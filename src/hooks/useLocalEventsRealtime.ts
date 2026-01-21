import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type LocalEventRow = {
  id: string;
  title: string;
  description: string;
  eventType?: string;
  event_type?: string;
  location: string;
  startTime?: string;
  start_time?: string;
  endTime?: string | null;
  end_time?: string | null;
  maxAttendees?: number | null;
  max_attendees?: number | null;
  currentAttendees?: number;
  current_attendees?: number;
  isAttending?: boolean;
};

export interface UseLocalEventsRealtimeState {
  loading: boolean;
  error: string | null;
  events: LocalEventRow[];
  refresh: () => Promise<void>;
}

// Uses backend endpoint (so it can return attendee counts + isAttending computed server-side)
// and uses Supabase Realtime subscriptions to refresh when my attendance changes.
export function useLocalEventsRealtime(userId: string, limit: number = 5): UseLocalEventsRealtimeState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<LocalEventRow[]>([]);

  const channelsRef = useRef<RealtimeChannel[]>([]);

  const loadSnapshot = useCallback(async () => {
    if (!userId) {
      setEvents([]);
      return;
    }

    const meRes = await supabase.from('profiles').select('location').eq('id', userId).maybeSingle();
    if (meRes.error) throw meRes.error;

    const myLocation = meRes.data?.location;
    if (!myLocation) {
      setEvents([]);
      return;
    }

    // List upcoming events in my location.
    const evRes = await supabase
      .from('local_events')
      .select('*')
      .eq('location', myLocation)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit);
    if (evRes.error) throw evRes.error;

    const base = (evRes.data as any[]) || [];
    const ids = base.map((e) => String(e.id)).filter(Boolean);

    // Fetch my attendance rows for these events.
    const attRes = ids.length
      ? await supabase
          .from('event_attendees')
          .select('event_id, status')
          .eq('user_id', userId)
          .in('event_id', ids)
      : ({ data: [], error: null } as any);
    if (attRes.error) throw attRes.error;

    const attByEvent = new Map<string, string>();
    ((attRes.data as any[]) || []).forEach((r: any) => {
      if (!r?.event_id) return;
      attByEvent.set(String(r.event_id), String(r.status));
    });

    // Fetch attendee counts (going) for these events.
    const countsRes = ids.length
      ? await supabase
          .from('event_attendees')
          .select('event_id, status')
          .in('event_id', ids)
      : ({ data: [], error: null } as any);
    if (countsRes.error) throw countsRes.error;

    const countsByEvent = new Map<string, number>();
    ((countsRes.data as any[]) || []).forEach((r: any) => {
      const key = String(r.event_id);
      if (!key) return;
      if (String(r.status) !== 'going') return;
      countsByEvent.set(key, (countsByEvent.get(key) || 0) + 1);
    });

    const normalized: LocalEventRow[] = base.map((e: any) => {
      const id = String(e.id);
      const myStatus = attByEvent.get(id);
      return {
        id,
        title: e.title ?? '',
        description: e.description ?? '',
        event_type: e.event_type ?? 'general',
        location: e.location ?? myLocation,
        start_time: e.start_time,
        end_time: e.end_time,
        max_attendees: e.max_attendees ?? null,
        currentAttendees: countsByEvent.get(id) || 0,
        isAttending: myStatus === 'going',
      };
    });

    setEvents(normalized);
  }, [limit, userId]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await loadSnapshot();
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh local events');
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

        // Refresh when MY attendance changes.
        const myAttCh = supabase
          .channel(`local_events_my_att_${userId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'event_attendees', filter: `user_id=eq.${userId}` },
            () => {
              loadSnapshot().catch(() => undefined);
            }
          )
          .subscribe();

        // Refresh when events list changes.
        const eventsCh = supabase
          .channel(`local_events_${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'local_events' }, () => {
            loadSnapshot().catch(() => undefined);
          })
          .subscribe();

        if (isMounted) channelsRef.current = [myAttCh, eventsCh];
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load local events');
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
  }, [loadSnapshot, userId]);

  return useMemo(
    () => ({
      loading,
      error,
      events,
      refresh,
    }),
    [error, events, loading, refresh]
  );
}
