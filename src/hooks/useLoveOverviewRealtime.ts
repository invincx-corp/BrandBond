import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
};

export type DateRequestRow = {
  id: string;
  from_user_id: string;
  to_user_id: string;
  request_type: string;
  message: string;
  proposed_at: string | null;
  proposed_location: string | null;
  status: string;
  created_at: string;
  responded_at: string | null;
  is_read_by_sender: boolean;
  is_read_by_receiver: boolean;
};

export type DateRequestWithSender = DateRequestRow & {
  from_profile: {
    id: string;
    full_name: string | null;
    age: number | null;
    location: string | null;
  } | null;
  from_main_photo_url: string | null;
  match_percentage: number;
  common_interests: string[];
};

type UserInterestsRow = {
  user_id: string;
} & Record<string, any>;

export type LoveStatsRow = {
  user_id: string;
  total_matches: number;
  pending_date_requests: number;
  unread_notifications: number;
  updated_at: string;
};

export interface LoveOverviewRealtimeState {
  loading: boolean;
  error: string | null;

  stats: LoveStatsRow | null;
  notifications: NotificationRow[];
  incomingDateRequests: DateRequestWithSender[];

  peopleNearbyCount: number;

  unreadNotificationsCount: number;
  unreadIncomingDateRequestsCount: number;

  refresh: () => Promise<void>;

  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  markDateRequestRead: (id: string) => Promise<void>;
  respondToDateRequest: (id: string, status: 'accepted' | 'declined' | 'cancelled') => Promise<void>;
}

