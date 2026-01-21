import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserActivityRow = {
  id: string;
  user_id: string;
  activity_type: string;
  title: string;
  description: string;
  activity_data: any;
  created_at: string;
};

export interface UserActivitiesRealtimeState {
  loading: boolean;
  error: string | null;
  activities: UserActivityRow[];
  refresh: () => Promise<void>;
}

export function useUserActivitiesRealtime(userId: string, limit: number = 50): UserActivitiesRealtimeState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<UserActivityRow[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setActivities([]);
      return;
    }

    const res = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (res.error) throw res.error;
    setActivities((res.data as UserActivityRow[]) || []);
  }, [userId, limit]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh activities');
    }
  }, [load]);

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
        await load();

        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }

        channelRef.current = supabase
          .channel(`user_activities_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'user_activities', filter: `user_id=eq.${userId}` },
            () => {
              load().catch(() => undefined);
            }
          )
          .subscribe();
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load activities');
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
  }, [userId, load]);

  const stableActivities = useMemo(() => activities, [activities]);

  return {
    loading,
    error,
    activities: stableActivities,
    refresh,
  };
}
