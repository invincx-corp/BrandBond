import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserInsightsRow = {
  user_id: string;
  primary_interests: string[];
  personality_traits: string[];
  lifestyle_patterns: string[];
  compatibility_trends: Record<string, number>;
  updated_at: string;
};

export interface UseUserInsightsRealtimeState {
  loading: boolean;
  error: string | null;
  insights: UserInsightsRow | null;
  refresh: () => Promise<void>;
}

export function useUserInsightsRealtime(userId: string): UseUserInsightsRealtimeState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<UserInsightsRow | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const loadSnapshot = useCallback(async () => {
    if (!userId) {
      setInsights(null);
      return;
    }

    const res = await supabase
      .from('user_insights')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (res.error) throw res.error;
    setInsights((res.data as any as UserInsightsRow) || null);
  }, [userId]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await loadSnapshot();
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh insights');
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
          .channel(`user_insights_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'user_insights', filter: `user_id=eq.${userId}` },
            () => {
              loadSnapshot().catch(() => undefined);
            }
          )
          .subscribe();

        if (isMounted) channelRef.current = ch;
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load insights');
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
      insights,
      refresh,
    }),
    [error, insights, loading, refresh]
  );
}
