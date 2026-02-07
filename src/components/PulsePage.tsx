import React, { useEffect, useMemo, useState, useCallback, useLayoutEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
  Activity,
  Heart,
  MessageCircle,
  Share2,
  Smile,
  ChevronDown,
  Globe,
  Orbit,
  Shield,
  Users,
  Lock,
  X,
  Sparkles,
  Timer,
} from 'lucide-react';

type PulseTheme = 'love' | 'friends';

type PulsePageProps = {
  theme?: PulseTheme;
};

type PulseAction =
  | 'daily-trace'
  | 'enrich-favorite'
  | 'habit-mood'
  | 'thought-seed'
  | 'space-response'
  | 'quiet-note';

type Visibility = 'public' | 'orbit' | 'mutual' | 'private';

type FeedView = 'for-you' | 'orbit';

type PulsePostType =
  | 'daily_vibe'
  | 'enrich_favorite'
  | 'habit_mood'
  | 'thought_seed'
  | 'space_response'
  | 'quiet_note';

type PulseReactionType =
  | 'felt_that'
  | 'same'
  | 'warmth'
  | 'nudge'
  | 'stayed_with_me'
  | 'relatable'
  | 'respectful_disagree'
  | 'noticed_you_again';

type ReactionChip = {
  reaction: PulseReactionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  toast: (name: string) => string;
};

type PulsePostRow = {
  id: string;
  user_id: string;
  universe: 'love' | 'friends' | 'both';
  visibility: Visibility;
  type: PulsePostType;
  content: any;
  created_at: string;
  expires_at: string | null;
};

type ExpiryPreset = '4h' | '24h' | '3d' | 'never';

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type UserInterestsRow = {
  user_id: string;
  top_interests: string[] | null;
  hidden_gems: string[] | null;
  future_hopes: string[] | null;
};

type PulseRevealThreadRow = {
  id: string;
  universe: 'love' | 'friends' | 'both';
  user_a_id: string;
  user_b_id: string;
  prompt_id: string | null;
  status: 'issued' | 'awaiting_other' | 'revealed' | 'archived';
  issued_at: string;
  revealed_at: string | null;
};

type PulseRevealPromptRow = {
  id: string;
  universe: 'love' | 'friends' | 'both';
  prompt: string;
  is_active: boolean;
  created_at: string;
};

type PulseSpaceRow = {
  id: string;
  name: string;
  description: string | null;
};

type PulseSpacePromptRow = {
  id: string;
  space_id: string;
  prompt: string;
};

type PulseSpaceResponseRow = {
  id: string;
  space_id: string;
  prompt_id: string | null;
  user_id: string;
  response: string;
  created_at: string;
  visibility: Visibility;
  pulse_post_id: string | null;
};

