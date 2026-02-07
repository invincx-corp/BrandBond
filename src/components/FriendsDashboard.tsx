import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Bell,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Compass,
  Crown,
  Home,
  Menu,
  RefreshCw,
  Search,
  Star,
  Trophy,
  UserPlus,
  Users,
  Users2,
  X,
} from 'lucide-react';
import { useLocalEventsRealtime } from '../hooks/useLocalEventsRealtime';
import { useMyMenuStatsRealtime } from '../hooks/useMyMenuStatsRealtime';
import { useMyProfileRealtime } from '../hooks/useMyProfileRealtime';
import { supabase } from '../lib/supabase';

import CommunityProfileModal from './CommunityProfileModal';
import FanclubProfileModal from './FanclubProfileModal';
import ProfileDetailsModal from './ProfileDetailsModal';
import ProgressiveOnboardingOverlay from './ProgressiveOnboardingOverlay';
import FriendsPulsePage from './FriendsPulsePage';
import UserProfileButton from './UserProfileButton';

interface FriendsDashboardProps {
  userId: string;
  onNavigate: (page: string) => void;
}

type ActiveTab = 'overview' | 'pulse' | 'matches' | 'communities' | 'fanclubs' | 'events' | 'requests' | 'profile-settings';

type LucideIcon = React.ComponentType<{ className?: string }>;

type NavTab = {
  id: ActiveTab;
  label: string;
  icon: any;
  route: string;
  badge?: number;
};

type UnknownRecord = Record<string, unknown>;

type FriendRequest = {
  id: string;
  name: string;
  profileImage: string;
  age: string | number;
  location: string;
  matchPercentage: number;
  mutualFriends: number;
  requestMessage: string;
  mutualFriendsList: Array<{ id: string; name: string; image: string }>;
};

type FriendshipMatch = {
  id: string;
  name: string;
  profileImage: string;
  matchPercentage: number;
  commonFavorites: string[];
  mutualFriends: number;
  mutualFriendsList?: Array<{ id: string | number; name: string; image?: string; profileImage?: string }>;
};

type ProfileDetailsProfile = FriendRequest | FriendshipMatch;

type FanclubProfile = Record<string, unknown>;

type FriendMatchPreview = {
  id: string | number;
  name: string;
  profileImage?: string;
  matchPercentage?: number;
  commonFavorites?: string[];
} & Record<string, unknown>;

type RecoItem = {
  id: string | number;
  isJoined?: boolean;
  matchPercentage: number;
} & Record<string, unknown>;

type PostWithId = { id: string | number } & Record<string, unknown>;

type ButtonStyles = {
  card: string;
  primary: {
    green: string;
    red: string;
  };
  tab: {
    active: string;
    inactive: string;
  };
};

type EventCardModel = {
  id: string | number;
  title: string;
  date: string;
  attendees: number;
  maxAttendees: number | null;
  description: string;
  category: string;
  location: string;
  type: string;
  image: string;
  organizer: string;
  tags: string[];
};

const EventCard: React.FC<{ event: EventCardModel }> = () => null;

const IndividualPostCard: React.FC<{ post: UnknownRecord; onNavigate: (page: string) => void }> = () => null;
const FriendshipMatchCard: React.FC<{ profile: UnknownRecord }> = () => null;
const CommunityPostCard: React.FC<{ post: UnknownRecord; onNavigate: (page: string) => void }> = () => null;
const FanclubPostCard: React.FC<{ post: UnknownRecord; onNavigate: (page: string) => void }> = () => null;
const CommunityRecommendationCard: React.FC<{ community: UnknownRecord }> = () => null;
const FanclubRecommendationCard: React.FC<{ fanclub: UnknownRecord }> = () => null;

