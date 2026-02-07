import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type RecommendationRow = {
  id: string;
  user_id: string;
  recommended_user_id: string;
  score: number;
  reasons: any;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
};

export type RecommendationProfile = {
  id: string;
  full_name: string | null;
  age: number | null;
  location: string | null;
  photo_url: string | null;
};

export type RecommendationItem = RecommendationRow & {
  recommended_profile: RecommendationProfile | null;
};

export interface UseMatchRecommendationsRealtimeState {
  loading: boolean;
  error: string | null;
  recommendations: RecommendationItem[];
  refresh: () => Promise<void>;
}

export function useMatchRecommendationsRealtime(userId: string, limit: number = 50): UseMatchRecommendationsRealtimeState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadSnapshot = useCallback(async () => {
    if (!userId) {
      setRecommendations([]);
      return;
    }

    // Fast path: single round-trip request using nested selects.
    // This relies on PostgREST relationship inference. If it fails, we fall back to
    // the multi-query enrichment below.
    const joinedRes = await supabase
      .from('match_recommendations')
      .select(
        `
        id,
        user_id,
        recommended_user_id,
        score,
        reasons,
        status,
        created_at,
        updated_at,
        expires_at,
        recommended_profile:profiles!inner(
          id,
          full_name,
          age,
          location,
          photo_url
        )
      `
      )
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('score', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (!joinedRes.error && Array.isArray(joinedRes.data)) {
      const enriched: RecommendationItem[] = (joinedRes.data as any[]).map((r: any) => {
        const p = r.recommended_profile || null;

        return {
          id: r.id,
          user_id: r.user_id,
          recommended_user_id: r.recommended_user_id,
          score: r.score,
          reasons: r.reasons,
          status: r.status,
          created_at: r.created_at,
          updated_at: r.updated_at,
          expires_at: r.expires_at,
          recommended_profile: p
            ? {
                id: p.id,
                full_name: p.full_name ?? null,
                age: typeof p.age === 'number' ? p.age : null,
                location: p.location ?? null,
                photo_url: p.photo_url ?? null,
              }
            : null,
        } as RecommendationItem;
      });

      setRecommendations(enriched);
      return;
    }

    // Fallback path: keep previous behavior (3 queries), but photos remain optional.
    if (joinedRes.error) {
      console.warn('Recommendations joined query failed; falling back to multi-query enrichment:', joinedRes.error);
    }

    const recRes = await supabase
      .from('match_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('score', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (recRes.error) throw recRes.error;

    const base = (recRes.data as any as RecommendationRow[]) || [];
    const ids = Array.from(new Set(base.map((r) => r.recommended_user_id).filter(Boolean)));

    const [profilesRes, photosRes] = await Promise.all([
      ids.length
        ? supabase
            .from('profiles')
            .select('id, full_name, age, location')
            .in('id', ids)
        : Promise.resolve({ data: [], error: null } as any),
      ids.length
        ? supabase
            .from('user_photos')
            .select('user_id, photo_url, is_main_photo, photo_order')
            .in('user_id', ids)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    // Photos are optional for rendering recommendations. If user_photos query times out
    // (or any other error occurs), keep rendering profile cards without photos.
    if (photosRes.error) {
      console.warn('Failed to load recommendation photos (continuing without photos):', photosRes.error);
    }

    const profileById = new Map<string, any>((profilesRes.data || []).map((p: any) => [p.id, p]));
    const photosByUser = new Map<string, any[]>();
    ((photosRes.data || []) as any[]).forEach((row: any) => {
      const list = photosByUser.get(row.user_id) || [];
      list.push(row);
      photosByUser.set(row.user_id, list);
    });

    const enriched: RecommendationItem[] = base.map((r) => {
      const p = profileById.get(r.recommended_user_id) || null;
      const photos = photosByUser.get(r.recommended_user_id) || [];
      const main =
        photos.find((ph) => ph.is_main_photo) ||
        photos.sort((a, b) => (a.photo_order ?? 999) - (b.photo_order ?? 999))[0];

      return {
        ...r,
        recommended_profile: p
          ? {
              id: p.id,
              full_name: p.full_name ?? null,
              age: typeof p.age === 'number' ? p.age : null,
              location: p.location ?? null,
              photo_url: main?.photo_url ?? null,
            }
          : null,
      };
    });

    setRecommendations(enriched);
  }, [limit, userId]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await loadSnapshot();
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh recommendations');
    }
  }, [loadSnapshot]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await loadSnapshot();

        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        const ch = supabase
          .channel(`match_recommendations_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'match_recommendations', filter: `user_id=eq.${userId}` },
            () => {
              loadSnapshot().catch(() => undefined);
            }
          )
          .subscribe();

        if (isMounted) channelRef.current = ch;
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load recommendations');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [loadSnapshot, userId]);

  return useMemo(
    () => ({
      loading,
      error,
      recommendations,
      refresh,
    }),
    [error, loading, recommendations, refresh]
  );
}
