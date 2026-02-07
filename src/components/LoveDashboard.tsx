import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  MessageCircle,
  RefreshCw,
  Star,
  Calendar,
  Music,
  Film,
  Book,
  MapPin,
  Compass,
  Utensils,
  ShoppingBag,
  Trophy,
  Plane,
  Camera,
  Tv,
  Palette,
  Globe,
  Smartphone,
  Sparkles,
  Search,
  X,
  ThumbsUp,
  Bookmark,
  Bell,
  User,
  Users,
  DollarSign,
  ArrowRight,
  Check,
  Clock,
  PawPrint,
} from 'lucide-react';
import UserProfileButton from './UserProfileButton';
import { useLoveOverviewRealtime } from '../hooks/useLoveOverviewRealtime';
import { useMyMatchesRealtime } from '../hooks/useMyMatchesRealtime';
import { useProfileActionsRealtime } from '../hooks/useProfileActionsRealtime';
import { useProfileRevealsRealtime } from '../hooks/useProfileRevealsRealtime';
import { useMatchRecommendationsRealtime } from '../hooks/useMatchRecommendationsRealtime';
import { useMyProfileRealtime } from '../hooks/useMyProfileRealtime';
import { useMyMenuStatsRealtime } from '../hooks/useMyMenuStatsRealtime';
import { supabase } from '../lib/supabase';
import NotificationsPanel from './NotificationsPanel';
import ProgressiveOnboardingOverlay from './ProgressiveOnboardingOverlay';
import { mapDatePlanStatusToLabel, resolveMatchPercentage } from '../utils/matchPercentage';
import LovePulsePage from './LovePulsePage';

interface LoveDashboardProps {
  userId: string;
  onNavigate: (page: string) => void;
}

type LoveProfileCardModel = {
  id: string;
  name?: string;
  age?: number;
  location?: string;
  photos?: string[];
  matchPercentage?: number;
  commonInterests?: string[];
  isRevealed?: boolean;
};

const ProfileSuggestionCard: React.FC<{
  profile: LoveProfileCardModel;
  onOpen?: (profile: LoveProfileCardModel) => void;
  onAction?: (action: 'like' | 'love' | 'bookmark', profile: LoveProfileCardModel) => void;
  hasAction?: (profileId: string, action: 'like' | 'love' | 'bookmark') => boolean;
  onReveal?: (profileId: string) => Promise<void>;
  onPlanDate?: (profile: LoveProfileCardModel) => void;
}> = ({ profile, onOpen, onAction, hasAction, onReveal, onPlanDate }) => {
  return (
    <div
      className="bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-150 cursor-pointer relative overflow-hidden h-[500px] shadow-lg max-w-sm lg:max-w-md xl:max-w-lg"
      onClick={() => onOpen?.(profile)}
    >
      <div className="absolute inset-0 z-0">
        <div
          className={`w-full h-full transition-all duration-500 ${profile.isRevealed ? 'blur-none' : 'blur-sm opacity-60'}`}
        >
          <img
            src={profile.photos?.[0] || ''}
            alt={`${profile.name || 'Profile'}'s profile photo`}
            className="w-full h-full object-cover rounded-2xl"
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="w-full h-full bg-gradient-to-br from-blue-200 via-cyan-200 to-blue-100 flex items-center justify-center text-white font-bold text-6xl sm:text-8xl rounded-2xl hidden">
            👤
          </div>
        </div>
      </div>
      <div className="absolute inset-0 sm:hidden bg-gradient-to-b from-transparent via-black/5 to-black/20 z-[5] pointer-events-none"></div>

      <div className="relative z-10 h-full flex flex-col p-2.5 sm:p-4">
        <div className="text-center mb-3 sm:mb-6 mt-4 sm:mt-8">
          <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 drop-shadow-lg">
            {profile.name || 'Unknown'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 drop-shadow-lg font-medium">
            {profile.age ?? ''} • {profile.location ?? ''}
          </p>
          <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-300 mb-3 sm:mb-4 shadow-lg">
            <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-yellow-500" />
            <span className="font-bold text-xs sm:text-sm">{profile.matchPercentage ?? 0}%</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center mb-3 sm:mb-6">
          <div className="text-center">
            <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 drop-shadow-lg font-semibold">Common Interests</p>
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
              {(profile.commonInterests ?? []).map((interest: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-3 sm:space-y-4">
          <div className="flex justify-center flex-wrap gap-x-2.5 sm:gap-x-3 md:gap-x-4 gap-y-1.5 sm:gap-y-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('like', profile);
              }}
              className={`w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl ${
                hasAction?.(profile.id, 'like') ? 'border-blue-600 bg-blue-50' : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              <ThumbsUp
                className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${
                  hasAction?.(profile.id, 'like') ? 'text-blue-700' : 'text-blue-600'
                }`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                (async () => {
                  try {
                    onAction?.('love', profile);
                    if (onReveal) await onReveal(profile.id);
                    onOpen?.({ ...profile, isRevealed: true });
                  } catch (err) {
                    console.error('Failed to love+reveal profile:', err);
                  }
                })();
              }}
              className={`w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl ${
                hasAction?.(profile.id, 'love') ? 'border-red-600 bg-red-50' : 'border-red-300 hover:border-red-500 hover:bg-red-50'
              }`}
            >
              <Heart
                className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${
                  hasAction?.(profile.id, 'love') ? 'text-red-700' : 'text-red-600'
                }`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.('bookmark', profile);
              }}
              className={`w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl ${
                hasAction?.(profile.id, 'bookmark')
                  ? 'border-purple-600 bg-purple-50'
                  : 'border-purple-300 hover:border-purple-500 hover:bg-purple-50'
              }`}
            >
              <Bookmark
                className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${
                  hasAction?.(profile.id, 'bookmark') ? 'text-purple-700' : 'text-purple-600'
                }`}
              />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlanDate?.(profile);
              }}
              className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-green-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
            </button>
          </div>
          {!profile.isRevealed && (
            <div className="text-center">
              <p className="text-xs text-gray-500 italic drop-shadow-lg font-medium">* Click Heart to reveal full profile</p>
            </div>
          )}
        </div>
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500 italic drop-shadow-lg font-medium">* Click Calendar to plan a date</p>
        </div>
      </div>
    </div>
  );
};

