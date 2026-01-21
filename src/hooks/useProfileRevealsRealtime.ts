import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type ProfileRevealRow = {
  id: string;
  user_id: string;
  target_user_id: string;
  created_at: string;
};

export interface UseProfileRevealsRealtimeState {
  loading: boolean;
  error: string | null;

  reveals: ProfileRevealRow[];
  revealedTargetIds: Set<string>;

  refresh: () => Promise<void>;

  reveal: (targetUserId: string) => Promise<void>;
}

export function useProfileRevealsRealtime(userId: string, limit: number = 500): UseProfileRevealsRealtimeState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reveals, setReveals] = useState<ProfileRevealRow[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadSnapshot = useCallback(async () => {
    if (!userId) {
      setReveals([]);
      return;
    }

    const res = await supabase
      .from('profile_reveals')
      .select('id, user_id, target_user_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (res.error) throw res.error;

    setReveals(((res.data as any[]) || []) as ProfileRevealRow[]);
  }, [limit, userId]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await loadSnapshot();
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh profile reveals');
    }
  }, [loadSnapshot]);

  const reveal = useCallback(
    async (targetUserId: string) => {
      if (!userId) return;
      if (!targetUserId) return;
      if (String(targetUserId) === String(userId)) return;

      const insRes = await supabase
        .from('profile_reveals')
        .upsert({ user_id: userId, target_user_id: targetUserId }, { onConflict: 'user_id,target_user_id' });

      if (insRes.error) throw insRes.error;
    },
    [userId]
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

        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        const ch = supabase
          .channel(`profile_reveals_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profile_reveals', filter: `user_id=eq.${userId}` },
            () => {
              loadSnapshot().catch(() => undefined);
            }
          )
          .subscribe();

        if (isMounted) channelRef.current = ch;
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load profile reveals');
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

  const revealedTargetIds = useMemo(() => {
    return new Set(reveals.map((r) => String(r.target_user_id)).filter(Boolean));
  }, [reveals]);

  return useMemo(
    () => ({
      loading,
      error,
      reveals,
      revealedTargetIds,
      refresh,
      reveal,
    }),
    [error, loading, reveals, revealedTargetIds, refresh, reveal]
  );
}
