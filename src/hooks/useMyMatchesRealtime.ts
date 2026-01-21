import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type MyMatchRow = {
  match_id: string;
  other_user_id: string;
  status: string;
  created_at: string;
  accepted_at: string | null;
  metadata: any;
};

export type MatchProfile = {
  id: string;
  full_name: string | null;
  age: number | null;
  location: string | null;
  photo_url: string | null;
};

export type MyMatchItem = MyMatchRow & {
  other_profile: MatchProfile | null;
};

export interface UseMyMatchesRealtimeState {
  loading: boolean;
  error: string | null;
  matches: MyMatchItem[];

  acceptedMatches: MyMatchItem[];
  pendingMatches: MyMatchItem[];

  refresh: () => Promise<void>;
}

export function useMyMatchesRealtime(userId: string, limit: number = 50): UseMyMatchesRealtimeState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<MyMatchItem[]>([]);

  const channelsRef = useRef<RealtimeChannel[]>([]);

  const loadSnapshot = useCallback(async () => {
    if (!userId) {
      setMatches([]);
      return;
    }

    const matchesRes = await supabase
      .from('my_matches')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (matchesRes.error) throw matchesRes.error;

    const base = (matchesRes.data as any as MyMatchRow[]) || [];
    const otherIds = Array.from(new Set(base.map((m) => m.other_user_id).filter(Boolean)));

    const [profilesRes, photosRes] = await Promise.all([
      otherIds.length
        ? supabase
            .from('profiles')
            .select('id, full_name, age, location')
            .in('id', otherIds)
        : Promise.resolve({ data: [], error: null } as any),
      otherIds.length
        ? supabase
            .from('user_photos')
            .select('user_id, photo_url, is_main_photo, photo_order')
            .in('user_id', otherIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (photosRes.error) throw photosRes.error;

    const profileById = new Map<string, any>((profilesRes.data || []).map((p: any) => [p.id, p]));
    const photosByUser = new Map<string, any[]>();
    (photosRes.data || []).forEach((row: any) => {
      const list = photosByUser.get(row.user_id) || [];
      list.push(row);
      photosByUser.set(row.user_id, list);
    });

    const enriched: MyMatchItem[] = base.map((m) => {
      const p = profileById.get(m.other_user_id) || null;
      const photos = photosByUser.get(m.other_user_id) || [];
      const main =
        photos.find((ph) => ph.is_main_photo) ||
        photos.sort((a, b) => (a.photo_order ?? 999) - (b.photo_order ?? 999))[0];

      return {
        ...m,
        other_profile: p
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

    setMatches(enriched);
  }, [limit, userId]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await loadSnapshot();
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh matches');
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

        channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
        channelsRef.current = [];

        // Subscribe to raw matches table changes. The view cannot be subscribed to.
        // Filter ensures only changes relevant to current user trigger a refresh.
        const matchesLowCh = supabase
          .channel(`matches_low_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'matches', filter: `user_low=eq.${userId}` },
            () => {
              loadSnapshot().catch(() => undefined);
            }
          )
          .subscribe();

        const matchesHighCh = supabase
          .channel(`matches_high_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'matches', filter: `user_high=eq.${userId}` },
            () => {
              loadSnapshot().catch(() => undefined);
            }
          )
          .subscribe();

        channelsRef.current = [matchesLowCh, matchesHighCh];
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load matches');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [userId, loadSnapshot]);

  const acceptedMatches = useMemo(
    () => matches.filter((m) => (m.status || '').toLowerCase() === 'accepted'),
    [matches]
  );

  const pendingMatches = useMemo(
    () => matches.filter((m) => (m.status || '').toLowerCase() === 'pending'),
    [matches]
  );

  return {
    loading,
    error,
    matches,
    acceptedMatches,
    pendingMatches,
    refresh,
  };
}