const LoveDashboard: React.FC<LoveDashboardProps> = ({ userId, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isLoveUniverse = useMemo(() => location.pathname.startsWith('/love-dashboard'), [location.pathname]);

  const switchUniverse = useCallback(
    (universe: 'love' | 'friends') => {
      try {
        localStorage.setItem('brandbond_last_universe_v1', universe);
      } catch {
        // ignore
      }

      if (universe === 'love') {
        navigate('/love-dashboard/love-overview');
      } else {
        navigate('/friends-dashboard/social-overview');
      }
    },
    [navigate]
  );

  const isNestedFullPageRoute =
    location.pathname.startsWith('/love-dashboard/my-account') ||
    location.pathname.startsWith('/love-dashboard/edit-interests');

  const isNestedDyadRoute = location.pathname.includes('/love-dashboard/dyad/');

  // Fallback image URLs for when Unsplash images fail to load
  const fallbackImages = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&h=500&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500&h=500&fit=crop&crop=face"
  ];

  type LoveDashboardTabId =
    | 'overview'
    | 'pulse'
    | 'matches'
    | 'its-a-match'
    | 'dates'
    | 'date-requests'
    | 'my-account'
    | 'edit-interests';

  const [activeTab, setActiveTab] = useState<LoveDashboardTabId>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loveRealtime = useLoveOverviewRealtime(userId);
  const loveStats = useMemo(() => loveRealtime.stats, [loveRealtime.stats]);

  const unreadNotificationsCount = useMemo(
    () => loveRealtime.unreadNotificationsCount,
    [loveRealtime.unreadNotificationsCount]
  );

  const loveTabs = useMemo(
    () =>
      [
        { id: 'overview', label: 'Love Overview', icon: Heart, route: '/love-dashboard/love-overview' },
        { id: 'pulse', label: 'Pulse', icon: Activity, route: '/love-dashboard/pulse' },
        { id: 'matches', label: 'Romantic Matches', icon: Star, route: '/love-dashboard/romantic-matches' },
        { id: 'its-a-match', label: "It's a Match", icon: Sparkles, route: '/love-dashboard/its-a-match' },
        { id: 'dates', label: 'Date Planning', icon: Calendar, route: '/love-dashboard/date-planning' },
        { id: 'date-requests', label: 'Date Requests', icon: Compass, route: '/love-dashboard/date-requests' },
        { id: 'notifications', label: 'Notifications', icon: Bell, route: '/love-dashboard/notifications', badge: unreadNotificationsCount },
      ] as Array<{ id: LoveDashboardTabId; label: string; icon: any; route: string; badge?: number }>,
    [unreadNotificationsCount]
  );

  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const goToTab = useCallback(
    (tab: { id: LoveDashboardTabId; route: string }) => {
      setActiveTab(tab.id);
      navigate(tab.route);
    },
    [navigate]
  );

  // Sync activeTab with URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/love-overview')) {
      setActiveTab('overview');
    } else if (path.includes('/my-account')) {
      setActiveTab('my-account');
    } else if (path.includes('/edit-interests')) {
      setActiveTab('edit-interests');
    } else if (path.includes('/romantic-matches')) {
      setActiveTab('matches');
    } else if (path.includes('/its-a-match')) {
      setActiveTab('its-a-match');
    } else if (path.includes('/pulse')) {
      setActiveTab('pulse');
    } else if (path.includes('/dyad/')) {
      setActiveTab('pulse');
    } else if (path.includes('/soul-graph')) {
      // Soul Graph is now integrated inside Pulse.
      setActiveTab('pulse');
      navigate('/love-dashboard/pulse');
    } else if (path.includes('/date-planning')) {
      setActiveTab('dates');
    } else if (path.includes('/date-requests')) {
      setActiveTab('date-requests');
    } else if (path.includes('/liked-profiles')) {
      setActiveTab('liked');
    } else if (path.includes('/loved-profiles')) {
      setActiveTab('loved');
    } else if (path.includes('/bookmarked-profiles')) {
      setActiveTab('bookmarked');
    } else if (path.includes('/notifications')) {
      setActiveTab('notifications');
    } else {
      setActiveTab('overview');
    }
  }, [location.pathname, navigate]);

  void onNavigate;

  // Sync modals with URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/profile-modal/')) {
      const profileId = path.split('/profile-modal/')[1];
      setSelectedProfile({ id: profileId });
      setShowProfileModal(true);
    } else if (path.includes('/date-planning-modal/')) {
      const profileId = path.split('/date-planning-modal/')[1];
      setSelectedProfileForDate((prev: any) => (prev?.id === profileId ? prev : { id: profileId }));
      setShowDatePlanningModal(true);
    } else if (path.includes('/notifications-modal')) {
      setShowNotificationsModal(true);
    } else if (path.includes('/challenge-modal')) {
      setShowChallengeModal(true);
    } else if (path.includes('/spinwheel-modal')) {
      setShowSpinwheelModal(true);
    } else if (path.includes('/spin-result-modal')) {
      setShowSpinResultModal(true);
    }
  }, [location.pathname]);

  const myMatchesRealtime = useMyMatchesRealtime(userId, 50);
  const profileActions = useProfileActionsRealtime(userId);
  const profileReveals = useProfileRevealsRealtime(userId);
  const recommendationsRealtime = useMatchRecommendationsRealtime(userId, 50);

  const myProfileRealtime = useMyProfileRealtime(userId);
  const myMenuStats = useMyMenuStatsRealtime(userId);

  const [firstLoadComplete, setFirstLoadComplete] = useState(false);
  useEffect(() => {
    if (firstLoadComplete) return;

    const isLoading = loveRealtime.loading || myMatchesRealtime.loading || profileActions.loading;
    if (!isLoading) setFirstLoadComplete(true);
  }, [firstLoadComplete, loveRealtime.loading, myMatchesRealtime.loading, profileActions.loading]);

  // Live-derived love universe counters
  const [compatibilityScore, setCompatibilityScore] = useState<number>(0);
  useEffect(() => {
    if (!userId) return;

    let isActive = true;

    const loadCompatibility = async () => {
      try {
        const accepted = (myMatchesRealtime.acceptedMatches || []).map((m: any) => m.other_user_id).filter(Boolean);
        if (!accepted.length) {
          if (isActive) setCompatibilityScore(0);
          return;
        }

        const low = (a: string, b: string) => (a < b ? a : b);
        const high = (a: string, b: string) => (a < b ? b : a);
        const pairs = accepted.map((other: string) => ({ user_low: low(userId, other), user_high: high(userId, other) }));

        // Fetch compatibility rows for all accepted pairs and take the best score as the overview summary.
        const { data, error } = await supabase
          .from('user_compatibility')
          .select('score, user_low, user_high')
          .in('user_low', pairs.map((p) => p.user_low))
          .in('user_high', pairs.map((p) => p.user_high));

        if (error) throw error;
        const best = Math.max(0, ...(data || []).map((r: any) => Number(r.score) || 0));
        if (isActive) setCompatibilityScore(best);
      } catch (e) {
        console.error('Failed to load compatibility score:', e);
        if (isActive) setCompatibilityScore(0);
      }
    };

    loadCompatibility();
    return () => {
      isActive = false;
    };
  }, [myMatchesRealtime.acceptedMatches, userId]);

  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const compatibilityScoreByPairEmpty = useMemo(() => new Map<string, number>(), []);

  const likedProfiles = useMemo(() => {
    return profileActions.liked.map((a) => ({
      id: a.target_user_id,
      name: a.target_profile?.full_name ?? 'Unknown',
      age: a.target_profile?.age ?? 0,
      location: a.target_profile?.location ?? '',
      photos: [a.target_profile?.photo_url || fallbackImages[0]],
      matchPercentage: resolveMatchPercentage({
        myMatches: myMatchesRealtime.matches as any,
        userId,
        otherUserId: String(a.target_user_id),
        compatibilityScoreByPair: compatibilityScoreByPairEmpty,
      }),
      commonInterests: [],
      allTimeFavorites: {},
      bio: '',
      actionTimestamp: a.created_at,
      _raw: a,
    }));
  }, [profileActions.liked, fallbackImages, myMatchesRealtime.matches, userId]);

  const lovedProfiles = useMemo(() => {
    return profileActions.loved.map((a) => ({
      id: a.target_user_id,
      name: a.target_profile?.full_name ?? 'Unknown',
      age: a.target_profile?.age ?? 0,
      location: a.target_profile?.location ?? '',
      photos: [a.target_profile?.photo_url || fallbackImages[1]],
      matchPercentage: resolveMatchPercentage({
        myMatches: myMatchesRealtime.matches as any,
        userId,
        otherUserId: String(a.target_user_id),
        compatibilityScoreByPair: compatibilityScoreByPairEmpty,
      }),
      commonInterests: [],
      allTimeFavorites: {},
      bio: '',
      isRevealed: true,
      actionTimestamp: a.created_at,
      _raw: a,
    }));
  }, [profileActions.loved, fallbackImages, myMatchesRealtime.matches, userId]);

  const bookmarkedProfiles = useMemo(() => {
    return profileActions.bookmarked.map((a) => ({
      id: a.target_user_id,
      name: a.target_profile?.full_name ?? 'Unknown',
      age: a.target_profile?.age ?? 0,
      location: a.target_profile?.location ?? '',
      photos: [a.target_profile?.photo_url || fallbackImages[2]],
      matchPercentage: resolveMatchPercentage({
        myMatches: myMatchesRealtime.matches as any,
        userId,
        otherUserId: String(a.target_user_id),
        compatibilityScoreByPair: compatibilityScoreByPairEmpty,
      }),
      commonInterests: [],
      allTimeFavorites: {},
      bio: '',
      actionTimestamp: a.created_at,
      _raw: a,
    }));
  }, [profileActions.bookmarked, fallbackImages, myMatchesRealtime.matches, userId]);

  const resolveProfileById = useCallback((profileId: string) => {
    const inLoved = lovedProfiles.find((p) => p.id === profileId);
    if (inLoved) return inLoved;

    const inLiked = likedProfiles.find((p) => p.id === profileId);
    if (inLiked) return inLiked;

    const inBookmarked = bookmarkedProfiles.find((p) => p.id === profileId);
    if (inBookmarked) return inBookmarked;

    const inMatches = myMatchesRealtime.matches.find((m: any) => m.other_user_id === profileId);
    if (inMatches?.other_profile) {
      return {
        id: inMatches.other_user_id,
        name: inMatches.other_profile.full_name ?? 'Unknown',
        age: inMatches.other_profile.age ?? 0,
        location: inMatches.other_profile.location ?? '',
        photos: inMatches.other_profile.photo_url ? [inMatches.other_profile.photo_url] : fallbackImages,
        matchPercentage: resolveMatchPercentage({
          myMatches: myMatchesRealtime.matches as any,
          userId,
          otherUserId: String(inMatches.other_user_id),
          compatibilityScoreByPair: compatibilityScoreByPairEmpty,
        }),
        commonInterests: Array.isArray(inMatches.metadata?.common_interests) ? inMatches.metadata.common_interests : [],
        allTimeFavorites: {},
        bio: typeof inMatches.metadata?.bio === 'string' ? inMatches.metadata.bio : '',
        isRevealed: true,
        _raw: inMatches,
      };
    }

    return null;
  }, [bookmarkedProfiles, fallbackImages, likedProfiles, lovedProfiles, myMatchesRealtime.matches]);

  // Date Planning functionality state
  const [plannedDates, setPlannedDates] = useState<any[]>([]);
  const [showDatePlanningModal, setShowDatePlanningModal] = useState(false);
  const [selectedProfileForDate, setSelectedProfileForDate] = useState<any>(null);
  const [datePlanningStep, setDatePlanningStep] = useState<'type' | 'details' | 'review'>('type');
  const [datePlan, setDatePlan] = useState({
    type: '',
    date: '',
    time: '',
    location: '',
    activity: '',
    budget: '',
    description: '',
    specialNotes: ''
  });

  useEffect(() => {
    if (!userId) return;

    let isActive = true;
    const channel = supabase.channel(`date_plans:${userId}`);
    let pollTimer: any = null;

    const low = (a: string, b: string) => (a < b ? a : b);
    const high = (a: string, b: string) => (a < b ? b : a);

    const loadPlans = async () => {
      try {
        console.debug('[date_plans] loadPlans() start', { userId });
        const { data: plans, error: plansErr } = await supabase
          .from('date_plans')
          .select('id, creator_id, partner_id, type, plan_date, plan_time, location, activity, budget, description, special_notes, status, created_at')
          // Sender should see their outgoing requests immediately.
          // Receiver should only see a card once they accept.
          .or(`creator_id.eq.${userId},and(partner_id.eq.${userId},status.eq.accepted)`)
          .order('created_at', { ascending: false })
          .limit(50);

        if (plansErr) throw plansErr;

        const rows = (plans || []) as any[];
        const otherIds = Array.from(
          new Set(
            rows
              .map((p) => (p.creator_id === userId ? p.partner_id : p.creator_id))
              .filter(Boolean)
          )
        );

        const compatibilityByPair = new Map<string, number>();

        if (otherIds.length) {
          const pairs = otherIds.map((other) => ({ user_low: low(userId, other), user_high: high(userId, other) }));
          const compatRes = await supabase
            .from('user_compatibility')
            .select('score, user_low, user_high')
            .in('user_low', pairs.map((p) => p.user_low))
            .in('user_high', pairs.map((p) => p.user_high));

          if (compatRes.error) throw compatRes.error;

          (compatRes.data || []).forEach((row: any) => {
            const uLow = String(row.user_low);
            const uHigh = String(row.user_high);
            if (!uLow || !uHigh) return;
            const key = uLow < uHigh ? `${uLow}|${uHigh}` : `${uHigh}|${uLow}`;
            compatibilityByPair.set(key, Number(row.score) || 0);
          });
        }

        const [profilesRes, photosRes] = await Promise.all([
          otherIds.length
            ? supabase.from('profiles').select('id, full_name, age, location').in('id', otherIds)
            : Promise.resolve({ data: [], error: null } as any),
          otherIds.length
            ? supabase.from('user_photos').select('user_id, photo_url, is_main_photo, photo_order').in('user_id', otherIds)
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

        const mapped = rows.map((p) => {
          const otherId = p.creator_id === userId ? p.partner_id : p.creator_id;
          const other = profileById.get(otherId);

          const matchRow = (myMatchesRealtime.matches || []).find((m: any) => String(m?.other_user_id) === String(otherId)) || null;
          const pairKey = (() => {
            const a = String(userId);
            const b = String(otherId);
            return a < b ? `${a}|${b}` : `${b}|${a}`;
          })();
          const compatScore = compatibilityByPair.get(pairKey);

          const matchPct = resolveMatchPercentage({
            myMatches: myMatchesRealtime.matches as any,
            userId,
            otherUserId: String(otherId),
            compatibilityScoreByPair: compatibilityByPair,
          });

          console.debug('[date_plans] match% resolve', {
            userId,
            otherId,
            hasMatchRow: Boolean(matchRow),
            matchRowOtherUserId: matchRow?.other_user_id,
            matchRowMeta: matchRow?.metadata,
            pairKey,
            compatScore,
            matchPct,
          });

          return {
            id: p.id,
            fromProfile: {
              id: otherId,
              name: other?.full_name || 'Unknown',
              age: other?.age || 0,
              location: other?.location || '',
              photos: [
                ((): string => {
                  const photos = photosByUser.get(otherId) || [];
                  const main =
                    photos.find((ph: any) => ph.is_main_photo) ||
                    photos.sort((a: any, b: any) => (a.photo_order ?? 999) - (b.photo_order ?? 999))[0];
                  return main?.photo_url || fallbackImages[0];
                })(),
              ],
              matchPercentage: matchPct,
              commonInterests: [],
              allTimeFavorites: {},
              bio: ''
            },
            type: p.type,
            proposedDate: p.plan_date,
            proposedTime: p.plan_time,
            proposedLocation: p.location,
            proposedActivity: p.activity,
            budget: p.budget,
            description: p.description,
            specialNotes: p.special_notes,
            status: p.status,
            timestamp: p.created_at,
            _raw: p,
          };
        });

        if (isActive) setPlannedDates(mapped);
      } catch (e) {
        console.error('Failed to load date plans:', e);
      }
    };

    loadPlans();

    pollTimer = setInterval(() => {
      loadPlans();
    }, 5000);

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'date_plans',
          filter: `creator_id=eq.${userId}`,
        },
        (payload: any) => {
          console.debug('[date_plans] realtime (creator_id) payload', payload);
          loadPlans();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'date_plans',
          filter: `partner_id=eq.${userId}`,
        },
        (payload: any) => {
          console.debug('[date_plans] realtime (partner_id) payload', payload);
          loadPlans();
        }
      )
      .subscribe((status) => {
        console.debug('[date_plans] channel subscribe status', status, { userId });
      });

    return () => {
      isActive = false;
      if (pollTimer) clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [fallbackImages, myMatchesRealtime.matches, userId]);

  useEffect(() => {
    if (!showDatePlanningModal || !selectedProfileForDate?.id) return;

    if (selectedProfileForDate?.name && selectedProfileForDate?.photos?.length) return;

    const resolved = resolveProfileById(selectedProfileForDate.id);
    if (resolved) {
      setSelectedProfileForDate(resolved);
    }
  }, [resolveProfileById, selectedProfileForDate, showDatePlanningModal]);

  const romanticInterests = useMemo(() => profileActions.totalCount, [profileActions.totalCount]);

  void userId;

  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const notifications = useMemo(() => {
    return loveRealtime.notifications.map((n) => {
      let profile: any = null;
      if (n.entity_type === 'match' && n.entity_id) {
        const matchId = String(n.entity_id);
        const matchRow = (myMatchesRealtime.matches || []).find((m: any) => String(m.match_id) === matchId) || null;
        const other = matchRow?.other_profile;
        if (other) {
          profile = {
            id: matchRow.other_user_id,
            name: other?.full_name || 'Unknown',
            age: other?.age || 0,
            location: other?.location || '',
            photos: other?.photo_url ? [other.photo_url] : fallbackImages,
            matchPercentage: resolveMatchPercentage({
              myMatches: myMatchesRealtime.matches as any,
              userId,
              otherUserId: String(matchRow.other_user_id),
              compatibilityScoreByPair: compatibilityScoreByPairEmpty,
            }),
            commonInterests: Array.isArray(matchRow?.metadata?.common_interests) ? matchRow.metadata.common_interests : [],
            allTimeFavorites: {},
            bio: typeof matchRow?.metadata?.bio === 'string' ? matchRow.metadata.bio : '',
            isRevealed: true,
            _raw: matchRow,
          };
        }
      }

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        timestamp: n.created_at,
        isRead: n.is_read,
        action:
          n.entity_type === 'match'
            ? 'view_match'
            : n.entity_type === 'date_request'
              ? 'view_date_requests'
              : 'view_insights',
        profile,
        entityType: n.entity_type,
        entityId: n.entity_id,
      };
    });
  }, [fallbackImages, loveRealtime.notifications, myMatchesRealtime.matches]);

  const dateRequests = useMemo(() => {
    return loveRealtime.incomingDateRequests
      .filter((r) => String(r.from_user_id) !== String(userId))
      .map((r) => ({
        id: r.id,
        fromProfile: {
          id: r.from_user_id,
          name: r.from_profile?.full_name || 'Unknown',
          age: r.from_profile?.age || 0,
          location: r.from_profile?.location || '',
          photos: [r.from_main_photo_url || fallbackImages[0]],
          matchPercentage: typeof (r as any).match_percentage === 'number' ? (r as any).match_percentage : 0,
          commonInterests: Array.isArray((r as any).common_interests) ? (r as any).common_interests : [],
          allTimeFavorites: {},
          bio: ''
        },
        requestType: r.request_type,
        message: r.message,
        proposedDate: r.proposed_at
          ? new Date(r.proposed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          : 'Not specified',
        proposedTime: r.proposed_at
          ? new Date(r.proposed_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
          : 'Not specified',
        proposedLocation: r.proposed_location,
        status: r.status,
        timestamp: r.created_at,
        isRead: r.is_read_by_receiver,
        _raw: r,
      }));
  }, [loveRealtime.incomingDateRequests, userId]);

  // Function to generate poetic bio from all-time favorites
  const generatePoeticBio = (interests: string[]) => {
    if (!interests || interests.length === 0) {
      return "A mysterious soul with hidden depths, waiting to share their story with the right person.";
    }

    const music = interests[0] || "melodies";
    const food = interests[1] || "culinary delights";
    const hobby = interests[2] || "creative pursuits";
    const entertainment = interests[3] || "entertainment";
    const reading = interests[4] || "literary worlds";

    return `Meet a soul who finds rhythm in ${music}, savors the magic of ${food}, and loses themselves in ${hobby}. When not exploring ${entertainment}, they dive into ${reading} for inspiration. This is someone who believes life is meant to be lived with passion, curiosity, and an open heart - always ready to discover new adventures and create meaningful connections.`;
  };

  // Carousel navigation functions - Optimized for performance
  const nextImage = useCallback(() => {
    if (selectedProfile && selectedProfile.photos) {
      setCurrentImageIndex((prev) => {
        const newIndex = prev === selectedProfile.photos.length - 1 ? 0 : prev + 1;
        return newIndex;
      });
    }
  }, [selectedProfile]);

  const previousImage = useCallback(() => {
    if (selectedProfile && selectedProfile.photos) {
      setCurrentImageIndex((prev) => {
        const newIndex = prev === 0 ? selectedProfile.photos.length - 1 : prev - 1;
        return newIndex;
      });
    }
  }, [selectedProfile]);

  const goToImage = useCallback((index: number) => {
    setCurrentImageIndex(index);
  }, []);

  // Reset image index when profile changes - Optimized for performance
  useEffect(() => {
    if (selectedProfile && selectedProfile.photos) {
      setCurrentImageIndex(0);
      setImageLoading(true);
      setImageError(false);

      // Preload the first image with performance optimization
      if (selectedProfile.photos.length > 0) {
        const img = new Image();

        // Add loading timeout for better UX
        const loadingTimeout = setTimeout(() => {
          if (img.complete === false) {
            setImageLoading(false);
            setImageError(true);
          }
        }, 5000); // 5 second timeout

        img.onload = () => {
          clearTimeout(loadingTimeout);
          setImageLoading(false);
          setImageError(false);
        };
        img.onerror = () => {
          clearTimeout(loadingTimeout);
          setImageLoading(false);
          setImageError(true);
        };

        // Set crossOrigin for better performance
        img.crossOrigin = 'anonymous';
        img.src = selectedProfile.photos[0];
      }
    }
  }, [selectedProfile]);

  const conversations = useMemo(() => {
    return [] as any[];
  }, []);

  void conversations;

  // Love Challenge state and logic (Supabase-backed)
  const [dailyChallenge, setDailyChallenge] = useState({
    id: '',
    type: 'send_messages',
    title: 'Send thoughtful messages to 3 potential matches today!',
    target: 3,
    completed: 0,
    reward: '0 Love Points',
    isCompleted: false,
    lastReset: new Date().toDateString(),
    progress: [] as Array<{
      profileId: string;
      profileName: string;
      message: string;
      timestamp: string;
      type: string;
    }>,
  });

  const [showChallengeModal, setShowChallengeModal] = useState(false);

  const dailyChallengeChannelRef = useRef<any>(null);

  const loadDailyChallenge = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const authedUserId = authData.user?.id;
      if (!authedUserId) return;

      const challengeRes = await supabase
        .from('daily_challenges')
        .select('id, challenge_date, title, description, reward_points')
        .eq('challenge_date', todayStr)
        .maybeSingle();

      if (challengeRes.error) throw challengeRes.error;

      if (!challengeRes.data?.id) {
        setDailyChallenge((prev) => ({
          ...prev,
          id: '',
          title: 'No challenge available today',
          completed: 0,
          isCompleted: false,
          progress: [],
          lastReset: today.toDateString(),
        }));
        return;
      }

      const challengeId = challengeRes.data.id as string;

      const progressRes = await supabase
        .from('user_daily_challenge_progress')
        .select('id, progress, is_completed, completed_at')
        .eq('user_id', authedUserId)
        .eq('challenge_id', challengeId)
        .maybeSingle();

      if (progressRes.error) throw progressRes.error;

      const progressJson = (progressRes.data as any)?.progress || {};
      const progressItems = Array.isArray(progressJson?.items) ? progressJson.items : [];

      setDailyChallenge({
        id: challengeId,
        type: 'send_messages',
        title: challengeRes.data.title,
        target: typeof progressJson?.target === 'number' ? progressJson.target : 3,
        completed: typeof progressJson?.completed === 'number' ? progressJson.completed : 0,
        reward: `${challengeRes.data.reward_points} Love Points`,
        isCompleted: Boolean((progressRes.data as any)?.is_completed),
        lastReset: today.toDateString(),
        progress: progressItems.map((p: any) => ({
          profileId: String(p.profileId ?? ''),
          profileName: String(p.profileName ?? 'Someone'),
          message: String(p.message ?? ''),
          timestamp: String(p.timestamp ?? new Date().toISOString()),
          type: String(p.type ?? 'first_message'),
        })),
      });
    } catch (e) {
      console.error('Failed to load daily challenge:', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      await loadDailyChallenge();

      try {
        const { data: authData } = await supabase.auth.getUser();
        const authedUserId = authData.user?.id;
        if (!authedUserId) return;

        if (dailyChallengeChannelRef.current) {
          supabase.removeChannel(dailyChallengeChannelRef.current);
          dailyChallengeChannelRef.current = null;
        }

        const channel = supabase
          .channel(`daily_challenge_progress_${authedUserId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'user_daily_challenge_progress', filter: `user_id=eq.${authedUserId}` },
            () => {
              loadDailyChallenge().catch(() => undefined);
            }
          )
          .subscribe((status) => {
            console.debug('[daily_challenge_progress] channel subscribe status', status, { userId });
          });

        if (isMounted) dailyChallengeChannelRef.current = channel;
      } catch {
        // ignore
      }
    };

    init();

    return () => {
      isMounted = false;
      if (dailyChallengeChannelRef.current) {
        supabase.removeChannel(dailyChallengeChannelRef.current);
        dailyChallengeChannelRef.current = null;
      }
    };
  }, [loadDailyChallenge]);

  // Mutual Match System - "It's a Match" Feature
  const [mutualMatches, setMutualMatches] = useState<any[]>([]);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<any>(null);

  // Spinwheel System - Deciding Who Makes First Move
  const [showSpinwheelModal, setShowSpinwheelModal] = useState(false);
  const [spinwheelProfile, setSpinwheelProfile] = useState<any>(null);
  const [spinwheelType, setSpinwheelType] = useState<'mutual_match' | 'loved_profile'>('mutual_match');
  const [userSpinResult, setUserSpinResult] = useState<number | null>(null);
  const [otherPartySpinResult, setOtherPartySpinResult] = useState<number | null>(null);
  const [showSpinResultModal, setShowSpinResultModal] = useState(false);
  const [spinResult, setSpinResult] = useState<{
    winner: string;
    loser: string;
    firstMoveBy: string;
    userScore: number;
    otherScore: number;
  } | null>(null);

  // Memoized values for performance optimization
  void notifications;

  // Function to get a working image URL with fallback - Memoized for performance
  const getWorkingImageUrl = useCallback((originalUrl: string | undefined | null, index: number) => {
    const safeUrl = typeof originalUrl === 'string' ? originalUrl : '';
    if (!safeUrl) return fallbackImages[index % fallbackImages.length];

    // Check if the original URL contains the problematic photo ID
    if (safeUrl.includes('1494790108755-2616b612b786')) {
      return fallbackImages[index % fallbackImages.length];
    }
    return safeUrl;
  }, [fallbackImages]);

  // Notification functions - Optimized with useCallback for performance
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    try {
      await loveRealtime.markNotificationRead(notificationId);
    } catch (e) {
      console.error('Failed to mark notification read:', e);
    }
  }, [loveRealtime]);

  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      await loveRealtime.markAllNotificationsRead();
    } catch (e) {
      console.error('Failed to mark all notifications read:', e);
    }
  }, [loveRealtime]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await loveRealtime.deleteNotification(notificationId);
    } catch (e) {
      console.error('Failed to delete notification:', e);
    }
  }, [loveRealtime]);

  // no-op: unread count is derived from realtime data

  const handleNotificationAction = useCallback((notification: any) => {
    // Mark as read first
    markNotificationAsRead(notification.id);

    // Handle different notification actions
    switch (notification.action) {
      case 'view_profile':
        if (notification.profile) {
          setSelectedProfile(notification.profile);
          setShowProfileModal(true);
          navigate(`/love-dashboard/profile-modal/${notification.profile.id}`);
        }
        break;
      case 'view_date_request':
        setActiveTab('date-requests');
        break;
      case 'open_chat':
        break;
      case 'view_date_details':
        setActiveTab('dates');
        break;
      case 'view_date_requests':
        setActiveTab('date-requests');
        navigate('/love-dashboard/date-requests');
        if (notification.entityType === 'date_request' && notification.entityId) {
          markDateRequestAsRead(notification.entityId).catch(() => undefined);
        }
        break;
      case 'view_rewards':
        setShowChallengeModal(true);
        navigate('/love-dashboard/challenge-modal');
        break;
      case 'view_match': {
        const matchId = notification.entityId;
        const entityType = notification.entityType;

        if (entityType === 'match' && matchId) {
          const found = mutualMatches.find((m) => m?.id === matchId);
          if (found) {
            setCurrentMatch(found);
            setShowMatchPopup(true);
            setShowNotificationsModal(false);
            return;
          }
        }

        setActiveTab('its-a-match');
        navigate('/love-dashboard/its-a-match');
        break;
      }
    }

    // Close notifications modal
    setShowNotificationsModal(false);
  }, [markNotificationAsRead, navigate, mutualMatches]);

  const formatTimestamp = useCallback((timestamp: string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return notificationTime.toLocaleDateString();
  }, []);

  // Love Challenge functions (Supabase-backed)

  // Chat is intentionally hidden in dyad mode (Option A).

  const handleStartNewChat = useCallback(async (_otherUserId: string) => {
    return;
  }, []);

  const closeMatchPopup = useCallback(() => {
    setShowMatchPopup(false);
    setCurrentMatch(null);
  }, []);

  const viewMatchProfile = () => {
    if (currentMatch) {
      setSelectedProfile(currentMatch.profile);
      setShowProfileModal(true);
      closeMatchPopup();
    }
  };

  const openDyadWithMatch = useCallback(async () => {
    if (!currentMatch?.id) return;
    try {
      await supabase.rpc('activate_love_dyad', { p_match_id: String(currentMatch.id) });
    } catch (e) {
      const msg = String((e as any)?.message || 'Failed to open dyad');
      if (msg.includes('romantic_exclusivity_violation')) {
        window.alert('You can only have one active love dyad at a time. End the current one before opening a new one.');
      } else {
        window.alert(msg);
      }
      return;
    }

    closeMatchPopup();
    setActiveTab('pulse');
    navigate(`/love-dashboard/dyad/${String(currentMatch.id)}`);
  }, [closeMatchPopup, currentMatch, navigate]);

  const openDyadForMatchId = useCallback(
    async (matchId: string) => {
      if (!matchId) return;
      try {
        await supabase.rpc('activate_love_dyad', { p_match_id: String(matchId) });
      } catch (e) {
        const msg = String((e as any)?.message || 'Failed to open dyad');
        if (msg.includes('romantic_exclusivity_violation')) {
          window.alert('You can only have one active love dyad at a time. End the current one before opening a new one.');
        } else {
          window.alert(msg);
        }
        return;
      }
      setActiveTab('pulse');
      navigate(`/love-dashboard/dyad/${String(matchId)}`);
    },
    [navigate]
  );

  const planDateWithMatch = () => {
    if (currentMatch) {
      openDatePlanningModal(currentMatch.profile);
      closeMatchPopup();
    }
  };

  const prevAcceptedMatchIdsRef = useRef<Set<string>>(new Set());

  const persistedCompatibilityRef = useRef<Map<string, number>>(new Map());

  void persistedCompatibilityRef;

  // Profile actions are Supabase-backed via useProfileActionsRealtime
  const handleProfileAction = useCallback(
    async (action: 'like' | 'love' | 'bookmark', profile: any) => {
      try {
        if (!profile?.id) return;
        await profileActions.toggleAction(String(profile.id), action);
      } catch (e) {
        const msg = String((e as any)?.message || 'Failed to update');
        console.error('Failed to toggle profile action:', e);
        window.alert(msg);
      }
    },
    [profileActions]
  );

  const recommendedProfiles = useMemo(() => {
    const recs = recommendationsRealtime.recommendations || [];
    const mapped = recs
      .map((r: any) => {
        const p = r.recommended_profile;
        if (!p?.id) return null;
        const revealed = profileReveals.revealedTargetIds.has(String(p.id));

        const matchedKeywordsByCategory = r.reasons?.matched_keywords_by_category;
        const matchedKeywordChips = (() => {
          if (!matchedKeywordsByCategory || typeof matchedKeywordsByCategory !== 'object') return [] as string[];
          const chips: string[] = [];
          for (const v of Object.values(matchedKeywordsByCategory as any)) {
            const mine = Array.isArray((v as any)?.mine) ? (v as any).mine : [];
            const theirs = Array.isArray((v as any)?.theirs) ? (v as any).theirs : [];
            // Prefer showing "my" matched tokens; fall back to theirs if missing
            for (const x of (mine.length ? mine : theirs)) {
              if (typeof x === 'string' && x.trim()) chips.push(x.trim());
            }
          }
          // de-dupe (case-insensitive) and cap for UI
          const seen = new Set<string>();
          const out: string[] = [];
          for (const c of chips) {
            const k = c.toLowerCase();
            if (seen.has(k)) continue;
            seen.add(k);
            out.push(c);
            if (out.length >= 10) break;
          }
          return out;
        })();

        return {
          id: p.id,
          name: p.full_name ?? 'Unknown',
          age: p.age ?? 0,
          location: p.location ?? '',
          photos: [p.photo_url || fallbackImages[0]],
          matchPercentage: (() => {
            const resolved = resolveMatchPercentage({
              myMatches: myMatchesRealtime.matches as any,
              userId,
              otherUserId: String(p.id),
              compatibilityScoreByPair: compatibilityScoreByPairEmpty,
            });
            if (resolved > 0) return resolved;
            return typeof r.score === 'number' ? Math.round(r.score) : 0;
          })(),
          commonInterests: matchedKeywordChips.length
            ? matchedKeywordChips
            : (Array.isArray(r.reasons?.common_interests) ? r.reasons.common_interests : []),
          allTimeFavorites: r.reasons?.all_time_favorites || {},
          bio: typeof r.reasons?.bio === 'string' ? r.reasons.bio : '',
          isRevealed: revealed,
          _raw: r,
        };
      })
      .filter(Boolean);

    return mapped;
  }, [compatibilityScoreByPairEmpty, fallbackImages, myMatchesRealtime.matches, recommendationsRealtime.recommendations, profileReveals.revealedTargetIds, userId]);

  useEffect(() => {
    if (!userId) return;
    const recs = recommendationsRealtime.recommendations || [];
    if (!recs.length) return;

    const low = (a: string, b: string) => (a < b ? a : b);
    const high = (a: string, b: string) => (a < b ? b : a);

    const rows = recs
      .map((r: any) => {
        const p = r?.recommended_profile;
        if (!p?.id) return null;
        const score = typeof r.score === 'number' ? Math.round(r.score) : null;
        if (score === null || !Number.isFinite(score) || score <= 0) return null;
        const uLow = low(String(userId), String(p.id));
        const uHigh = high(String(userId), String(p.id));
        const key = `${uLow}|${uHigh}`;
        const prev = persistedCompatibilityRef.current.get(key);
        if (prev === score) return null;
        return {
          key,
          user_low: uLow,
          user_high: uHigh,
          score,
          updated_at: new Date().toISOString(),
        };
      })
      .filter(Boolean) as any[];

    if (!rows.length) return;

    (async () => {
      try {
        for (const r of rows) {
          const otherUserId = r.user_low === userId ? r.user_high : r.user_low;
          const { error } = await supabase.rpc('persist_user_compatibility', {
            other_user_id: otherUserId,
            score: r.score,
          });
          if (error) throw error;
        }
        rows.forEach((r) => persistedCompatibilityRef.current.set(r.key, r.score));
        console.debug('[user_compatibility] persisted recommendation scores (rpc)', {
          count: rows.length,
        });
      } catch (e) {
        console.error('[user_compatibility] failed to persist recommendation scores (rpc)', e);
      }
    })();
  }, [recommendationsRealtime.recommendations, userId]);

  useEffect(() => {
    const accepted = (myMatchesRealtime.acceptedMatches || []).map((m) => {
      const other = m.other_profile;
      const pct = resolveMatchPercentage({
        myMatches: myMatchesRealtime.matches as any,
        userId,
        otherUserId: String(m.other_user_id),
        compatibilityScoreByPair: compatibilityScoreByPairEmpty,
      });

      return {
        id: m.match_id,
        name: other?.full_name ?? 'Unknown',
        matchPercentage: pct,
        profile: {
          id: m.other_user_id,
          name: other?.full_name ?? 'Unknown',
          age: other?.age,
          location: other?.location,
          photos: other?.photo_url ? [other.photo_url] : [],
        },
      };
    });

    setMutualMatches(accepted);
  }, [myMatchesRealtime.acceptedMatches]);

  useEffect(() => {
    const accepted = myMatchesRealtime.acceptedMatches || [];
    const currentIds = new Set(accepted.map((m) => m.match_id));

    // On first load, just seed the ref without toasts
    if (prevAcceptedMatchIdsRef.current.size === 0) {
      prevAcceptedMatchIdsRef.current = currentIds;
      return;
    }

    const newlyAccepted = accepted.filter((m) => !prevAcceptedMatchIdsRef.current.has(m.match_id));
    if (newlyAccepted.length === 0) {
      prevAcceptedMatchIdsRef.current = currentIds;
      return;
    }

    // Toast + optional popup for the most recent new accepted match
    const newest = newlyAccepted[0];
    const name = newest.other_profile?.full_name || 'Someone';

    const popupMatch = {
      id: newest.match_id,
      name,
      matchPercentage: resolveMatchPercentage({
        myMatches: myMatchesRealtime.matches as any,
        userId,
        otherUserId: String(newest.other_user_id),
        compatibilityScoreByPair: compatibilityScoreByPairEmpty,
      }),
      profile: {
        id: newest.other_user_id,
        name,
        age: newest.other_profile?.age,
        location: newest.other_profile?.location,
        photos: newest.other_profile?.photo_url ? [newest.other_profile.photo_url] : [],
      },
    };
    setCurrentMatch(popupMatch);
    setShowMatchPopup(true);

    prevAcceptedMatchIdsRef.current = currentIds;
  }, [myMatchesRealtime.acceptedMatches]);

  // Prevent background scroll when modals are open
  useEffect(() => {
    const isAnyModalOpen = showProfileModal || showDatePlanningModal || 
                          showNotificationsModal || showChallengeModal || showMatchPopup || 
                          showSpinwheelModal || showSpinResultModal;

    if (isAnyModalOpen) {
      // Prevent background scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    } else {
      // Restore background scroll
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.top = 'unset';
      document.body.style.left = 'unset';
      document.body.style.right = 'unset';
      document.body.style.width = 'unset';
    }

    // Cleanup function to restore scroll on component unmount
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.top = 'unset';
      document.body.style.left = 'unset';
      document.body.style.right = 'unset';
      document.body.style.width = 'unset';
    };
  }, [showProfileModal, showDatePlanningModal, showNotificationsModal, 
      showChallengeModal, showMatchPopup, showSpinwheelModal, showSpinResultModal]);

  // Function to check if a profile has a specific action - Memoized for performance
  const hasProfileAction = useCallback((profileId: number, action: 'like' | 'love' | 'bookmark') => {
    const pid = String(profileId);
    switch (action) {
      case 'like':
        return profileActions.liked.some((a) => a.target_user_id === pid);
      case 'love':
        return profileActions.loved.some((a) => a.target_user_id === pid);
      case 'bookmark':
        return profileActions.bookmarked.some((a) => a.target_user_id === pid);
      default:
        return false;
    }
  }, [profileActions.bookmarked, profileActions.liked, profileActions.loved]);

  // Function to get action count - Memoized for performance

  // Function to handle date request actions - Optimized with useCallback for performance
  const handleDateRequest = useCallback(async (requestId: string, action: 'accept' | 'decline') => {
    try {
      await loveRealtime.respondToDateRequest(requestId, action === 'accept' ? 'accepted' : 'declined');
    } catch (e) {
      console.error('Failed to respond to date request:', e);
    }
  }, [loveRealtime]);

  // Function to mark date request as read - Optimized with useCallback for performance
  const markDateRequestAsRead = useCallback(async (requestId: string) => {
    try {
      await loveRealtime.markDateRequestRead(requestId);
    } catch (e) {
      console.error('Failed to mark date request read:', e);
    }
  }, [loveRealtime]);

  // Function to get unread date requests count - Memoized for performance
  void loveRealtime.unreadIncomingDateRequestsCount;

  // Function to open date request profile modal - Optimized with useCallback for performance
  const openDateRequestProfile = useCallback((profile: any) => {
      setSelectedProfile(profile);
      setShowProfileModal(true);
  }, []);

  // Function to remove profile from loved list - Optimized with useCallback for performance
  const removeFromLoved = useCallback(async (profileId: number) => {
    try {
      await profileActions.toggleAction(String(profileId), 'love');
    } catch (e) {
      const msg = String((e as any)?.message || 'Failed to update');
      console.error('Failed to remove loved profile:', e);
      window.alert(msg);
    }
  }, [profileActions]);

  // Function to remove profile from bookmarked list - Optimized with useCallback for performance
  const removeFromBookmarked = useCallback(async (profileId: number) => {
    try {
      await profileActions.toggleAction(String(profileId), 'bookmark');
    } catch (e) {
      console.error('Failed to remove bookmarked profile:', e);
    }
  }, [profileActions]);

  // Local demo chat-interface removed; dyad mode is not chat (Option A)

  // Date Planning Functions
  function openDatePlanningModal(profile: any) {
    if (!profile?.id) return;
    const resolved = resolveProfileById(profile.id) || profile;
    setSelectedProfileForDate(resolved);
    setDatePlanningStep('type');
    setDatePlan({
      type: '',
      date: '',
      time: '',
      location: '',
      activity: '',
      budget: '',
      description: '',
      specialNotes: ''
    });
    setShowDatePlanningModal(true);
    navigate(`/love-dashboard/date-planning-modal/${profile.id}`);
  }

  const closeDatePlanningModal = () => {
    setShowDatePlanningModal(false);
    setSelectedProfileForDate(null);
    setDatePlanningStep('type');
    setDatePlan({
      type: '',
      date: '',
      time: '',
      location: '',
      activity: '',
      budget: '',
      description: '',
      specialNotes: ''
    });
  };

  const generateDateSuggestions = (profile: any) => {
    const suggestions = [];
    const commonInterests = Array.isArray(profile?.commonInterests) ? profile.commonInterests : [];
    
    // Based on common interests
    if (commonInterests.includes('Coffee')) {
      suggestions.push({
        type: 'Coffee Date',
        activity: 'Visit a cozy coffee shop',
        budget: 'Low',
        description: 'Perfect for getting to know each other in a relaxed atmosphere'
      });
    }
    
    if (commonInterests.includes('Food') || commonInterests.includes('Biryani') || commonInterests.includes('Pizza')) {
      suggestions.push({
        type: 'Dinner Date',
        activity: 'Try a new restaurant together',
        budget: 'Medium',
        description: 'Explore new cuisines and share a memorable meal'
      });
    }
    
    if (commonInterests.includes('Travel') || commonInterests.includes('Photography')) {
      suggestions.push({
        type: 'Adventure Date',
        activity: 'Visit a local landmark or scenic spot',
        budget: 'Low',
        description: 'Capture beautiful moments and explore together'
      });
    }
    
    if (commonInterests.includes('Movies') || commonInterests.includes('Netflix')) {
      suggestions.push({
        type: 'Movie Date',
        activity: 'Watch a film together',
        budget: 'Medium',
        description: 'Share cinematic experiences and discuss your thoughts'
      });
    }
    
    if (commonInterests.includes('Art') || commonInterests.includes('Museums')) {
      suggestions.push({
        type: 'Cultural Date',
        activity: 'Visit an art gallery or museum',
        budget: 'Low',
        description: 'Appreciate art and culture together'
      });
    }
    
    // Add some generic romantic suggestions
    suggestions.push({
      type: 'Sunset Walk',
      activity: 'Evening walk in a beautiful park',
      budget: 'Free',
      description: 'Romantic stroll during golden hour'
    });
    
    suggestions.push({
      type: 'Dessert Date',
      activity: 'Visit a dessert cafe or ice cream parlor',
      budget: 'Low',
      description: 'Sweet treats for a sweet evening'
    });
    
    return suggestions;
  };

  const selectDateSuggestion = (suggestion: any) => {
    setDatePlan(prev => ({
      ...prev,
      type: suggestion.type,
      activity: suggestion.activity,
      budget: suggestion.budget,
      description: suggestion.description
    }));
    setDatePlanningStep('details');
  };

  const handleDatePlanChange = (field: string, value: string) => {
    setDatePlan(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const sendDateRequest = async () => {
    if (!selectedProfileForDate || !datePlan.type || !datePlan.date || !datePlan.time) return;

    try {
      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const authedUserId = authData.user?.id;
      if (!authedUserId) {
        return;
      }

      const toUserId = selectedProfileForDate.id;

      if (String(toUserId) === String(authedUserId)) {
        console.error('Blocked sending date request to self');
        return;
      }

      const proposedAtIso = new Date(`${datePlan.date}T${datePlan.time}`).toISOString();
      const requestMessage = `I've planned a special ${datePlan.type.toLowerCase()} for us!`;

      const { data: reqRow, error: reqErr } = await supabase
        .from('date_requests')
        .insert({
          from_user_id: authedUserId,
          to_user_id: toUserId,
          request_type: datePlan.type,
          message: requestMessage,
          proposed_at: proposedAtIso,
          proposed_location: datePlan.location || null,
          status: 'pending',
        })
        .select('id')
        .single();

      if (reqErr) throw reqErr;

      const { error: planErr } = await supabase
        .from('date_plans')
        .insert({
          creator_id: authedUserId,
          partner_id: toUserId,
          date_request_id: reqRow.id,
          type: datePlan.type,
          plan_date: datePlan.date,
          plan_time: datePlan.time,
          location: datePlan.location || null,
          activity: datePlan.activity || null,
          budget: datePlan.budget || null,
          description: datePlan.description || null,
          special_notes: datePlan.specialNotes || null,
          status: 'pending',
        });

      if (planErr) throw planErr;

      closeDatePlanningModal();
    } catch (e) {
      console.error('Failed to send date request:', e);
    }
  };

  void plannedDates;

  const openProfileModal = (profile: any) => {
    if (profile.isRevealed) {
      setSelectedProfile(profile);
      setShowProfileModal(true);
    } else {
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
  };

  const refreshData = () => {
    setIsRefreshing(true);
    loveRealtime.refresh().catch(() => undefined);
    recommendationsRealtime.refresh().catch(() => undefined);
    myMatchesRealtime.refresh().catch(() => undefined);
    profileActions.refresh().catch(() => undefined);
    profileReveals.refresh().catch(() => undefined);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Spinwheel Functions - Deciding Who Makes First Move
  const resolveSpinMatchId = useCallback(
    (profile: any): string | null => {
      if (!profile?.id || !userId) return null;
      const found = (myMatchesRealtime.matches || []).find((m: any) => String(m.other_user_id) === String(profile.id));
      return found?.match_id || null;
    },
    [myMatchesRealtime.matches, userId]
  );

  const [spinwheelMatchId, setSpinwheelMatchId] = useState<string | null>(null);
  const spinwheelChannelRef = useRef<any>(null);

  const openSpinwheelModal = (profile: any, type: 'mutual_match' | 'loved_profile') => {
    setSpinwheelProfile(profile);
    setSpinwheelType(type);
    setShowSpinwheelModal(true);
    setUserSpinResult(null);
    setOtherPartySpinResult(null);

    const matchId = resolveSpinMatchId(profile);
    setSpinwheelMatchId(matchId);

    navigate('/love-dashboard/spinwheel-modal');
  };

  const applySpinResultRow = useCallback((row: any) => {
    if (!row || !userId || !spinwheelProfile) return;

    const myId = String(userId);
    const lowId = String(row.user_low);
    const highId = String(row.user_high);
    void highId;

    const myScore = myId === lowId ? row.user_low_score : row.user_high_score;
    const otherScore = myId === lowId ? row.user_high_score : row.user_low_score;

    setUserSpinResult(typeof myScore === 'number' ? myScore : null);
    setOtherPartySpinResult(typeof otherScore === 'number' ? otherScore : null);

    const firstMoveBy = String(row.first_move_by);
    const firstMoveByLabel = firstMoveBy === myId ? 'You' : spinwheelProfile.name;

    const winner = (myScore ?? 0) <= (otherScore ?? 0) ? 'You' : spinwheelProfile.name;
    const loser = winner === 'You' ? spinwheelProfile.name : 'You';

    setSpinResult({
      winner,
      loser,
      firstMoveBy: firstMoveByLabel,
      userScore: myScore,
      otherScore: otherScore,
    });

    setShowSpinwheelModal(false);
    setShowSpinResultModal(true);
    navigate('/love-dashboard/spin-result-modal');
  }, [navigate, spinwheelProfile, userId]);

  useEffect(() => {
    if (!userId || !spinwheelMatchId) return;

    if (spinwheelChannelRef.current) {
      supabase.removeChannel(spinwheelChannelRef.current);
      spinwheelChannelRef.current = null;
    }

    const ch = supabase
      .channel(`spinwheel_${spinwheelMatchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'spinwheel_results', filter: `match_id=eq.${spinwheelMatchId}` },
        (payload: any) => {
          const row = payload?.new || payload?.old;
          applySpinResultRow(row);
        }
      )
      .subscribe();

    spinwheelChannelRef.current = ch;

    return () => {
      if (spinwheelChannelRef.current) {
        supabase.removeChannel(spinwheelChannelRef.current);
        spinwheelChannelRef.current = null;
      }
    };
  }, [applySpinResultRow, spinwheelMatchId, userId]);

  const spinWheel = useCallback(async () => {
    try {
      if (!spinwheelMatchId) {
        return;
      }

      const { data, error } = await supabase.rpc('create_or_get_spinwheel_result', {
        p_match_id: spinwheelMatchId,
      });

      if (error) throw error;
      applySpinResultRow(data);
    } catch (e) {
      console.error('Failed to spin wheel:', e);
    }
  }, [applySpinResultRow, spinwheelMatchId]);

  const closeSpinwheelModal = () => {
    setShowSpinwheelModal(false);
    setSpinwheelProfile(null);
    setUserSpinResult(null);
    setOtherPartySpinResult(null);
    setSpinwheelMatchId(null);
  };

  const closeSpinResultModal = () => {
    setShowSpinResultModal(false);
    setSpinResult(null);
  };

  const handleTakeChallenge = useCallback(() => {
    setShowChallengeModal(true);
  }, []);

  const handleFindMoreDates = () => {
    closeSpinResultModal();
    setActiveTab('matches');
  };

  const handleAIChatPrompts = () => {
    closeSpinResultModal();
  };

  if (isNestedFullPageRoute || isNestedDyadRoute) {
    return <Outlet />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <ProgressiveOnboardingOverlay userId={userId} />
      <header className="sticky top-0 z-40 bg-gradient-to-r from-pink-50/95 via-rose-50/95 to-purple-50/95 backdrop-blur-md border-b border-pink-200/70 shadow-sm">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Brand */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-nowrap min-w-0">
              <button
                type="button"
                onClick={() => navigate('/love-dashboard/love-overview')}
                className="flex items-center space-x-2 sm:space-x-3 flex-nowrap min-w-0"
                title="Love Dashboard"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="leading-tight min-w-0">
                  <div className="text-sm sm:text-base font-bold text-gray-900 whitespace-nowrap">BrandBond</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">Love Dashboard</div>
                </div>
              </button>

              <div className="hidden sm:flex items-center bg-white/80 border border-pink-200 rounded-full p-0.5 shadow-sm flex-nowrap">
                <button
                  type="button"
                  onClick={() => switchUniverse('love')}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    isLoveUniverse
                      ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow'
                      : 'text-gray-600 hover:text-indigo-700'
                  }`}
                  title="Go to Dates"
                >
                  Dates
                </button>
                <button
                  type="button"
                  onClick={() => switchUniverse('friends')}
                  className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                    !isLoveUniverse
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow'
                      : 'text-gray-600 hover:text-blue-700'
                  }`}
                  title="Go to Friends"
                >
                  Friends
                </button>
              </div>
            </div>

            {/* Center Spacer */}
            <div className="flex-1"></div>

            {/* Right Section - Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('matches');
                  navigate('/love-dashboard/romantic-matches');
                }}
                className="p-2 text-pink-600 hover:text-pink-700 active:text-pink-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
                title="Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('liked');
                  navigate('/love-dashboard/liked-profiles');
                }}
                className="p-2 text-pink-600 hover:text-pink-700 active:text-pink-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
                title="Liked"
              >
                <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('loved');
                  navigate('/love-dashboard/loved-profiles');
                }}
                className="p-2 text-pink-600 hover:text-pink-700 active:text-pink-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
                title="Loved"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('bookmarked');
                  navigate('/love-dashboard/bookmarked-profiles');
                }}
                className="p-2 text-pink-600 hover:text-pink-700 active:text-pink-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
                title="Bookmarked"
              >
                <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('notifications');
                  navigate('/love-dashboard/notifications');
                }}
                className="p-2 text-pink-600 hover:text-pink-700 active:text-pink-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={refreshData}
                className="p-2 text-pink-600 hover:text-pink-700 active:text-pink-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
                title="Refresh Data"
              >
                <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>

              <UserProfileButton
                userProfile={{
                  id: userId,
                  name: myProfileRealtime.profile?.full_name || 'User',
                  photos: myProfileRealtime.profile?.photo_urls || [],
                  email: myProfileRealtime.profile?.email || undefined,
                }}
                stats={{
                  datesCount: myMenuStats.datesCount,
                  friendsCount: myMenuStats.friendsCount,
                }}
                onProfileClick={() => {
                  setActiveTab('overview');
                  navigate('/love-dashboard/love-overview');
                }}
                onSettingsClick={() => {
                  setActiveTab('overview');
                  navigate('/love-dashboard/love-overview');
                }}
                onLogout={() => {
                  (async () => {
                    try {
                      await supabase.auth.signOut();
                    } catch {
                      // ignore
                    }

                    try {
                      localStorage.removeItem('brandbond_registration_progress_v1');
                      localStorage.removeItem('brandbond_last_route_v1');
                    } catch {
                      // ignore
                    }

                    window.location.href = '/';
                  })();
                }}
              />

              {/* Mobile toggle + overlay */}
              <button
                type="button"
                onClick={() => setSidebarOpenMobile(true)}
                className="sm:hidden inline-flex items-center justify-center rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 backdrop-blur px-3 py-2 shadow relative z-50"
                aria-label="Open menu"
                title="Open menu"
              >
                <Menu className="w-5 h-5 text-pink-700" />
              </button>

            </div>
          </div>
        </div>
      </header>

      <div className="w-full flex-1 min-h-0">
        <div className="flex h-full min-h-0">
          {/* Desktop left sidebar */}
          <div
            className={`hidden sm:block sticky top-0 self-start h-full overflow-y-auto border-r border-pink-200/70 bg-gradient-to-b from-pink-50/80 via-white/70 to-purple-50/70 backdrop-blur-md transition-[width,background-color,border-color] duration-300 ease-out ${
              sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
            }`}
          >
            <div className="p-3">
              <button
                type="button"
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="w-full inline-flex items-center justify-center rounded-xl border border-pink-200 bg-white/80 hover:bg-pink-50 px-3 py-2 text-pink-700 transition-all duration-200 ease-out"
                aria-label={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>

            <nav className="px-3 pb-4 space-y-1">
              {loveTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => goToTab(tab)}
                    className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all duration-200 ease-out ${
                      active
                        ? 'bg-gradient-to-r from-pink-100 via-rose-100 to-purple-100 text-pink-800'
                        : 'text-gray-700 hover:bg-pink-50/60'
                    }`}
                    title={tab.label}
                  >
                    <div className="relative">
                      <Icon className={`w-5 h-5 ${active ? 'text-pink-700' : 'text-gray-600'}`} />
                      {tab.badge && tab.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full">
                          {tab.badge > 9 ? '9+' : tab.badge}
                        </span>
                      )}
                    </div>
                    {!sidebarCollapsed ? (
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{tab.label}</div>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile toggle + overlay */}
          <div className="sm:hidden fixed top-[72px] left-3 z-40">
            <button
              type="button"
              onClick={() => setSidebarOpenMobile(true)}
              className="inline-flex items-center justify-center rounded-xl border border-pink-200 bg-gradient-to-r from-pink-50 via-rose-50 to-purple-50 backdrop-blur px-3 py-2 shadow"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-pink-700" />
            </button>
          </div>

          {sidebarOpenMobile ? (
            <div className="sm:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpenMobile(false)} />
              <div className="absolute inset-y-0 left-0 w-[280px] bg-gradient-to-b from-pink-50 via-white to-purple-50 shadow-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold text-pink-900">Menu</div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpenMobile(false)}
                    className="rounded-xl border border-pink-200 bg-white/80 px-3 py-2 text-sm font-semibold text-pink-700"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-4 space-y-1">
                  {loveTabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                          goToTab(tab);
                          setSidebarOpenMobile(false);
                        }}
                        className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                          active
                            ? 'bg-gradient-to-r from-pink-100 via-rose-100 to-purple-100 text-pink-800'
                            : 'text-gray-700 hover:bg-pink-50/60'
                        }`}
                      >
                        <div className="relative">
                          <Icon className={`w-5 h-5 ${active ? 'text-pink-700' : 'text-gray-600'}`} />
                          {tab.badge && tab.badge > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full">
                              {tab.badge > 9 ? '9+' : tab.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-semibold">{tab.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Tab Content */}
            <div className="w-full">
              {activeTab === 'overview' && (
                <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 md:space-y-8">
                  {/* Welcome Section */}
                  <div className="text-center mb-6 sm:mb-8 md:mb-12">
                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-3 md:mb-4">
                      Welcome to Your Love Journey 💕
                    </h1>
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl">Discover romantic connections that make your heart skip a beat</p>
                  </div>

              {/* Love Stats Cards - FULL WIDTH GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12">
                {[
                  { label: 'Romantic Matches', value: loveStats?.total_matches ?? 0, icon: Heart, color: 'from-blue-500 to-cyan-500' },
                  { label: 'People Nearby', value: loveRealtime.peopleNearbyCount, icon: MapPin, color: 'from-blue-500 to-cyan-500' },
                  { label: 'Compatibility', value: `${compatibilityScore}%`, icon: Star, color: 'from-yellow-500 to-orange-500' },
                  { label: 'Love Interests', value: romanticInterests, icon: Sparkles, color: 'from-purple-500 to-pink-500' }
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-6 shadow-lg hover:shadow-xl transition-all duration-150 border border-indigo-100 hover:border-indigo-200 group hover:scale-105"
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-2 sm:mb-3 md:mb-4 group-hover:scale-110 transition-transform shadow-lg border-3 border-white`}>
                      <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">{stat.value}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Main Features - 2 COLUMNS WITH SPACING */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 md:mb-12">
                <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200 hover:shadow-xl transition-all duration-150 shadow-lg">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Today's Romantic Matches</h3>
                      <div className="inline-flex items-center space-x-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        95% Active
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed italic bg-gray-50 p-3 rounded-lg border border-gray-100 mb-6">
                    "Discover people who share your romantic vision and relationship goals"
                  </p>
                  <button 
                    onClick={() => setActiveTab('matches')}
                    className="flex-1 py-2.5 px-4 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors duration-75 text-sm"
                  >
                    <Heart className="w-4 h-4 inline mr-2" />
                    View Matches
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200 hover:shadow-xl transition-all duration-150 shadow-lg">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <Activity className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Pulse</h3>
                      <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        New Today
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed italic bg-gray-50 p-3 rounded-lg border border-gray-100 mb-6">
                    "Daily signals. Slow bonds. Explore the same people in new ways."
                  </p>
                  <button 
                    onClick={() => {
                      setActiveTab('pulse');
                      navigate('/love-dashboard/pulse');
                    }}
                    className="flex-1 py-2.5 px-4 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors duration-75 text-sm"
                  >
                    <Activity className="w-4 h-4 inline mr-2" />
                    Open Pulse
                  </button>
                </div>
              </div>

              {/* Daily Love Challenge and It's a Match - 50-50 HORIZONTAL SPLIT ON DESKTOP, STACKED ON MOBILE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8 mb-4 sm:mb-6 md:mb-8 lg:mb-12">
                {/* Daily Love Challenge Card */}
                <div className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-150">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2"><i className="fas fa-trophy text-yellow-500 mr-2"></i>Today's Love Challenge</h3>
                      {dailyChallenge.isCompleted ? (
                        <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          <Check className="w-4 h-4 mr-1" />
                        ✅ Completed
                        </div>
                      ) : (
                        <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                          <Trophy className="w-4 h-4 mr-1" />
                          Active Challenge
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed italic bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                    "💝 <strong>Challenge:</strong> {dailyChallenge.title}"
                  </p>
                  
                  {/* Progress Display */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Progress: {dailyChallenge.completed}/{dailyChallenge.target} completed</span>
                      <span className="text-purple-600 font-medium">🎁 Reward: {dailyChallenge.reward}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(dailyChallenge.completed / dailyChallenge.target) * 100}%` }}
                        ></div>
                    </div>
                  </div>

                  {/* Progress Details */}
                    {dailyChallenge.progress.length > 0 && (
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mb-4">
                      <p className="text-sm text-purple-700 font-medium mb-2">Recent Progress:</p>
                      <div className="space-y-1">
                          {dailyChallenge.progress.slice(-2).map((progress, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm text-purple-600">
                              <span>💬</span>
                            <span>Message sent to <strong>{progress.profileName}</strong></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  
                  <div className="flex space-x-3">
                    <button 
                      onClick={handleTakeChallenge}
                      disabled={dailyChallenge.isCompleted}
                      className={`flex-1 py-2.5 px-4 rounded-full font-medium transition-colors duration-75 text-sm ${
                        dailyChallenge.isCompleted
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-purple-500 text-white hover:bg-purple-600'
                      }`}
                    >
                      <Trophy className="w-4 h-4 inline mr-2" />
                      {dailyChallenge.isCompleted ? 'Completed!' : 'Take Challenge'}
                  </button>
                  </div>
                </div>

                {/* It's a Match Hint Card */}
                <div className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-150">
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2"><i className="fas fa-sparkles text-blue-500 mr-2"></i>It's a Match Magic</h3>
                      <div className="inline-flex items-center px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-semibold">
                        <Heart className="w-4 h-4 mr-1" />
                        Mutual Interest
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 text-sm leading-relaxed italic bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                    "💕 <strong>Discover:</strong> When both of you show mutual interest, magic happens!"
                    </p>
                    
                    {/* Match Status Display */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Current Matches: {mutualMatches.length}</span>
                      <span className="text-pink-600 font-medium">
                        <i className="fas fa-bullseye text-blue-500 mr-2"></i>{mutualMatches.length > 0 ? 'Beautiful connections!' : 'Start building connections!'}
                      </span>
                    </div>
                    <div className="w-full bg-pink-200 rounded-full h-2">
                        <div 
                        className="bg-gradient-to-r from-pink-500 to-red-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((mutualMatches.length / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Recent Matches Display */}
                    {mutualMatches.length > 0 && (
                      <div className="bg-pink-50 p-3 rounded-lg border border-pink-200 mb-4">
                        <p className="text-sm text-pink-700 font-medium mb-2">Recent Matches:</p>
                        <div className="space-y-1">
                          {mutualMatches.slice(-2).map((match, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm text-pink-600">
                              <span>💖</span>
                              <span>Matched with <strong>{match.profile.name}</strong></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'pulse' && (
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
              <LovePulsePage />
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Romantic Matches ⭐
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">Explore profiles recommended for you</p>
              </div>

              {recommendedProfiles.length === 0 ? (
                <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 text-center">
                  <div className="text-sm text-gray-700">No recommendations yet.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {recommendedProfiles.map((profile) => {
                    if (!profile) return null;
                    return (
                      <ProfileSuggestionCard
                        key={profile.id}
                        profile={profile as LoveProfileCardModel}
                        onOpen={(p) => openProfileModal(p)}
                        onAction={(action, p) => handleProfileAction(action, p)}
                        hasAction={(profileId, actionType) => hasProfileAction(Number(profileId), actionType)}
                        onReveal={(profileId) => profileReveals.reveal(profileId)}
                        onPlanDate={(p) => openDatePlanningModal(p)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'its-a-match' && (
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="text-center mb-6 sm:mb-8 md:mb-12">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
                  It's a Match! 💕
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">Mutual connections and next steps</p>
              </div>

              {mutualMatches.length === 0 ? (
                <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-3xl p-4 sm:p-6 md:p-8 border border-pink-200 text-center">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-pink-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Sparkles className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 text-pink-400" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 leading-tight">No mutual matches yet</h3>
                  <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">When mutual connections happen, they’ll appear here.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('matches');
                      navigate('/love-dashboard/romantic-matches');
                    }}
                    className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-pink-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-sm sm:text-base md:text-lg font-medium hover:bg-pink-600"
                  >
                    Explore Matches
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl sm:rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 border border-pink-200 mb-4 sm:mb-6 md:mb-8 lg:mb-12">
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 md:mb-4 lg:mb-6 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-1.5 md:space-x-2 lg:space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm sm:text-base font-bold">💕</span>
                      </div>
                      <span>It's a Match!</span>
                    </div>
                    <span className="px-2 py-1 bg-gradient-to-r from-pink-400 to-red-400 text-white text-xs rounded-full font-medium">
                      {mutualMatches.length} Mutual Connection{mutualMatches.length > 1 ? 's' : ''}
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                    {mutualMatches.slice(0, 12).map((match) => (
                      <div
                        key={match.id}
                        className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:scale-105 shadow-lg max-w-sm lg:max-w-md xl:max-w-lg"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <img
                            src={getWorkingImageUrl(match.profile.photos[0], 0)}
                            alt={match.profile.name}
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-gray-200"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = fallbackImages[0];
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{match.profile.name}</h4>
                            <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-300">
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              {match.profile.matchPercentage}%
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 mb-3">
                          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                            <span>💬</span>
                            <span>Both messaged each other</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                            <span>💕</span>
                            <span>Mutual interest confirmed</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedProfile(match.profile);
                              setShowProfileModal(true);
                            }}
                            className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-pink-500 text-white text-xs sm:text-sm rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:bg-pink-600"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => {
                              const otherUserId = String(match.profile?.id || '');
                              if (!otherUserId) return;
                              handleStartNewChat(otherUserId)
                                .then(() => {
                                  setActiveTab('overview');
                                  navigate('/love-dashboard/love-overview');
                                })
                                .catch((e) => {
                                  console.error('Failed to start chat with match:', e);
                                  setActiveTab('overview');
                                  navigate('/love-dashboard/love-overview');
                                });
                            }}
                            className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-500 text-white text-xs sm:text-sm rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:bg-blue-600"
                          >
                            Chat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dates' && (
            <div className="p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="text-center mb-6 sm:mb-8 md:mb-12">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Date Planning 💕
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">Plan romantic dates with your matches</p>
              </div>

              <div className="text-center mb-4 sm:mb-6 md:mb-8 px-2 sm:px-0">
                <div className="flex flex-col space-y-2 sm:space-y-3 md:space-y-0 sm:flex-row sm:justify-center sm:items-center sm:space-x-2 md:space-x-4">
                  <button
                    onClick={() => setActiveTab('loved')}
                    className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-2 md:py-2.5 lg:py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base flex items-center justify-center space-x-1.5 sm:space-x-2 hover:scale-105 shadow-md"
                  >
                    <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="whitespace-nowrap">Plan Date with Loved</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-2 md:py-2.5 lg:py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base flex items-center justify-center space-x-1.5 sm:space-x-2 hover:scale-105 shadow-md"
                  >
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="whitespace-nowrap">Open Dyad Space</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('bookmarked')}
                    className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-2 md:py-2.5 lg:py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base flex items-center justify-center space-x-1.5 sm:space-x-2 hover:scale-105 shadow-md"
                  >
                    <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="whitespace-nowrap">Plan Date with Bookmarked</span>
                  </button>
                </div>
              </div>

              {plannedDates.length === 0 ? (
                <div className="text-center py-4 sm:py-8 md:py-12">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Calendar className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 text-indigo-400" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 leading-tight">No dates planned yet</h3>
                  <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">Use the buttons above to start planning romantic dates with your matches!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:gap-4">
                    {plannedDates.map((date) => (
                      <div key={date.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 md:p-4 border border-indigo-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-lg">
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-indigo-200 flex-shrink-0">
                            <img src={date.fromProfile.photos[0]} alt={date.fromProfile.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                              <h4 className="font-semibold text-gray-800 text-sm sm:text-base break-words">{date.fromProfile.name}</h4>
                              {(() => {
                                const st = mapDatePlanStatusToLabel(date.status);
                                return (
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${st.pillClass}`}>
                                    {st.label}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                              {date.type && (
                                <div className="flex items-center space-x-1.5 sm:space-x-2">
                                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-700 font-medium break-words">{date.type}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-700 break-words">
                                  {date.proposedDate} at {date.proposedTime}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-700 break-words">{date.proposedLocation}</span>
                              </div>
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-700 break-words">{date.proposedActivity}</span>
                              </div>
                              {date.budget && (
                                <div className="flex items-center space-x-1.5 sm:space-x-2">
                                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-700 break-words">Budget: {date.budget}</span>
                                </div>
                              )}
                              {date.description && (
                                <div className="flex items-start space-x-1.5 sm:space-x-2">
                                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-600 italic break-words">&quot;{date.description}&quot;</span>
                                </div>
                              )}
                              {date.specialNotes && (
                                <div className="flex items-start space-x-1.5 sm:space-x-2">
                                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-600 italic break-words">Notes: {date.specialNotes}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center pt-4">
                    <button
                      onClick={() => {
                        setActiveTab('date-requests');
                        navigate('/love-dashboard/date-requests');
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 text-sm sm:text-base hover:scale-105"
                    >
                      View Date Requests
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2">
                  Notifications 🔔
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">Stay updated with your love journey</p>
                
                {/* "It's a Match" Hint */}
                <div className="mt-4 sm:mt-6 bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-3 sm:p-4 border border-pink-200 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                    <span className="text-sm sm:text-base font-medium text-pink-700"><i className="fas fa-sparkles text-blue-500 mr-2"></i>It's a Match Notifications</span>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-pink-600 mb-2">
                    Get notified when mutual matches happen!
                  </p>
                  <button 
                    onClick={() => setActiveTab('its-a-match')}
                    className="px-3 sm:px-4 py-1.5 bg-gradient-to-r from-pink-400 to-red-400 text-white rounded-full text-xs sm:text-sm font-medium hover:shadow-lg transition-all duration-200 hover:scale-105"
                  >
                    See Your Matches
                  </button>
                </div>
              </div>
              
              <div className="text-center py-4 sm:py-8 md:py-12">
                <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Bell className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 text-yellow-400" />
                </div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 leading-tight">No notifications yet</h3>
                <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">You'll see important updates here!</p>
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
                >
                  Go to Overview
                </button>
              </div>
            </div>
          )}

          {/* Liked Profiles Tab */}
          {activeTab === 'liked' && (
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                  Liked Profiles 👍
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">Profiles you've shown interest in</p>
              </div>
              
              {likedProfiles.length === 0 ? (
                <div className="text-center py-4 sm:py-8 md:py-12">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <ThumbsUp className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-400" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 leading-tight">No liked profiles yet</h3>
                  <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">Start liking profiles to see them here!</p>
                  <button 
                    onClick={() => setActiveTab('matches')}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 md:py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors duration-75 text-sm sm:text-base"
                  >
                    Browse Matches
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {likedProfiles.map((profile) => (
                    <div 
                      key={profile.id} 
                      className="bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-150 cursor-pointer relative overflow-hidden aspect-[3/4] min-h-[320px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px] shadow-lg max-w-sm lg:max-w-md xl:max-w-lg"
                      onClick={() => openProfileModal(profile)}
                    >
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={getWorkingImageUrl(profile.photos[0], 0)} 
                          alt={`${profile.name}'s profile photo`}
                          className="w-full h-full object-cover rounded-2xl"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = fallbackImages[0];
                          }}
                        />
                      </div>
                      
                      <div className="relative z-10 h-full flex flex-col p-2.5 sm:p-4">
                        <div className="text-center mb-3 sm:mb-6 mt-4 sm:mt-8">
                          <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 drop-shadow-lg">
                            {profile.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 drop-shadow-lg font-medium">
                            {profile.age} • {profile.location}
                          </p>
                          <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-300 mb-3 sm:mb-4 shadow-lg">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-yellow-500" />
                            <span className="font-bold text-xs sm:text-sm">{profile.matchPercentage}%</span>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center mb-3 sm:mb-6">
                          <div className="text-center">
                            <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 drop-shadow-lg font-semibold">Common Interests</p>
                            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                              {profile.commonInterests.map((interest: string, index: number) => (
                                <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto text-center">
                          <p className="text-xs text-gray-500 italic drop-shadow-lg font-medium">
                            Liked on {new Date(profile.actionTimestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loved Profiles Tab */}
          {activeTab === 'loved' && (
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Loved Profiles ❤️
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">Profiles you've fallen in love with</p>
              </div>
              
              {lovedProfiles.length === 0 ? (
                <div className="text-center py-4 sm:py-8 md:py-12">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Heart className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 text-red-400" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 leading-tight">No loved profiles yet</h3>
                  <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">Start loving profiles to see them here!</p>
                  <button 
                    onClick={() => setActiveTab('matches')}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 md:py-3 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors duration-75 text-sm sm:text-base"
                  >
                    Browse Matches
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {lovedProfiles.map((profile) => (
                    <div 
                      key={profile.id} 
                      className="bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-150 relative overflow-hidden aspect-[3/4] min-h-[320px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px] shadow-lg max-w-sm lg:max-w-md xl:max-w-lg"
                    >
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={getWorkingImageUrl(profile.photos[0], 0)} 
                          alt={`${profile.name}'s profile photo`}
                          className="w-full h-full object-cover rounded-2xl"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = fallbackImages[1];
                          }}
                        />
                      </div>
                      
                      <div className="relative z-10 h-full flex flex-col p-2.5 sm:p-4">
                        <div className="text-center mb-3 sm:mb-6 mt-4 sm:mt-8">
                          <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 drop-shadow-lg">
                            {profile.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 drop-shadow-lg font-medium">
                            {profile.age} • {profile.location}
                          </p>
                          <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-300 mb-3 sm:mb-4 shadow-lg">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-yellow-500" />
                            <span className="font-bold text-xs sm:text-sm">{profile.matchPercentage}%</span>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center mb-3 sm:mb-6">
                          <div className="text-center">
                            <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 drop-shadow-lg font-semibold">Common Interests</p>
                            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                              {profile.commonInterests.map((interest: string, index: number) => (
                                <span key={index} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                                                {/* Action Buttons - Love Universe Style - Mobile Responsive */}
                        <div className="mt-auto space-y-2 sm:space-y-3 md:space-y-4">
                          {/* Circular Action Buttons - Mobile Responsive */}
                          <div className="flex justify-center flex-wrap gap-x-2.5 sm:gap-x-3 md:gap-x-4 gap-y-1.5 sm:gap-y-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openDatePlanningModal(profile);
                              }}
                              className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-green-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                              title="Plan Date"
                            >
                              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openDyadForMatchId(String(profile.id)).catch(() => undefined);
                              }}
                              className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                              title="Chat"
                            >
                              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openProfileModal(profile);
                              }}
                              className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                              title="View Profile"
                            >
                              <User className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromLoved(Number(profile.id));
                              }}
                              className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-red-300 hover:border-red-500 hover:bg-red-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                              title="Unlove"
                            >
                              <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openSpinwheelModal(profile, 'loved_profile');
                              }}
                              className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                              title="Spin for First Move"
                            >
                              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600" />
                            </button>
                          </div>

                          {/* Hint Text - Love Universe Style - Mobile Responsive */}
                          <div className="text-center">
                            <p className="text-xs text-gray-500 italic drop-shadow-lg font-medium leading-tight">
                              * Click Calendar to plan a date • Click Message to open dyad
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 text-center">
                          <p className="text-xs text-gray-500 italic drop-shadow-lg font-medium">
                            Loved on {new Date(profile.actionTimestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bookmarked Profiles Tab */}
          {activeTab === 'bookmarked' && (
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-2">
                  Bookmarked Profiles 🔖
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">Profiles you've saved for later</p>
              </div>
              
              {bookmarkedProfiles.length === 0 ? (
                <div className="text-center py-4 sm:py-8 md:py-12">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Bookmark className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 text-purple-400" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 leading-tight">No bookmarked profiles yet</h3>
                  <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">Start bookmarking profiles to see them here!</p>
                  <button 
                    onClick={() => setActiveTab('matches')}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 md:py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors duration-75 text-sm sm:text-base"
                  >
                    Browse Matches
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {bookmarkedProfiles.map((profile) => (
                    <div 
                      key={profile.id} 
                      className="bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-150 relative overflow-hidden aspect-[3/4] min-h-[320px] sm:min-h-[400px] md:min-h-[500px] lg:min-h-[600px] shadow-lg max-w-sm lg:max-w-md xl:max-w-lg"
                    >
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={getWorkingImageUrl(profile.photos[0], 0)} 
                          alt={`${profile.name}'s profile photo`}
                          className="w-full h-full object-cover rounded-2xl"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = fallbackImages[2];
                          }}
                        />
                      </div>
                      
                      <div className="relative z-10 h-full flex flex-col p-2.5 sm:p-4">
                        <div className="text-center mb-3 sm:mb-6 mt-4 sm:mt-8">
                          <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 drop-shadow-lg">
                            {profile.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 drop-shadow-lg font-medium">
                            {profile.age} • {profile.location}
                          </p>
                          <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-300 mb-3 sm:mb-4 shadow-lg">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-yellow-500" />
                            <span className="font-bold text-xs sm:text-sm">{profile.matchPercentage}%</span>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center mb-3 sm:mb-6">
                          <div className="text-center">
                            <p className="text-sm sm:text-base text-gray-700 mb-3 sm:mb-4 drop-shadow-lg font-semibold">Common Interests</p>
                            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                              {profile.commonInterests.map((interest: string, index: number) => (
                                <span key={index} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                                                {/* Action Buttons - Love Universe Style - Mobile Responsive */}
                        <div className="mt-auto space-y-2 sm:space-y-3 md:space-y-4">
                          {/* Circular Action Buttons - Mobile Responsive */}
                          <div className="flex justify-center flex-wrap gap-x-2.5 sm:gap-x-3 md:gap-x-4 gap-y-1.5 sm:gap-y-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openDatePlanningModal(profile);
                              }}
                              className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-green-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                              title="Plan Date"
                            >
                              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openDyadForMatchId(String(profile.id)).catch(() => undefined);
                              }}
                              className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                              title="Open Dyad"
                            >
                              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openProfileModal(profile);
                              }}
                              className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                              title="View Profile"
                            >
                              <User className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600" />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromBookmarked(Number(profile.id));
                              }}
                              className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                              title="Remove"
                            >
                              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600" />
                            </button>
                          </div>

                          {/* Hint Text - Love Universe Style - Mobile Responsive */}
                          <div className="text-center">
                            <p className="text-xs text-gray-500 italic drop-shadow-lg font-medium leading-tight">
                              * Click Calendar to plan a date • Click Message to chat
                            </p>
                          </div>
                        </div>

                        <div className="mt-2 text-center">
                          <p className="text-xs text-gray-500 italic drop-shadow-lg font-medium">
                            Bookmarked on {new Date(profile.actionTimestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Date Requests Tab */}
          {activeTab === 'date-requests' && (
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
              {/* Header Section - Matching Love Universe Style */}
              <div className="text-center mb-6 sm:mb-8 md:mb-12">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Date Requests 💕
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">People who want to go on dates with you</p>
                

              </div>
              
              {dateRequests.length === 0 ? (
                /* Empty State - Matching Love Universe Aesthetics */
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-4 sm:p-6 md:p-8 border border-indigo-200 text-center">
                  <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Calendar className="w-7 h-7 sm:w-10 sm:h-10 md:w-12 md:h-12 text-indigo-500" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 leading-tight">No date requests yet</h3>
                  <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">When people send you date requests, they'll appear here!</p>
                  <button 
                    onClick={() => setActiveTab('matches')}
                    className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-sm sm:text-base md:text-lg font-medium hover:scale-105"
                  >
                    Browse Matches
                  </button>
                </div>
              ) : (
                /* Date Request Cards - Matching Love Universe Card Design */
                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                  {dateRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className={`bg-white/80 backdrop-blur-sm rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-150 overflow-hidden ${
                        request.status === 'pending' ? 'border-indigo-200' : 
                        request.status === 'accepted' ? 'border-green-200' : 'border-red-200'
                      } ${!request.isRead ? 'ring-2 ring-indigo-300' : ''}`}
                      onClick={() => markDateRequestAsRead(request.id)}
                    >
                      <div className="p-4 sm:p-6 md:p-8">
                        {/* Header with Profile Info - Matching Love Universe Profile Style */}
                        <div className="flex items-start space-x-4 sm:space-x-6 mb-4 sm:mb-6 md:mb-8">
                          <div className="flex-shrink-0">
                            <img 
                              src={request.fromProfile.photos[0]} 
                              alt={`${request.fromProfile.name}'s profile photo`}
                              className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-indigo-200 shadow-lg"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                              <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                                {request.fromProfile.name}
                              </h3>
                              {!request.isRead && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  New
                                </span>
                              )}
                            </div>
                            <p className="text-sm sm:text-base text-gray-600 mb-2">
                              {request.fromProfile.age} • {request.fromProfile.location}
                            </p>
                            <div className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full text-sm font-bold shadow-lg">
                              {request.fromProfile.matchPercentage}%
                            </div>
                          </div>
                        </div>

                        {/* Date Request Details - Matching Love Universe Card Style */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-indigo-200 mb-4 sm:mb-6 md:mb-8">
                          <h4 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center space-x-2">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500" />
                            <span>{request.requestType} Request</span>
                          </h4>
                          <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6 leading-relaxed">
                            {request.message}
                          </p>
                          
                          {/* Proposed Details Grid - Matching Love Universe Grid Style */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="text-center p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-200 hover:shadow-md transition-all duration-200 hover:scale-105 group">
                              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                              <p className="text-sm font-medium text-gray-700">{request.proposedDate}</p>
                            </div>
                            <div className="text-center p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-200 hover:shadow-md transition-all duration-200 hover:scale-105 group">
                              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                              <p className="text-sm font-medium text-gray-700">{request.proposedTime}</p>
                            </div>
                            <div className="text-center p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-200 hover:shadow-md transition-all duration-200 hover:scale-105 group">
                              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                              <p className="text-sm font-medium text-gray-700 truncate">{request.proposedLocation}</p>
                            </div>
                          </div>
                        </div>

                        {/* What They Liked Section - Matching Love Universe Section Style */}
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 sm:p-6 border border-purple-200 mb-4 sm:mb-6 md:mb-8">
                          <h4 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center space-x-2">
                            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                            <span>What They Liked About Your Profile</span>
                          </h4>
                          
                          {/* Common Interests - Matching Love Universe Tag Style */}
                          <div className="mb-4 sm:mb-6">
                            <p className="text-sm sm:text-base text-gray-700 mb-3 font-medium">Common Interests:</p>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                              {request.fromProfile.commonInterests?.slice(0, 4).map((interest: string, index: number) => (
                                <span key={index} className="px-3 py-2 bg-white/90 backdrop-blur-sm text-gray-800 text-sm rounded-full border border-purple-200 drop-shadow-sm font-medium hover:shadow-md transition-all duration-200 hover:scale-105">
                                  {interest}
                                </span>
                              ))}
                              {request.fromProfile.commonInterests?.length > 4 && (
                                <span className="px-3 py-2 bg-white/90 backdrop-blur-sm text-gray-800 text-sm rounded-full border border-purple-200 drop-shadow-sm font-medium hover:shadow-md transition-all duration-200 hover:scale-105">
                                  +{request.fromProfile.commonInterests.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Common Favorites Section - Matching Love Universe Card Style */}
                        <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl p-4 sm:p-6 border border-pink-200 mb-4 sm:mb-6 md:mb-8">
                          <h4 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center space-x-2">
                            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500" />
                            <span>Common Favorites Between You</span>
                          </h4>
                          
                          {/* Favorites Grid - Matching Love Universe Grid Style */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="text-center p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-indigo-200 hover:shadow-md transition-all duration-200 hover:scale-105 group">
                              <Music className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {request.fromProfile.commonInterests?.find((interest: string) => 
                                  ['Taylor Swift', 'Arijit Singh', 'Ed Sheeran', 'Shreya Ghoshal'].includes(interest)
                                ) || "Music"}
                              </p>
                            </div>
                            <div className="text-center p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-105 group">
                              <Film className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {request.fromProfile.commonInterests?.find((interest: string) => 
                                  ['Movies', 'Netflix', 'Gaming'].includes(interest)
                                ) || "Entertainment"}
                              </p>
                            </div>
                            <div className="text-center p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200 hover:shadow-md transition-all duration-200 hover:scale-105 group">
                              <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {request.fromProfile.commonInterests?.find((interest: string) => 
                                  ['Biryani', 'Pizza', 'Coffee', 'Tea'].includes(interest)
                                ) || "Food & Drinks"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons - Matching Love Universe Button Style */}
                        {request.status === 'pending' && (
                          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDateRequest(request.id, 'accept');
                              }}
                              className="flex-1 sm:flex-none px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-sm sm:text-base md:text-lg font-medium hover:scale-105"
                            >
                              Accept Request
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDateRequest(request.id, 'decline');
                              }}
                              className="flex-1 sm:flex-none px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-sm sm:text-base md:text-lg font-medium hover:scale-105"
                            >
                              Decline Request
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openDateRequestProfile(request.fromProfile);
                              }}
                              className="flex-1 sm:flex-none px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-sm sm:text-base md:text-lg font-medium hover:scale-105 flex items-center justify-center space-x-2"
                            >
                              <User className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span>View Profile</span>
                            </button>
                          </div>
                        )}

                        {/* View Profile Button - For Non-Pending Requests */}
                        {request.status !== 'pending' && (
                          <div className="mb-4 sm:mb-6 space-y-3">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openDateRequestProfile(request.fromProfile);
                              }}
                              className="w-full px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-sm sm:text-base md:text-lg font-medium hover:scale-105 flex items-center justify-center space-x-2"
                            >
                              <User className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span>View Complete Profile</span>
                            </button>
                            
                            {/* Plan Date Button - Only for Accepted Requests */}
                            {request.status === 'accepted' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDatePlanningModal(request.fromProfile);
                                }}
                                className="w-full px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-sm sm:text-base md:text-lg font-medium hover:scale-105 flex items-center justify-center space-x-2"
                              >
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Plan Date Together</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Status Display - Matching Love Universe Status Style */}
                        {request.status !== 'pending' && (
                          <div className={`text-center p-3 sm:p-4 rounded-xl font-medium text-sm sm:text-base ${
                            request.status === 'accepted' 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {request.status === 'accepted' ? '✅ Request Accepted' : '❌ Request Declined'}
                          </div>
                        )}

                        {/* Timestamp - Matching Love Universe Text Style */}
                        <div className="text-center mt-4 sm:mt-6">
                          <p className="text-xs text-gray-500">
                            Request sent on {new Date(request.timestamp).toLocaleDateString()} at {new Date(request.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

      
      {/* Detailed Profile Modal */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-1 sm:p-2 md:p-3 lg:p-4 xl:p-6">
          <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg sm:shadow-xl md:shadow-2xl w-full max-w-[900px] max-h-[95vh] overflow-y-auto mx-1 sm:mx-2 md:mx-3 lg:mx-4">
            {/* Modal Header */}
            <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-3 md:space-y-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 md:space-x-3 lg:space-x-4 w-full sm:w-auto">
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 break-words leading-tight">{selectedProfile.name}'s Complete Profile</h2>
                  <div className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs sm:text-sm md:text-base font-bold">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white" />
                    <span>{selectedProfile.matchPercentage}%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  {(selectedProfile?.isRevealed || selectedProfile?.id) && (
                    <button
                      onClick={() => {
                        const resolved = resolveProfileById(selectedProfile.id) || {
                          ...selectedProfile,
                          photos: Array.isArray(selectedProfile?.photos) && selectedProfile.photos.length ? selectedProfile.photos : fallbackImages,
                          commonInterests: Array.isArray(selectedProfile?.commonInterests) ? selectedProfile.commonInterests : [],
                        };
                        openDatePlanningModal(resolved);
                      }}
                      className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-semibold text-xs sm:text-sm md:text-base hover:shadow-lg transition-all duration-200"
                      title="Plan a Date"
                    >
                      Plan Date
                    </button>
                  )}
                  <button 
                    onClick={closeProfileModal}
                    className="p-1 sm:p-1.5 md:p-2 lg:p-2.5 xl:p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-75"
                  >
                    <X className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7" />
                  </button>
                </div>
              </div>
            </div>

            {/* Image Carousel */}
            <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-6 text-center">Photos</h3>
              <div className="relative">
                {/* Main Carousel Container */}
                <div className={`relative w-full max-w-[450px] h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] xl:h-[450px] rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl overflow-hidden mx-auto transition-all duration-500 ${
                  imageLoading || imageError || !selectedProfile.photos || selectedProfile.photos.length === 0
                    ? 'bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100'
                }`}>
                  {/* Current Image */}
                  {selectedProfile.photos && selectedProfile.photos.length > 0 ? (
                    <>
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 backdrop-blur-sm">
                          <div className="text-center p-2 sm:p-3 md:p-4 lg:p-5">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5"></div>
                            <p className="text-indigo-600 font-medium text-xs sm:text-sm md:text-base">Loading image...</p>
                          </div>
                        </div>
                      )}
                      
                      <img 
                        src={selectedProfile.photos[currentImageIndex]} 
                        alt={`${selectedProfile.name}'s photo ${currentImageIndex + 1}`}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                        onLoad={() => {
                          setImageLoading(false);
                          setImageError(false);
                        }}
                    onError={(_e) => {
                          setImageLoading(false);
                          setImageError(true);
                          // Don't hide the image, just show error overlay
                        }}
                        crossOrigin="anonymous"
                      />
                      
                      {imageError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-red-50 to-pink-50">
                          <div className="text-center p-2 sm:p-3 md:p-4 lg:p-5">
                            <Camera className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 mx-auto text-red-400 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5" />
                            <p className="text-red-600 font-medium text-xs sm:text-sm md:text-base">Image failed to load</p>
                            <p className="text-red-500 text-xs sm:text-sm mt-1 sm:mt-2 md:mt-3">Please check your internet connection</p>
                            <button 
                              onClick={() => {
                                setImageLoading(true);
                                setImageError(false);
                                // Force reload the image
                                const img = new Image();
                                img.src = selectedProfile.photos[currentImageIndex];
                                img.onload = () => {
                                  setImageLoading(false);
                                  setImageError(false);
                                };
                              }}
                              className="mt-1 sm:mt-2 md:mt-3 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-red-500 text-white rounded-full text-xs sm:text-sm md:text-base hover:bg-red-600 transition-colors duration-75"
                            >
                              Retry
                            </button>
                      </div>
                    </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-2 sm:p-3 md:p-4 lg:p-5">
                        <Camera className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 xl:w-16 xl:h-16 mx-auto text-gray-400 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5" />
                        <p className="text-gray-500 text-xs sm:text-sm md:text-base lg:text-lg">No photos available</p>
                  </div>
                </div>
                  )}
                  
                  {/* Navigation Arrows */}
                  {selectedProfile.photos && selectedProfile.photos.length > 1 && !imageLoading && !imageError && (
                    <>
                      <button 
                        className="absolute left-1 sm:left-2 md:left-3 lg:left-4 xl:left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-white/80 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-10"
                        onClick={previousImage}
                      >
                        <ChevronLeft className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
                      </button>
                      
                      <button 
                        className="absolute right-1 sm:right-2 md:right-3 lg:right-4 xl:right-5 top-1/2 transform -translate-y-1/2 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-white/80 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 z-10"
                        onClick={nextImage}
                      >
                        <ChevronRight className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
                      </button>
                    </>
                  )}
                  
                  {/* Image Counter */}
                  {selectedProfile.photos && selectedProfile.photos.length > 0 && !imageLoading && !imageError && (
                    <div className="absolute bottom-1 sm:bottom-2 md:bottom-3 lg:bottom-4 xl:bottom-5 right-1 sm:right-2 md:right-3 lg:right-4 xl:right-5 bg-black/50 text-white px-1 sm:px-2 md:px-3 lg:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm md:text-base font-medium">
                      {currentImageIndex + 1} of {selectedProfile.photos.length}
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Navigation */}
                {selectedProfile.photos && selectedProfile.photos.length > 0 && (
                  <div className="mt-1 sm:mt-2 md:mt-3 lg:mt-4 xl:mt-5 flex justify-center space-x-1 sm:space-x-2 md:space-x-3">
                    {selectedProfile.photos.map((photo: string, index: number) => (
                      <button
                      key={index}
                        className={`w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl overflow-hidden border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          index === currentImageIndex 
                            ? 'border-indigo-500 ring-2 ring-indigo-300' 
                            : 'border-gray-200 hover:border-indigo-400'
                        }`}
                        onClick={() => goToImage(index)}
                      >
                        <img 
                          src={photo} 
                          alt={`${selectedProfile.name}'s photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          onError={(_e) => {
                            // Silently handle thumbnail loading errors
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
                </div>
              </div>

            {/* Basic Profile Information */}
            <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-6 text-center">Basic Information</h3>
              
              {/* Name and Verification - Primary Hierarchy */}
              <div className="mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-6 text-center">
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-2 md:space-y-0 sm:space-x-2 md:space-x-3 lg:space-x-4 xl:space-x-5 mb-1 sm:mb-2 md:mb-3">
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-gray-900 break-words leading-tight">{selectedProfile.name}</h2>
                  <div className="bg-green-100 p-1 sm:p-1.5 md:p-2 rounded-full">
                    <Check className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-green-600" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-gray-500">Verified Profile</p>
                </div>

              {/* Secondary Information - Gender, Age, Languages */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4 lg:gap-5">
                <div className="bg-gray-50 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5">
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 mb-1 sm:mb-2 md:mb-3">
                    <User className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-indigo-600" />
                    <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700">Gender</span>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-900">Female</p>
                </div>

                <div className="bg-gray-50 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5">
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 mb-1 sm:mb-2 md:mb-3">
                    <Calendar className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-indigo-600" />
                    <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700">Age</span>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-900">{selectedProfile.age} years</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 mb-1 sm:mb-2 md:mb-3">
                    <Globe className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-indigo-600" />
                    <span className="text-xs sm:text-sm md:text-base font-medium text-gray-700">Languages</span>
                  </div>
                  <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-900 break-words">English, Hindi, Marathi</p>
                </div>
              </div>
            </div>

            {/* About Section */}
            <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-800 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5">About {selectedProfile.name}</h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5"><i className="fas fa-sparkles text-blue-500 mr-1"></i>Poetic Bio crafted from their All Time Favorites</p>
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border border-indigo-200">
                <p className="text-gray-700 leading-relaxed text-xs sm:text-sm md:text-base lg:text-lg italic">
                  {generatePoeticBio(selectedProfile.commonInterests)}
                </p>
              </div>
            </div>

            {/* All Time Favorites - One from each category */}
            <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4 lg:mb-5">All Time Favorites</h3>
              <div className="flex space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 xl:space-x-5 overflow-x-auto pb-1 sm:pb-2 md:pb-3 scrollbar-hide">
                  {/* Music Related */}
                  <div className="flex-shrink-0 w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40 2xl:w-44 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5 border border-blue-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Music className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">Fav Singer</span>
                    </div>
                    <p className="text-xs font-semibold text-blue-900 break-words">Taylor Swift</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-2 sm:p-3 md:p-4 border border-purple-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Music className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-700">Fav Song</span>
                    </div>
                    <p className="text-xs font-semibold text-purple-900 break-words">Blank Space</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-indigo-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Music className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                      <span className="text-xs font-medium text-indigo-700">Music Category</span>
                    </div>
                    <p className="text-xs font-semibold text-indigo-900">Pop</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl p-2 sm:p-3 md:p-4 border border-cyan-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Music className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-600" />
                      <span className="text-xs font-medium text-cyan-700">Music Composer</span>
                    </div>
                    <p className="text-xs font-semibold text-cyan-900">A.R. Rahman</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-2 sm:p-3 md:p-4 border border-teal-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Music className="w-3 h-3 sm:w-4 sm:h-4 text-teal-600" />
                      <span className="text-xs font-medium text-teal-700">Songwriter</span>
                    </div>
                    <p className="text-xs font-semibold text-teal-900">Ed Sheeran</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-2 sm:p-3 md:p-4 border border-emerald-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Music className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">Music Band</span>
                    </div>
                    <p className="text-xs font-semibold text-emerald-900">Coldplay</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-2 sm:p-3 md:p-4 border border-green-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Star className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700">Fav Idol</span>
                    </div>
                    <p className="text-xs font-semibold text-green-900">BTS</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-lime-50 to-yellow-50 rounded-xl p-2 sm:p-3 md:p-4 border border-lime-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-lime-600" />
                      <span className="text-xs font-medium text-lime-700">Singer Group</span>
                    </div>
                    <p className="text-xs font-semibold text-lime-900">Little Mix</p>
                  </div>
                  
                  {/* Entertainment Related */}
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-2 sm:p-3 md:p-4 border border-yellow-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Film className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-700">Fav Movie</span>
                    </div>
                    <p className="text-xs font-semibold text-yellow-900">Inception</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-2 sm:p-3 md:p-4 border border-amber-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Film className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">Movie Category</span>
                    </div>
                    <p className="text-xs font-semibold text-amber-900">Sci-Fi</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-2 sm:p-3 md:p-4 border border-orange-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Tv className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                      <span className="text-xs font-medium text-orange-700">Fav TV Series</span>
                    </div>
                    <p className="text-xs font-semibold text-orange-900">Friends</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-2 sm:p-3 md:p-4 border border-red-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Tv className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                      <span className="text-xs font-medium text-red-700">TV Category</span>
                    </div>
                    <p className="text-xs font-semibold text-red-900">Comedy</p>
                  </div>
                  
                  {/* Reading Related */}
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-2 sm:p-3 md:p-4 border border-pink-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Book className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-pink-600" />
                      <span className="text-xs font-medium text-pink-700">Fav Book</span>
                    </div>
                    <p className="text-xs font-semibold text-pink-900">Harry Potter</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-rose-50 to-fuchsia-50 rounded-xl p-2 sm:p-3 md:p-4 border border-rose-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Book className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-rose-600" />
                      <span className="text-xs font-medium text-rose-700">Book Category</span>
                    </div>
                    <p className="text-xs font-semibold text-rose-900">Fantasy</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-fuchsia-50 to-violet-50 rounded-xl p-2 sm:p-3 md:p-4 border border-fuchsia-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Tv className="w-3 h-3 sm:w-4 sm:h-4 text-fuchsia-600" />
                      <span className="text-xs font-medium text-fuchsia-700">Fav Cartoon</span>
                    </div>
                    <p className="text-xs font-semibold text-fuchsia-900">Tom & Jerry</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-2 sm:p-3 md:p-4 border border-violet-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Book className="w-3 h-3 sm:w-4 sm:h-4 text-violet-600" />
                      <span className="text-xs font-medium text-violet-700">Fav Comic</span>
                    </div>
                    <p className="text-xs font-semibold text-violet-900">Batman</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-2 sm:p-3 md:p-4 border border-purple-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-700">Fav Actor</span>
                    </div>
                    <p className="text-xs font-semibold text-purple-900">Leonardo DiCaprio</p>
                  </div>
                  
                  {/* Sports Related */}
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-2 sm:p-3 md:p-4 border border-indigo-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                      <span className="text-xs font-medium text-indigo-700">Fav Sport</span>
                    </div>
                    <p className="text-xs font-semibold text-indigo-900">Cricket</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Trophy className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">Fav Athlete</span>
                    </div>
                    <p className="text-xs font-semibold text-blue-900">Virat Kohli</p>
                  </div>
                  
                  {/* Travel Related */}
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl p-2 sm:p-3 md:p-4 border border-cyan-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Plane className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-cyan-600" />
                      <span className="text-xs font-medium text-cyan-700">Travel Destination</span>
                    </div>
                    <p className="text-xs font-semibold text-cyan-900">Paris</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-2 sm:p-3 md:p-4 border border-teal-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Plane className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-teal-600" />
                      <span className="text-xs font-medium text-teal-700">Travel Category</span>
                    </div>
                    <p className="text-xs font-semibold text-teal-900">Beach</p>
                  </div>
                  
                  {/* Food Related */}
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-2 sm:p-3 md:p-4 border border-emerald-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Utensils className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">Fav Food</span>
                    </div>
                    <p className="text-xs font-semibold text-emerald-900">Biryani</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-green-50 to-lime-50 rounded-xl p-2 sm:p-3 md:p-4 border border-green-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Utensils className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                      <span className="text-xs font-medium text-green-700">Cuisine Category</span>
                    </div>
                    <p className="text-xs font-semibold text-green-900">Indian</p>
                  </div>
                  
                  {/* Shopping & Tech */}
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-lime-50 to-yellow-50 rounded-xl p-2 sm:p-3 md:p-4 border border-lime-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-lime-600" />
                      <span className="text-xs font-medium text-lime-700">Shopping Brand</span>
                    </div>
                    <p className="text-xs font-semibold text-lime-900">Nike</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-2 sm:p-3 md:p-4 border border-yellow-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-700">Tech Gadget</span>
                    </div>
                    <p className="text-xs font-semibold text-yellow-900">iPhone</p>
                  </div>
                  
                  {/* Personal */}
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-2 sm:p-3 md:p-4 border border-amber-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Palette className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-600" />
                      <span className="text-xs font-medium text-amber-700">Fav Hobby</span>
                    </div>
                    <p className="text-xs font-semibold text-amber-900">Painting</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-2 sm:p-3 md:p-4 border border-orange-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                      <span className="text-xs font-medium text-orange-700">Fav Interest</span>
                    </div>
                    <p className="text-xs font-semibold text-orange-900">Photography</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-2 sm:p-3 md:p-4 border border-red-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                      <span className="text-xs font-medium text-red-700">Fav Habit</span>
                    </div>
                    <p className="text-xs font-semibold text-red-900">Morning Yoga</p>
                  </div>
                  
                  <div className="flex-shrink-0 w-32 sm:w-36 md:w-40 lg:w-44 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-2 sm:p-3 md:p-4 border border-pink-200">
                    <div className="flex items-center space-x-1 sm:space-x-2 mb-1 sm:mb-2">
                      <PawPrint className="w-3 h-3 sm:w-4 sm:h-4 text-pink-600" />
                      <span className="text-xs font-medium text-pink-700">Fav Animal</span>
                    </div>
                    <p className="text-xs font-semibold text-pink-900">Dogs</p>
                  </div>
                </div>
            </div>

            {/* Hobbies & Interests */}
            <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4 lg:mb-5">Hobbies & Interests</h3>
              <div className="flex space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 overflow-x-auto pb-1 sm:pb-2 md:pb-3 scrollbar-hide">
                    {(selectedProfile?.commonInterests ?? []).map((interest: string, index: number) => (
                  <span key={index} className="flex-shrink-0 px-1 sm:px-2 md:px-3 lg:px-4 xl:px-5 py-1 sm:py-1.5 md:py-2 lg:py-2.5 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 font-medium text-xs sm:text-sm md:text-base hover:bg-indigo-200 transition-colors duration-75">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>

            {/* Category-wise Favorites */}
            <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">
              <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4 lg:mb-5">Detailed Favorites by Category</h3>
              
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-5">
                {/* Music Related */}
                  <button 
                  onClick={() => console.log('Fav Singers category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 lg:p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl md:rounded-2xl border border-blue-200 hover:border-blue-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Music className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900 text-xs sm:text-sm md:text-base">Fav Singers</span>
                  </div>
                  <ChevronRight className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 text-blue-600" />
                  </button>

                  <button 
                  onClick={() => console.log('Fav Songs category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg sm:rounded-xl border border-purple-200 hover:border-purple-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Music className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" />
                    <span className="font-semibold text-purple-900 text-xs sm:text-sm">Fav Songs</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" />
                  </button>

                <button 
                  onClick={() => console.log('Music Categories category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg sm:rounded-xl border border-indigo-200 hover:border-indigo-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Music className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-indigo-600" />
                    <span className="font-semibold text-indigo-900 text-xs sm:text-sm">Music Categories</span>
                </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-indigo-600" />
                </button>

                <button 
                  onClick={() => console.log('Music Composers category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg sm:rounded-xl border border-cyan-200 hover:border-cyan-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Music className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-cyan-600" />
                    <span className="font-semibold text-cyan-900 text-xs sm:text-sm">Music Composers</span>
              </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-cyan-600" />
                </button>

                <button 
                  onClick={() => console.log('Songwriters category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg sm:rounded-xl border border-teal-200 hover:border-teal-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Music className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-teal-600" />
                    <span className="font-semibold text-teal-900 text-xs sm:text-sm">Songwriters</span>
            </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-teal-600" />
                </button>

                <button 
                  onClick={() => console.log('Music Bands category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg sm:rounded-xl border border-emerald-200 hover:border-emerald-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Music className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-900 text-xs sm:text-sm">Music Bands</span>
              </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-600" />
                </button>

                <button 
                  onClick={() => console.log('Fav Idols category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-green-50 to-lime-50 rounded-lg sm:rounded-xl border border-green-200 hover:border-green-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Star className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
                    <span className="font-semibold text-green-900 text-xs sm:text-sm">Fav Idols</span>
              </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
                </button>

                <button 
                  onClick={() => console.log('Singer Groups category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-lime-50 to-yellow-50 rounded-lg sm:rounded-xl border border-lime-200 hover:border-lime-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-lime-600" />
                    <span className="font-semibold text-lime-900 text-xs sm:text-sm">Singer Groups</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-lime-600" />
                </button>

                {/* Entertainment Related */}
                <button 
                  onClick={() => console.log('Fav Movies category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg sm:rounded-xl border border-yellow-200 hover:border-yellow-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Film className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900 text-xs sm:text-sm">Fav Movies</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-600" />
                </button>

                <button 
                  onClick={() => console.log('Movie Categories category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg sm:rounded-xl border border-amber-200 hover:border-amber-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Film className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-600" />
                    <span className="font-semibold text-amber-900 text-xs sm:text-sm">Movie Categories</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-600" />
                </button>

                <button 
                  onClick={() => console.log('Fav TV Series category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg sm:rounded-xl border border-orange-200 hover:border-orange-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Tv className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-orange-600" />
                    <span className="font-semibold text-orange-900 text-xs sm:text-sm">Fav TV Series</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-orange-600" />
                </button>

                <button 
                  onClick={() => console.log('TV Categories category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg sm:rounded-xl border border-red-200 hover:border-red-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Tv className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-600" />
                    <span className="font-semibold text-red-900 text-xs sm:text-sm">TV Categories</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-600" />
                </button>

                {/* Reading Related */}
                <button 
                  onClick={() => console.log('Fav Books category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg sm:rounded-xl border border-pink-200 hover:border-pink-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Book className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-pink-600" />
                    <span className="font-semibold text-pink-900 text-xs sm:text-sm">Fav Books</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-pink-600" />
                </button>

                <button 
                  onClick={() => console.log('Book Categories category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-rose-50 to-fuchsia-50 rounded-lg sm:rounded-xl border border-rose-200 hover:border-rose-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Book className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-rose-600" />
                    <span className="font-semibold text-rose-900 text-xs sm:text-sm">Book Categories</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-rose-600" />
                </button>

                <button 
                  onClick={() => console.log('Fav Cartoons category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-fuchsia-50 to-violet-50 rounded-lg sm:rounded-xl border border-fuchsia-200 hover:border-fuchsia-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Tv className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-fuchsia-600" />
                    <span className="font-semibold text-fuchsia-900 text-xs sm:text-sm">Fav Cartoons</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-fuchsia-600" />
                </button>

                <button 
                  onClick={() => console.log('Fav Comics category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg sm:rounded-xl border border-violet-200 hover:border-violet-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Book className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-violet-600" />
                    <span className="font-semibold text-violet-900 text-xs sm:text-sm">Fav Comics</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-violet-600" />
                </button>

                <button 
                  onClick={() => console.log('Fav Actors category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg sm:rounded-xl border border-purple-200 hover:border-purple-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" />
                    <span className="font-semibold text-purple-900 text-xs sm:text-sm">Fav Actors</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" />
                </button>

                {/* Sports Related */}
                <button 
                  onClick={() => console.log('Fav Sports category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg sm:rounded-xl border border-indigo-200 hover:border-indigo-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-indigo-600" />
                    <span className="font-semibold text-indigo-900 text-xs sm:text-sm">Fav Sports</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-indigo-600" />
                </button>

                <button 
                  onClick={() => console.log('Fav Athletes category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl border border-blue-200 hover:border-blue-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900 text-xs sm:text-sm">Fav Athletes</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600" />
                </button>

                {/* Travel Related */}
                <button 
                  onClick={() => console.log('Travel Destinations category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg sm:rounded-xl border border-cyan-200 hover:border-cyan-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Plane className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-cyan-600" />
                    <span className="font-semibold text-cyan-900 text-xs sm:text-sm">Travel Destinations</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-cyan-600" />
                </button>

                <button 
                  onClick={() => console.log('Travel Categories category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg sm:rounded-xl border border-teal-200 hover:border-teal-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Plane className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-teal-600" />
                    <span className="font-semibold text-teal-900 text-xs sm:text-sm">Travel Categories</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-teal-600" />
                </button>

                {/* Food Related */}
                <button 
                  onClick={() => console.log('Fav Food category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg sm:rounded-xl border border-emerald-200 hover:border-emerald-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Utensils className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-900 text-xs sm:text-sm">Fav Food</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-emerald-600" />
                </button>

                <button 
                  onClick={() => console.log('Cuisine Categories category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-green-50 to-lime-50 rounded-lg sm:rounded-xl border border-green-200 hover:border-green-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Utensils className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
                    <span className="font-semibold text-green-900 text-xs sm:text-sm">Cuisine Categories</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600" />
                </button>

                {/* Shopping & Tech */}
                <button 
                  onClick={() => console.log('Shopping Brands category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-lime-50 to-yellow-50 rounded-lg sm:rounded-xl border border-lime-200 hover:border-lime-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-lime-600" />
                    <span className="font-semibold text-lime-900 text-xs sm:text-sm">Shopping Brands</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-lime-600" />
                </button>

                <button 
                  onClick={() => console.log('Tech Gadgets category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg sm:rounded-xl border border-yellow-200 hover:border-yellow-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Smartphone className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-600" />
                    <span className="font-semibold text-yellow-900 text-xs sm:text-sm">Tech Gadgets</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-600" />
                </button>

                {/* Personal */}
                <button 
                  onClick={() => console.log('Fav Hobbies category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg sm:rounded-xl border border-amber-200 hover:border-amber-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Palette className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-600" />
                    <span className="font-semibold text-amber-900 text-xs sm:text-sm">Fav Hobbies</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-amber-600" />
                </button>

                <button 
                  onClick={() => console.log('Fav Interests category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg sm:rounded-xl border border-orange-200 hover:border-orange-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Heart className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-orange-600" />
                    <span className="font-semibold text-orange-900 text-xs sm:text-sm">Fav Interests</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-orange-600" />
                </button>

                <button 
                  onClick={() => console.log('Fav Habits category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-lg sm:rounded-xl border border-red-200 hover:border-red-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-600" />
                    <span className="font-semibold text-red-900 text-xs sm:text-sm">Fav Habits</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-600" />
                </button>

                <button 
                  onClick={() => console.log('Fav Animals category clicked')}
                  className="flex items-center justify-between w-full p-2 sm:p-3 md:p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg sm:rounded-xl border border-pink-200 hover:border-pink-300 transition-colors duration-75"
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                    <PawPrint className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-pink-600" />
                    <span className="font-semibold text-pink-900 text-xs sm:text-sm">Fav Animals</span>
                  </div>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-pink-600" />
                </button>
              </div>
              
              <div className="mt-2 sm:mt-3 text-center">
                <p className="text-xs sm:text-sm text-gray-600">Click any category to see detailed favorites</p>
              </div>
            </div>



                                  {/* Action Buttons */}
                  <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6">
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-2 md:space-y-3 sm:space-y-0 sm:space-x-1 md:space-x-2 lg:space-x-3 xl:space-x-4">
                      <button 
                        onClick={() => {
                          const p = selectedProfile;
                          if (!p) return;
                          openDatePlanningModal(p);
                        }}
                        className="flex-1 py-1 sm:py-2 md:py-2.5 lg:py-3 xl:py-4 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg sm:rounded-xl md:rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base lg:text-lg flex items-center justify-center space-x-1 sm:space-x-2"
                      >
                        <Calendar className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                        <span>Send Date Request</span>
                      </button>
                      <button 
                        onClick={() => {
                          const matchId = String((selectedProfile as any)?.match_id || '');
                          if (!matchId) return;
                          openDyadForMatchId(matchId).catch(() => undefined);
                        }}
                        className="flex-1 py-1 sm:py-2 md:py-2.5 lg:py-3 xl:py-4 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg sm:rounded-xl md:rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base lg:text-lg flex items-center justify-center space-x-1 sm:space-x-2"
                      >
                        <MessageCircle className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                        <span>Open Dyad</span>
                      </button>
                    </div>
                  </div>

                  {/* It's a Match Hint Card */}
                  <div className="px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 pb-2 sm:pb-3 md:pb-4 lg:pb-5 xl:pb-6">
                    <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-pink-100 border border-pink-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                        <span className="text-pink-700 font-semibold text-sm sm:text-base">It's a Match Magic</span>
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                      </div>
                      <p className="text-pink-600 text-xs sm:text-sm mb-3">
                        When both of you show mutual interest, magic happens! 
                      </p>
                      <button 
                        onClick={() => setActiveTab('its-a-match')}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs sm:text-sm font-medium rounded-full hover:shadow-lg transition-all duration-200 hover:scale-105"
                      >
                        Discover Matches
                      </button>
                    </div>
                  </div>
                </div>
                </div>
                )}
                </div>
                </div>
      {/* Mobile Bottom Navigation Bar - Only Visible on Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-pink-200 shadow-lg">
        <div className="flex items-center justify-between px-2 py-2.5">
          {(
            [
              { id: 'overview', label: 'Overview', icon: Heart },
              { id: 'pulse', label: 'Pulse', icon: Activity },
              { id: 'matches', label: 'Matches', icon: Star },
              { id: 'its-a-match', label: 'Match!', icon: Sparkles },
              { id: 'dates', label: 'Dates', icon: Calendar },
              { id: 'date-requests', label: 'Requests', icon: Calendar }
            ] as Array<{ id: LoveDashboardTabId; label: string; icon: any }>
          )
          .map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'overview') navigate('/love-dashboard/love-overview');
                  if (tab.id === 'pulse') navigate('/love-dashboard/pulse');
                  if (tab.id === 'matches') navigate('/love-dashboard/romantic-matches');
                  if (tab.id === 'its-a-match') navigate('/love-dashboard/its-a-match');
                  if (tab.id === 'dates') navigate('/love-dashboard/date-planning');
                  if (tab.id === 'date-requests') navigate('/love-dashboard/date-requests');
                }}
                className={`flex flex-col items-center justify-center space-y-1 py-1 px-1 rounded-lg transition-all duration-200 flex-1 min-w-0 ${
                  activeTab === tab.id
                    ? 'text-pink-600 bg-pink-50'
                    : 'text-gray-600 hover:text-pink-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 ${
                    activeTab === tab.id ? 'text-pink-600' : 'text-gray-600'
                  }`} />
                </div>
                <span className={`text-[8px] font-medium truncate ${
                  activeTab === tab.id ? 'text-pink-600' : 'text-gray-600'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {/* Date Planning Modal */}
      {showDatePlanningModal && selectedProfileForDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-indigo-200 max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 sm:p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/80 shadow-lg">
                    <img 
                      src={(Array.isArray(selectedProfileForDate.photos) && selectedProfileForDate.photos[0]) || selectedProfileForDate.photo_url || fallbackImages[0]} 
                      alt={selectedProfileForDate.name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                      Plan Date with {selectedProfileForDate.name}
                    </h3>
                    <p className="text-indigo-100 text-xs sm:text-sm font-medium">
                      Create a memorable experience together <i className="fas fa-sparkles text-blue-500 ml-2"></i>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeDatePlanningModal}
                  className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
              {datePlanningStep === 'type' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Choose Date Type</h4>
                    <p className="text-gray-600 text-sm">Select from our smart suggestions or create your own</p>
                  </div>
                  
                  {/* Smart Suggestions */}
                  <div className="grid gap-3">
                    <h5 className="font-medium text-gray-700 text-sm">💡 Smart Suggestions (Based on Common Interests)</h5>
                    <div className="grid gap-2">
                      {generateDateSuggestions(selectedProfileForDate).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => selectDateSuggestion(suggestion)}
                          className="w-full text-left p-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-xl hover:border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-100 hover:via-purple-100 hover:to-pink-100 transition-all duration-200 group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h6 className="font-semibold text-gray-800">{suggestion.type}</h6>
                              <p className="text-sm text-gray-600">{suggestion.activity}</p>
                              <p className="text-xs text-indigo-600 font-medium">Budget: {suggestion.budget}</p>
                            </div>
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                              <ArrowRight className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 italic">{suggestion.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Date Option */}
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setDatePlanningStep('details')}
                      className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200"
                    >
                      Create Custom Date
                    </button>
                  </div>
                </div>
              )}

              {datePlanningStep === 'details' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Date Details</h4>
                    <p className="text-gray-600 text-sm">Fill in the details for your perfect date</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date Type</label>
                      <input
                        type="text"
                        value={datePlan.type}
                        onChange={(e) => handleDatePlanChange('type', e.target.value)}
                        placeholder="e.g., Coffee Date, Dinner Date"
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={datePlan.date}
                        onChange={(e) => handleDatePlanChange('date', e.target.value)}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                      <input
                        type="time"
                        value={datePlan.time}
                        onChange={(e) => handleDatePlanChange('time', e.target.value)}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                      <select
                        value={datePlan.budget}
                        onChange={(e) => handleDatePlanChange('budget', e.target.value)}
                        className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        <option value="">Select Budget</option>
                        <option value="Free">Free</option>
                        <option value="Low">Low ($10-25)</option>
                        <option value="Medium">Medium ($25-75)</option>
                        <option value="High">High ($75+)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={datePlan.location}
                      onChange={(e) => handleDatePlanChange('location', e.target.value)}
                      placeholder="e.g., Central Park, Starbucks, Italian Restaurant"
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Activity</label>
                    <input
                      type="text"
                      value={datePlan.activity}
                      onChange={(e) => handleDatePlanChange('activity', e.target.value)}
                      placeholder="e.g., Coffee and conversation, Dinner and movie, Walk in the park"
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={datePlan.description}
                      onChange={(e) => handleDatePlanChange('description', e.target.value)}
                      placeholder="Describe what you have in mind for this date..."
                      rows={3}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Special Notes</label>
                    <textarea
                      value={datePlan.specialNotes}
                      onChange={(e) => handleDatePlanChange('specialNotes', e.target.value)}
                      placeholder="Any special requests or notes..."
                      rows={2}
                      className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => setDatePlanningStep('type')}
                      className="flex-1 px-4 py-2 border border-indigo-300 text-indigo-600 rounded-full font-medium hover:bg-indigo-50 transition-colors duration-75"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setDatePlanningStep('review')}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200"
                    >
                      Review & Send
                    </button>
                  </div>
                </div>
              )}

              {datePlanningStep === 'review' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Review Your Date Plan</h4>
                    <p className="text-gray-600 text-sm">Make sure everything looks perfect before sending</p>
                  </div>
                  
                  <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-xl p-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-5 h-5 text-indigo-500" />
                        <span className="font-medium text-gray-800">{datePlan.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        <span className="text-gray-700">{datePlan.date} at {datePlan.time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                        <span className="text-gray-700">{datePlan.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-indigo-500" />
                        <span className="text-gray-700">{datePlan.activity}</span>
                      </div>
                      {datePlan.budget && (
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-indigo-500" />
                          <span className="text-gray-700">Budget: {datePlan.budget}</span>
                        </div>
                      )}
                      {datePlan.description && (
                        <div>
                          <p className="text-sm text-gray-600 italic">"{datePlan.description}"</p>
                        </div>
                      )}
                      {datePlan.specialNotes && (
                        <div>
                          <p className="text-sm text-gray-600 italic">Notes: {datePlan.specialNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => setDatePlanningStep('details')}
                      className="flex-1 px-4 py-2 border border-indigo-300 text-indigo-600 rounded-full font-medium hover:bg-indigo-500 hover:text-white transition-all duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={sendDateRequest}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200"
                    >
                      Send Date Request 💕
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* It's a Match Popup - Celebratory Modal */}
      {showMatchPopup && currentMatch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm sm:max-w-md w-full overflow-hidden animate-bounce-in">
            {/* Celebration Header */}
            <div className="bg-gradient-to-r from-pink-400 via-red-400 to-pink-500 text-white p-4 sm:p-6 text-center relative overflow-hidden">
              {/* Floating Hearts Animation */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="animate-pulse absolute top-2 left-4 text-2xl">💕</div>
                <div className="animate-pulse absolute top-4 right-6 text-xl">💖</div>
                <div className="animate-pulse absolute bottom-4 left-6 text-xl">💝</div>
                <div className="animate-pulse absolute bottom-2 right-4 text-2xl">💕</div>
              </div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <span className="text-3xl sm:text-4xl"><i className="fas fa-party-horn text-yellow-500"></i></span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">It's a Match!</h3>
                <p className="text-pink-100 text-sm sm:text-base">The feeling is mutual! 💕</p>
              </div>
            </div>

            {/* Match Details */}
            <div className="p-4 sm:p-6 text-center">
              <div className="mb-4 sm:mb-6">
                <img
                  src={getWorkingImageUrl(currentMatch.profile.photos[0], 0)}
                  alt={currentMatch.profile.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-pink-200 mx-auto mb-3 sm:mb-4"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = fallbackImages[0];
                  }}
                />
                <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-1">
                  {currentMatch.profile.name}
                </h4>
                <p className="text-pink-600 font-medium text-sm sm:text-base">
                  {currentMatch.profile.matchPercentage}%
                </p>
                <p className="text-gray-600 text-xs sm:text-sm mt-1">
                  {currentMatch.profile.location}
                </p>
              </div>

              {/* Match Celebration Message */}
              <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-pink-200">
                <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                          <i className="fas fa-sparkles text-blue-500 mr-2"></i><strong>Congratulations!</strong> You and {currentMatch.profile.name} have both shown interest in each other.
        This mutual connection is special and could be the beginning of something beautiful! <i className="fas fa-star text-purple-500 ml-2"></i>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={viewMatchProfile}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-pink-400 to-red-400 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 text-sm sm:text-base"
                >
                  👀 View Full Profile
                </button>
                
                <button
                  onClick={startChatWithMatch}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-400 to-purple-400 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 text-sm sm:text-base"
                >
                  💬 Start Chatting
                </button>
                
                <button
                  onClick={planDateWithMatch}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 text-sm sm:text-base"
                >
                  🗓️ Plan a Date
                </button>
                
                <button
                  onClick={() => openSpinwheelModal(currentMatch.profile, 'mutual_match')}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-400 to-indigo-400 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 text-sm sm:text-base"
                >
                  <i className="fas fa-bullseye text-blue-500 mr-2"></i>Spin for First Move
                </button>
                
                <button
                  onClick={closeMatchPopup}
                  className="w-full px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 text-gray-600 rounded-full font-medium hover:bg-gray-50 transition-all duration-200 text-sm sm:text-base"
                >
                  Continue Browsing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spinwheel Modal - Deciding Who Makes First Move */}
      {showSpinwheelModal && spinwheelProfile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md sm:max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-4 sm:p-6 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                <h3 className="text-lg sm:text-xl font-bold"><i className="fas fa-bullseye text-blue-500 mr-2"></i>First Move Decision</h3>
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <p className="text-indigo-100 text-sm sm:text-base">
                {spinwheelType === 'mutual_match' 
                  ? `Spin the wheel with ${spinwheelProfile.name} to decide who makes the first move!`
                  : `Spin the wheel to decide who initiates the next level with ${spinwheelProfile.name}!`
                }
              </p>
            </div>

            {/* Spinwheel Content */}
            <div className="p-4 sm:p-6 text-center">
              {/* Profile Info */}
              <div className="mb-4 sm:mb-6">
                <img
                  src={getWorkingImageUrl(spinwheelProfile.photos[0], 0)}
                  alt={spinwheelProfile.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-indigo-200 mx-auto mb-3"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = fallbackImages[0];
                  }}
                />
                <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-1">
                  {spinwheelProfile.name}
                </h4>
                <p className="text-indigo-600 font-medium text-sm">
                  {spinwheelProfile.matchPercentage}%
                </p>
              </div>

              {/* Spinwheel Display */}
              <div className="mb-4 sm:mb-6">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-4 sm:p-6 border border-indigo-200">
                  <div className="text-center mb-4">
                    <h5 className="text-sm sm:text-base font-semibold text-gray-800 mb-2">
                      🎲 Your Spin Result
                    </h5>
                    {userSpinResult ? (
                      <div className="text-3xl sm:text-4xl font-bold text-indigo-600 bg-white rounded-full w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto shadow-lg">
                        {userSpinResult}
                      </div>
                    ) : (
                      <div className="text-2xl sm:text-3xl text-gray-400">
                        Waiting to spin...
                      </div>
                    )}
                  </div>
                  
                  {!userSpinResult && (
                    <button
                      onClick={spinWheel}
                      className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 text-base sm:text-lg"
                    >
                      <i className="fas fa-bullseye text-blue-500 mr-2"></i>Spin the Wheel!
                    </button>
                  )}
                  
                  {userSpinResult && !otherPartySpinResult && (
                    <div className="text-center">
                      <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-indigo-600">
                        {spinwheelProfile.name} is spinning...
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={closeSpinwheelModal}
                className="px-4 sm:px-6 py-2 sm:py-2.5 border border-gray-300 text-gray-600 rounded-full font-medium hover:bg-gray-50 transition-all duration-200 text-sm sm:text-base"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spin Result Modal - Who Won and What's Next */}
      {showSpinResultModal && spinResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md sm:max-w-lg w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 text-white p-4 sm:p-6 text-center relative">
              <button
                onClick={closeSpinResultModal}
                className="absolute top-3 right-3 p-1.5 hover:bg-white/20 rounded-full transition-colors duration-75"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                <h3 className="text-lg sm:text-xl font-bold"><i className="fas fa-party-horn text-yellow-500 mr-2"></i>Spin Results!</h3>
                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>

            {/* Results Content */}
            <div className="p-4 sm:p-6 text-center">
              {/* Winner Announcement */}
              <div className="mb-4 sm:mb-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl sm:text-3xl"><i className="fas fa-trophy text-yellow-500"></i></span>
                </div>
                <h4 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                  {spinResult.winner} Won!
                </h4>
                <p className="text-gray-600 text-sm sm:text-base">
                  {spinResult.winner === 'You' ? 'Congratulations!' : 'Great spin!'}
                </p>
              </div>

              {/* Score Display */}
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-pink-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-pink-600 font-medium mb-1">Your Score</p>
                    <p className="text-lg sm:text-xl font-bold text-pink-700">{spinResult.userScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-pink-600 font-medium mb-1">{spinwheelProfile?.name}'s Score</p>
                    <p className="text-lg sm:text-xl font-bold text-pink-700">{spinResult.otherScore}</p>
                  </div>
                </div>
              </div>

              {/* First Move Decision */}
              <div className="mb-4 sm:mb-6">
                <h5 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                  <i className="fas fa-bullseye text-blue-500 mr-2"></i>Who Makes the First Move?
                </h5>
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 sm:p-4 border border-indigo-200">
                  <p className="text-indigo-700 font-medium text-sm sm:text-base">
                    <strong>{spinResult.firstMoveBy}</strong> will initiate the next level!
                  </p>
                  <p className="text-indigo-600 text-xs sm:text-sm mt-1">
                    This could be planning a date, audio call, video call, or more!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={handleFindMoreDates}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 text-sm sm:text-base"
                >
                  🔍 Find More Dates
                </button>
                
                <button
                  onClick={handleAIChatPrompts}
                  className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:scale-105 text-sm sm:text-base"
                >
                  🤖 AI Chat Prompts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Modal - MOBILE RESPONSIVE */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            {/* Modal Header - Mobile Optimized */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold">Today's Love Challenge</h3>
                    <p className="text-purple-100 text-xs sm:text-sm">Complete daily goals to earn rewards!</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChallengeModal(false)}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors duration-75"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Challenge Content - Mobile Optimized */}
            <div className="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[80vh] sm:max-h-[70vh]">
              {/* Current Challenge - Mobile Optimized */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border border-purple-200">
                <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-2.5 sm:mb-3 flex items-center space-x-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                  <span>Current Challenge</span>
                </h4>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-gray-700 font-medium mb-1.5 sm:mb-2 text-sm sm:text-base leading-relaxed">{dailyChallenge.title}</p>
                    <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                      <span className="text-xs sm:text-sm text-gray-600">Progress</span>
                      <span className="text-xs sm:text-sm font-semibold text-purple-600">
                        {dailyChallenge.completed}/{dailyChallenge.target}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                      <div 
                        className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 sm:h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(dailyChallenge.completed / dailyChallenge.target) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white/80 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                    <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">🎁 <strong>Reward:</strong></p>
                    <p className="text-purple-600 font-medium text-sm sm:text-base">{dailyChallenge.reward}</p>
                  </div>

                  {dailyChallenge.progress.length > 0 && (
                    <div className="bg-white/80 rounded-lg sm:rounded-xl p-2.5 sm:p-3">
                      <p className="text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">📊 <strong>Recent Activity:</strong></p>
                      <div className="space-y-1.5 sm:space-y-2">
                        {dailyChallenge.progress.map((progress, index) => (
                          <div key={index} className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full flex-shrink-0"></span>
                            <span className="text-gray-700 flex-1">
                              Message sent to <strong>{progress.profileName}</strong>
                            </span>
                            <span className="text-xs text-gray-500 flex-shrink-0">
                              {formatTimestamp(progress.timestamp)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Mobile Optimized */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-3 sm:pt-4">
                <button
                  onClick={() => setShowChallengeModal(false)}
                  className="w-full sm:flex-1 px-3 sm:px-4 py-2 border border-purple-300 text-purple-600 rounded-full font-medium hover:bg-purple-50 transition-colors duration-75 text-sm sm:text-base"
                >
                  Close
                </button>
                {!dailyChallenge.isCompleted && (
                  <button
                    onClick={() => {
                      setShowChallengeModal(false);
                      setActiveTab('matches');
                    }}
                    className="w-full sm:flex-1 px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
                  >
                    <i className="fas fa-bullseye text-blue-500 mr-2"></i>Start Messaging
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
      </div>

      {/* Notifications Modal */}
      <NotificationsPanel
        isOpen={showNotificationsModal}
        onClose={() => {
          setShowNotificationsModal(false);
          if (location.pathname.includes('/notifications-modal')) {
            navigate('/love-dashboard/love-overview');
          }
        }}
        notifications={notifications}
        unreadCount={unreadNotificationsCount}
        onMarkAsRead={markNotificationAsRead}
        onMarkAllAsRead={markAllNotificationsAsRead}
        onDeleteNotification={deleteNotification}
        onNotificationAction={handleNotificationAction}
        formatTimestamp={formatTimestamp}
      />
    </div>
  );
};

export default LoveDashboard;
