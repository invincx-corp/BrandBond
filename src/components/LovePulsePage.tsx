import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity as _Activity,
  ArrowRight,
  Heart,
  LineChart,
  RefreshCw,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';

import { useMyMatchesRealtime } from '../hooks/useMyMatchesRealtime';
import { useMatchRecommendationsRealtime } from '../hooks/useMatchRecommendationsRealtime';
import { useChat } from '../contexts/ChatContext';
import { supabase } from '../lib/supabase';

type Visibility = 'public' | 'orbit' | 'mutual' | 'private';

type PulsePostType = 'daily_vibe' | 'habit_mood' | 'thought_seed' | 'enrich_favorite' | 'quiet_note';

type PulsePostRow = {
  id: string;
  user_id: string;
  target_user_id: string | null;
  universe: 'love' | 'friends' | 'both';
  visibility: Visibility;
  type: PulsePostType;
  content: Record<string, unknown> | null;
  created_at: string;
  expires_at: string | null;
};

type PulseAcknowledgmentRow = {
  id: string;
  universe: 'love' | 'friends' | 'both';
  from_user_id: string;
  to_user_id: string;
  kind: string;
  message: string | null;
  created_at: string;
  expires_at: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type SoulPoint = { day: string; score: number };

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

const _QUIET_NOTE_PROMPTS = [
  'No reply needed — I just wanted to say…',
  'Something I’m holding softly about you…',
  'A tiny confession:',
  'A memory I keep replaying:',
  'A wish for us:',
  'One thing I’m grateful you did:',
] as const;

const quietPrompts = _QUIET_NOTE_PROMPTS;

const LovePulsePage: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useChat();
  const currentUserId = userId;
  const safeUserId = currentUserId || '';
  const myMatchesRealtime = useMyMatchesRealtime(safeUserId, 50);
  const recommendationsRealtime = useMatchRecommendationsRealtime(safeUserId, 30);

  const acceptedMatches = useMemo(() => myMatchesRealtime.acceptedMatches || [], [myMatchesRealtime.acceptedMatches]);
  const matchUserIds = useMemo(
    () => acceptedMatches.map((m) => String(m.other_user_id)).filter(Boolean),
    [acceptedMatches]
  );

  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PulsePostRow[]>([]);
  const [profilesById, setProfilesById] = useState<Map<string, ProfileRow>>(new Map());
  const [acks, setAcks] = useState<PulseAcknowledgmentRow[]>([]);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  type DockKey = 'daily' | 'checkin' | 'favorite' | 'quiet' | 'signal';
  const [dockOpen, setDockOpen] = useState<DockKey | null>(null);
  const [, setDrawerExpanded] = useState<boolean>(false);
  const dockButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dockPanelRef = useRef<HTMLDivElement | null>(null);
  const [dockAnchor, setDockAnchor] = useState<{
    key: DockKey;
    left: number;
    width: number;
  } | null>(null);

  useEffect(() => {
    if (!dockOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;

      const panelEl = dockPanelRef.current;
      if (panelEl && panelEl.contains(target)) return;

      const btnEl = dockButtonRefs.current[dockOpen];
      if (btnEl && btnEl.contains(target)) return;

      setDockOpen(null);
      setDockAnchor(null);
      setDrawerExpanded(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [dockOpen]);

  const [activeDyadId, setActiveDyadId] = useState<string>('');

  const [soulGraphOpen, setSoulGraphOpen] = useState(false);
  const [soulGraphLoading, setSoulGraphLoading] = useState(false);
  const [soulGraphError, setSoulGraphError] = useState<string | null>(null);
  const [soulPoints, setSoulPoints] = useState<SoulPoint[]>([]);

  const switchDyad = useCallback((otherId: string) => {
    setActiveDyadId(otherId);
  }, []);

  const loadSoulGraph = useCallback(
    async (otherId: string) => {
      try {
        setSoulGraphError(null);
        setSoulGraphLoading(true);
        const { data, error } = await supabase.rpc('get_love_dyad_resonance', {
          other_id: otherId,
          days_back: 30,
        });
        if (error) throw error;
        const rows = Array.isArray(data) ? (data as any[]) : [];
        const parsed = rows
          .map((r) => ({
            day: String(r?.day || ''),
            score: clamp(Number(r?.score) || 0, 0, 100),
          }))
          .filter((p) => p.day);
        setSoulPoints(parsed);
      } catch (e: any) {
        setSoulGraphError(String(e?.message || 'Failed to load'));
        setSoulPoints([]);
      } finally {
        setSoulGraphLoading(false);
      }
    },
    [currentUserId]
  );

  const formatTimeAgo = useCallback((iso: string) => {
    const t = new Date(iso).getTime();
    const now = Date.now();
    const diff = Math.max(0, now - t);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `${days}d`;
  }, []);

  const getDockHint = useCallback(
    (d: any, key: DockKey) => {
      if (key === 'quiet') {
        const allowed = new Set([currentUserId, ...matchUserIds]);
        const arr = (posts || []).filter((p) => {
          const target = String(p.target_user_id || p.content?.target_user_id || '').trim();
          if (!target) return false;
          const author = String(p.user_id || '').trim();
          if (!allowed.has(author) || !allowed.has(target)) return false;
          const a = author < target ? author : target;
          const b = author < target ? target : author;
          const dyadKey = `${a}:${b}`;
          return dyadKey === d.key;
        });
        const now = Date.now();
        const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const lastQuiet = arr.find((p) => p.type === 'quiet_note');
        const quietThisWeek = arr.filter((p) => p.type === 'quiet_note' && new Date(p.created_at).getTime() >= weekAgo).length;
        const last = lastQuiet?.created_at ? formatTimeAgo(lastQuiet.created_at) : '—';
        return `${last} · ${quietThisWeek}/wk`;
      }
      if (key === 'signal') {
        const allowed = new Set([currentUserId, ...matchUserIds]);
        const dyadAcks = (acks || []).filter((a) => {
          const from = String(a.from_user_id || '').trim();
          const to = String(a.to_user_id || '').trim();
          if (!from || !to) return false;
          if (!allowed.has(from) || !allowed.has(to)) return false;
          const x = from < to ? from : to;
          const y = from < to ? to : from;
          const key = `${x}:${y}`;
          return key === d.key;
        });
        const lastAck = dyadAcks.length ? formatTimeAgo(dyadAcks[0].created_at) : '—';
        return `${lastAck} · ${dyadAcks.length}`;
      }
      return '';
    },
    [acks, currentUserId, formatTimeAgo, matchUserIds, posts]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) globalThis.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = globalThis.setTimeout(() => setToast(null), 2400);
  }, []);

  const formatLastSeen = useCallback(
    (iso: string | null) => {
      if (!iso) return '—';
      return formatTimeAgo(iso);
    },
    [formatTimeAgo]
  );

  const openRecommendationReveal = useCallback(
    async (otherId: string) => {
      if (!currentUserId) {
        showToast('Please sign in');
        return;
      }
      try {
        const { error } = await supabase.rpc('issue_mutual_recommendation_reveal_thread', {
          other_id: otherId,
          cooldown_hours: 72,
        });
        if (error) throw error;
        showToast('Reveal opened');
      } catch (e: any) {
        const msg = String(e?.message || 'Failed to open reveal');
        if (msg.includes('not_eligible')) {
          showToast('Not eligible yet (it has to be mutual recommendations).');
        } else if (msg.includes('cooldown_active')) {
          showToast('You already had a reveal recently. Let it breathe for a bit.');
        } else {
          showToast(msg);
        }
      }
    },
    [currentUserId, showToast]
  );

  const reciprocalRecommendationIds = useMemo(() => {
    const ids = new Set<string>();
    const all = recommendationsRealtime.recommendations || [];
    for (const r of all) {
      if (!r?.recommended_user_id) continue;
      const otherId = String(r.recommended_user_id);
      const reverse = all.find((x: any) => String(x?.user_id) === otherId && String(x?.recommended_user_id) === currentUserId);
      if (reverse && String(reverse?.status) === 'active') ids.add(otherId);
    }
    return ids;
  }, [currentUserId, recommendationsRealtime.recommendations]);

  const mutualRecommendations = useMemo(() => {
    const all = recommendationsRealtime.recommendations || [];
    return all.filter((r) => reciprocalRecommendationIds.has(String(r.recommended_user_id || '')));
  }, [recommendationsRealtime.recommendations, reciprocalRecommendationIds]);

  const loadPulse = useCallback(async () => {
    if (!currentUserId) return;

    setFeedError(null);
    setFeedLoading(true);
    try {
      if (!matchUserIds.length) {
        setPosts([]);
        setProfilesById(new Map());
        return;
      }

      const postsRes = await supabase
        .from('pulse_posts')
        .select('id, user_id, target_user_id, universe, visibility, type, content, created_at, expires_at')
        .eq('universe', 'love')
        .eq('visibility', 'private')
        .in('user_id', [currentUserId, ...matchUserIds])
        .order('created_at', { ascending: false })
        .limit(200);

      if (postsRes.error) throw postsRes.error;

      const rows = (postsRes.data as any as PulsePostRow[]) || [];
      const now = Date.now();
      const visible = rows.filter((p) => {
        const expiresAt = p.expires_at ? new Date(p.expires_at).getTime() : null;
        return !expiresAt || expiresAt > now;
      });
      setPosts(visible);

      const acksRes = await supabase
        .from('pulse_acknowledgments')
        .select('id, universe, from_user_id, to_user_id, kind, message, created_at, expires_at')
        .eq('universe', 'love')
        .in('from_user_id', [currentUserId, ...matchUserIds])
        .order('created_at', { ascending: false })
        .limit(120);
      if (acksRes.error) throw acksRes.error;
      const ackRows = (acksRes.data as any as PulseAcknowledgmentRow[]) || [];
      const now2 = Date.now();
      const visibleAcks = ackRows.filter((a) => {
        const ex = a.expires_at ? new Date(a.expires_at).getTime() : null;
        return !ex || ex > now2;
      });
      setAcks(visibleAcks);

      const authorIds = Array.from(
        new Set(
          [...rows.map((r) => r.user_id), ...visibleAcks.map((a) => a.from_user_id), ...visibleAcks.map((a) => a.to_user_id)]
            .filter(Boolean)
            .map(String)
        )
      );
      const profilesRes = authorIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', authorIds)
        : ({ data: [], error: null } as any);

      if (profilesRes.error) throw profilesRes.error;
      setProfilesById(new Map((profilesRes.data || []).map((p: any) => [p.id, p as ProfileRow])));
    } catch (e: any) {
      setFeedError(e?.message || 'Failed to load');
    } finally {
      setFeedLoading(false);
    }
  }, [currentUserId, matchUserIds]);

  const sendAck = useCallback(
    async (toId: string, kind: string, message: string | null) => {
      if (!currentUserId) {
        showToast('Please sign in');
        return;
      }
      try {
        const { error } = await supabase.rpc('send_pulse_acknowledgment', {
          to_id: toId,
          kind,
          message,
          cooldown_minutes: 30,
        });
        if (error) throw error;
        showToast('Sent');
        await loadPulse();
      } catch (e: any) {
        const msg = String(e?.message || 'Failed');
        if (msg.includes('cooldown_active')) {
          showToast('Give it a little space (cooldown).');
        } else if (msg.includes('not_matched')) {
          showToast('Acknowledgments are match-only.');
        } else {
          showToast(msg);
        }
      }
    },
    [currentUserId, loadPulse, showToast]
  );

  useEffect(() => {
    loadPulse().catch(() => undefined);
  }, [loadPulse]);

  useEffect(() => {
    if (!currentUserId) return;
    const ch = supabase
      .channel('love_pulse_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pulse_posts' }, () => {
        loadPulse().catch(() => undefined);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [currentUserId, loadPulse]);

  const createDailyVibe = useCallback(
    async (targetUserId: string, vibe: string, text: string) => {
      if (!currentUserId) {
        showToast('Please sign in');
        return;
      }

      const trimmedText = text.trim().slice(0, 120);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      try {
        const { error } = await supabase.from('pulse_posts').insert({
          user_id: currentUserId,
          target_user_id: targetUserId,
          universe: 'love',
          visibility: 'private',
          type: 'daily_vibe',
          content: {
            vibe,
            text: trimmedText,
            target_user_id: targetUserId,
          },
          expires_at: expiresAt,
        });
        if (error) throw error;
        showToast('Shared');
        await loadPulse();
      } catch (e: any) {
        showToast(e?.message || 'Failed to share');
      }
    },
    [currentUserId, loadPulse, showToast]
  );

  const createHabitMood = useCallback(
    async (targetUserId: string, label: string, value: number) => {
      if (!currentUserId) {
        showToast('Please sign in');
        return;
      }
      const clamped = Math.max(0, Math.min(100, Math.round(value)));
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const left = label.includes('|') ? label.split('|')[0]?.trim() : label;
      const right = label.includes('|') ? label.split('|')[1]?.trim() : '';
      const leaning = clamped < 45 ? left : clamped > 55 ? right : 'in the middle';

      try {
        const { error } = await supabase.from('pulse_posts').insert({
          user_id: currentUserId,
          target_user_id: targetUserId,
          universe: 'love',
          visibility: 'private',
          type: 'habit_mood',
          content: {
            label,
            value: clamped,
            text: leaning === 'in the middle' ? `Today I was kind of in the middle.` : `Today I leaned more toward “${leaning}”.`,
            target_user_id: targetUserId,
          },
          expires_at: expiresAt,
        });
        if (error) throw error;
        showToast('Shared');
        await loadPulse();
      } catch (e: any) {
        showToast(e?.message || 'Failed to share');
      }
    },
    [currentUserId, loadPulse, showToast]
  );

  const createEnrichFavorite = useCallback(
    async (targetUserId: string, category: string, favorite: string) => {
      if (!currentUserId) {
        showToast('Please sign in');
        return;
      }
      const trimmed = favorite.trim().slice(0, 120);
      if (!trimmed) {
        showToast('Add the favorite');
        return;
      }
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      try {
        const { error } = await supabase.from('pulse_posts').insert({
          user_id: currentUserId,
          target_user_id: targetUserId,
          universe: 'love',
          visibility: 'private',
          type: 'enrich_favorite',
          content: {
            category,
            favorite: trimmed,
            text: category ? `${category}: ${trimmed}` : trimmed,
            target_user_id: targetUserId,
          },
          expires_at: expiresAt,
        });
        if (error) throw error;
        showToast('Shared');
        await loadPulse();
      } catch (e: any) {
        showToast(e?.message || 'Failed to share');
      }
    },
    [currentUserId, loadPulse, showToast]
  );

  const createQuietNote = useCallback(
    async (targetUserId: string, prompt: string, note: string) => {
      if (!currentUserId) {
        showToast('Please sign in');
        return;
      }
      const trimmed = note.trim().slice(0, 280);
      if (!trimmed) {
        showToast('Write a quiet note');
        return;
      }
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      try {
        const { error } = await supabase.from('pulse_posts').insert({
          user_id: currentUserId,
          target_user_id: targetUserId,
          universe: 'love',
          visibility: 'private',
          type: 'quiet_note',
          content: {
            prompt: prompt.trim().slice(0, 160),
            note: trimmed,
            target_user_id: targetUserId,
          },
          expires_at: expiresAt,
        });
        if (error) throw error;
        showToast('Saved');
        await loadPulse();
      } catch (e: any) {
        showToast(e?.message || 'Failed to save');
      }
    },
    [currentUserId, loadPulse, showToast]
  );

  const postsByDyad = useMemo(() => {
    const map = new Map<string, PulsePostRow[]>();
    const allowed = new Set([currentUserId, ...matchUserIds]);
    for (const p of posts) {
      const target = String(p.target_user_id || p.content?.target_user_id || '').trim();
      if (!target) continue;
      const author = String(p.user_id || '').trim();
      if (!allowed.has(author) || !allowed.has(target)) continue;

      const a = author < target ? author : target;
      const b = author < target ? target : author;
      const key = `${a}:${b}`;
      const arr = map.get(key) || [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [currentUserId, matchUserIds, posts]);

  const acksByDyad = useMemo(() => {
    const map = new Map<string, PulseAcknowledgmentRow[]>();
    const allowed = new Set([currentUserId, ...matchUserIds]);
    for (const a of acks) {
      const from = String(a.from_user_id || '').trim();
      const to = String(a.to_user_id || '').trim();
      if (!from || !to) continue;
      if (!allowed.has(from) || !allowed.has(to)) continue;
      const x = from < to ? from : to;
      const y = from < to ? to : from;
      const key = `${x}:${y}`;
      const arr = map.get(key) || [];
      arr.push(a);
      map.set(key, arr);
    }
    return map;
  }, [acks, currentUserId, matchUserIds]);

  const getDyadLastActivityIso = useCallback(
    (dyadKey: string) => {
      const arr = postsByDyad.get(dyadKey) || [];
      const ackArr = acksByDyad.get(dyadKey) || [];
      const postIso = arr.length ? arr[0].created_at : null;
      const ackIso = ackArr.length ? ackArr[0].created_at : null;
      if (!postIso && !ackIso) return null;
      if (!postIso) return ackIso;
      if (!ackIso) return postIso;
      return new Date(postIso).getTime() >= new Date(ackIso).getTime() ? postIso : ackIso;
    },
    [acksByDyad, postsByDyad]
  );

  const dyads = useMemo(() => {
    if (!currentUserId) return [];
    const base = acceptedMatches
      .map((m) => {
        const otherId = String(m.other_user_id);
        const a = currentUserId < otherId ? currentUserId : otherId;
        const b = currentUserId < otherId ? otherId : currentUserId;
        const key = `${a}:${b}`;
        return {
          key,
          otherId,
          otherName: m.other_profile?.full_name || 'Someone',
          otherPhotoUrl: m.other_profile?.photo_url || null,
          items: postsByDyad.get(key) || [],
        };
      })
      .filter((d) => d.otherId);

    const time = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);

    return base.sort((x, y) => {
      const ax = time(getDyadLastActivityIso(x.key));
      const ay = time(getDyadLastActivityIso(y.key));
      if (ax !== ay) return ay - ax;
      const nameCmp = String(x.otherName || '').localeCompare(String(y.otherName || ''), undefined, { sensitivity: 'base' });
      if (nameCmp !== 0) return nameCmp;
      return String(x.otherId).localeCompare(String(y.otherId));
    });
  }, [acceptedMatches, currentUserId, getDyadLastActivityIso, postsByDyad]);

  useEffect(() => {
    if (!activeDyadId && dyads.length) setActiveDyadId(dyads[0].otherId);
    if (activeDyadId && dyads.length && !dyads.some((d) => d.otherId === activeDyadId)) {
      setActiveDyadId(dyads[0].otherId);
    }
  }, [activeDyadId, dyads]);

  const activeDyad = useMemo(() => {
    if (!activeDyadId) return null;
    return dyads.find((d) => d.otherId === activeDyadId) || null;
  }, [activeDyadId, dyads]);

  const activeDyadOtherId = useMemo(() => activeDyad?.otherId || null, [activeDyad]);

  const openSoulGraph = useCallback(async () => {
    if (!activeDyadOtherId) return;
    setSoulGraphOpen(true);
    await loadSoulGraph(activeDyadOtherId);
  }, [activeDyadOtherId, loadSoulGraph]);

  type DyadComposer = {
    vibe: string;
    vibeText: string;
    habitLabel: string;
    habitValue: number;
    thoughtPrompt: string;
    thoughtAnswer: string;
    favoriteCategory: string;
    favoriteValue: string;
    quietPrompt: string;
    quietNote: string;
    ackKind: string;
    ackMessage: string;
  };

  const [composerByUserId, setComposerByUserId] = useState<Map<string, DyadComposer>>(new Map());

  const setComposer = useCallback((otherId: string, patch: Partial<DyadComposer>) => {
    setComposerByUserId((prev) => {
      const next = new Map(prev);
      const cur =
        next.get(otherId) ||
        ({
          vibe: 'tender',
          vibeText: '',
          habitLabel: 'Closer | Need space',
          habitValue: 50,
          thoughtPrompt: 'Send one line you wish they could overhear right now',
          thoughtAnswer: '',
          favoriteCategory: 'Song',
          favoriteValue: '',
          quietPrompt: 'No reply needed — I just wanted to say…',
          quietNote: '',
          ackKind: 'warmth',
          ackMessage: '',
        } as DyadComposer);
      next.set(otherId, { ...cur, ...patch });
      return next;
    });
  }, []);

  const getComposer = useCallback(
    (otherId: string) =>
      composerByUserId.get(otherId) ||
      ({
        vibe: 'tender',
        vibeText: '',
        habitLabel: 'Closer | Need space',
        habitValue: 50,
        thoughtPrompt: 'Send one line you wish they could overhear right now',
        thoughtAnswer: '',
        favoriteCategory: 'Song',
        favoriteValue: '',
        quietPrompt: 'No reply needed — I just wanted to say…',
        quietNote: '',
        ackKind: 'warmth',
        ackMessage: '',
      } as DyadComposer),
    [composerByUserId]
  );

  const resolvePostDisplay = useCallback((p: PulsePostRow) => {
    const c = p.content || {};
    switch (p.type) {
      case 'daily_vibe':
        return { badge: String(c.vibe || 'vibe'), text: String(c.text || '').trim() };
      case 'habit_mood':
        return { badge: String(c.label || 'habit'), text: String(c.text || '').trim() };
      case 'thought_seed':
        return { badge: 'thought', text: String(c.answer || c.text || '').trim(), sub: String(c.prompt || '').trim() };
      case 'enrich_favorite':
        return { badge: 'favorite', text: String(c.text || c.favorite || '').trim() };
      case 'quiet_note':
        return { badge: 'quiet', text: String(c.note || '').trim(), sub: String(c.prompt || '').trim() };
      default:
        return { badge: 'pulse', text: '' };
    }
  }, []);

  return (
    <div className="h-full min-h-0 bg-gradient-to-br from-pink-50 via-white to-purple-50 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="rounded-3xl bg-white border border-pink-100 shadow-[0_18px_60px_rgba(0,0,0,0.10)] overflow-hidden">
          <div className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur">
            <div className="px-5 sm:px-8 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-gray-900">Other matches</div>
                  <div className="text-xs text-gray-600 mt-0.5">Tap an avatar to switch rooms.</div>
                </div>
                <div className="text-[11px] font-semibold text-gray-500">{dyads.length ? `${dyads.length} total` : ''}</div>
              </div>
              {dyads.length ? (
                <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                  {dyads.map((d) => {
                    const lastIso = getDyadLastActivityIso(d.key);
                    const isActive = d.otherId === activeDyadId;
                    const initials = String(d.otherName || 'S')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((x) => x[0])
                      .join('')
                      .toUpperCase();
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => switchDyad(d.otherId)}
                        className="flex flex-col items-center gap-1 min-w-[64px]"
                        title={lastIso ? `Last activity: ${formatLastSeen(lastIso)}` : 'No activity yet'}
                      >
                        <div
                          className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center border-2 transition-colors ${
                            isActive ? 'border-pink-400' : 'border-gray-200'
                          }`}
                        >
                          {d.otherPhotoUrl ? (
                            <img src={d.otherPhotoUrl} alt={d.otherName} className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className={`w-full h-full flex items-center justify-center text-sm font-extrabold ${
                                isActive ? 'bg-pink-50 text-pink-800' : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {initials || '♡'}
                            </div>
                          )}
                        </div>
                        <div
                          className={`text-[11px] font-semibold truncate max-w-[72px] ${
                            isActive ? 'text-pink-700' : 'text-gray-700'
                          }`}
                        >
                          {d.otherName}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="p-4 sm:p-6 pb-28">
            {toast && (
              <div className="mb-4 rounded-2xl bg-gray-900 text-white text-sm font-semibold px-4 py-3">{toast}</div>
            )}

            {!currentUserId && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
                Please sign in to use Love Pulse.
              </div>
            )}

            {currentUserId && myMatchesRealtime.loading && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">Loading matches…</div>
            )}

            {currentUserId && !myMatchesRealtime.loading && myMatchesRealtime.error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{myMatchesRealtime.error}</div>
            )}

            {currentUserId && !myMatchesRealtime.loading && !acceptedMatches.length && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">
                No romantic matches yet.
              </div>
            )}

            {currentUserId && feedLoading && (
              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">Loading pulse…</div>
            )}
            {currentUserId && !feedLoading && feedError && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{feedError}</div>
            )}

            {currentUserId && !feedLoading && !feedError && dyads.length > 0 && (
              <div className="space-y-4">
                {/* Room */}
                <div className="rounded-3xl border border-gray-100 bg-white shadow-[0_12px_35px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-pink-50 to-purple-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-gray-900 truncate">{activeDyad?.otherName || 'Your match'}</div>
                        <div className="text-xs text-gray-600">Private room</div>
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <Link
                          to={activeDyadOtherId ? `/love-dashboard/dyad/${activeDyadOtherId}` : '#'}
                          onClick={(e) => {
                            if (!activeDyadOtherId) e.preventDefault();
                          }}
                          aria-disabled={!activeDyadOtherId}
                          className={`inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-white ${
                            !activeDyadOtherId ? 'opacity-50 pointer-events-none' : ''
                          }`}
                          title={'Dyad Space'}
                        >
                          <ArrowRight className="w-4 h-4" />
                          Space
                        </Link>
                        <button
                          type="button"
                          onClick={openSoulGraph}
                          disabled={!activeDyadOtherId}
                          className={`inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-white ${
                            !activeDyadOtherId ? 'opacity-50 pointer-events-none' : ''
                          }`}
                        >
                          <LineChart className="w-4 h-4" />
                          Soul
                        </button>
                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700">
                          <Timer className="w-4 h-4" />
                          24h
                        </div>
                      </div>
                    </div>
                  </div>

                  {activeDyad ? (
                    <div>
                      {(() => {
                        const d = activeDyad;
                        const composer = getComposer(d.otherId);
                        const dyadAcks = acksByDyad.get(d.key) || [];
                        const dyadPosts = d.items || [];
                        const activityIso = getDyadLastActivityIso(d.key);
                        return (
                          <div>
                            <div className="p-5">
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <div className="text-xs text-gray-600">Room</div>
                                <div className="text-[11px] text-gray-500">Last: {formatLastSeen(activityIso)}</div>
                              </div>

                              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-pink-50/30 p-4">
                                <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                                  {dyadPosts.length === 0 && dyadAcks.length === 0 ? (
                                    <div className="text-sm text-gray-600">No shared moments yet. Drop something small.</div>
                                  ) : null}

                            {soulGraphOpen ? (
                              <div
                                className="fixed inset-0 z-[60]"
                                onClick={() => setSoulGraphOpen(false)}
                              >
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                                <div
                                  className="absolute inset-x-3 sm:inset-x-10 top-16 sm:top-20 mx-auto max-w-2xl"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="rounded-3xl border border-pink-100 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] overflow-hidden">
                                    <div className="px-5 sm:px-7 py-5 bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 text-white">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="text-xs font-semibold text-white/85">Soul Graph</div>
                                          <div className="text-xl sm:text-2xl font-extrabold truncate">
                                            {activeDyad?.otherName || 'Your match'}
                                          </div>
                                          <div className="mt-1 text-xs sm:text-sm text-white/85">
                                            A 30‑day pulse of closeness. It grows when you show up.
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setSoulGraphOpen(false)}
                                          className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center"
                                          title="Close"
                                        >
                                          <X className="w-5 h-5" />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="p-5 sm:p-6">
                                      {soulGraphError ? (
                                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{soulGraphError}</div>
                                      ) : null}

                                      {soulGraphLoading ? (
                                        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-700">Listening…</div>
                                      ) : null}

                                      {!soulGraphLoading && !soulGraphError ? (
                                        <div className="rounded-3xl border border-gray-100 bg-gradient-to-br from-white to-pink-50/40 p-5">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                              <div className="text-sm font-extrabold text-gray-900">Your last 30 days</div>
                                              <div className="text-xs text-gray-600 mt-1">Not a score. A story in motion.</div>
                                            </div>
                                            <div className="text-right">
                                              <div className="text-[11px] text-gray-500">Today’s vibe</div>
                                              <div className="text-lg font-extrabold text-gray-900">
                                                {soulPoints.length ? Math.round(soulPoints[soulPoints.length - 1].score) : '—'}
                                              </div>
                                            </div>
                                          </div>

                                          {soulPoints.length ? (
                                            <div className="mt-5">
                                              <div
                                                className="grid gap-1 items-end"
                                                style={{ gridTemplateColumns: `repeat(${soulPoints.length}, minmax(0, 1fr))` }}
                                              >
                                                {soulPoints.map((p, idx) => {
                                                  const prev = idx > 0 ? soulPoints[idx - 1].score : p.score;
                                                  const delta = Math.round(p.score - prev);
                                                  const h = Math.max(10, Math.round((p.score / 100) * 88));
                                                  const isLift = delta >= 0;
                                                  return (
                                                    <div key={p.day} className="flex flex-col items-center gap-2">
                                                      <div
                                                        className={`w-full rounded-full ${
                                                          isLift
                                                            ? 'bg-gradient-to-t from-pink-400 via-fuchsia-400 to-purple-400'
                                                            : 'bg-gradient-to-t from-slate-300 via-slate-200 to-slate-100'
                                                        }`}
                                                        style={{ height: `${h}px` }}
                                                        title={`${p.day}: ${Math.round(p.score)}${idx > 0 ? ` (${delta >= 0 ? '+' : ''}${delta})` : ''}`}
                                                      />
                                                      <div className="text-[10px] font-semibold text-gray-400">{idx % 6 === 0 ? String(p.day).slice(5) : ''}</div>
                                                    </div>
                                                  );
                                                })}
                                              </div>

                                              <div className="mt-4 flex flex-wrap gap-2">
                                                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-700">
                                                  <Sparkles className="w-3.5 h-3.5 text-pink-600" />
                                                  Tiny moves raise it.
                                                </div>
                                                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-700">
                                                  <Heart className="w-3.5 h-3.5 text-pink-600" />
                                                  Consistency beats intensity.
                                                </div>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-700">
                                              No resonance yet. Send a Daily or a Quiet note and come back tomorrow.
                                            </div>
                                          )}
                                        </div>
                                      ) : null}

                                      <div className="mt-4 flex items-center justify-between gap-2">
                                        <div className="text-[11px] text-gray-500">Private between you two.</div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (!activeDyad) return;
                                            void loadSoulGraph(activeDyad.otherId);
                                          }}
                                          className="inline-flex items-center gap-2 rounded-full bg-gray-900 text-white px-4 py-2 text-xs font-semibold"
                                        >
                                          <RefreshCw className="w-4 h-4" />
                                          Refresh
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : null}

                                  {dyadAcks.slice(0, 3).map((a) => {
                                    const fromMe = a.from_user_id === currentUserId;
                                    const fromName =
                                      profilesById.get(a.from_user_id)?.full_name || (fromMe ? 'You' : 'Someone');
                                    return (
                                      <div key={a.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                          className={`max-w-[85%] rounded-2xl px-3 py-2 border text-xs ${
                                            fromMe
                                              ? 'bg-gray-900 text-white border-gray-900'
                                              : 'bg-white text-gray-900 border-gray-200'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className={`text-[11px] font-semibold ${fromMe ? 'text-white/80' : 'text-gray-500'}`}>{fromName}</div>
                                            <div className={`text-[11px] ${fromMe ? 'text-white/60' : 'text-gray-400'}`}>{formatTimeAgo(a.created_at)}</div>
                                          </div>
                                          <div className="mt-1 inline-flex items-center gap-2 font-semibold">
                                            {a.kind === 'spark' ? <Sparkles className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
                                            {a.kind}
                                          </div>
                                          {a.message ? <div className={`mt-1 ${fromMe ? 'text-white' : 'text-gray-800'}`}>{a.message}</div> : null}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {dyadPosts.slice(0, 18).reverse().map((p) => {
                                    const fromMe = p.user_id === currentUserId;
                                    const authorName = profilesById.get(p.user_id)?.full_name || (fromMe ? 'You' : 'Someone');
                                    const display = resolvePostDisplay(p);
                                    return (
                                      <div key={p.id} className={`flex ${fromMe ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                          className={`max-w-[85%] rounded-3xl px-4 py-3 border shadow-sm ${
                                            fromMe
                                              ? 'bg-gradient-to-br from-pink-600 via-fuchsia-600 to-purple-600 text-white border-transparent'
                                              : 'bg-white text-gray-900 border-gray-200'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <div className={`text-[11px] font-semibold ${fromMe ? 'text-white/80' : 'text-gray-500'}`}>{authorName}</div>
                                            <div className={`text-[11px] ${fromMe ? 'text-white/60' : 'text-gray-400'}`}>{formatTimeAgo(p.created_at)}</div>
                                          </div>

                                          <div className={`mt-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                                            fromMe ? 'bg-white/15 text-white' : 'bg-gray-50 text-gray-700 border border-gray-100'
                                          }`}
                                          >
                                            <Heart className={`w-3.5 h-3.5 ${fromMe ? 'text-white' : 'text-pink-600'}`} />
                                            {display.badge}
                                          </div>

                                          {display.sub ? (
                                            <div className={`mt-2 text-xs font-semibold ${fromMe ? 'text-white/85' : 'text-gray-600'}`}>{display.sub}</div>
                                          ) : null}
                                          {display.text ? (
                                            <div className={`mt-2 text-sm font-semibold ${fromMe ? 'text-white' : 'text-gray-900'}`}>{display.text}</div>
                                          ) : null}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Dock popover anchored to button */}
                            {dockAnchor && dockOpen ? (
                              <div
                                className="fixed inset-0 z-50 pointer-events-none"
                                onClick={() => {
                                  setDockOpen(null);
                                  setDockAnchor(null);
                                  setDrawerExpanded(false);
                                }}
                              >
                                <div
                                  className="absolute pointer-events-auto bg-white rounded-2xl border border-gray-200 shadow-[0_-12px_40px_rgba(0,0,0,0.18)] overflow-hidden transition-transform duration-150 ease-out"
                                  style={{
                                    left: dockAnchor.left,
                                    width: dockAnchor.width,
                                    bottom: 92,
                                    transform: 'translateY(0px)',
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  ref={dockPanelRef}
                                >
                                  <div className="px-3 pt-3 pb-2 border-b border-gray-100">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="text-xs font-extrabold text-gray-900">
                                        {dockOpen === 'daily'
                                          ? 'Daily'
                                          : dockOpen === 'checkin'
                                            ? 'Quick check-in'
                                            : dockOpen === 'favorite'
                                              ? 'Favorite'
                                              : dockOpen === 'quiet'
                                                ? 'Quiet note'
                                                : 'Signal'}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDockOpen(null);
                                          setDockAnchor(null);
                                          setDrawerExpanded(false);
                                        }}
                                        className="text-[11px] font-semibold text-gray-600 hover:text-gray-900"
                                      >
                                        Close
                                      </button>
                                    </div>
                                  </div>

                                  <div className="p-3 max-h-[60vh] overflow-auto">
                                    {dockOpen === 'daily' ? (
                                      <div className="space-y-3">
                                        <div className="text-[11px] font-semibold text-gray-700">Daily expressions</div>
                                        <div className="flex flex-wrap gap-2">
                                          {['tender', 'soft', 'quiet', 'hopeful', 'restless', 'warm'].map((v) => (
                                            <button
                                              key={v}
                                              type="button"
                                              onClick={() => setComposer(d.otherId, { vibe: v })}
                                              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                                                composer.vibe === v
                                                  ? 'border-pink-300 bg-pink-50 text-pink-800'
                                                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                              }`}
                                            >
                                              {v}
                                            </button>
                                          ))}
                                        </div>
                                        <textarea
                                          value={composer.vibeText}
                                          onChange={(e) => setComposer(d.otherId, { vibeText: e.target.value.slice(0, 120) })}
                                          placeholder="One optional line (no reply debt)"
                                          className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-sm"
                                          rows={3}
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="text-[11px] text-gray-500">{composer.vibeText.length}/120</div>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              await createDailyVibe(d.otherId, composer.vibe, composer.vibeText);
                                              setComposer(d.otherId, { vibeText: '' });
                                            }}
                                            className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 text-white text-xs font-semibold"
                                          >
                                            Share
                                          </button>
                                        </div>
                                      </div>
                                    ) : null}

                                    {dockOpen === 'checkin' ? (
                                      <div className="space-y-3">
                                        <div className="text-[11px] font-semibold text-gray-700">Quick check-in</div>
                                        <select
                                          value={composer.habitLabel}
                                          onChange={(e) => setComposer(d.otherId, { habitLabel: e.target.value })}
                                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                                        >
                                          {['Closer | Need space', 'Talk it out | Sit with it', 'Soft | Guarded', 'Present | Scattered'].map((x) => (
                                            <option key={x} value={x}>
                                              {x}
                                            </option>
                                          ))}
                                        </select>
                                        <input
                                          type="range"
                                          min={0}
                                          max={100}
                                          value={composer.habitValue}
                                          onChange={(e) => setComposer(d.otherId, { habitValue: Number(e.target.value) })}
                                          className="w-full"
                                        />
                                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                                          <span>{String(composer.habitLabel).split('|')[0]?.trim() || 'Left'}</span>
                                          <span>{String(composer.habitLabel).split('|')[1]?.trim() || 'Right'}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            await createHabitMood(d.otherId, composer.habitLabel, composer.habitValue);
                                          }}
                                          className="w-full rounded-full bg-gray-900 text-white px-4 py-2 text-xs font-semibold hover:bg-gray-800"
                                        >
                                          Send
                                        </button>
                                      </div>
                                    ) : null}

                                    {dockOpen === 'favorite' ? (
                                      <div className="space-y-3">
                                        <div className="text-[11px] font-semibold text-gray-700">Enrich a favorite</div>
                                        <select
                                          value={composer.favoriteCategory}
                                          onChange={(e) => setComposer(d.otherId, { favoriteCategory: e.target.value })}
                                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                                        >
                                          {['Song', 'Movie', 'Show', 'Book', 'Food', 'Place', 'Artist', 'Game', 'Creator', 'Habit'].map((x) => (
                                            <option key={x} value={x}>
                                              {x}
                                            </option>
                                          ))}
                                        </select>
                                        <input
                                          value={composer.favoriteValue}
                                          onChange={(e) => setComposer(d.otherId, { favoriteValue: e.target.value.slice(0, 120) })}
                                          placeholder="e.g., 'Moon Song'"
                                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                                        />
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            await createEnrichFavorite(d.otherId, composer.favoriteCategory, composer.favoriteValue);
                                            setComposer(d.otherId, { favoriteValue: '' });
                                          }}
                                          className="w-full rounded-full bg-gray-900 text-white px-4 py-2 text-xs font-semibold hover:bg-gray-800"
                                        >
                                          Share favorite
                                        </button>
                                      </div>
                                    ) : null}

                                    {dockOpen === 'quiet' ? (
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="text-[11px] font-semibold text-gray-700">Quiet note</div>
                                          <button
                                            type="button"
                                            onClick={() => setComposer(d.otherId, { quietPrompt: quietPrompts[Math.floor(Math.random() * quietPrompts.length)] })}
                                            className="text-[11px] font-semibold text-purple-700 hover:text-purple-900"
                                          >
                                            Shuffle
                                          </button>
                                        </div>
                                        <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-3 text-xs font-semibold text-purple-900">
                                          {composer.quietPrompt}
                                        </div>
                                        <textarea
                                          value={composer.quietNote}
                                          onChange={(e) => setComposer(d.otherId, { quietNote: e.target.value.slice(0, 240) })}
                                          placeholder="Write a quiet note (no reply needed)"
                                          className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-sm"
                                          rows={4}
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="text-[11px] text-gray-500">{composer.quietNote.length}/240</div>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              await createQuietNote(d.otherId, composer.quietPrompt, composer.quietNote);
                                              setComposer(d.otherId, { quietNote: '' });
                                            }}
                                            className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-xs font-semibold"
                                          >
                                            Send
                                          </button>
                                        </div>
                                      </div>
                                    ) : null}

                                    {dockOpen === 'signal' ? (
                                      <div className="space-y-3">
                                        <div className="text-[11px] font-semibold text-gray-700">Send a tiny signal</div>
                                        <div className="grid grid-cols-2 gap-2">
                                          {[
                                            { kind: 'warmth', title: 'Warmth', hint: 'A soft nudge.' },
                                            { kind: 'spark', title: 'Spark', hint: 'A bold ping.' },
                                          ].map((k) => (
                                            <button
                                              key={k.kind}
                                              type="button"
                                              onClick={() => setComposer(d.otherId, { ackKind: k.kind })}
                                              className={`rounded-2xl border p-3 text-left transition-colors ${
                                                composer.ackKind === k.kind
                                                  ? 'border-gray-900 bg-gray-900 text-white'
                                                  : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between gap-2">
                                                <div className="text-xs font-extrabold">{k.title}</div>
                                                <div className="opacity-90">
                                                  {k.kind === 'spark' ? <Sparkles className="w-4 h-4" /> : <Heart className="w-4 h-4" />}
                                                </div>
                                              </div>
                                              <div className={`mt-1 text-[11px] ${composer.ackKind === k.kind ? 'text-white/80' : 'text-gray-500'}`}>{k.hint}</div>
                                            </button>
                                          ))}
                                        </div>
                                        <input
                                          value={composer.ackMessage}
                                          onChange={(e) => setComposer(d.otherId, { ackMessage: e.target.value.slice(0, 140) })}
                                          placeholder="Add a tiny line (optional)"
                                          className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-sm"
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                          <div className="text-[11px] text-gray-500">{composer.ackMessage.length}/140</div>
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              await sendAck(d.otherId, composer.ackKind, composer.ackMessage.trim() || null);
                                              setComposer(d.otherId, { ackMessage: '' });
                                            }}
                                            className="px-4 py-2 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800"
                                          >
                                            Send
                                          </button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            ) : null}

                        {mutualRecommendations.length ? (
                          <div className="pt-2">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Suggested reveals (mutual recommendations)</div>
                            <div className="space-y-2">
                              {mutualRecommendations.slice(0, 3).map((r) => (
                                <div
                                  key={r.id}
                                  className="rounded-2xl border border-gray-100 bg-white px-3 py-2 flex items-center justify-between gap-3"
                                >
                                  <div className="min-w-0">
                                    <div className="text-xs font-extrabold text-gray-900 truncate">
                                      {r.recommended_profile?.full_name || 'Someone'}
                                    </div>
                                    <div className="text-[11px] text-gray-500">Compatibility: {Math.round(r.score)}%</div>
                                  </div>
                                  <button
                                    type="button"
                                    className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-semibold"
                                    onClick={() => {
                                      openRecommendationReveal(String(r.recommended_user_id));
                                    }}
                                  >
                                    Open
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                        );
                      })()}
                    </div>
                  ) : null}
                </div>

                {/* Fixed bottom dock - Pulse page only, shared across matches */}
                <div className="fixed bottom-0 left-0 right-0 z-40 sm:left-[260px]">
                  <div className="w-full px-3 sm:px-6 pb-3">
                    <div className="w-full rounded-3xl border border-gray-100 bg-white/90 backdrop-blur shadow-[0_-12px_40px_rgba(0,0,0,0.12)] p-3">
                    <div className="grid grid-cols-5 gap-2">
                      {(
                        [
                          { key: 'daily', label: 'Daily', accent: 'text-pink-700' },
                          { key: 'checkin', label: 'Check-in', accent: 'text-gray-900' },
                          { key: 'favorite', label: 'Favorite', accent: 'text-amber-700' },
                          { key: 'quiet', label: 'Quiet', accent: 'text-purple-700' },
                          { key: 'signal', label: 'Signal', accent: 'text-gray-900' },
                        ] as Array<{ key: DockKey; label: string; accent: string }>
                      ).map((btn) => {
                        const active = dockOpen === btn.key;
                        const hint =
                          activeDyad && (btn.key === 'quiet' || btn.key === 'signal')
                            ? getDockHint(activeDyad, btn.key)
                            : '';
                        return (
                          <button
                            key={btn.key}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!activeDyad) return;
                              const el = dockButtonRefs.current[btn.key];
                              const rect = el?.getBoundingClientRect();
                              if (rect) {
                                setDockAnchor({ key: btn.key, left: rect.left, width: rect.width });
                              } else {
                                setDockAnchor(null);
                              }
                              setDockOpen((prev) => {
                                if (prev === btn.key) {
                                  setDockAnchor(null);
                                  setDrawerExpanded(false);
                                  return null;
                                }
                                setDrawerExpanded(true);
                                return btn.key;
                              });
                            }}
                            className={`rounded-2xl border px-3 py-2 text-left transition-colors ${
                              active ? 'border-pink-200 bg-pink-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                            }`}
                            disabled={!activeDyad}
                            ref={(node) => {
                              dockButtonRefs.current[btn.key] = node;
                            }}
                          >
                            <div className={`text-xs font-extrabold ${btn.accent}`}>{btn.label}</div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{hint || 'Tap'}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LovePulsePage;