const FriendsDashboard: React.FC<FriendsDashboardProps> = ({ userId, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isFriendsUniverse = useMemo(() => location.pathname.startsWith('/friends-dashboard'), [location.pathname]);
  const showBackArrow = useMemo(
    () => location.pathname !== '/friends-dashboard/social-overview',
    [location.pathname]
  );

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

  const demoNotifications: string[] = [];
  const friendRequestsData: FriendRequest[] = [];
  const individualPosts: UnknownRecord[] = [];
  const friendshipMatches: FriendMatchPreview[] = [];
  const communityPosts: PostWithId[] = [];
  const communityRecommendations: RecoItem[] = [];
  const fanclubPosts: PostWithId[] = [];
  const fanclubsData: RecoItem[] = [];
  const additionalPosts: UnknownRecord[] = [];
  const additionalCommunityPosts: UnknownRecord[] = [];
  const additionalFanclubPosts: UnknownRecord[] = [];
  const totalFriendshipMatches = 0;
  const communitiesData: RecoItem[] = [];
  const friendsNearby = 0;
  const socialScore = 0;
  const buttonStyles: ButtonStyles = {
    card: '',
    primary: {
      green: '',
      red: '',
    },
    tab: {
      active:
        'flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold transition-all duration-200 shadow-md',
      inactive:
        'flex-1 py-2.5 px-4 rounded-xl text-gray-600 font-semibold hover:bg-white/70 transition-all duration-200',
    },
  };
  const handleProfileLike = () => {
    return;
  };

  const handleProfileChat = () => {
    return;
  };

  const myProfileRealtime = useMyProfileRealtime(userId);
  const myMenuStats = useMyMenuStatsRealtime(userId);
  const localEventsRealtime = useLocalEventsRealtime(userId, 12);

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [friendshipMatchesSubTab, setFriendshipMatchesSubTab] = useState<'your-friends' | 'find-friends' | 'requests'>('your-friends');
  const [communitiesSubTab, setCommunitiesSubTab] = useState<'your-groups' | 'explore-new'>('your-groups');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showProfileDetailsModal, setShowProfileDetailsModal] = useState(false);
  const [selectedProfileForDetails, setSelectedProfileForDetails] = useState<ProfileDetailsProfile | null>(null);
  const [showCommunityProfileModal, setShowCommunityProfileModal] = useState(false);
  const [selectedCommunity] = useState<UnknownRecord | null>(null);
  const [showFanclubProfileModal, setShowFanclubProfileModal] = useState(false);
  const [selectedFanclub] = useState<FanclubProfile | null>(null);

  const refreshData = useCallback(() => {
    window.location.reload();
  }, []);

  useEffect(() => {
    if (location.pathname === '/friends-dashboard/friend-requests') {
      setActiveTab('matches');
      setFriendshipMatchesSubTab('requests');
    } else if (location.pathname === '/friends-dashboard/social-overview') {
      setActiveTab('overview');
    } else if (location.pathname === '/friends-dashboard/pulse') {
      setActiveTab('pulse');
    } else if (location.pathname === '/friends-dashboard/communities') {
      setActiveTab('communities');
    } else if (location.pathname === '/friends-dashboard/fanclubs') {
      setActiveTab('fanclubs');
    } else if (location.pathname === '/friends-dashboard/matches') {
      setActiveTab('matches');
    }
  }, [location.pathname]);

  const mainTabs = useMemo(
    () =>
      [
        { id: 'overview', label: 'Social Overview', icon: Home, route: '/friends-dashboard/social-overview' },
        { id: 'pulse', label: 'Pulse', icon: Activity, route: '/friends-dashboard/pulse' },
        { id: 'matches', label: 'Find Friends', icon: Users, route: '/friends-dashboard/friendship-matches' },
        { id: 'communities', label: 'Communities', icon: Users2, route: '/friends-dashboard/communities-fanclubs' },
        { id: 'events', label: 'Events', icon: Calendar, route: '/friends-dashboard/events' },
      ] satisfies NavTab[],
    []
  );

  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const goToTab = useCallback(
    (tab: NavTab) => {
      setActiveTab(tab.id);
      navigate(tab.route);
    },
    [navigate]
  );

  const friendRequestsContent = (
    <div className="p-2 sm:p-3 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
      <div className="text-center mb-3 sm:mb-4 md:mb-8">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1 sm:mb-2">
          Friend Requests
        </h1>
      </div>
      <div className="text-sm text-gray-600">No requests right now.</div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <ProgressiveOnboardingOverlay userId={userId} />
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cyan-100 shadow-sm">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Brand & Back Button */}
            <div className="flex items-center space-x-2 sm:space-x-3 flex-nowrap min-w-0">
              {showBackArrow && (
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-75 flex-shrink-0"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              <div className="flex items-center space-x-2 sm:space-x-3 flex-nowrap min-w-0">
                <button
                  type="button"
                  onClick={() => navigate('/friends-dashboard/social-overview')}
                  className="flex items-center space-x-2 sm:space-x-3 flex-nowrap min-w-0"
                  title="Friends Dashboard"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div className="leading-tight min-w-0">
                    <div className="text-sm sm:text-base font-bold text-gray-900 whitespace-nowrap">BrandBond</div>
                    <div className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">Friends Dashboard</div>
                  </div>
                </button>

                <div className="hidden sm:flex items-center bg-white/80 border border-cyan-200 rounded-full p-0.5 shadow-sm flex-nowrap">
                  <button
                    type="button"
                    onClick={() => switchUniverse('love')}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      !isFriendsUniverse
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
                      isFriendsUniverse
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow'
                        : 'text-gray-600 hover:text-blue-700'
                    }`}
                    title="Go to Friends"
                  >
                    Friends
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1"></div>

            {/* Right Section - Mobile Responsive Header Icons with Equal Spacing */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
              {/* Notifications Icon */}
              <button
                type="button"
                onClick={() => {
                  setShowNotificationsModal(true);
                  navigate('/friends-dashboard/notifications-modal');
                }}
                className="p-2 text-blue-600 hover:text-blue-700 active:text-blue-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {demoNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {demoNotifications.length > 9 ? '9+' : demoNotifications.length}
                  </span>
                )}
              </button>

              {/* Search Icon */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab('matches');
                  navigate('/friends-dashboard/friendship-matches');
                }}
                className="p-2 text-blue-600 hover:text-blue-700 active:text-blue-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
                title="Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Refresh Icon */}
              <button type="button" 
                onClick={refreshData}
                className="p-2 text-blue-600 hover:text-blue-700 active:text-blue-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              {/* User Profile Button */}
              <UserProfileButton
                userProfile={{
                  id: userId,
                  name: myProfileRealtime.profile?.full_name || 'User',
                  photos: myProfileRealtime.profile?.photo_urls || [],
                  email: myProfileRealtime.profile?.email || undefined
                }}
                stats={{
                  datesCount: myMenuStats.datesCount,
                  friendsCount: myMenuStats.friendsCount,
                }}
                onProfileClick={() => setActiveTab('profile-settings')}
                onSettingsClick={() => setActiveTab('profile-settings')}
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
                theme="friends"
              />
            </div>

          </div>

        </div>

      </header>

      {/* Demo Information Banner */}

      {/* Main Content */}

      <div className="w-full flex-1 min-h-0">
        <div className="flex h-full min-h-0">
          {/* Desktop left sidebar */}
          <div
            className={`hidden sm:block sticky top-0 self-start h-full overflow-y-auto border-r border-gray-200 bg-white/80 backdrop-blur-md transition-all duration-200 ${
              sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
            }`}
          >
            <div className="p-3">
              <button
                type="button"
                onClick={() => setSidebarCollapsed((v) => !v)}
                className="w-full inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 text-gray-700"
                aria-label={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
              >
                {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>

            <nav className="px-3 pb-4 space-y-1">
              {mainTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => goToTab(tab)}
                    className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors ${
                      active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    title={tab.label}
                  >
                    <div className="relative">
                      <Icon className={`w-5 h-5 ${active ? 'text-blue-700' : 'text-gray-600'}`} />
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
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white/90 backdrop-blur px-3 py-2 shadow"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-800" />
            </button>
          </div>

          {sidebarOpenMobile ? (
            <div className="sm:hidden fixed inset-0 z-50">
              <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpenMobile(false)} />
              <div className="absolute inset-y-0 left-0 w-[280px] bg-white shadow-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-extrabold text-gray-900">Menu</div>
                  <button
                    type="button"
                    onClick={() => setSidebarOpenMobile(false)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-4 space-y-1">
                  {mainTabs.map((tab) => {
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
                          active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${active ? 'text-blue-700' : 'text-gray-600'}`} />
                        <div className="text-sm font-semibold">{tab.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {/* Content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 md:py-6 pb-20 sm:pb-6">
            {/* Tab Content */}
            <div className="w-full">
              {activeTab === 'overview' && (
                <div className="min-h-screen bg-gray-50">
                  {/* Social Media Feed Header */}
                  <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
                    <div className="max-w-4xl mx-auto text-center">
                      <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                        Your Social Feed
                      </h1>
                      <p className="text-gray-600 text-[10px] sm:text-sm">Discover posts, matches, and communities</p>
                    </div>
                  </div>

                  {/* Social Media Feed Content */}
                  <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                      {/* Left Side - Mixed Social Media Feed */}
                      <div className="lg:col-span-2 space-y-4 sm:space-y-6 px-3 sm:px-6">
                        {/* Mixed Feed - All content types scattered throughout with proper card designs */}
                    
                    {/* 1. Individual Post - Instagram Style */}
                    {individualPosts[0] && <IndividualPostCard post={individualPosts[0]} onNavigate={onNavigate} />}
                    
                    {/* 2. Friendship Match Recommendation Card - Using Redesigned Component */}
                    {friendshipMatches[0] && <FriendshipMatchCard profile={friendshipMatches[0]} />}



                    {/* 3. Community Post - Instagram Style with Community Highlighting */}

                    {communityPosts[0] && <CommunityPostCard post={communityPosts[0]} onNavigate={onNavigate} />}



                    {/* 4. Individual Post */}

                    {individualPosts[1] && <IndividualPostCard post={individualPosts[1]} onNavigate={onNavigate} />}



                    {/* 5. Community Recommendation Card - Similar to Friendship Match but with Member Stats */}

                    {/* 5. Community Recommendation Card - Using Redesigned Component */}

                    {communityRecommendations[0] && <CommunityRecommendationCard community={communityRecommendations[0]} />}



                    {/* 6. Fanclub Post - Instagram Style with Fanclub Highlighting */}

                    {fanclubPosts[0] && <FanclubPostCard post={fanclubPosts[0]} onNavigate={onNavigate} />}



                    {/* 7. Individual Post */}

                    {individualPosts[2] && <IndividualPostCard post={individualPosts[2]} onNavigate={onNavigate} />}



                    {/* 8. Friendship Match Recommendation Card - Using Redesigned Component */}

                    {friendshipMatches[1] && <FriendshipMatchCard profile={friendshipMatches[1]} />}

                    {/* 9. Community Post */}

                    {communityPosts[1] && <CommunityPostCard post={communityPosts[1]} onNavigate={onNavigate} />}

                    {/* 10. Individual Post */}

                    {additionalPosts[0] && <IndividualPostCard post={additionalPosts[0]} onNavigate={onNavigate} />}



                    {/* 11. Fanclub Recommendation Card - Exciting & Vibrant Design */}

                    {fanclubsData[0] && <FanclubRecommendationCard fanclub={fanclubsData[0]} />}



                    {/* 12. Second Fanclub Recommendation Card */}

                    {fanclubsData[1] && <FanclubRecommendationCard fanclub={fanclubsData[1]} />}



                    {/* 13. Third Fanclub Recommendation Card */}

                    {fanclubsData[2] && <FanclubRecommendationCard fanclub={fanclubsData[2]} />}













                    {/* 12. Individual Post */}

                    {additionalPosts[1] && <IndividualPostCard post={additionalPosts[1]} onNavigate={onNavigate} />}



                    {/* 13. Fanclub Post */}

                    {fanclubPosts[1] && <FanclubPostCard post={fanclubPosts[1]} onNavigate={onNavigate} />}



                    {/* 14. Individual Post */}

                    {additionalPosts[2] && <IndividualPostCard post={additionalPosts[2]} onNavigate={onNavigate} />}



                    {/* 15. Community Post */}

                    {additionalCommunityPosts[0] && <CommunityPostCard post={additionalCommunityPosts[0]} onNavigate={onNavigate} />}



                    {/* 16. Friendship Match Recommendation Card - Using Redesigned Component */}

                    {friendshipMatches[2] && <FriendshipMatchCard profile={friendshipMatches[2]} />}



                    {/* 17. Individual Post */}

                    {additionalPosts[3] && <IndividualPostCard post={additionalPosts[3]} onNavigate={onNavigate} />}



                    {/* 18. Community Post */}

                    {additionalCommunityPosts[1] && <CommunityPostCard post={additionalCommunityPosts[1]} onNavigate={onNavigate} />}



                    {/* 19. Fanclub Post */}

                    {additionalFanclubPosts[0] && <FanclubPostCard post={additionalFanclubPosts[0]} onNavigate={onNavigate} />}

                  </div>



                  {/* Right Side - Interactive Stats & Features */}

                  <div className="space-y-6">

                    {/* Social Stats Cards - FULL WIDTH GRID */}

                    <div className="grid grid-cols-2 gap-3 mb-6">

                      {[
                        { label: 'Friendship Matches', value: totalFriendshipMatches, icon: Star, color: 'from-blue-500 via-cyan-500 to-teal-500' },
                        { label: 'Communities', value: communitiesData.length, icon: Building2, color: 'from-cyan-500 via-teal-500 to-blue-500' },
                        { label: 'Friends Nearby', value: friendsNearby, icon: Users, color: 'from-teal-500 via-blue-500 to-cyan-500' },
                        { label: 'Social Score', value: `${socialScore}%`, icon: Trophy, color: 'from-yellow-500 to-orange-500' },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 overflow-hidden border-blue-200 ring-2 ring-blue-300"
                        >
                          <div
                            className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                          >
                            <stat.icon className="w-6 h-6 text-white" />
                          </div>

                          <div className="text-xl font-bold text-gray-800 mb-1">{stat.value}</div>
                          <div className="text-xs text-gray-600">{stat.label}</div>
                        </div>
                      ))}
                    </div>



                    {/* Main Features - 2 COLUMNS WITH SPACING */}

                    <div className="space-y-4">

                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">

                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                          <Star className="w-6 h-6 text-blue-500" />
                          <span>Today's Friendship Matches</span>
                        </h3>

                        <p className="text-gray-600 text-sm mb-4">Discover people who share your interests and could become great friends</p>

                        <button
                          type="button"
                          onClick={() => setActiveTab('matches')}
                          className={buttonStyles.card}
                        >
                          View Matches
                        </button>
                      </div>



                      <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl p-6 border border-cyan-200 hover:shadow-xl transition-all duration-300">

                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center space-x-2">
                          <Building2 className="w-6 h-6 text-cyan-500" />
                          <span>Your Communities</span>
                        </h3>

                        <p className="text-gray-600 text-sm mb-4">Join communities that share your interests and passions</p>

                        <button
                          type="button"
                          onClick={() => setActiveTab('communities')}
                          className={buttonStyles.card}
                        >
                          Explore Communities
                        </button>
                      </div>

                      {/* Friend Requests Quick Access */}

                      {friendRequestsData.length > 0 && (

                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('matches');
                              setFriendshipMatchesSubTab('requests');
                            }}
                            className="w-full mt-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-sm sm:text-base font-medium hover:scale-105 flex items-center justify-center space-x-2"
                          >

                            <UserPlus className="w-5 h-5" />

                            <span>View Friend Requests ({friendRequestsData.length})</span>

                          </button>
                        </div>

                      )}



                    {/* Hot Matches Preview - CENTERED WITH SPACING */}

                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">

                      <h3 className="text-lg font-bold text-gray-800 mb-4 text-center flex items-center justify-center space-x-2">

                        <Star className="w-6 h-6 text-blue-500" />

                        <span>Your Top Friendship Matches This Week</span>

                      </h3>

                      <p className="text-center text-sm text-gray-600 mb-4">

                        These profiles share your top interests!

                      </p>

                      <div className="grid grid-cols-1 gap-4 mb-4">

                        {friendshipMatches.slice(0, 2).map((profile) => (

                          <div
                            key={String(profile.id)}
                            className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105 h-32"
                            onClick={() => {
                              setSelectedProfileForDetails(profile as unknown as ProfileDetailsProfile);
                              setShowProfileDetailsModal(true);
                            }}
                          >

                            {/* Background Profile Image - Blurred */}

                            <div className="absolute inset-0 z-0">

                              <img 

                                src={typeof profile.profileImage === 'string' ? profile.profileImage : undefined} 

                                alt={`${String(profile.name)}'s profile`}

                                className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-300"

                                onError={(e) => {

                                  const target = e.currentTarget as HTMLImageElement;

                                  target.style.display = 'none';

                                }}

                              />

                              {/* Fallback gradient background */}

                              <div className="w-full h-full bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 opacity-60"></div>

                            </div>

                            

                            {/* Content Overlay */}

                            <div className="relative z-10 h-full flex flex-col justify-between p-4">

                              {/* Top Section - Profile Info */}

                              <div className="text-center">

                                <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-blue-600 font-bold text-lg mx-auto mb-2 group-hover:scale-110 transition-transform border-2 border-white/50">

                                  {String(profile.name).charAt(0)}

                                </div>

                                <h4 className="font-bold text-gray-800 text-sm mb-1 drop-shadow-sm">

                                  {String(profile.name)}

                                </h4>

                                <div className="inline-flex items-center space-x-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full border border-blue-200 mb-2 shadow-sm">

                                  <Star className="w-3 h-3 text-yellow-500" />

                                  <span className="text-blue-700 font-semibold text-xs">{String(profile.matchPercentage ?? '')}%</span>

                                </div>

                              </div>

                              

                              {/* Bottom Section - All Time Favorite */}

                              <div className="text-center">

                                <div className="text-xs text-blue-700 font-medium mb-1 opacity-90">

                                  Shares your top interests:

                                </div>

                                <span className="inline-block bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white px-3 py-1 rounded-full font-semibold text-xs shadow-lg border border-white/20">
                                  {String(profile.commonFavorites?.[0] ?? '')}
                                </span>

                              </div>

                            </div>

                          </div>

                        ))}

                      </div>

                      <div className="text-center">
                        <button type="button" onClick={() => setActiveTab('matches')} className={buttonStyles.card}>
                          Explore All Matches
                        </button>
                      </div>

                    </div>

                  </div>
                </div>

              </div>
            </div>
          </div>

              )}

          {activeTab === 'matches' && (

            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">

              {/* Header Section */}

              <div className="text-center mb-4 sm:mb-8">

                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1 sm:mb-2">

                  Friendship Matches

                </h1>

                <p className="text-gray-600 text-sm sm:text-base md:text-lg">Connect with people who share your interests</p>

              </div>

              

              {/* Main Content Tabs */}

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-blue-200">

                <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 p-1">

                  <button type="button" 

                                      onClick={() => {
                    setFriendshipMatchesSubTab('your-friends');
                  }}

                    className={`${friendshipMatchesSubTab === 'your-friends' ? buttonStyles.tab.active : buttonStyles.tab.inactive}`}

                  >

                    <Users className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />

                    <span className="text-xs sm:text-sm">Your Friends</span>

                  </button>

                  <button type="button" 

                                      onClick={() => {
                    setFriendshipMatchesSubTab('find-friends');
                  }}

                    className={`${friendshipMatchesSubTab === 'find-friends' ? buttonStyles.tab.active : buttonStyles.tab.inactive}`}

                  >

                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />

                    <span className="text-xs sm:text-sm">Find Friends</span>

                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFriendshipMatchesSubTab('requests');
                    }}
                    className={`${friendshipMatchesSubTab === 'requests' ? buttonStyles.tab.active : buttonStyles.tab.inactive}`}
                  >
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Requests</span>
                  </button>

                      </div>

                    </div>



              {/* Content Area - Populated based on selected sub-tab */}

              {friendshipMatchesSubTab === 'requests' ? (
                friendRequestsContent
              ) : friendshipMatchesSubTab === 'your-friends' ? (

                <div className="space-y-4 sm:space-y-6">

                  {/* Your Friends Section */}

                  <div className="text-center">

                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">

                      Your Current Friends

                    </h2>

                    <p className="text-gray-600 text-sm sm:text-base">People you're already connected with</p>

                    </div>

                    

                  {/* Friends Posts Grid */}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">

                    {individualPosts.slice(0, 3).map((post, index) => (

                      <IndividualPostCard key={String((post as { id?: unknown })?.id ?? index)} post={post} onNavigate={onNavigate} />

                    ))}

                    </div>

                    

                  {/* Empty State for Your Friends */}

                  {individualPosts.length === 0 && (

                    <div className="text-center py-8 sm:py-12">

                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">

                        <Users className="w-8 h-8 sm:w-10 sm:h-10 text-green-400" />

                      </div>

                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No friends connected yet</h3>

                      <p className="text-gray-600 text-sm sm:text-base mb-4">Start connecting with people to build your friendship network</p>

                    </div>

                  )}

                </div>

              ) : (

                <div className="space-y-4 sm:space-y-6">

                  {/* Find Friends Section */}

                  <div className="text-center">

                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">

                      Discover New Friends

                    </h2>

                    <p className="text-gray-600 text-sm sm:text-base">People who could become your great friends</p>

                  </div>

                  

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">

                    {friendshipMatches.map((profile) => (

                      <FriendshipMatchCard key={profile.id} profile={profile} />

                    ))}

                  </div>

                </div>

              )}

            </div>

          )}

          {activeTab === 'pulse' && (

            <div className="-mx-2 sm:mx-0">

              <FriendsPulsePage />

            </div>

          )}


          {activeTab === 'communities' && (

            <div className="p-3 sm:p-6 space-y-6 sm:space-y-8">

              {/* Header Section */}

              <div className="text-center mb-6 sm:mb-8">

                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2 sm:mb-3">

                  Communities & Fanclubs

                </h1>

                <p className="text-gray-600 text-sm sm:text-base md:text-lg">Connect with people who share your interests and passions</p>

              </div>

              





              {/* Main Content Tabs */}

              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-blue-200">

                <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-1 p-1">

                  <button type="button" 

                                      onClick={() => {
                    setCommunitiesSubTab('your-groups');
                  }}

                    className={`${communitiesSubTab === 'your-groups' ? buttonStyles.tab.active : buttonStyles.tab.inactive}`}

                  >

                    <Users className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />

                    <span className="text-xs sm:text-sm">Your Communities & Fanclubs</span>

                  </button>

                  <button type="button" 

                                      onClick={() => {
                    setCommunitiesSubTab('explore-new');
                  }}

                    className={`${communitiesSubTab === 'explore-new' ? buttonStyles.tab.active : buttonStyles.tab.inactive}`}

                  >

                    <Compass className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />

                    <span className="text-xs sm:text-sm">Explore New Ones</span>

                  </button>

                      </div>

                    </div>



              {/* Content Area - Populated based on selected sub-tab */}

              {communitiesSubTab === 'your-groups' ? (

                <div className="space-y-6 sm:space-y-8">

                  {/* Your Communities Section */}

                  <div className="space-y-3 sm:space-y-4 md:space-y-6">

                    <div className="text-center">

                      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-1.5 sm:mb-2 md:mb-3 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">

                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-500" />

                        <span>Your Communities</span>

                      </h2>

                      <p className="text-gray-600 text-xs sm:text-sm md:text-base px-2 sm:px-0">Groups you've already joined and are actively part of</p>

                      </div>

                    

                    {/* Community Posts Grid */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">

                      {communityPosts.slice(0, 3).map((post) => (

                        <CommunityPostCard key={String(post.id)} post={post} onNavigate={onNavigate} />

                      ))}

                    </div>



                    {/* Empty State for Communities */}

                    {communityPosts.length === 0 && (

                      <div className="text-center py-8 sm:py-12">

                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">

                          <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />

                        </div>

                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No communities joined yet</h3>

                        <p className="text-gray-600 text-sm sm:text-base mb-4">Join communities to connect with people who share your interests</p>

                      </div>

                    )}

                  </div>



                  {/* Your Fanclubs Section */}

                  <div className="space-y-3 sm:space-y-4 md:space-y-6 pt-4 sm:pt-6 md:pt-8 border-t border-gray-200">

                    <div className="text-center">

                      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-1.5 sm:mb-2 md:mb-3 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">

                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-500" />

                        <span>Your Fanclubs</span>

                      </h2>

                      <p className="text-gray-600 text-xs sm:text-sm md:text-base px-2 sm:px-0">Fanclubs you've already joined and are passionate about</p>

                    </div>

                    

                    {/* Fanclub Posts Grid */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">

                      {fanclubPosts.slice(0, 3).map((post) => (

                        <FanclubPostCard key={post.id} post={post} onNavigate={onNavigate} />

                      ))}

                    </div>



                    {/* Empty State for Fanclubs */}

                    {fanclubPosts.length === 0 && (

                      <div className="text-center py-8 sm:py-12">

                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">

                          <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />

                        </div>

                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No fanclubs joined yet</h3>

                        <p className="text-gray-600 text-sm sm:text-base mb-4">Join fanclubs to connect with people who share your passions</p>

                      </div>

                    )}

                  </div>

                </div>

              ) : (

                <div className="space-y-6 sm:space-y-8">

                  {/* Explore New Communities Section */}

                  <div className="space-y-3 sm:space-y-4 md:space-y-6">

                    <div className="text-center">

                      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-1.5 sm:mb-2 md:mb-3 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">

                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-500" />

                        <span>Communities to Join</span>

                      </h2>

                      <p className="text-gray-600 text-xs sm:text-sm md:text-base px-2 sm:px-0">Discover new communities based on your interests</p>

                    </div>

                    

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">

                      {communitiesData

                        .filter((community) => !community.isJoined && community.matchPercentage >= 70)

                        .slice(0, 6)

                        .map((community) => (

                          <CommunityRecommendationCard key={String(community.id)} community={community} />

                        ))}

                    </div>

                  </div>



                  {/* Explore New Fanclubs Section */}

                  <div className="space-y-3 sm:space-y-4 md:space-y-6 pt-4 sm:pt-6 md:pt-8 border-t border-gray-200">

                    <div className="text-center">

                      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-1.5 sm:mb-2 md:mb-3 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">

                        <Crown className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-500" />

                        <span>Fanclubs to Join</span>

                      </h2>

                      <p className="text-gray-600 text-xs sm:text-sm md:text-base px-2 sm:px-0">Discover new fanclubs based on your passions</p>

                    </div>

                    

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">

                      {fanclubsData

                        .filter((fanclub) => !fanclub.isJoined && fanclub.matchPercentage >= 70)

                        .slice(0, 6)

                        .map((fanclub) => (

                          <FanclubRecommendationCard key={String(fanclub.id)} fanclub={fanclub} />

                        ))}

                    </div>

                  </div>



                  {/* Community & Fanclub Recommendations */}

                  <div className="space-y-3 sm:space-y-4 md:space-y-6 pt-4 sm:pt-6 md:pt-8 border-t border-gray-200">

                    <div className="text-center">

                      <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-1.5 sm:mb-2 md:mb-3 flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2">

                        <Star className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-500" />

                        <span>Recommended for You</span>

                      </h2>

                      <p className="text-gray-600 text-xs sm:text-sm md:text-base px-2 sm:px-0">Based on your interests and preferences</p>

                    </div>

                    

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">

                      {communityRecommendations

                        .filter((community) => community.matchPercentage >= 70)

                        .slice(0, 6)

                        .map((community) => (

                          <CommunityRecommendationCard key={String(community.id)} community={community} />

                        ))}

                    </div>

                  </div>

                </div>

              )}

            </div>

          )}



          {activeTab === 'events' && (

            <div className="p-2 sm:p-3 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">

              <div className="text-center mb-3 sm:mb-4 md:mb-8">

                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-1 sm:mb-2 md:mb-3">

                  Community Events

                </h1>

                <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg px-2 sm:px-0">Join exciting events and meet new friends</p>

              </div>

              {/* Events Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {(localEventsRealtime.loading ? [] : localEventsRealtime.events).map((event: unknown) => (
                  <EventCard
                    key={String((event as { id?: unknown })?.id)}
                    event={{
                      id: (event as { id: string | number }).id,
                      title: (event as { title: string }).title,
                      date: (event as { start_time?: string | null }).start_time ? new Date((event as { start_time: string }).start_time).toLocaleString() : 'TBD',
                      attendees: (event as { currentAttendees?: number | null }).currentAttendees ?? 0,
                      maxAttendees: (event as { max_attendees?: number | null }).max_attendees ?? null,
                      description: (event as { description?: string | null }).description ?? '',
                      category: (event as { event_type?: string | null }).event_type || 'Community',
                      location: (event as { location?: string | null }).location ?? '',
                      type: 'offline',
                      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
                      organizer: 'BrandBond',
                      tags: [],
                    }}
                  />
                ))}
              </div>

              {!localEventsRealtime.loading && localEventsRealtime.events.length === 0 && (
                <div className="text-center text-gray-600">
                  No upcoming events found for your location.
                </div>
              )}
            </div>

          )}

        </div>
      </div>




      {/* Notifications Modal */}

      {showNotificationsModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center">

          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowNotificationsModal(false)}></div>

          <div className="relative bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-sm sm:max-w-md w-full mx-3 sm:mx-4 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-3 sm:mb-4">

              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Notifications</h3>

              <button type="button" 

                onClick={() => setShowNotificationsModal(false)}

                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"

              >

                <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />

              </button>

            </div>

            {demoNotifications.length > 0 ? (

              <div className="space-y-2 sm:space-y-3">

                {demoNotifications.map((notification, index) => (

                  <div key={index} className="p-2.5 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">

                    <p className="text-gray-800 text-xs sm:text-sm">{notification}</p>

                  </div>

                ))}

              </div>

            ) : (

              <div className="text-center py-6 sm:py-8">

                <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2 sm:mb-3" />

                <p className="text-gray-600 text-sm sm:text-base">No new notifications</p>

              </div>

            )}

          </div>

        </div>

      )}


      {/* Mobile Bottom Navigation Bar - Only Visible on Mobile */}

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">

        <div className="flex items-center justify-between px-2 py-2.5">

          {([

            { id: 'overview', label: 'Home', icon: Users },

            { id: 'pulse', label: 'Pulse', icon: Activity },

            { id: 'matches', label: 'Match', icon: Star },

            { id: 'requests', label: 'Req', icon: UserPlus, badge: friendRequestsData.length },

            { id: 'communities', label: 'Groups', icon: Home },

            { id: 'events', label: 'Events', icon: Calendar }

          ] satisfies Array<{ id: ActiveTab; label: string; icon: LucideIcon; badge?: number }>).map((tab) => {

            const Icon = tab.icon;

            return (

              <button

                key={tab.id}

                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'overview') navigate('/friends-dashboard/social-overview');
                  if (tab.id === 'pulse') navigate('/friends-dashboard/pulse');
                  if (tab.id === 'matches') navigate('/friends-dashboard/friendship-matches');
                  if (tab.id === 'communities') navigate('/friends-dashboard/communities-fanclubs');
                  if (tab.id === 'events') navigate('/friends-dashboard/events');
                  if (tab.id === 'requests') navigate('/friends-dashboard/friend-requests');
                }}

                className={`flex flex-col items-center justify-center space-y-1 py-1 px-1 rounded-lg transition-all duration-200 flex-1 min-w-0 ${

                  activeTab === tab.id

                    ? 'text-blue-600 bg-blue-50'

                    : 'text-gray-600 hover:text-blue-600'

                }`}

              >

                <div className="relative">

                  <Icon className={`w-4 h-4 ${

                    activeTab === tab.id ? 'text-blue-600' : 'text-gray-600'

                  }`} />

                  {tab.badge && tab.badge > 0 && (

                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center">

                      {tab.badge > 9 ? '9+' : tab.badge}

                    </span>

                  )}

                </div>

                <span className={`text-[8px] font-medium truncate ${

                  activeTab === tab.id ? 'text-blue-600' : 'text-gray-600'

                }`}>

                  {tab.label}

                </span>

              </button>

            );

          })}

        </div>

      </div>



      {/* Demo Notifications */}

      {demoNotifications.length > 0 && (

        <div className="fixed bottom-20 sm:bottom-4 right-4 space-y-2 z-50">

          {demoNotifications.map((notification, index) => (

            <div

              key={index}

              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full shadow-lg border border-blue-200 animate-bounce-in"

            >

              {notification}

            </div>

          ))}

        </div>

      )}



      {/* Profile Details Modal */}

      {showProfileDetailsModal && selectedProfileForDetails && (

        <ProfileDetailsModal

          profile={selectedProfileForDetails}

          isOpen={showProfileDetailsModal}

          onClose={() => setShowProfileDetailsModal(false)}

          onLike={handleProfileLike}

          onChat={handleProfileChat}

        />

      )}



      {/* Community Profile Modal */}

      {showCommunityProfileModal && selectedCommunity && (

        <CommunityProfileModal

          isOpen={showCommunityProfileModal}

          onClose={() => setShowCommunityProfileModal(false)}

          community={selectedCommunity}

          userProfile={{

            interests: ['Technology', 'Programming', 'Innovation', 'Startups'],

            personality: ['Analytical', 'Creative', 'Ambitious'],

            location: 'San Francisco',

            activityLevel: 'Very Active'

          }}

          onNavigate={onNavigate}

        />

      )}



      {/* Fanclub Profile Modal */}

      {showFanclubProfileModal && selectedFanclub && (

        <FanclubProfileModal

          isOpen={showFanclubProfileModal}

          onClose={() => setShowFanclubProfileModal(false)}

          fanclub={selectedFanclub as never}

          userProfile={{

            interests: ['Technology', 'Programming', 'Innovation', 'Startups'],

            personality: ['Analytical', 'Creative', 'Ambitious'],

            location: 'San Francisco',

            activityLevel: 'Very Active'

          }}

          onNavigate={onNavigate}

        />

      )}

      </div>

    </div>

    </div>

  );

};



export default FriendsDashboard;



