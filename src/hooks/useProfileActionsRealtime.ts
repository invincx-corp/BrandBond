import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type ProfileActionType = 'like' | 'love' | 'bookmark';

export type ProfileActionRow = {
  id: string;
  user_id: string;
  target_user_id: string;
  action: ProfileActionType;
  created_at: string;
};

export type ActionProfile = {
  id: string;
  full_name: string | null;
  age: number | null;
  location: string | null;
  photo_url: string | null;
};

export type ProfileActionWithProfile = ProfileActionRow & {
  target_profile: ActionProfile | null;
};

export interface UseProfileActionsRealtimeState {
  loading: boolean;
  error: string | null;

  actions: ProfileActionWithProfile[];

  liked: ProfileActionWithProfile[];
  loved: ProfileActionWithProfile[];
  bookmarked: ProfileActionWithProfile[];

  likeCount: number;
  loveCount: number;
  bookmarkCount: number;
  totalCount: number;

  refresh: () => Promise<void>;

  toggleAction: (targetUserId: string, action: ProfileActionType) => Promise<void>;
}

export function useProfileActionsRealtime(userId: string, limit: number = 500): UseProfileActionsRealtimeState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actions, setActions] = useState<ProfileActionWithProfile[]>([]);

  const channelsRef = useRef<RealtimeChannel[]>([]);

  const loadSnapshot = useCallback(async () => {
    if (!userId) {
      setActions([]);
      return;
    }

    const actionsRes = await supabase
      .from('profile_actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (actionsRes.error) throw actionsRes.error;

    const base = (actionsRes.data as any as ProfileActionRow[]) || [];
    const targetIds = Array.from(new Set(base.map((r) => r.target_user_id).filter(Boolean)));

    const [profilesRes, photosRes] = await Promise.all([
      targetIds.length
        ? supabase
            .from('profiles')
            .select('id, full_name, age, location')
            .in('id', targetIds)
        : Promise.resolve({ data: [], error: null } as any),
      targetIds.length
        ? supabase
            .from('user_photos')
            .select('user_id, photo_url, is_main_photo, photo_order')
            .in('user_id', targetIds)
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

    const enriched: ProfileActionWithProfile[] = base.map((r) => {
      const p = profileById.get(r.target_user_id) || null;
      const photos = photosByUser.get(r.target_user_id) || [];
      const main =
        photos.find((ph) => ph.is_main_photo) ||
        photos.sort((a, b) => (a.photo_order ?? 999) - (b.photo_order ?? 999))[0];

      return {
        ...r,
        target_profile: p
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

    setActions(enriched);
  }, [limit, userId]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await loadSnapshot();
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh profile actions');
    }
  }, [loadSnapshot]);

  const toggleAction = useCallback(
    async (targetUserId: string, action: ProfileActionType) => {
      if (!userId) return;

      const exists = actions.some((a) => a.target_user_id === targetUserId && a.action === action);

      if (exists) {
        const delRes = await supabase
          .from('profile_actions')
          .delete()
          .eq('user_id', userId)
          .eq('target_user_id', targetUserId)
          .eq('action', action);

        if (delRes.error) throw delRes.error;
      } else {
        const insRes = await supabase
          .from('profile_actions')
          .upsert({ user_id: userId, target_user_id: targetUserId, action }, { onConflict: 'user_id,target_user_id,action' });

        if (insRes.error) {
          const msg = String(insRes.error.message || 'Failed to save action');
          if (action === 'love' && msg.includes('romantic_exclusivity_violation')) {
            throw new Error('You can only have one active love match at a time. End the current one before starting a new one.');
          }
          throw insRes.error;
        }
      }
    },
    [actions, userId]
  );

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

        const ch = supabase
          .channel(`profile_actions_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profile_actions', filter: `user_id=eq.${userId}` },
            () => {
              loadSnapshot().catch(() => undefined);
            }
          )
          .subscribe();

        channelsRef.current = [ch];
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load profile actions');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      channelsRef.current.forEach((c) => supabase.removeChannel(c));
      channelsRef.current = [];
    };
  }, [userId, loadSnapshot]);

  const liked = useMemo(() => actions.filter((a) => a.action === 'like'), [actions]);
  const loved = useMemo(() => actions.filter((a) => a.action === 'love'), [actions]);
  const bookmarked = useMemo(() => actions.filter((a) => a.action === 'bookmark'), [actions]);

  const likeCount = liked.length;
  const loveCount = loved.length;
  const bookmarkCount = bookmarked.length;
  const totalCount = actions.length;

  return {
    loading,
    error,

    actions,

    liked,
    loved,
    bookmarked,

    likeCount,
    loveCount,
    bookmarkCount,
    totalCount,

    refresh,

    toggleAction,
  };
}
