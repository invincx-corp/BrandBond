import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface UseMyMenuStatsRealtimeState {
  loading: boolean;
  error: string | null;

  datesCount: number;
  friendsCount: number;
  communitiesJoined: number;
  conversationsActive: number;

  refresh: () => Promise<void>;
}

export function useMyMenuStatsRealtime(userId: string): UseMyMenuStatsRealtimeState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [datesCount, setDatesCount] = useState(0);
  const [friendsCount, setFriendsCount] = useState(0);
  const [communitiesJoined, setCommunitiesJoined] = useState(0);
  const [conversationsActive, setConversationsActive] = useState(0);

  const channelsRef = useRef<RealtimeChannel[]>([]);

  const loadSnapshot = useCallback(async () => {
    if (!userId) {
      setDatesCount(0);
      setFriendsCount(0);
      setCommunitiesJoined(0);
      setConversationsActive(0);
      return;
    }

    // Dates count: count of accepted date requests involving the user.
    const datesRes = await supabase
      .from('date_requests')
      .select('id', { count: 'exact', head: true })
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (datesRes.error) throw datesRes.error;

    // Friends count: accepted matches involving the user.
    // Note: matches table has user_low/user_high in this codebase.
    const friendsRes = await supabase
      .from('matches')
      .select('id', { count: 'exact', head: true })
      .or(`user_low.eq.${userId},user_high.eq.${userId}`)
      .eq('status', 'accepted');

    if (friendsRes.error) throw friendsRes.error;

    const [communitiesRes, conversationsRes] = await Promise.all([
      supabase
        .from('community_members')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .or(`user_low.eq.${userId},user_high.eq.${userId}`)
        .eq('is_archived', false)
        .gte('last_message_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    if (communitiesRes.error) throw communitiesRes.error;
    if (conversationsRes.error) throw conversationsRes.error;

    setDatesCount(datesRes.count || 0);
    setFriendsCount(friendsRes.count || 0);
    setCommunitiesJoined(communitiesRes.count || 0);
    setConversationsActive(conversationsRes.count || 0);
  }, [userId]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await loadSnapshot();
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh menu stats');
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

        const datesLowCh = supabase
          .channel(`my_menu_dates_from_${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'date_requests', filter: `from_user_id=eq.${userId}` }, () => {
            loadSnapshot().catch(() => undefined);
          })
          .subscribe();

        const datesHighCh = supabase
          .channel(`my_menu_dates_to_${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'date_requests', filter: `to_user_id=eq.${userId}` }, () => {
            loadSnapshot().catch(() => undefined);
          })
          .subscribe();

        const matchesLowCh = supabase
          .channel(`my_menu_friends_low_${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `user_low=eq.${userId}` }, () => {
            loadSnapshot().catch(() => undefined);
          })
          .subscribe();

        const matchesHighCh = supabase
          .channel(`my_menu_friends_high_${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `user_high=eq.${userId}` }, () => {
            loadSnapshot().catch(() => undefined);
          })
          .subscribe();

        const communitiesCh = supabase
          .channel(`my_menu_communities_${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'community_members', filter: `user_id=eq.${userId}` }, () => {
            loadSnapshot().catch(() => undefined);
          })
          .subscribe();

        const convLowCh = supabase
          .channel(`my_menu_conversations_low_${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_low=eq.${userId}` }, () => {
            loadSnapshot().catch(() => undefined);
          })
          .subscribe();

        const convHighCh = supabase
          .channel(`my_menu_conversations_high_${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `user_high=eq.${userId}` }, () => {
            loadSnapshot().catch(() => undefined);
          })
          .subscribe();

        if (isMounted) {
          channelsRef.current = [datesLowCh, datesHighCh, matchesLowCh, matchesHighCh, communitiesCh, convLowCh, convHighCh];
        }
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load menu stats');
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

  return useMemo(
    () => ({
      loading,
      error,
      datesCount,
      friendsCount,
      communitiesJoined,
      conversationsActive,
      refresh,
    }),
    [communitiesJoined, conversationsActive, datesCount, error, friendsCount, loading, refresh]
  );
}