const PulsePage: React.FC<PulsePageProps> = ({ theme = 'friends' }) => {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PulseAction | null>(null);
  const [visibility, setVisibility] = useState<Visibility | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [posts, setPosts] = useState<PulsePostRow[]>([]);
  const [profilesById, setProfilesById] = useState<Map<string, ProfileRow>>(new Map());
  const [reactionsByPostId, setReactionsByPostId] = useState<Map<string, Record<PulseReactionType, number>>>(new Map());
  const [myReactionsByPostId, setMyReactionsByPostId] = useState<Map<string, Set<PulseReactionType>>>(new Map());
  const [orbitUserIds, setOrbitUserIds] = useState<string[]>([]);
  const [orbitScoresByUserId, setOrbitScoresByUserId] = useState<Map<string, number>>(new Map());
  const [revealedUserIds, setRevealedUserIds] = useState<Set<string>>(new Set());
  const [interestsByUserId, setInterestsByUserId] = useState<Map<string, UserInterestsRow>>(new Map());
  const [revealCandidateId, setRevealCandidateId] = useState<string | null>(null);
  const [revealSaving, setRevealSaving] = useState(false);

  const [revealThread, setRevealThread] = useState<PulseRevealThreadRow | null>(null);
  const [revealPrompt, setRevealPrompt] = useState<PulseRevealPromptRow | null>(null);
  const [revealThreadLoading, setRevealThreadLoading] = useState(false);
  const [revealThreadError, setRevealThreadError] = useState<string | null>(null);
  const [revealResponseText, setRevealResponseText] = useState('');

  const [spaces, setSpaces] = useState<PulseSpaceRow[]>([]);
  const [spacePromptsBySpaceId, setSpacePromptsBySpaceId] = useState<Map<string, PulseSpacePromptRow[]>>(new Map());

  const [spacesSheetOpen, setSpacesSheetOpen] = useState(false);
  const [spacesSheetSelectedSpaceId, setSpacesSheetSelectedSpaceId] = useState<string>('');
  const [spacesSheetLoading, setSpacesSheetLoading] = useState(false);
  const [spacesSheetError, setSpacesSheetError] = useState<string | null>(null);
  const [spacesSheetResponses, setSpacesSheetResponses] = useState<PulseSpaceResponseRow[]>([]);

  const [feedView, setFeedView] = useState<FeedView>('for-you');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 1400);
  }, []);

  const formatExpiresIn = useCallback((expiresAt: string | null) => {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 'Expired';
    const mins = Math.ceil(ms / 60000);
    if (mins < 60) return `Expires in ${mins}m`;
    const hrs = Math.ceil(mins / 60);
    if (hrs < 24) return `Expires in ${hrs}h`;
    const days = Math.ceil(hrs / 24);
    return `Expires in ${days}d`;
  }, []);

  const isExpiringSoon = useCallback((expiresAt: string | null) => {
    if (!expiresAt) return false;
    const ms = new Date(expiresAt).getTime() - Date.now();
    return ms > 0 && ms <= 2 * 60 * 60 * 1000;
  }, []);

  const defaultExpiresAt = useCallback(() => {
    // Most pulse moments are daily/ephemeral.
    const now = new Date();
    return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }, []);

  const copyToClipboard = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied');
      } catch {
        showToast('Copy failed');
      }
    },
    [showToast]
  );

  const logPulseSignal = useCallback(
    async (signal: string, payload: Record<string, any>) => {
      if (!currentUserId) return;
      try {
        await supabase.from('pulse_signals').insert({
          user_id: currentUserId,
          universe: theme,
          signal,
          ...payload,
        });
      } catch {
        // ignore
      }
    },
    [currentUserId, theme]
  );

  const postDwellStartedAtRef = useRef<Map<string, number>>(new Map());

  const PostDwellEffect: React.FC<{ post: PulsePostRow }> = ({ post }) => {
    useEffect(() => {
      if (!currentUserId) return;
      if (post.user_id === currentUserId) return;
      if (post.visibility === 'private') return;

      if (!postDwellStartedAtRef.current.has(post.id)) {
        postDwellStartedAtRef.current.set(post.id, Date.now());
        logPulseSignal('open_post', {
          post_id: post.id,
          target_user_id: post.user_id,
        }).catch(() => undefined);
      }

      return () => {
        const start = postDwellStartedAtRef.current.get(post.id);
        if (!start) return;
        postDwellStartedAtRef.current.delete(post.id);
        const ms = Math.max(0, Date.now() - start);
        logPulseSignal('dwell', {
          post_id: post.id,
          target_user_id: post.user_id,
          dwell_ms: ms,
        }).catch(() => undefined);
      };
    }, [post]);

    return null;
  };

  const actionButtonRef = useRef<HTMLButtonElement | null>(null);
  const [actionMenuPos, setActionMenuPos] = useState<{ top: number; right: number } | null>(null);

  const closeActionMenu = useCallback(() => {
    setIsActionMenuOpen(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const id = data.session?.user?.id || '';
        if (isMounted) setCurrentUserId(id);
      } catch {
        if (isMounted) setCurrentUserId('');
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadPulse = useCallback(async () => {
    setFeedError(null);
    setFeedLoading(true);
    try {
      const uni: 'love' | 'friends' | 'both' = theme;

      const postsRes = await supabase
        .from('pulse_posts')
        .select('id, user_id, universe, visibility, type, content, created_at, expires_at')
        .in('universe', [uni, 'both'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsRes.error) {
        // Debug aid: browser sometimes only shows a generic 404 line; Supabase provides structured details.
        console.error('[Pulse] Failed to load pulse_posts', {
          message: postsRes.error.message,
          details: (postsRes.error as any).details,
          hint: (postsRes.error as any).hint,
          code: (postsRes.error as any).code,
        });
        throw postsRes.error;
      }

      const rows = (postsRes.data as any as PulsePostRow[]) || [];
      // Defense-in-depth (RLS already filters expires_at); also avoid rendering expired posts if clock skew.
      const now = Date.now();
      const visible = rows.filter((p) => {
        const expiresAt = p.expires_at ? new Date(p.expires_at).getTime() : null;
        return !expiresAt || expiresAt > now;
      });
      setPosts(visible);

      const authorIds = Array.from(new Set(rows.map((r) => r.user_id).filter(Boolean)));
      const profilesRes = authorIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', authorIds)
        : ({ data: [], error: null } as any);

      if (profilesRes.error) {
        console.error('[Pulse] Failed to load profiles', profilesRes.error);
        throw profilesRes.error;
      }
      setProfilesById(new Map((profilesRes.data || []).map((p: any) => [p.id, p as ProfileRow])));

      if (theme === 'friends') {
        const spacesRes = await supabase
          .from('pulse_spaces')
          .select('id, name, description')
          .order('name', { ascending: true });
        if (spacesRes.error) {
          console.error('[Pulse] Failed to load pulse_spaces', spacesRes.error);
        } else {
          setSpaces((spacesRes.data || []) as any);
          const ids = (spacesRes.data || []).map((s: any) => String(s.id));
          if (ids.length) {
            const promptsRes = await supabase
              .from('pulse_space_prompts')
              .select('id, space_id, prompt')
              .in('space_id', ids)
              .order('created_at', { ascending: false });
            if (promptsRes.error) {
              console.error('[Pulse] Failed to load pulse_space_prompts', promptsRes.error);
            } else {
              const map = new Map<string, PulseSpacePromptRow[]>();
              (promptsRes.data || []).forEach((r: any) => {
                const sid = String(r.space_id);
                const arr = map.get(sid) || [];
                arr.push({ id: String(r.id), space_id: sid, prompt: String(r.prompt) });
                map.set(sid, arr);
              });
              setSpacePromptsBySpaceId(map);
            }
          } else {
            setSpacePromptsBySpaceId(new Map());
          }
        }
      } else {
        setSpaces([]);
        setSpacePromptsBySpaceId(new Map());
      }

      if (currentUserId) {
        const orbitRes = await supabase
          .from('pulse_orbit')
          .select('other_user_id, score')
          .eq('owner_id', currentUserId)
          .order('score', { ascending: false })
          .order('updated_at', { ascending: false })
          .limit(20);

        if (orbitRes.error) {
          console.error('[Pulse] Failed to load pulse_orbit', orbitRes.error);
        } else {
          const ids = (orbitRes.data || []).map((r: any) => String(r.other_user_id));
          setOrbitUserIds(ids);
          setOrbitScoresByUserId(
            new Map((orbitRes.data || []).map((r: any) => [String(r.other_user_id), Number(r.score || 0)]))
          );
        }

        const revealsRes = await supabase
          .from('pulse_reveals')
          .select('target_user_id')
          .eq('user_id', currentUserId);
        if (revealsRes.error) {
          console.error('[Pulse] Failed to load pulse_reveals', revealsRes.error);
        } else {
          setRevealedUserIds(new Set((revealsRes.data || []).map((r: any) => String(r.target_user_id))));
        }
      } else {
        setOrbitUserIds([]);
        setOrbitScoresByUserId(new Map());
        setRevealedUserIds(new Set());
      }

      const postIds = rows.map((r) => r.id);
      if (postIds.length) {
        const reactionsRes = await supabase
          .from('pulse_reactions')
          .select('post_id, user_id, reaction')
          .in('post_id', postIds);
        if (reactionsRes.error) {
          console.error('[Pulse] Failed to load pulse_reactions', reactionsRes.error);
          throw reactionsRes.error;
        }

        const agg = new Map<string, Record<PulseReactionType, number>>();
        const mine = new Map<string, Set<PulseReactionType>>();
        (reactionsRes.data || []).forEach((r: any) => {
          const postId = String(r.post_id);
          const reaction = String(r.reaction) as PulseReactionType;
          const userId = String(r.user_id);

          const record: Record<PulseReactionType, number> = agg.get(postId) || ({} as any);
          record[reaction] = (record[reaction] || 0) + 1;
          agg.set(postId, record);

          if (currentUserId && userId === currentUserId) {
            const set = mine.get(postId) || new Set<PulseReactionType>();
            set.add(reaction);
            mine.set(postId, set);
          }
        });
        setReactionsByPostId(agg);
        setMyReactionsByPostId(mine);
      } else {
        setReactionsByPostId(new Map());
        setMyReactionsByPostId(new Map());
      }
    } catch (e: any) {
      console.error('[Pulse] loadPulse error', e);
      setFeedError(
        e?.message
          ? `${e.message} (If you recently changed VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY, restart the dev server)`
          : 'Failed to load Pulse'
      );
    } finally {
      setFeedLoading(false);
    }
  }, [currentUserId, theme]);

  const loadInterestsForUsers = useCallback(async (userIds: string[]) => {
    const unique = Array.from(new Set(userIds)).filter(Boolean);
    if (!unique.length) return;
    try {
      const res = await supabase
        .from('user_interests')
        .select('user_id, favorite_song, favorite_movie, hobby_interest, habit, generated_bio')
        .in('user_id', unique);
      if (res.error) throw res.error;
      const next = new Map(interestsByUserId);
      (res.data || []).forEach((r: any) => {
        next.set(String(r.user_id), r as UserInterestsRow);
      });
      setInterestsByUserId(next);
    } catch (e) {
      console.error('[Pulse] Failed to load user_interests', e);
    }
  }, [interestsByUserId]);

  useEffect(() => {
    // Only load interests for revealed users (profile layer cards).
    loadInterestsForUsers(Array.from(revealedUserIds)).catch(() => undefined);
  }, [loadInterestsForUsers, revealedUserIds]);

  useEffect(() => {
    loadPulse().catch(() => undefined);
  }, [loadPulse]);

  useEffect(() => {
    // Live refresh on pulse changes.
    if (!currentUserId) return;

    const ch = supabase
      .channel(`pulse_page_${theme}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pulse_posts' }, () => {
        loadPulse().catch(() => undefined);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pulse_reactions' }, () => {
        loadPulse().catch(() => undefined);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [currentUserId, loadInterestsForUsers, showToast, theme]);

  useEffect(() => {
    if (theme !== 'friends') return;
    if (spacesSheetSelectedSpaceId) return;
    if (!spaces.length) return;
    setSpacesSheetSelectedSpaceId(String(spaces[0].id));
  }, [spaces, spacesSheetSelectedSpaceId, theme]);

  const loadSpacesSheetResponses = useCallback(async () => {
    if (theme !== 'friends') return;
    if (!spacesSheetSelectedSpaceId) {
      setSpacesSheetResponses([]);
      return;
    }

    setSpacesSheetLoading(true);
    setSpacesSheetError(null);
    try {
      const res = await supabase
        .from('pulse_space_responses')
        .select('id, space_id, prompt_id, user_id, response, created_at, visibility, pulse_post_id')
        .eq('space_id', spacesSheetSelectedSpaceId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (res.error) throw res.error;
      setSpacesSheetResponses((res.data || []) as any);
    } catch (e: any) {
      setSpacesSheetError(e?.message || 'Failed to load responses');
      setSpacesSheetResponses([]);
    } finally {
      setSpacesSheetLoading(false);
    }
  }, [spacesSheetSelectedSpaceId, theme]);

  useEffect(() => {
    if (!spacesSheetOpen) return;
    loadSpacesSheetResponses().catch(() => undefined);
  }, [loadSpacesSheetResponses, spacesSheetOpen]);

  useLayoutEffect(() => {
    if (!isActionMenuOpen) {
      return;
    }

    const el = actionButtonRef.current;
    if (!el) {
      return;
    }

    const update = () => {
      const rect = el.getBoundingClientRect();
      const gap = 8;

      setActionMenuPos({
        top: rect.bottom + gap,
        right: Math.max(window.innerWidth - rect.right, 12),
      });
    };

    update();

    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [isActionMenuOpen]);

  const [selectedStory, setSelectedStory] = useState<string | null>(null);

  const themeStyles = useMemo(() => {
    if (theme === 'love') {
      return {
        hero: 'from-pink-600 via-fuchsia-600 to-purple-600',
        pill: 'bg-white/15 border-white/25 text-white',
        primaryBtn: 'from-pink-500 via-fuchsia-500 to-purple-500',
        highlightPill: 'bg-pink-50 text-pink-700 border-pink-200',
        accentRing: 'ring-pink-200',
        selected: 'border-pink-400 bg-pink-50',
        avatar: 'from-pink-500 to-fuchsia-500',
      } as const;
    }

    return {
      hero: 'from-blue-600 via-cyan-600 to-teal-600',
      pill: 'bg-white/15 border-white/25 text-white',
      primaryBtn: 'from-blue-500 via-cyan-500 to-teal-500',
      highlightPill: 'bg-blue-50 text-blue-700 border-blue-200',
      accentRing: 'ring-blue-200',
      selected: 'border-blue-400 bg-blue-50',
      avatar: 'from-blue-500 to-cyan-500',
    } as const;
  }, [theme]);

  const actionLabel = useMemo(() => {
    switch (pendingAction) {
      case 'daily-trace':
        return 'Daily Trace';
      case 'enrich-favorite':
        return 'Enrich a Favorite';
      case 'habit-mood':
        return 'Habit / Mood Slider';
      case 'thought-seed':
        return 'Thought Seed';
      case 'space-response':
        return 'Space Prompt Response';
      case 'quiet-note':
        return 'Quiet Note';
      default:
        return null;
    }
  }, [pendingAction]);

  const orbitPeople = useMemo(() => {
    const base = orbitUserIds.length ? orbitUserIds : Array.from(new Set(posts.map((p) => p.user_id))).filter(Boolean);
    const top = base.slice(0, 10);
    return top.map((id, idx) => {
      const name = profilesById.get(id)?.full_name || 'Someone';
      const initial = name?.charAt(0) || '•';
      const ring = idx % 2 === 0 ? 'ring-emerald-400' : 'ring-amber-400';
      const dot = idx % 2 === 0 ? 'bg-emerald-500' : 'bg-amber-500';
      return { id, name, initial, ring, dot };
    });
  }, [orbitUserIds, posts, profilesById]);

  const revealThreshold = 10;
  const revealCandidates = useMemo(() => {
    // Prefer the highest orbit score among not-yet-revealed.
    return orbitUserIds
      .filter((id) => !revealedUserIds.has(id))
      .sort((a, b) => (orbitScoresByUserId.get(b) || 0) - (orbitScoresByUserId.get(a) || 0))
      .slice(0, 1);
  }, [orbitScoresByUserId, orbitUserIds, revealedUserIds]);

  useEffect(() => {
    setRevealCandidateId(revealCandidates[0] || null);
  }, [revealCandidates]);

  const loadRevealThread = useCallback(async () => {
    if (!currentUserId) {
      setRevealThread(null);
      setRevealPrompt(null);
      return;
    }
    if (theme !== 'love') {
      setRevealThread(null);
      setRevealPrompt(null);
      return;
    }
    if (!revealCandidateId) {
      setRevealThread(null);
      setRevealPrompt(null);
      return;
    }

    setRevealThreadLoading(true);
    setRevealThreadError(null);
    try {
      const a = currentUserId < revealCandidateId ? currentUserId : revealCandidateId;
      const b = currentUserId < revealCandidateId ? revealCandidateId : currentUserId;

      const threadRes = await supabase
        .from('pulse_reveal_threads')
        .select('id, universe, user_a_id, user_b_id, prompt_id, status, issued_at, revealed_at')
        .eq('universe', 'love')
        .eq('user_a_id', a)
        .eq('user_b_id', b)
        .is('archived_at', null)
        .order('issued_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (threadRes.error) throw threadRes.error;
      const thread = (threadRes.data || null) as any as PulseRevealThreadRow | null;
      setRevealThread(thread);

      if (thread?.prompt_id) {
        const promptRes = await supabase
          .from('pulse_reveal_prompts')
          .select('id, universe, prompt, is_active, created_at')
          .eq('id', thread.prompt_id)
          .maybeSingle();
        if (promptRes.error) throw promptRes.error;
        setRevealPrompt((promptRes.data || null) as any);
      } else {
        setRevealPrompt(null);
      }
    } catch (e: any) {
      setRevealThreadError(e?.message || 'Failed to load reveal');
      setRevealThread(null);
      setRevealPrompt(null);
    } finally {
      setRevealThreadLoading(false);
    }
  }, [currentUserId, revealCandidateId, theme]);

  useEffect(() => {
    loadRevealThread().catch(() => undefined);
  }, [loadRevealThread]);

  useEffect(() => {
    if (theme !== 'love') return;
    if (!revealCandidateId) return;
    const t = window.setInterval(() => {
      loadRevealThread().catch(() => undefined);
    }, 8000);
    return () => window.clearInterval(t);
  }, [loadRevealThread, revealCandidateId, theme]);

  const issueRevealThread = useCallback(async () => {
    if (!currentUserId) {
      showToast('Please sign in');
      return;
    }
    if (theme !== 'love') return;
    if (!revealCandidateId) return;
    setRevealSaving(true);
    setRevealThreadError(null);
    try {
      const { data, error } = await supabase.rpc('issue_mutual_reveal_thread', {
        other_id: revealCandidateId,
        min_score: revealThreshold,
        cooldown_hours: 72,
      });
      if (error) throw error;
      if (data) {
        await loadRevealThread();
      }
    } catch (e: any) {
      const msg = String(e?.message || 'Failed to open reveal');
      if (msg.includes('not_eligible')) {
        setRevealThreadError('Not eligible yet. Keep showing up quietly (orbit has to be mutual).');
      } else if (msg.includes('cooldown_active')) {
        setRevealThreadError('You already had a reveal recently. Let it breathe for a bit.');
      } else {
        setRevealThreadError(msg);
      }
    } finally {
      setRevealSaving(false);
    }
  }, [currentUserId, loadRevealThread, revealCandidateId, revealThreshold, showToast, theme]);

  const submitRevealResponse = useCallback(async () => {
    if (!currentUserId) {
      showToast('Please sign in');
      return;
    }
    if (theme !== 'love') return;
    if (!revealThread?.id) return;
    const trimmed = revealResponseText.trim();
    if (!trimmed) {
      setRevealThreadError('Write one honest sentence.');
      return;
    }

    setRevealSaving(true);
    setRevealThreadError(null);
    try {
      const { error } = await supabase.rpc('submit_mutual_reveal_response', {
        thread_uuid: revealThread.id,
        response_text: trimmed,
      });
      if (error) throw error;
      setRevealResponseText('');
      await loadRevealThread();
      showToast('Submitted');
    } catch (e: any) {
      setRevealThreadError(e?.message || 'Failed to submit');
    } finally {
      setRevealSaving(false);
    }
  }, [currentUserId, loadRevealThread, revealResponseText, revealThread?.id, showToast, theme]);

  const revealProfile = useCallback(async () => {
    if (!revealCandidateId) return;
    if (!currentUserId) {
      showToast('Please sign in');
      return;
    }
    setRevealSaving(true);
    try {
      const { data, error } = await supabase.rpc('maybe_create_pulse_reveal', {
        target: revealCandidateId,
        threshold: revealThreshold,
      });
      if (error) throw error;

      if (data?.target_user_id) {
        const next = new Set(revealedUserIds);
        next.add(String(data.target_user_id));
        setRevealedUserIds(next);
      } else {
        const next = new Set(revealedUserIds);
        next.add(revealCandidateId);
        setRevealedUserIds(next);
      }

      showToast('Reveal unlocked');
      await loadPulse();
    } catch (e: any) {
      showToast(e?.message || 'Not unlocked yet');
    } finally {
      setRevealSaving(false);
    }
  }, [currentUserId, loadPulse, revealCandidateId, revealedUserIds, showToast]);

  const layerCardTextForUser = useCallback(
    (userId: string) => {
      const i = interestsByUserId.get(userId);
      if (!i) return null;
      const bits = [
        i.favorite_song ? `Song: ${i.favorite_song}` : null,
        i.favorite_movie ? `Movie: ${i.favorite_movie}` : null,
        i.hobby_interest ? `Hobby: ${i.hobby_interest}` : null,
        i.habit ? `Habit: ${i.habit}` : null,
      ].filter(Boolean) as string[];
      if (bits.length) return bits[0];
      if (i.generated_bio) return i.generated_bio;
      return null;
    },
    [interestsByUserId]
  );

  const reactionChipsForPost = useCallback(
    (post: PulsePostRow): ReactionChip[] => {
      switch (post.type) {
        case 'daily_vibe':
          return [
            { reaction: 'felt_that', label: 'felt that', icon: Heart, toast: (n) => `Sent “felt that” to ${n}` },
            { reaction: 'same', label: 'same', icon: Smile, toast: (n) => `Sent “same” to ${n}` },
            { reaction: 'warmth', label: 'warmth', icon: Sparkles, toast: (n) => `Sent warmth to ${n}` },
          ];
        case 'habit_mood':
          return [
            { reaction: 'relatable', label: 'relatable', icon: Smile, toast: (n) => `Marked relatable for ${n}` },
            { reaction: 'same', label: 'same', icon: Heart, toast: (n) => `Sent “same” to ${n}` },
            { reaction: 'nudge', label: 'nudge', icon: MessageCircle, toast: (n) => `You nudged ${n} gently` },
          ];
        case 'thought_seed':
          return [
            { reaction: 'stayed_with_me', label: 'stayed w/ me', icon: Sparkles, toast: (n) => `That stayed with you (${n})` },
            { reaction: 'felt_that', label: 'felt that', icon: Heart, toast: (n) => `Sent “felt that” to ${n}` },
            { reaction: 'nudge', label: 'nudge', icon: MessageCircle, toast: (n) => `You nudged ${n} gently` },
          ];
        case 'enrich_favorite':
          return [
            { reaction: 'noticed_you_again', label: 'noticed you', icon: Sparkles, toast: (n) => `Noticed ${n} again` },
            { reaction: 'same', label: 'same taste', icon: Smile, toast: (n) => `Same taste as ${n}` },
            { reaction: 'nudge', label: 'ask later', icon: MessageCircle, toast: (n) => `Saved a gentle nudge for ${n}` },
          ];
        case 'space_response':
          return [
            { reaction: 'noticed_you_again', label: 'noticed you', icon: Sparkles, toast: (n) => `Noticed ${n} again` },
            { reaction: 'warmth', label: 'warmth', icon: Heart, toast: (n) => `Sent warmth to ${n}` },
            { reaction: 'respectful_disagree', label: 'soft disagree', icon: Shield, toast: (n) => `Softly disagreed with ${n}` },
          ];
        case 'quiet_note':
          return [];
        default:
          return [
            { reaction: 'felt_that', label: 'felt that', icon: Heart, toast: (n) => `Sent “felt that” to ${n}` },
            { reaction: 'same', label: 'same', icon: Smile, toast: (n) => `Sent “same” to ${n}` },
            { reaction: 'nudge', label: 'nudge', icon: MessageCircle, toast: (n) => `You nudged ${n} gently` },
          ];
      }
    },
    []
  );

  const visiblePosts = useMemo(() => {
    const now = Date.now();
    return posts.filter((p) => {
      const expiresAt = p.expires_at ? new Date(p.expires_at).getTime() : null;
      return !expiresAt || expiresAt > now;
    });
  }, [posts]);

  const orbitPreviewByUserId = useMemo(() => {
    const byId = new Map<string, PulsePostRow>();
    for (const post of visiblePosts) {
      if (!post.user_id) continue;
      if (post.user_id === currentUserId) continue;
      if (!orbitUserIds.includes(post.user_id)) continue;
      if (!byId.has(post.user_id)) {
        byId.set(post.user_id, post);
      }
    }
    return byId;
  }, [currentUserId, orbitUserIds, visiblePosts]);

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

  const resolvePostCopy = useCallback(
    (post: PulsePostRow) => {
      const c = post.content || {};
      switch (post.type) {
      case 'daily_vibe':
        return {
          vibe: String(c.vibe || 'vibe'),
          text: String(c.text || 'A tiny check-in.'),
          prompt: 'Tap to say: “felt that.”',
        };
      case 'habit_mood':
        return {
          vibe: String(c.label || 'signal'),
          text: String(c.text || 'A tiny signal (no typing).'),
          prompt: 'Tap to say: “relatable.”',
        };
      case 'thought_seed':
        return {
          vibe: 'thought',
          text: String(c.answer || c.text || 'A quick whisper.'),
          prompt: String(c.prompt ? `Prompt: ${c.prompt}` : 'Tap to say: “this stayed with me.”'),
        };
      case 'enrich_favorite':
        return {
          vibe: 'favorite',
          text: String(c.favorite || c.text || 'I enriched something I love.'),
          prompt: 'Tap to say: “I want to understand this.”',
        };
      case 'space_response': {
        const spaceId = String(post.content?.space_id || '');
        const promptId = String(post.content?.prompt_id || '');
        const spaceName =
          spaces.find((s) => s.id === spaceId)?.name || String(post.content?.space || '').trim() || 'Space';
        const promptText =
          (promptId && (spacePromptsBySpaceId.get(spaceId) || []).find((p) => p.id === promptId)?.prompt) || '';

        return {
          vibe: spaceName,
          text: String(post.content?.response || '').trim() || 'Shared a space response',
          prompt: promptText ? `Prompt: ${promptText}` : spaceName,
        };
      }
      case 'quiet_note':
        return {
          vibe: 'quiet',
          text: 'Quiet note saved.',
          prompt: 'For matching only.',
        };
      default:
        return { vibe: 'pulse', text: 'A moment.', prompt: 'Tap to respond.' };
      }
    },
    [spacePromptsBySpaceId, spaces]
  );

  const spaceOptions = useMemo(() => {
    return spaces;
  }, [spaces]);

  const addReaction = useCallback(
    async (post: PulsePostRow, reaction: PulseReactionType, toastMessage: string) => {
      if (!currentUserId) {
        showToast('Please sign in to react');
        return;
      }
      if (post.visibility === 'private') {
        showToast('This moment is private');
        return;
      }

      try {
        const current = myReactionsByPostId.get(post.id) || new Set<PulseReactionType>();
        const has = current.has(reaction);

        if (has) {
          const del = await supabase
            .from('pulse_reactions')
            .delete()
            .eq('post_id', post.id)
            .eq('user_id', currentUserId)
            .eq('reaction', reaction);
          if (del.error) throw del.error;

          logPulseSignal('reaction_removed', {
            post_id: post.id,
            target_user_id: post.user_id,
            reaction,
          }).catch(() => undefined);
        } else {
          const ins = await supabase.from('pulse_reactions').insert({
            post_id: post.id,
            user_id: currentUserId,
            reaction,
          });
          if (ins.error) throw ins.error;

          logPulseSignal('reaction_added', {
            post_id: post.id,
            target_user_id: post.user_id,
            reaction,
          }).catch(() => undefined);
        }

        showToast(toastMessage);
      } catch (e) {
        console.error('[Pulse] addReaction failed', e);
        showToast('Could not react');
      }
    },
    [currentUserId, logPulseSignal, myReactionsByPostId, showToast, theme]
  );

  const upsertView = useCallback(
    async (post: PulsePostRow) => {
      if (!currentUserId) return;
      if (post.visibility === 'private') return;
      if (post.user_id === currentUserId) return;
      try {
        await supabase.from('pulse_views').upsert(
          {
            post_id: post.id,
            viewer_id: currentUserId,
            viewed_at: new Date().toISOString(),
          },
          { onConflict: 'post_id,viewer_id' }
        );

        // Viewing also gently increases orbit score (smaller than reactions).
        if (post.user_id) {
          const { data: existing } = await supabase
            .from('pulse_orbit')
            .select('owner_id, other_user_id, score')
            .eq('owner_id', currentUserId)
            .eq('other_user_id', post.user_id)
            .maybeSingle();

          const nextScore = Math.min(9999, (existing?.score || 0) + 1);
          await supabase
            .from('pulse_orbit')
            .upsert(
              {
                owner_id: currentUserId,
                other_user_id: post.user_id,
                score: nextScore,
                last_seen_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'owner_id,other_user_id' }
            );
        }
      } catch {
        // intentionally silent
      }
    },
    [currentUserId]
  );

  const [composerStep, setComposerStep] = useState<'choose_visibility' | 'compose'>('choose_visibility');
  const [composerSaving, setComposerSaving] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>('24h');

  const resetComposer = useCallback(() => {
    setPendingAction(null);
    setVisibility(null);
    setComposerStep('choose_visibility');
    setComposerSaving(false);
    setComposerError(null);
    setExpiryPreset('24h');

    setDailyVibeValue('soft');
    setDailyVibeText('');

    setHabitLabel('Routine — Chaos');
    setHabitValue(50);

    setThoughtPrompt("Lately, I've been avoiding...");
    setThoughtAnswer('');

    setFavoriteLabel('A song');
    setFavoriteValue('');
    setFavoriteLoveRespect(70);

    setSpaceLabel('Late-night thinkers');
    setSpaceResponse('');

    setSelectedSpaceId('');
    setSelectedPromptId('');

    setQuietPrompt('A quiet truth I rarely say...');
    setQuietNote('');
  }, []);

  const [dailyVibeValue, setDailyVibeValue] = useState('soft');
  const [dailyVibeText, setDailyVibeText] = useState('');

  const [habitLabel, setHabitLabel] = useState('Routine — Chaos');
  const [habitValue, setHabitValue] = useState(50);

  const [thoughtPrompt, setThoughtPrompt] = useState("Lately, I've been avoiding...");
  const [thoughtAnswer, setThoughtAnswer] = useState('');

  const [favoriteLabel, setFavoriteLabel] = useState('A song');
  const [favoriteValue, setFavoriteValue] = useState('');
  const [favoriteLoveRespect, setFavoriteLoveRespect] = useState(70);

  const [spaceLabel, setSpaceLabel] = useState('Late-night thinkers');
  const [spaceResponse, setSpaceResponse] = useState('');

  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');

  const selectedSpacePrompts = useMemo(() => {
    if (!selectedSpaceId) return [];
    return spacePromptsBySpaceId.get(selectedSpaceId) || [];
  }, [selectedSpaceId, spacePromptsBySpaceId]);

  const [quietPrompt, setQuietPrompt] = useState('A quiet truth I rarely say...');
  const [quietNote, setQuietNote] = useState('');

  const resolveActionType = useCallback((a: PulseAction): PulsePostType => {
    switch (a) {
      case 'daily-trace':
        return 'daily_vibe';
      case 'enrich-favorite':
        return 'enrich_favorite';
      case 'habit-mood':
        return 'habit_mood';
      case 'thought-seed':
        return 'thought_seed';
      case 'space-response':
        return 'space_response';
      case 'quiet-note':
        return 'quiet_note';
      default:
        return 'daily_vibe';
    }
  }, []);

  const buildContentForAction = useCallback(
    (a: PulseAction) => {
      switch (a) {
        case 'daily-trace':
          return {
            vibe: dailyVibeValue,
            text: dailyVibeText,
          };
        case 'habit-mood':
          return {
            label: habitLabel,
            value: habitValue,
            text: `I'm leaning ${habitValue}% toward ${habitLabel.split(' — ')[1] || 'the other side'}.`,
          };
        case 'thought-seed':
          return {
            prompt: thoughtPrompt,
            answer: thoughtAnswer,
          };
        case 'enrich-favorite':
          return {
            category: favoriteLabel,
            favorite: favoriteValue,
            love_respect: favoriteLoveRespect,
            text: favoriteValue ? `${favoriteLabel}: ${favoriteValue}` : '',
          };
        case 'space-response':
          return {
            space_id: selectedSpaceId || null,
            prompt_id: selectedPromptId || null,
            space: spaceLabel,
            response: spaceResponse,
          };
        case 'quiet-note':
          return {
            prompt: quietPrompt,
            note: quietNote,
          };
        default:
          return {};
      }
    },
    [dailyVibeText, dailyVibeValue, favoriteLabel, favoriteLoveRespect, favoriteValue, habitLabel, habitValue, quietNote, quietPrompt, spaceLabel, spaceResponse, thoughtAnswer, thoughtPrompt]
  );

  const savePulsePost = useCallback(async () => {
    if (!pendingAction) return;
    if (!visibility) {
      setComposerError('Choose who should see this.');
      return;
    }
    if (!currentUserId) {
      setComposerError('Please sign in first.');
      return;
    }

    const type = resolveActionType(pendingAction);
    const content = buildContentForAction(pendingAction);

    // Basic validations
    if (type === 'thought_seed' && !String((content as any).answer || '').trim()) {
      setComposerError('Write a short answer or close this moment.');
      return;
    }
    if (type === 'space_response' && !String((content as any).response || '').trim()) {
      setComposerError('Write a short response or close this moment.');
      return;
    }
    if (type === 'space_response' && theme === 'friends' && !(content as any).space_id) {
      setComposerError('Pick a space.');
      return;
    }
    if (type === 'enrich_favorite' && !String((content as any).favorite || '').trim()) {
      setComposerError('Pick the favorite.');
      return;
    }

    const today = new Date();
    const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const limitKey = `pulse_limit:${currentUserId}:${dayKey}:${theme}:${type}`;
    const currentCount = Number(localStorage.getItem(limitKey) || '0');

    const softLimits: Record<PulsePostType, number> = {
      daily_vibe: 3,
      enrich_favorite: 2,
      habit_mood: 3,
      thought_seed: 2,
      space_response: 3,
      quiet_note: 6,
    };
    const allowed = softLimits[type] ?? 3;
    if (currentCount >= allowed) {
      setComposerError('Slow it down: you’ve shared plenty today. Try again tomorrow.');
      return;
    }

    setComposerSaving(true);
    setComposerError(null);
    try {
      const uni: 'love' | 'friends' | 'both' = theme;

      const expires = (() => {
        if (pendingAction === 'quiet-note' || visibility === 'private') return null;
        if (expiryPreset === 'never') return null;
        const now = Date.now();
        const ms = expiryPreset === '4h' ? 4 * 60 * 60 * 1000 : expiryPreset === '3d' ? 3 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        return new Date(now + ms).toISOString();
      })();

      const postRes = await supabase
        .from('pulse_posts')
        .insert({
          user_id: currentUserId,
          universe: uni,
          visibility,
          type,
          content,
          expires_at: expires,
        })
        .select('id')
        .single();
      if (postRes.error) throw postRes.error;

      if (type === 'space_response' && theme === 'friends') {
        const spaceId = (content as any)?.space_id || null;
        const promptId = (content as any)?.prompt_id || null;
        const responseText = String((content as any)?.response || '').trim();
        if (spaceId && responseText) {
          const ins = await supabase.from('pulse_space_responses').insert({
            space_id: spaceId,
            prompt_id: promptId,
            user_id: currentUserId,
            response: responseText,
            visibility,
            pulse_post_id: postRes.data.id,
          });
          if (ins.error) {
            console.error('[Pulse] Failed to insert pulse_space_responses', ins.error);
          }
        }
      }

      localStorage.setItem(limitKey, String(currentCount + 1));

      showToast('Shared');
      resetComposer();
      await loadPulse();
    } catch (e: any) {
      setComposerError(e?.message || 'Failed to share');
    } finally {
      setComposerSaving(false);
    }
  }, [buildContentForAction, currentUserId, expiryPreset, loadPulse, pendingAction, resetComposer, resolveActionType, showToast, theme, visibility]);

  return (
    <div className="min-h-screen bg-[#FAFAFB]">
      <div className="relative">
        <div className={`absolute inset-0 bg-gradient-to-r ${themeStyles.hero}`} />
        <div className="absolute inset-0 opacity-45 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.40),transparent_45%),radial-gradient(circle_at_85%_30%,rgba(255,255,255,0.22),transparent_55%),radial-gradient(circle_at_50%_95%,rgba(255,255,255,0.18),transparent_60%)]" />
        <div className="relative px-3 sm:px-4 pt-4 sm:pt-6 pb-10 sm:pb-14">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 border border-white/25 flex items-center justify-center shadow-lg">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">Pulse</h1>
                    <p className="text-white/85 text-xs sm:text-sm">Tiny moments. Real people. No awkward DMs.</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${themeStyles.pill} border text-white/90 text-[11px] sm:text-xs font-semibold`}>
                    <Timer className="w-3.5 h-3.5" />
                    one vibe a day
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${themeStyles.pill} border text-white/90 text-[11px] sm:text-xs font-semibold`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    soft connection, not work
                  </span>
                </div>
              </div>

              <div className="relative flex-shrink-0 z-50">
                {theme === 'friends' && (
                  <button
                    type="button"
                    onClick={() => {
                      setSpacesSheetOpen(true);
                      logPulseSignal('open_spaces_sheet', {}).catch(() => undefined);
                      if (!spacesSheetSelectedSpaceId && spaces.length) {
                        setSpacesSheetSelectedSpaceId(String(spaces[0].id));
                      }
                    }}
                    className="mr-2 inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white/15 border border-white/25 text-white text-xs sm:text-sm font-semibold shadow-lg hover:bg-white/20 transition-all"
                  >
                    Spaces
                  </button>
                )}
                <button
                  ref={actionButtonRef}
                  type="button"
                  onClick={() => setIsActionMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-white/15 border border-white/25 text-white text-xs sm:text-sm font-semibold shadow-lg hover:bg-white/20 transition-all"
                >
                  Share a vibe
                  <ChevronDown className={`w-4 h-4 transition-transform ${isActionMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {spacesSheetOpen && theme === 'friends' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSpacesSheetOpen(false)}
          />
          <div className="relative w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-gray-900">Spaces</div>
                <div className="text-xs text-gray-600">Friends-only rooms for shared moments.</div>
              </div>
              <button
                type="button"
                onClick={() => setSpacesSheetOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <div className="text-xs font-semibold text-gray-700">Pick a space</div>
                <div className="mt-2 space-y-2">
                  {spaces.map((s) => {
                    const active = String(s.id) === spacesSheetSelectedSpaceId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSpacesSheetSelectedSpaceId(String(s.id));
                        }}
                        className={`w-full text-left rounded-2xl border p-3 transition-all ${
                          active ? `${themeStyles.selected} shadow-sm` : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-bold text-gray-900">{s.name}</div>
                        {s.description && <div className="mt-1 text-[11px] text-gray-600">{s.description}</div>}
                      </button>
                    );
                  })}
                  {!spaces.length && <div className="text-xs text-gray-600">No spaces yet.</div>}
                </div>
              </div>

              <div className="sm:col-span-2">
                {(() => {
                  const space = spaces.find((s) => String(s.id) === spacesSheetSelectedSpaceId);
                  const prompts = spacePromptsBySpaceId.get(spacesSheetSelectedSpaceId) || [];
                  const todayPrompt = prompts[0]?.prompt || 'No prompt yet.';

                  return (
                    <>
                      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                        <div className="text-xs font-semibold text-gray-700">{space?.name || 'Space'}</div>
                        <div className="mt-1 text-sm font-bold text-gray-900">{todayPrompt}</div>
                        <button
                          type="button"
                          onClick={() => {
                            logPulseSignal('respond_space_prompt_clicked', {
                              space_id: spacesSheetSelectedSpaceId,
                              prompt_id: (spacePromptsBySpaceId.get(spacesSheetSelectedSpaceId) || [])[0]?.id || null,
                            }).catch(() => undefined);
                            setPendingAction('space-response');
                            setVisibility(null);
                            setComposerStep('choose_visibility');
                            setSpacesSheetOpen(false);
                            setSelectedSpaceId(spacesSheetSelectedSpaceId);
                            const firstPrompt = (spacePromptsBySpaceId.get(spacesSheetSelectedSpaceId) || [])[0];
                            setSelectedPromptId(firstPrompt?.id || '');
                            if (space?.name) setSpaceLabel(space.name);
                          }}
                          className={`mt-3 w-full py-2 rounded-full bg-gradient-to-r ${themeStyles.primaryBtn} text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all`}
                        >
                          Respond in this space
                        </button>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-bold text-gray-900">Recent responses</div>
                          <button
                            type="button"
                            onClick={() => loadSpacesSheetResponses()}
                            className="text-xs font-semibold text-gray-700 hover:text-gray-900"
                          >
                            Refresh
                          </button>
                        </div>

                        {spacesSheetError && <div className="mt-2 text-xs font-semibold text-red-600">{spacesSheetError}</div>}
                        {spacesSheetLoading ? (
                          <div className="mt-3 text-xs text-gray-600">Loading…</div>
                        ) : (
                          <div className="mt-3 space-y-3">
                            {spacesSheetResponses.map((r) => {
                              const name = profilesById.get(r.user_id)?.full_name || 'Someone';
                              return (
                                <div key={r.id} className="rounded-2xl border border-gray-100 bg-white p-3">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="text-xs font-semibold text-gray-700 truncate">{name}</div>
                                    <div className="text-[11px] text-gray-500">{formatTimeAgo(r.created_at)}</div>
                                  </div>
                                  <div className="mt-2 text-sm font-semibold text-gray-900">{r.response}</div>
                                </div>
                              );
                            })}
                            {!spacesSheetResponses.length && (
                              <div className="text-xs text-gray-600">No responses yet. Be the first to show up.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {isActionMenuOpen && actionMenuPos && (
        <div className="fixed inset-0 z-[9999]">
          <button
            type="button"
            aria-label="Close share a vibe menu"
            onClick={closeActionMenu}
            className="absolute inset-0 bg-black/20"
          />

          <div
            className="fixed w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[70vh] overflow-y-auto"
            style={{ top: actionMenuPos.top, right: actionMenuPos.right }}
          >
            <div className="p-2">
              <button
                type="button"
                onClick={() => {
                  setPendingAction('daily-trace');
                  setVisibility(null);
                  closeActionMenu();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-bold text-gray-900">Daily vibe</div>
                <div className="text-xs text-gray-600">1 per day, keep it light</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingAction('enrich-favorite');
                  setVisibility(null);
                  closeActionMenu();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-bold text-gray-900">Enrich a Favorite</div>
                <div className="text-xs text-gray-600">Make your taste feel personal</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingAction('habit-mood');
                  setVisibility(null);
                  closeActionMenu();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-bold text-gray-900">Habit / Mood Slider</div>
                <div className="text-xs text-gray-600">A tiny signal (no typing)</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingAction('thought-seed');
                  setVisibility(null);
                  closeActionMenu();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-bold text-gray-900">Thought Seed</div>
                <div className="text-xs text-gray-600">A quick whisper</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingAction('space-response');
                  setVisibility(null);
                  closeActionMenu();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-bold text-gray-900">Space Prompt Response</div>
                <div className="text-xs text-gray-600">Show up to the same moment</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPendingAction('quiet-note');
                  setVisibility(null);
                  closeActionMenu();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="text-sm font-bold text-gray-900">Quiet Note</div>
                <div className="text-xs text-gray-600">Just for matching</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-0 right-0 top-3 z-[9999] flex justify-center px-3">
          <div className="pointer-events-none rounded-full bg-gray-900 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow-xl">
            {toast}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-3 sm:px-4 mt-4 sm:mt-6 pb-6 sm:pb-10 space-y-4 sm:space-y-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.10)] p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold text-gray-900">Orbit</div>
              <div className="text-xs sm:text-sm text-gray-600">The faces that keep feeling familiar.</div>
            </div>
            <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${themeStyles.highlightPill} border text-xs font-semibold`}>
              <Orbit className="w-3.5 h-3.5" />
              little moments
            </span>
          </div>

          <div className="mt-4 flex gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory">
            {orbitPeople.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStory(s.id)}
                className="flex flex-col items-center gap-2 min-w-[72px] snap-start"
              >
                <div className={`relative w-14 h-14 rounded-full bg-white ring-4 ${s.ring} shadow-sm flex items-center justify-center`}>
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${themeStyles.avatar} flex items-center justify-center text-white font-extrabold`}>
                    {s.initial}
                  </div>
                  <div className={`absolute -right-0.5 -bottom-0.5 w-4 h-4 rounded-full border-2 border-white ${s.dot}`} />
                </div>
                <div className="text-[11px] font-semibold text-gray-800 truncate w-[72px] text-center">{s.name}</div>
              </button>
            ))}
          </div>

          {selectedStory !== null && (
            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-700">A tiny thing from {orbitPeople.find((p) => p.id === selectedStory)?.name || 'Someone'}</div>
                  {(() => {
                    const preview = orbitPreviewByUserId.get(selectedStory);
                    if (!preview) {
                      return (
                        <>
                          <div className="text-sm font-bold text-gray-900">"I’m proud of myself for showing up."</div>
                          <div className="mt-1 text-[11px] text-gray-600">No reply debt. Just a little warmth.</div>
                        </>
                      );
                    }

                    const copy = resolvePostCopy(preview);
                    return (
                      <>
                        <div className="text-sm font-bold text-gray-900">{copy.text}</div>
                        <div className="mt-1 text-[11px] text-gray-600">
                          {copy.prompt}{' '}
                          <span className="text-gray-400">· {formatTimeAgo(preview.created_at)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStory(null)}
                  className="p-2 rounded-full hover:bg-white transition-colors"
                >
                  <X className="w-4 h-4 text-gray-700" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
                  Tap: “same"
                </button>
                <button type="button" className="px-3 py-1.5 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
                  Tap: “proud of you"
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Sent warmth')}
                  className={`px-3 py-1.5 rounded-full bg-gradient-to-r ${themeStyles.primaryBtn} text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all`}
                >
                  Send warmth
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {revealCandidateId && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.10)] p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-extrabold text-gray-900">A mutual reveal is close</div>
                    <div className="mt-1 text-xs sm:text-sm text-gray-600">Two-way orbit has built enough warmth to unlock a layer.</div>
                  </div>
                  {theme === 'love' ? (
                    <button
                      type="button"
                      onClick={issueRevealThread}
                      disabled={revealSaving || revealThreadLoading}
                      className={`px-4 py-2 rounded-full bg-gradient-to-r ${themeStyles.primaryBtn} text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60`}
                    >
                      {revealThread ? 'Open' : revealSaving ? 'Opening…' : 'Open'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={revealProfile}
                      disabled={revealSaving}
                      className={`px-4 py-2 rounded-full bg-gradient-to-r ${themeStyles.primaryBtn} text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60`}
                    >
                      {revealSaving ? 'Revealing…' : 'Reveal'}
                    </button>
                  )}
                </div>

                {theme === 'love' && (
                  <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                    {revealThreadLoading ? (
                      <div className="text-xs text-gray-600">Loading reveal…</div>
                    ) : revealThreadError ? (
                      <div className="text-xs font-semibold text-red-600">{revealThreadError}</div>
                    ) : revealThread ? (
                      <>
                        <div className="text-xs font-semibold text-gray-700">Mutual reveal prompt</div>
                        <div className="mt-1 text-sm font-bold text-gray-900">{revealPrompt?.prompt || 'A small question to answer privately.'}</div>

                        {revealThread.status !== 'revealed' && (
                          <>
                            <textarea
                              value={revealResponseText}
                              onChange={(e) => setRevealResponseText(e.target.value.slice(0, 220))}
                              placeholder="One honest sentence."
                              className="mt-3 w-full rounded-2xl border border-gray-200 bg-white p-3 text-sm"
                              rows={3}
                            />
                            <button
                              type="button"
                              onClick={submitRevealResponse}
                              disabled={revealSaving}
                              className={`mt-3 w-full py-2 rounded-full bg-gradient-to-r ${themeStyles.primaryBtn} text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60`}
                            >
                              {revealSaving ? 'Submitting…' : 'Submit'}
                            </button>
                            {revealThread.status === 'awaiting_other' && (
                              <div className="mt-2 text-[11px] text-gray-600">Waiting for the other person. No reply debt.</div>
                            )}
                          </>
                        )}

                        {revealThread.status === 'revealed' && (
                          <div className="mt-2 text-[11px] text-gray-600">Revealed. You can see each other’s responses.</div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-gray-600">Open a mutual reveal when you’re ready.</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.10)] p-2">
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="text-sm font-extrabold text-gray-900">Pulse Feed</div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-full bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => setFeedView('for-you')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        feedView === 'for-you' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      For you
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedView('orbit')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        feedView === 'orbit' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Orbit
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {feedLoading && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.10)] p-6 text-sm text-gray-600">
                Loading Pulse...
              </div>
            )}
            {!feedLoading && feedError && (
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.10)] p-6 text-sm text-red-600">
                {feedError}
              </div>
            )}
            {!feedLoading && !feedError && visiblePosts.map((post) => {
              const isRevealed = revealedUserIds.has(post.user_id);
              const authorName = isRevealed ? profilesById.get(post.user_id)?.full_name || 'Someone' : 'Someone';
              const initial = authorName.charAt(0) || '•';
              const copy = resolvePostCopy(post);
              const counts = reactionsByPostId.get(post.id) || ({} as Record<PulseReactionType, number>);
              const my = myReactionsByPostId.get(post.id) || new Set<PulseReactionType>();
              const chips = reactionChipsForPost(post);
              const layer = isRevealed ? layerCardTextForUser(post.user_id) : null;

              // Mark view (soft curiosity signal)
              upsertView(post).catch(() => undefined);

              const expiresLabel = formatExpiresIn(post.expires_at);
              const soon = isExpiringSoon(post.expires_at);
              return (
              <div key={post.id} className={`bg-white rounded-2xl sm:rounded-3xl border ${soon ? 'border-amber-200' : 'border-gray-100'} shadow-[0_10px_35px_rgba(0,0,0,0.10)] overflow-hidden`}>
                <PostDwellEffect post={post} />
                <div className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-r ${themeStyles.avatar} flex items-center justify-center text-white font-extrabold ring-4 ${themeStyles.accentRing}`}>
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-extrabold text-gray-900 truncate">{authorName}</div>
                          <span className="text-[11px] text-gray-500">{formatTimeAgo(post.created_at)}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${themeStyles.highlightPill} border text-[11px] font-semibold`}>
                            <Sparkles className="w-3.5 h-3.5" />
                            {copy.vibe}
                          </span>
                          <span className="text-[11px] text-gray-500">{post.visibility}</span>
                          {expiresLabel && (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${soon ? 'text-amber-700' : 'text-gray-500'}`}>
                              <Timer className="w-3.5 h-3.5" />
                              {expiresLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPendingAction('thought-seed');
                        setVisibility(null);
                        setComposerStep('choose_visibility');
                      }}
                      className="px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Respond
                    </button>
                  </div>

                  <div className="mt-4 text-[15px] leading-relaxed font-semibold text-gray-900">{copy.text}</div>
                  <div className="mt-2 text-xs text-gray-600">{copy.prompt}</div>
                  {layer && (
                    <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                      <div className="text-[11px] font-semibold text-gray-700">Revealed layer</div>
                      <div className="mt-1 text-xs font-semibold text-gray-900">{layer}</div>
                    </div>
                  )}
                  <div className="mt-3 text-[11px] text-gray-600">
                    {Object.keys(counts).length ? 'Acknowledged' : 'Be the first to acknowledge'}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {chips.map((chip) => {
                      const Icon = chip.icon;
                      const count = counts[chip.reaction] || 0;
                      const active = my.has(chip.reaction);
                      return (
                        <button
                          key={chip.reaction}
                          type="button"
                          onClick={() => addReaction(post, chip.reaction, chip.toast(authorName))}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-100 transition-colors ${
                            active ? 'ring-2 ring-gray-300' : ''
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {chip.label}{count ? ` · ${count}` : ''}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        logPulseSignal('copy_link', {}).catch(() => undefined);
                        copyToClipboard(window.location.href);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      copy link
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.10)] p-4 sm:p-6">
              <div className="text-sm font-extrabold text-gray-900">A gentle nudge</div>
              <div className="mt-1 text-xs sm:text-sm text-gray-600">
                The more you tap, the more your Orbit starts feeling like “your people.”
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={`px-3 py-2 rounded-full bg-gradient-to-r ${themeStyles.primaryBtn} text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all`}>
                  Find someone familiar
                </button>
                <button type="button" className="px-3 py-2 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-50 transition-colors">
                  Quietly update your vibe
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.10)] p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="text-base font-bold text-gray-900">Your vibe today</div>
                <Timer className="w-5 h-5 text-gray-700" />
              </div>
              <div className="mt-1 text-xs sm:text-sm text-gray-600">One tiny post. You don’t have to be “interesting”.</div>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <div className="text-xs font-semibold text-gray-700">Daily vibe</div>
                <div className="text-sm font-bold text-gray-900">Not shared yet</div>
                <button
                  type="button"
                  onClick={() => {
                    setPendingAction('daily-trace');
                    setVisibility(null);
                  }}
                  className={`mt-3 w-full py-2 rounded-full bg-gradient-to-r ${themeStyles.primaryBtn} text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all`}
                >
                  Share mine
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-[0_10px_35px_rgba(0,0,0,0.10)] p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="text-base font-bold text-gray-900">Visibility</div>
                <Shield className="w-5 h-5 text-gray-700" />
              </div>
              <div className="mt-1 text-xs sm:text-sm text-gray-600">You choose every time.</div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-gray-200 p-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-700" />
                    <div className="text-xs font-semibold text-gray-800">Public</div>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">Anyone can witness this.</div>
                </div>
                <div className="rounded-2xl border border-gray-200 p-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Orbit className="w-4 h-4 text-gray-700" />
                    <div className="text-xs font-semibold text-gray-800">Orbit</div>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">Recurring people only.</div>
                </div>
                <div className="rounded-2xl border border-gray-200 p-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-700" />
                    <div className="text-xs font-semibold text-gray-800">Mutual</div>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">Mutual attention only.</div>
                </div>
                <div className="rounded-2xl border border-gray-200 p-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-gray-700" />
                    <div className="text-xs font-semibold text-gray-800">Private</div>
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">For matching only.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={resetComposer}
          />
          <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-gray-900">{actionLabel}</div>
                <div className="text-xs text-gray-600">
                  {composerStep === 'choose_visibility' ? 'Who should see this?' : 'Make it tiny. Make it real.'}
                </div>
              </div>
              <button
                type="button"
                onClick={resetComposer}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>

            {composerError && <div className="mt-3 text-xs font-semibold text-red-600">{composerError}</div>}

            {composerStep === 'choose_visibility' && (
              <>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'public', label: 'Public', desc: 'Anyone can witness this.', icon: Globe },
                      { id: 'orbit', label: 'Orbit', desc: 'Recurring people only.', icon: Orbit },
                      { id: 'mutual', label: 'Mutual', desc: 'Mutual attention only.', icon: Users },
                      { id: 'private', label: 'Private', desc: 'For matching only.', icon: Lock },
                    ] as const
                  ).map((opt) => {
                    const Icon = opt.icon;
                    const selected = visibility === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setVisibility(opt.id)}
                        className={`text-left p-4 rounded-2xl border transition-all ${
                          selected
                            ? `${themeStyles.selected} shadow-sm`
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
                              selected ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <Icon className="w-4 h-4 text-gray-800" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{opt.label}</div>
                            <div className="text-xs text-gray-600">{opt.desc}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!visibility) {
                        setComposerError('Choose who should see this.');
                        return;
                      }
                      setComposerStep('compose');
                      setComposerError(null);
                    }}
                    className={`w-full py-2.5 rounded-full bg-gradient-to-r ${themeStyles.primaryBtn} text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all`}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {composerStep === 'compose' && (
              <>
                {visibility !== 'private' && pendingAction !== 'quiet-note' && (
                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold text-gray-700">Ritual</div>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: '4h', label: '4h' },
                          { id: '24h', label: '24h' },
                          { id: '3d', label: '3d' },
                          { id: 'never', label: 'keep' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setExpiryPreset(opt.id)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${
                            expiryPreset === opt.id ? themeStyles.selected : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {pendingAction === 'daily-trace' && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs font-semibold text-gray-700">Pick today's vibe</div>
                    <div className="flex flex-wrap gap-2">
                      {['soft', 'warm', 'restless', 'quiet', 'hopeful', 'tender'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setDailyVibeValue(v)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${
                            dailyVibeValue === v ? themeStyles.selected : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={dailyVibeText}
                      onChange={(e) => setDailyVibeText(e.target.value.slice(0, 120))}
                      placeholder="Optional: one line (no reply debt)"
                      className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                      rows={3}
                    />
                    <div className="text-[11px] text-gray-500">{dailyVibeText.length}/120</div>
                  </div>
                )}

                {pendingAction === 'habit-mood' && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs font-semibold text-gray-700">A gentle slider</div>
                    <div className="flex flex-wrap gap-2">
                      {['Routine — Chaos', 'Talk it out — Sit with it', 'Night alive — Morning hopeful'].map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setHabitLabel(l)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${
                            habitLabel === l ? themeStyles.selected : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={habitValue}
                      onChange={(e) => setHabitValue(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-700">{habitValue}%</div>
                  </div>
                )}

                {pendingAction === 'thought-seed' && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs font-semibold text-gray-700">Thought seed</div>
                    <select
                      value={thoughtPrompt}
                      onChange={(e) => setThoughtPrompt(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      {[
                        "Lately, I've been avoiding...",
                        'I secretly admire people who...',
                        "I'm certain about this, unsure about everything else...",
                      ].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={thoughtAnswer}
                      onChange={(e) => setThoughtAnswer(e.target.value.slice(0, 180))}
                      placeholder="Finish it (no essays)"
                      className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-gray-200"
                      rows={3}
                    />
                    <div className="text-[11px] text-gray-500">{thoughtAnswer.length}/180</div>
                  </div>
                )}

                {pendingAction === 'enrich-favorite' && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs font-semibold text-gray-700">A memory card</div>
                    <div className="flex gap-2">
                      {['A song', 'A movie', 'A habit', 'A place'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFavoriteLabel(c)}
                          className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${
                            favoriteLabel === c ? themeStyles.selected : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <input
                      value={favoriteValue}
                      onChange={(e) => setFavoriteValue(e.target.value.slice(0, 80))}
                      placeholder="Name it"
                      className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    />
                    <div className="text-xs text-gray-700">Love — Respect</div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={favoriteLoveRespect}
                      onChange={(e) => setFavoriteLoveRespect(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {pendingAction === 'space-response' && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs font-semibold text-gray-700">Choose a space</div>
                    <select
                      value={selectedSpaceId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setSelectedSpaceId(nextId);
                        const name = spaces.find((s) => s.id === nextId)?.name || '';
                        if (name) setSpaceLabel(name);
                        const firstPrompt = (spacePromptsBySpaceId.get(nextId) || [])[0];
                        setSelectedPromptId(firstPrompt?.id || '');
                      }}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select…</option>
                      {spaceOptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>

                    <div className="text-xs font-semibold text-gray-700">Prompt</div>
                    <select
                      value={selectedPromptId}
                      onChange={(e) => setSelectedPromptId(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      disabled={!selectedSpaceId}
                    >
                      <option value="">Select…</option>
                      {selectedSpacePrompts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.prompt}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={spaceResponse}
                      onChange={(e) => setSpaceResponse(e.target.value.slice(0, 180))}
                      placeholder="Respond softly"
                      className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-sm"
                      rows={3}
                    />
                  </div>
                )}

                {pendingAction === 'quiet-note' && (
                  <div className="mt-4 space-y-3">
                    <div className="text-xs font-semibold text-gray-700">Quiet note (private)</div>
                    <select
                      value={quietPrompt}
                      onChange={(e) => setQuietPrompt(e.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm"
                    >
                      {[
                        'A quiet truth I rarely say...',
                        "A habit I'm trying to rebuild...",
                        "Something I want, but don't chase...",
                      ].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={quietNote}
                      onChange={(e) => setQuietNote(e.target.value.slice(0, 160))}
                      placeholder="Optional line"
                      className="w-full rounded-2xl border border-gray-200 bg-white p-3 text-sm"
                      rows={3}
                    />
                    <div className="text-[11px] text-gray-500">This won't show up in feeds.</div>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setComposerStep('choose_visibility')}
                    className="flex-1 py-2 rounded-full bg-white border border-gray-200 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                    disabled={composerSaving}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={savePulsePost}
                    className={`flex-1 py-2 rounded-full bg-gradient-to-r ${themeStyles.primaryBtn} text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all`}
                    disabled={composerSaving}
                  >
                    {composerSaving ? 'Sharing...' : 'Share'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PulsePage;