export function useLoveOverviewRealtime(userId: string): LoveOverviewRealtimeState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<LoveStatsRow | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [incomingDateRequests, setIncomingDateRequests] = useState<DateRequestWithSender[]>([]);
  const [peopleNearbyCount, setPeopleNearbyCount] = useState<number>(0);

  const channelsRef = useRef<RealtimeChannel[]>([]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const unreadIncomingDateRequestsCount = useMemo(
    () => incomingDateRequests.filter((r) => !r.is_read_by_receiver).length,
    [incomingDateRequests]
  );

  const loadSnapshot = useCallback(async () => {
    if (!userId) {
      setStats(null);
      setNotifications([]);
      setIncomingDateRequests([]);
      setPeopleNearbyCount(0);
      return;
    }

    const [statsRes, notifRes, reqRes] = await Promise.all([
      supabase.from('user_love_stats').select('*').eq('user_id', userId).maybeSingle(),
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('date_requests')
        .select('*')
        .eq('to_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (statsRes.error) throw statsRes.error;
    if (notifRes.error) throw notifRes.error;
    if (reqRes.error) throw reqRes.error;

    setStats((statsRes.data as LoveStatsRow | null) || null);
    setNotifications((notifRes.data as NotificationRow[]) || []);

    // People nearby (simple implementation): count profiles with same location as me.
    // Note: requires profiles table + RLS allowing reads of location.
    const meRes = await supabase.from('profiles').select('location').eq('id', userId).maybeSingle();
    if (meRes.error) throw meRes.error;

    const myLocation = meRes.data?.location;
    if (myLocation) {
      const nearbyRes = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('location', myLocation)
        .neq('id', userId);

      if (nearbyRes.error) throw nearbyRes.error;
      setPeopleNearbyCount(nearbyRes.count || 0);
    } else {
      setPeopleNearbyCount(0);
    }

    const baseRequests = (reqRes.data as DateRequestRow[]) || [];
    const senderIds = Array.from(new Set(baseRequests.map((r) => r.from_user_id).filter(Boolean)));

    const [profilesRes, photosRes, myInterestsRes, senderInterestsRes] = await Promise.all([
      senderIds.length
        ? supabase
            .from('profiles')
            .select('id, full_name, age, location')
            .in('id', senderIds)
        : Promise.resolve({ data: [], error: null } as any),
      senderIds.length
        ? supabase
            .from('user_photos')
            .select('user_id, photo_url, is_main_photo, photo_order')
            .in('user_id', senderIds)
        : Promise.resolve({ data: [], error: null } as any),
      supabase.from('user_interests').select('*').eq('user_id', userId).maybeSingle(),
      senderIds.length
        ? supabase.from('user_interests').select('*').in('user_id', senderIds)
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (photosRes.error) throw photosRes.error;
    if (myInterestsRes.error) throw myInterestsRes.error;
    if (senderInterestsRes.error) throw senderInterestsRes.error;

    const extractInterestSet = (row: UserInterestsRow | null) => {
      if (!row) return new Set<string>();
      const out = new Set<string>();
      Object.entries(row).forEach(([key, val]) => {
        if (key === 'id' || key === 'user_id' || key === 'created_at') return;
        if (typeof val === 'string') {
          const s = val.trim();
          if (s) out.add(s);
          return;
        }
        if (Array.isArray(val)) {
          val.forEach((v) => {
            if (typeof v === 'string') {
              const s = v.trim();
              if (s) out.add(s);
            }
          });
        }
      });
      return out;
    };

    const myInterestSet = extractInterestSet((myInterestsRes.data as any) || null);
    const senderInterestById = new Map<string, Set<string>>();
    ((senderInterestsRes.data as any[]) || []).forEach((row: any) => {
      if (!row?.user_id) return;
      senderInterestById.set(String(row.user_id), extractInterestSet(row as UserInterestsRow));
    });

    const profileById = new Map<string, any>((profilesRes.data || []).map((p: any) => [p.id, p]));
    const photosByUser = new Map<string, any[]>();
    (photosRes.data || []).forEach((row: any) => {
      const list = photosByUser.get(row.user_id) || [];
      list.push(row);
      photosByUser.set(row.user_id, list);
    });

    const low = (a: string, b: string) => (a < b ? a : b);
    const high = (a: string, b: string) => (a < b ? b : a);

    const pairs = senderIds.map((other) => ({ user_low: low(userId, other), user_high: high(userId, other) }));
    const compatRes = senderIds.length
      ? await supabase
          .from('user_compatibility')
          .select('score, user_low, user_high')
          .in('user_low', pairs.map((p) => p.user_low))
          .in('user_high', pairs.map((p) => p.user_high))
      : ({ data: [], error: null } as any);
    if (compatRes.error) throw compatRes.error;

    const compatByOtherId = new Map<string, number>();
    (compatRes.data || []).forEach((row: any) => {
      const uLow = String(row.user_low);
      const uHigh = String(row.user_high);
      const other = uLow === userId ? uHigh : uHigh === userId ? uLow : null;
      if (!other) return;
      compatByOtherId.set(other, Number(row.score) || 0);
    });

    const enriched: DateRequestWithSender[] = baseRequests.map((r) => {
      const p = profileById.get(r.from_user_id) || null;
      const photos = photosByUser.get(r.from_user_id) || [];
      const main = photos.find((ph) => ph.is_main_photo) || photos.sort((a, b) => (a.photo_order ?? 999) - (b.photo_order ?? 999))[0];

      const senderInterestSet = senderInterestById.get(r.from_user_id) || new Set<string>();
      const commonInterests = Array.from(myInterestSet).filter((v) => senderInterestSet.has(v));

      return {
        ...r,
        from_profile: p
          ? {
              id: p.id,
              full_name: p.full_name ?? null,
              age: typeof p.age === 'number' ? p.age : null,
              location: p.location ?? null,
            }
          : null,
        from_main_photo_url: main?.photo_url ?? null,
        match_percentage: compatByOtherId.get(r.from_user_id) || 0,
        common_interests: commonInterests,
      };
    });

    setIncomingDateRequests(enriched);
  }, [userId]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await loadSnapshot();
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh love overview');
    }
  }, [loadSnapshot]);

  const markNotificationRead = useCallback(async (id: string) => {
    const { error: updErr } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (updErr) throw updErr;
  }, [userId]);

  const markAllNotificationsRead = useCallback(async () => {
    const { error: updErr } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (updErr) throw updErr;
  }, [userId]);

  const deleteNotification = useCallback(async (id: string) => {
    const { error: delErr } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (delErr) throw delErr;
  }, [userId]);

  const markDateRequestRead = useCallback(async (id: string) => {
    const { error: updErr } = await supabase
      .from('date_requests')
      .update({ is_read_by_receiver: true })
      .eq('id', id)
      .eq('to_user_id', userId);

    if (updErr) throw updErr;
  }, [userId]);

  const respondToDateRequest = useCallback(async (id: string, status: 'accepted' | 'declined' | 'cancelled') => {
    const normalizedStatus = status === 'declined' ? 'rejected' : status;

    const { error: updErr } = await supabase
      .from('date_requests')
      .update({ status: normalizedStatus, responded_at: new Date().toISOString() })
      .eq('id', id)
      .eq('to_user_id', userId);

    if (updErr) throw updErr;

    // Keep date_plans in sync since Date Planning UI is driven by date_plans.
    const { error: planErr } = await supabase
      .from('date_plans')
      .update({ status: normalizedStatus })
      .eq('date_request_id', id);

    if (planErr) throw planErr;
  }, [userId]);

  useEffect(() => {
    let isMounted = true;
    let pollTimer: any = null;

    const init = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await loadSnapshot();

        // Clean previous
        channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
        channelsRef.current = [];

        const notificationsCh = supabase
          .channel(`love_overview_notifications_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
            (payload: any) => {
              console.debug('[love_overview] notifications realtime payload', payload);
              // reload snapshot for correctness (keeps UI consistent)
              loadSnapshot().catch(() => undefined);
            }
          )
          .subscribe((status) => {
            console.debug('[love_overview] notifications channel subscribe status', status, { userId });
          });

        const dateRequestsCh = supabase
          .channel(`love_overview_date_requests_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'date_requests', filter: `to_user_id=eq.${userId}` },
            (payload: any) => {
              console.debug('[love_overview] incoming date_requests realtime payload', payload);
              loadSnapshot().catch(() => undefined);
            }
          )
          .subscribe((status) => {
            console.debug('[love_overview] incoming date_requests channel subscribe status', status, { userId });
          });

        const outgoingDateRequestsCh = supabase
          .channel(`love_overview_outgoing_date_requests_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'date_requests', filter: `from_user_id=eq.${userId}` },
            (payload: any) => {
              console.debug('[love_overview] outgoing date_requests realtime payload', payload);
              loadSnapshot().catch(() => undefined);
            }
          )
          .subscribe((status) => {
            console.debug('[love_overview] outgoing date_requests channel subscribe status', status, { userId });
          });

        const statsCh = supabase
          .channel(`love_overview_stats_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'user_love_stats', filter: `user_id=eq.${userId}` },
            (payload: any) => {
              console.debug('[love_overview] stats realtime payload', payload);
              loadSnapshot().catch(() => undefined);
            }
          )
          .subscribe((status) => {
            console.debug('[love_overview] stats channel subscribe status', status, { userId });
          });

        channelsRef.current = [notificationsCh, dateRequestsCh, outgoingDateRequestsCh, statsCh];

        // Polling fallback: keeps UI fresh even if Realtime is not enabled for tables.
        pollTimer = setInterval(() => {
          loadSnapshot().catch(() => undefined);
        }, 5000);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load love overview');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      if (pollTimer) clearInterval(pollTimer);
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [userId, loadSnapshot]);

  return {
    loading,
    error,

    stats,
    notifications,
    incomingDateRequests,

    peopleNearbyCount,

    unreadNotificationsCount,
    unreadIncomingDateRequestsCount,

    refresh,

    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,

    markDateRequestRead,
    respondToDateRequest,
  };
}
