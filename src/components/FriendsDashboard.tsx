import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Heart, Users, MessageCircle, Search, Settings, Home, Compass, Calendar, Star, Music, Film, Book, MapPin, Utensils, ShoppingBag, Gamepad2, Youtube, Trophy, Plane, Camera, Coffee, Headphones, Tv, Car, Dumbbell, Palette, Code, Briefcase, GraduationCap, Baby, PawPrint, Leaf, Zap, Globe, Smartphone, Watch, Shirt, Gift, Sparkles, Target, TrendingUp, Filter, Plus, X, Send, Phone, Video, MoreHorizontal, ThumbsUp, Share2, Bookmark, Bell, User, ChevronRight, ChevronDown, Play, Pause, Volume2, SkipForward, Repeat, Shuffle, Download, ExternalLink, Check, Clock, MapPin as Location, Calendar as CalendarIcon, Users as UsersIcon, ActivitySquare, ArrowLeft, ChevronLeft, DollarSign, ArrowRight, Building2, Users2, Hash, MessageSquare, Award, Globe2, Shield, Crown, Lightbulb, HeartHandshake, Handshake, UserPlus, UserCheck, UserX, UserMinus, UserCog, RefreshCw } from 'lucide-react';

import DashboardService, { DashboardStats, DailyMatch, CommunityPreview, RecentActivity, UserInsight, LocalEvent } from '../services/dashboardService';

import ProfileDetailsModal from './ProfileDetailsModal';

import CommunityProfileModal from './CommunityProfileModal';

import FanclubProfileModal from './FanclubProfileModal';

import ChatSystem from './ChatSystem';

import messagingService, { ConversationWithProfile, Message } from '../services/messagingService';

import { generatePoeticDescription, defaultFavoriteCategories } from '../utils/poeticBioGenerator';
import { useMyProfileRealtime } from '../hooks/useMyProfileRealtime';
import { useMyMenuStatsRealtime } from '../hooks/useMyMenuStatsRealtime';
import { useLocalEventsRealtime } from '../hooks/useLocalEventsRealtime';
import { useUserInsightsRealtime } from '../hooks/useUserInsightsRealtime';
import UserProfileButton from './UserProfileButton';
import { supabase } from '../lib/supabase';
import ProgressiveOnboardingOverlay from './ProgressiveOnboardingOverlay';

interface FriendsDashboardProps {
  userId: string;
  onNavigate: (page: string) => void;
}

const FriendsDashboard: React.FC<FriendsDashboardProps> = ({ userId, onNavigate }) => {
  const navigate = useNavigate();
  useLocation();

  const myProfileRealtime = useMyProfileRealtime(userId);
  const myMenuStats = useMyMenuStatsRealtime(userId);
  const localEventsRealtime = useLocalEventsRealtime(userId, 12);
  const userInsightsRealtime = useUserInsightsRealtime(userId);

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const refreshData = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <ProgressiveOnboardingOverlay userId={userId} />

      {/* Header */}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cyan-100 shadow-sm">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Left Section - Brand & Back Button */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4">
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className="p-1 sm:p-1.5 md:p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-75 flex-shrink-0"
                title="Back"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>

              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
                <span className="text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  BrandBond
                </span>
              </div>
            </div>

            {/* Center Section - Spacer */}
            <div className="flex-1"></div>

            {/* Right Section - Mobile Responsive Header Icons with Equal Spacing */}
            <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-5 xl:space-x-6">
              {/* Notifications Icon */}
              <button
                type="button"
                onClick={() => {
                  setShowNotificationsModal(true);
                  navigate('/friends-dashboard/notifications-modal');
                }}
                className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-700 active:text-blue-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation relative"
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
                className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-700 active:text-blue-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
                title="Search"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Refresh Icon */}
              <button 
                onClick={refreshData}
                className="p-1.5 sm:p-2 text-blue-600 hover:text-blue-700 active:text-blue-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
                title="Refresh Data"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              {/* Switch Icon - Pink/Indigo Colors for Love Dashboard */}
              <button 
                onClick={() => onNavigate('love-dashboard')}
                className="p-1.5 sm:p-2 text-pink-600 hover:text-pink-700 active:text-pink-800 hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
                title="Switch to Love Dashboard"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
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

      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 md:py-6 pb-20 sm:pb-6">

        {/* Tab Navigation - Hidden on Mobile */}
        <div className="hidden sm:block bg-white/60 backdrop-blur-sm rounded-full p-1 sm:p-1.5 md:p-2 shadow-lg border border-blue-200 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          {/* Desktop: Main Navigation Tabs */}
          <div className="flex space-x-0.5">
          {[
            { id: 'overview', label: 'Social Overview', icon: Users },
            { id: 'matches', label: 'Friendship Matches', icon: Star },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'requests', label: 'Friend Requests', icon: UserPlus, badge: friendRequestsData.length },
            { id: 'communities', label: 'Communities/Fanclubs', icon: Home },
            { id: 'events', label: 'Events', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === 'overview') {
                    navigate('/friends-dashboard/social-overview');
                  } else if (tab.id === 'matches') {
                    navigate('/friends-dashboard/friendship-matches');
                  } else if (tab.id === 'messages') {
                    navigate('/friends-dashboard/messages');
                  } else if (tab.id === 'requests') {
                    navigate('/friends-dashboard/friend-requests');
                  } else if (tab.id === 'communities') {
                    navigate('/friends-dashboard/communities-fanclubs');
                  } else if (tab.id === 'events') {
                    navigate('/friends-dashboard/events');
                  }
                }}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 rounded-full font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/80'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm md:text-base">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full">
          {activeTab === 'overview' && (
            <div className="min-h-screen bg-gray-50">
              {/* Social Media Feed Header */}
              <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
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

                        { label: 'Social Score', value: `${socialScore}%`, icon: Trophy, color: 'from-yellow-500 to-orange-500' }

                ].map((stat, index) => (

                  <div

                    key={stat.label}

                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 hover:scale-105 group"

                  >

                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>

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

                    onClick={() => setActiveTab('communities')}

                    className={buttonStyles.card}

                  >

                    Explore Communities

                  </button>

                    

                    {/* Friend Requests Quick Access */}

                    {friendRequestsData.length > 0 && (

                      <button 

                        onClick={() => setActiveTab('requests')}

                        className="w-full mt-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-sm sm:text-base font-medium hover:scale-105 flex items-center justify-center space-x-2"

                      >

                        <UserPlus className="w-5 h-5" />

                        <span>View Friend Requests ({friendRequestsData.length})</span>

                      </button>

                    )}

                      </div>

                    </div>



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

                          <div key={profile.id} className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group hover:scale-105 h-32">

                            {/* Background Profile Image - Blurred */}

                            <div className="absolute inset-0 z-0">

                              <img 

                                src={profile.profileImage} 

                                alt={`${profile.name}'s profile`}

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

                                  {profile.name.charAt(0)}

                                </div>

                                <h4 className="font-bold text-gray-800 text-sm mb-1 drop-shadow-sm">

                                  {profile.name}

                                </h4>

                                <div className="inline-flex items-center space-x-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full border border-blue-200 mb-2 shadow-sm">

                                  <Star className="w-3 h-3 text-yellow-500" />

                                  <span className="text-blue-700 font-semibold text-xs">{profile.matchPercentage}%</span>

                                </div>

                              </div>

                              

                              {/* Bottom Section - All Time Favorite */}

                              <div className="text-center">

                                <div className="text-xs text-blue-700 font-medium mb-1 opacity-90">

                                  Shares your top interests:

                                </div>

                                <span className="inline-block bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white px-3 py-1 rounded-full font-semibold text-xs shadow-lg border border-white/20">

                            {profile.commonFavorites[0]}

                                </span>

                              </div>

                            </div>

                          </div>

                        ))}

                      </div>

                      <div className="text-center">

                        <button 

                          onClick={() => setActiveTab('matches')}

                          className={buttonStyles.card}

                        >

                          Explore All Matches

                        </button>

                      </div>

                    </div>



                    {/* It's a Connection Section - Mutual Connections */}

                    {mutualConnections.length > 0 && (

                      <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl p-6 border border-cyan-200">

                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex flex-col items-center justify-center space-y-2">

                          <div className="flex items-center space-x-2">

                            <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full flex items-center justify-center">

                              <Users className="w-4 h-4 text-white" />

                            </div>

                            <span>It's a Connection!</span>

                          </div>

                          <span className="px-3 py-1 bg-gradient-to-r from-cyan-400 to-teal-400 text-white text-xs rounded-full font-medium">

                            {mutualConnections.length} Mutual Connection{mutualConnections.length > 1 ? 's' : ''}

                          </span>

                        </h3>

                        

                        <div className="space-y-3">

                          {mutualConnections.slice(0, 3).map((match) => (

                            <div key={match.id} className="bg-white/80 rounded-xl p-3 border border-cyan-200 hover:shadow-lg transition-all duration-200 hover:scale-105">

                              <div className="flex items-center space-x-3">

                                <img

                                  src={match.profileImage}

                                  alt={match.name}

                                  className="w-10 h-10 rounded-full border-2 border-cyan-200"

                                  onError={(e) => {

                                    const target = e.target as HTMLImageElement;

                                    target.src = fallbackImages[0];

                                  }}

                                />

                                <div className="flex-1 min-w-0">

                                  <h4 className="font-semibold text-gray-800 text-sm truncate">

                                    {match.name}

                                  </h4>

                                  <p className="text-xs text-cyan-600 font-medium">

                                    {match.mutualFriends} Mutual Friends

                                  </p>

                                </div>

                              </div>

                              

                              {/* Mutual Connections Profile Circles - Overlapping */}

                              {match.mutualFriendsList && match.mutualFriendsList.length > 0 && (

                                <div className="mt-3">

                                  <div className="text-xs text-gray-500 mb-2">Mutual friends:</div>

                                  <div className="flex items-center">

                                    {match.mutualFriendsList.slice(0, 6).map((friend: any, index: number) => (

                                      <div key={friend.id} className="relative group" style={{ marginLeft: index === 0 ? '0' : '-8px' }}>

                                        <img

                                          src={friend.image || friend.profileImage}

                                          alt={friend.name}

                                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform duration-200"

                                          onError={(e) => {

                                            const target = e.target as HTMLImageElement;

                                            target.src = fallbackImages[0];

                                          }}

                                        />

                                        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">

                                          {friend.name}

                                        </div>

                                      </div>

                                    ))}

                                  </div>

                                </div>

                              )}

                              

                              <div className="space-y-2 mb-3 mt-2">

                                <div className="flex items-center space-x-2 text-xs text-gray-600">

                                  <MessageCircle className="w-3 h-3 text-gray-600" />

                                  <span>Both messaged each other</span>

                                </div>

                                <div className="flex items-center space-x-2 text-xs text-gray-600">

                                  <Users className="w-3 h-3 text-gray-600" />

                                  <span>Mutual interest confirmed</span>

                                </div>

                              </div>

                              

                              <div className="flex space-x-2">

                                <button

                                  onClick={() => {

                                    setSelectedProfile(match);

                                    setShowProfileModal(true);
                                    navigate(`/friends-dashboard/profile-modal/${match.id}`);

                                  }}

                                  className="flex-1 px-3 py-1.5 bg-gradient-to-r from-cyan-400 to-teal-400 text-white text-xs rounded-full font-medium hover:shadow-lg transition-all duration-200"

                                >

                                  View Profile

                                </button>

                                <button

                                  onClick={() => {

                                    setActiveChat(match);

                                    setActiveTab('messages');

                                  }}

                                  className="flex-1 px-3 py-1.5 bg-gradient-to-r from-blue-400 to-cyan-400 text-white text-xs rounded-full font-medium hover:shadow-lg transition-all duration-200"

                                >

                                  Chat

                                </button>

                              </div>

                            </div>

                          ))}

                        </div>

                        

                        {mutualConnections.length > 3 && (

                          <div className="text-center mt-4">

                            <button className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-teal-400 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 text-sm">

                              View All {mutualConnections.length} Connections

                            </button>

                          </div>

                        )}

                      </div>

                    )}



                    {/* Daily Social Challenge and It's a Connection - STACKED */}

                    <div className="space-y-4">

                      {/* Daily Social Challenge Card */}

                      <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl p-6 border border-cyan-200">

                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-center space-x-2">

                          <Trophy className="w-6 h-6 text-cyan-500" />

                          <span>Today's Social Challenge</span>

                        </h3>

                        {dailyChallenge.isCompleted && (

                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium mb-4 inline-block">

                              Completed

                          </span>

                        )}

                        

                        <div className="bg-white/80 rounded-xl p-4 mb-4">

                          <p className="text-gray-700 text-sm mb-3 text-center leading-relaxed">

                            🤝 <strong>Challenge:</strong> {dailyChallenge.title}

                          </p>

                          

                          {/* Progress Display */}

                          <div className="flex flex-col items-center justify-center space-y-2 mb-3">

                            <span className="text-gray-600 text-sm text-center">

                              Progress: {dailyChallenge.completed}/{dailyChallenge.target} completed

                            </span>

                            <div className="w-32 bg-gray-200 rounded-full h-2">

                              <div 

                                className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 h-2 rounded-full transition-all duration-500"

                                style={{ width: `${(dailyChallenge.completed / dailyChallenge.target) * 100}%` }}

                              ></div>

                            </div>

                          </div>



                          {/* Reward Display */}

                          <div className="text-center">

                            <span className="text-sm text-cyan-600 font-medium">

                              Reward: {dailyChallenge.reward}

                            </span>

                          </div>



                          {/* Progress Details */}

                          {dailyChallenge.progress.length > 0 && (

                            <div className="mt-3 p-2 bg-cyan-50 rounded-lg">

                              <p className="text-xs text-cyan-700 font-medium mb-2 text-center">Recent Progress:</p>

                              <div className="space-y-1">

                                {dailyChallenge.progress.slice(-2).map((progress, index) => (

                                  <div key={index} className="text-xs text-cyan-600 flex items-center space-x-2 justify-center">

                                  <MessageCircle className="w-3 h-3 text-cyan-600" />

                                    <span>Message sent to <strong>{progress.profileName}</strong></span>

                                  </div>

                                ))}

                              </div>

                            </div>

                          )}

                        </div>

                        

                        <div className="text-center">

                          <button 

                            onClick={handleTakeChallenge}

                            disabled={dailyChallenge.isCompleted}

                            className={`w-full px-6 py-3 rounded-full font-medium transition-all duration-200 ${

                              dailyChallenge.isCompleted

                                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'

                                : 'bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white hover:scale-105'

                            }`}

                          >

                            {dailyChallenge.isCompleted ? 'Challenge Completed!' : 'Take Challenge'}

                          </button>

                        </div>

                      </div>



                      {/* It's a Connection Hint Card */}

                      <div className="bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-100 rounded-2xl p-6 border border-teal-200">

                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-center space-x-2">

                          <Sparkles className="w-6 h-6 text-teal-500" />

                          <span>It's a Connection Magic</span>

                        </h3>

                        

                        <div className="bg-white/80 rounded-xl p-4 mb-4">

                          <p className="text-gray-700 text-sm mb-3 text-center leading-relaxed">

                            🤝 <strong>Discover:</strong> When both of you show mutual interest, magic happens!

                          </p>

                          

                          {/* Connection Status Display */}

                          <div className="flex flex-col items-center justify-center space-y-2 mb-3">

                            <span className="text-gray-600 text-sm text-center">

                              Current Connections: {mutualConnections.length}

                            </span>

                            <div className="w-32 bg-teal-200 rounded-full h-2">

                              <div 

                                className="bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 h-2 rounded-full transition-all duration-500"

                                style={{ width: `${Math.min((mutualConnections.length / 10) * 100, 100)}%` }}

                              ></div>

                            </div>

                          </div>



                          {/* Connection Description */}

                          <div className="text-center">

                            <span className="text-sm text-teal-600 font-medium">

                              {mutualConnections.length > 0 ? 'You have beautiful connections!' : 'Start building connections!'}

                            </span>

                          </div>



                          {/* Recent Connections Display */}

                          {mutualConnections.length > 0 && (

                            <div className="mt-3 p-2 bg-teal-50 rounded-lg">

                              <p className="text-xs text-teal-700 font-medium mb-2 text-center">Recent Connections:</p>

                              <div className="space-y-1">

                                {mutualConnections.slice(-2).map((match, index) => (

                                  <div key={index} className="text-xs text-teal-600 flex items-center space-x-2 justify-center">

                                    <Users className="w-3 h-3 text-teal-600" />

                                    <span>Connected with <strong>{match.name}</strong></span>

                                  </div>

                                ))}

                              </div>

                            </div>

                          )}

                        </div>

                        

                        <div className="text-center">

                          <button 

                            onClick={() => setActiveTab('matches')}

                            className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 text-sm sm:text-base hover:scale-105"

                          >

                            {mutualConnections.length > 0 ? 'View All Connections' : 'Discover Connections'}

                          </button>

                        </div>

                      </div>

                    </div>



                    {/* Bottom Row - 3 COLUMNS WITH EQUAL SPACING */}

                    <div className="grid grid-cols-1 gap-4">

                      {/* Social Insights */}

                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200 hover:shadow-lg transition-all duration-200">

                        <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center space-x-2">

                          <Target className="w-5 h-5 text-blue-500" />

                          <span>Insights</span>

                        </h3>

                        <div className="space-y-3">

                          <div className="bg-white/80 rounded-xl p-3">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Top categories</div>
                            <div className="grid grid-cols-3 gap-2">
                              {(
                                Object.entries(userInsightsRealtime.insights?.compatibility_trends || {})
                                  .map(([k, v]) => ({ key: k, value: Number(v) || 0 }))
                                  .sort((a, b) => b.value - a.value)
                                  .slice(0, 3)
                              ).map((item) => (
                                <div
                                  key={item.key}
                                  className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-2 text-center"
                                >
                                  <div className="text-[10px] uppercase tracking-wide text-gray-600 truncate">
                                    {item.key}
                                  </div>
                                  <div className="text-sm font-bold text-gray-800">{item.value}%</div>
                                </div>
                              ))}
                              {Object.keys(userInsightsRealtime.insights?.compatibility_trends || {}).length === 0 && (
                                <div className="col-span-3 text-center text-xs text-gray-600">No insights yet</div>
                              )}
                            </div>
                          </div>

                          <div className="bg-white/80 rounded-xl p-3">
                            <div className="text-xs font-semibold text-gray-700 mb-2">Your highlights</div>
                            <div className="space-y-1">
                              <div className="text-xs text-gray-700">
                                Interests:{' '}
                                <span className="font-medium">
                                  {(userInsightsRealtime.insights?.primary_interests || []).slice(0, 3).join(', ') || '—'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-700">
                                Traits:{' '}
                                <span className="font-medium">
                                  {(userInsightsRealtime.insights?.personality_traits || []).slice(0, 2).join(', ') || '—'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-700">
                                Patterns:{' '}
                                <span className="font-medium">
                                  {(userInsightsRealtime.insights?.lifestyle_patterns || []).slice(0, 2).join(', ') || '—'}
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>

                      </div>



                      {/* Social Journey Progress */}

                      <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-2xl p-4 border border-cyan-200 hover:shadow-lg transition-all duration-200">

                        <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center space-x-2">

                          <Compass className="w-5 h-5 text-cyan-500" />

                          <span>Progress</span>

                        </h3>

                        <div className="space-y-3">

                          <div className="bg-white/80 rounded-xl p-3 text-center">

                            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-2">

                              <Users className="w-6 h-6 text-white" />

                            </div>

                            <h4 className="font-semibold text-gray-800 text-sm mb-1">Communities Joined</h4>

                            <p className="text-2xl font-bold text-blue-600">{communitiesData.length}</p>

                          </div>

                          <div className="bg-white/80 rounded-xl p-3 text-center">

                            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-2">

                              <Star className="w-6 h-6 text-white" />

                            </div>

                            <h4 className="font-semibold text-gray-800 text-sm mb-1">Friendship Score</h4>

                            <p className="text-2xl font-bold text-cyan-600">{socialScore}%</p>

                          </div>

                        </div>

                      </div>



                      {/* Community & Fanclub Recommendations */}

                      <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-4 border border-teal-200 hover:shadow-lg transition-all duration-200">

                        <h3 className="text-base font-bold text-gray-800 mb-3 flex items-center space-x-2">

                          <Building2 className="w-5 h-5 text-teal-500" />

                          <span>Recommendations</span>

                        </h3>

                        <div className="space-y-3">

                          {communitiesData.slice(0, 2).map((community) => (

                            <div key={community.id} className="bg-white/80 rounded-xl p-3 hover:shadow-md transition-all duration-200 hover:scale-105">

                              <div className="flex items-center space-x-3">

                                <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">

                                  <span className="text-white font-bold text-sm">{community.name.charAt(0)}</span>

                                </div>

                                <div className="flex-1 min-w-0">

                                  <h4 className="font-semibold text-gray-800 text-sm truncate">{community.name}</h4>

                                  <p className="text-xs text-gray-600">{community.matchPercentage}%</p>

                                </div>

                              </div>

                            </div>

                          ))}

                          <button 

                            onClick={() => setActiveTab('communities')}

                            className="w-full py-2 px-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 text-sm sm:text-base"

                          >

                            View All Recommendations

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

                  <button 

                                      onClick={() => {
                    setFriendshipMatchesSubTab('your-friends');
                  }}

                    className={`${friendshipMatchesSubTab === 'your-friends' ? buttonStyles.tab.active : buttonStyles.tab.inactive}`}

                  >

                    <Users className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />

                    <span className="text-xs sm:text-sm">Your Friends</span>

                  </button>

                  <button 

                                      onClick={() => {
                    setFriendshipMatchesSubTab('find-friends');
                  }}

                    className={`${friendshipMatchesSubTab === 'find-friends' ? buttonStyles.tab.active : buttonStyles.tab.inactive}`}

                  >

                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />

                    <span className="text-xs sm:text-sm">Find Friends</span>

                  </button>

                      </div>

                    </div>



              {/* Content Area - Populated based on selected sub-tab */}

              {friendshipMatchesSubTab === 'your-friends' ? (

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

                    {individualPosts.slice(0, 3).map((post, i) => (

                      <IndividualPostCard key={post.id} post={post} onNavigate={onNavigate} />

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

                    {friendshipMatches.map((profile, i) => (

                      <FriendshipMatchCard key={profile.id} profile={profile} />

                ))}

              </div>

                </div>

              )}

            </div>

          )}



          {activeTab === 'messages' && (
            <div className="h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)] overflow-hidden">
              {isMessagingInitialized ? (
                <ChatSystem
                  userId={userId}
                  conversations={conversations}
                  theme="friends"
                  currentUserProfile={{
                    id: userId,
                    name: myProfileRealtime.profile?.full_name || "Current User",
                    age: 25,
                    location: "Mumbai, Maharashtra",
                    bio: "Looking for meaningful friendships",
                    commonInterests: ["Sports", "Gaming", "Technology", "Music", "Travel"],
                    allTimeFavorites: {
                      "Fav Sports": [{ id: "1", name: "Cricket", description: "National sport", image: "" }],
                      "Fav Games": [{ id: "2", name: "PUBG", description: "Battle royale", image: "" }],
                      "Fav Tech": [{ id: "3", name: "AI & ML", description: "Future technology", image: "" }]
                    }
                  }}
                  onSendMessage={handleSendMessage}
                  onMarkAsRead={handleMarkAsRead}
                  onDeleteConversation={handleDeleteConversation}
                  onBlockUser={handleBlockUser}
                  onReportUser={handleReportUser}
                  onStartVideoCall={handleStartVideoCall}
                  onStartVoiceCall={handleStartVoiceCall}
                  onShareLocation={handleShareLocation}
                  onSendDateInvite={handleSendDateInvite}
                  onSendAIEnhancedMessage={handleSendAIEnhancedMessage}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-100 via-cyan-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <MessageCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1.5 sm:mb-2">Loading Messages</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">Initializing your chat system...</p>
                  </div>
                </div>
              )}
            </div>
          )}



          {activeTab === 'requests' && (

            <div className="p-2 sm:p-3 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">

              <div className="text-center mb-3 sm:mb-4 md:mb-8">

                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1 sm:mb-2">

                  Friend Requests

                </h1>

                <p className="text-gray-600 text-xs sm:text-sm md:text-base lg:text-lg">People who want to connect with you</p>

              </div>

              

              {/* Friend Request Cards - Redesigned with Love Universe Card Aesthetics */}

              <div className="space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">

                {friendRequestsData.map((request) => (

                  <div 

                    key={request.id} 

                    className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-blue-200 ring-2 ring-blue-300"

                  >

                    <div className="p-3 sm:p-4 md:p-6 lg:p-8">

                      {/* Header with Profile Info - Matching Love Universe Profile Style */}

                      <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 md:space-x-6 mb-3 sm:mb-4 md:mb-6 lg:mb-8">

                        <div className="flex-shrink-0 flex justify-center sm:justify-start">

                          <img 

                            src={request.profileImage} 

                            alt={request.name}

                            className="w-16 h-16 sm:w-18 md:w-20 lg:w-24 rounded-full object-cover border-2 border-blue-200 shadow-lg"

                            onError={(e) => {

                              const target = e.target as HTMLImageElement;

                              target.src = fallbackImages[0];

                            }}

                          />

                        </div>

                        

                        <div className="flex-1 min-w-0 text-center sm:text-left">

                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 md:space-x-3 mb-2">

                            <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800">

                              {request.name}

                            </h3>

                            <div className="flex items-center justify-center sm:justify-start space-x-2">

                              <div className="bg-blue-100 p-1 sm:p-1.5 rounded-full">

                                <Check className="w-3 h-3 sm:w-4 h-4 text-blue-600" />

                              </div>

                              <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">

                                New

                              </span>

                            </div>

                          </div>

                          <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-2">

                            {request.age} • {request.location}

                          </p>

                          <div className="inline-flex items-center space-x-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 text-white rounded-full text-xs sm:text-sm font-bold shadow-lg">

                            {request.matchPercentage}%

                          </div>

                        </div>



                        {/* Mutual Friends Section - Compact Header */}

                        <div className="flex-shrink-0 flex flex-col items-center space-y-1">

                          <div className="flex -space-x-1 sm:-space-x-2">

                            {request.mutualFriendsList.map((friend, index) => (

                              <img 

                                key={friend.id}

                                src={friend.image} 

                                alt={friend.name}

                                className="w-5 h-5 sm:w-6 h-6 md:w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm"

                                onError={(e) => {

                                  const target = e.target as HTMLImageElement;

                                  target.src = fallbackImages[0];

                                }}

                              />

                            ))}

                          </div>

                          <span className="text-xs text-gray-600 font-medium">{request.mutualFriends} mutual</span>

                        </div>



                        {/* View Profile Button - Top Right */}

                        <button 

                          onClick={() => handleViewProfile(request)}

                          className="flex-shrink-0 w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full hover:shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105"

                        >

                          <User className="w-4 h-4 sm:w-5 h-5" />

                          <span className="text-sm sm:text-base md:text-lg font-medium">View Profile</span>

                        </button>

                      </div>



                      {/* Personal Message Section */}

                      <div className="mb-3 sm:mb-4">

                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border border-blue-200">

                          <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">

                            <div className="flex-shrink-0 flex justify-center sm:justify-start">

                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-sm">

                                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />

                              </div>

                            </div>

                            <div className="flex-1 min-w-0 text-center sm:text-left">

                              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 mb-2">

                                <h4 className="text-xs sm:text-sm font-medium text-blue-600">Message from {request.name}</h4>

                                <span className="text-xs text-blue-500 bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full font-medium">New</span>

                              </div>

                              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-blue-200 shadow-sm">

                                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">

                                  {request.requestMessage}

                                </p>

                              </div>

                            </div>

                          </div>

                        </div>

                      </div>



                      {/* About Section - Full Width */}

                      <div className="mb-3 sm:mb-4">

                        <div className="p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border-b border-gray-100">

                          <h4 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold text-gray-800 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5">About {request.name}</h4>

                          <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-1 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5">✨ Poetic Bio crafted from their All Time Favorites</p>

                          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border border-blue-200">

                            <p className="text-gray-700 leading-relaxed text-xs sm:text-sm md:text-base italic">

                              "A soul who finds joy in shared passions and common interests. From {request.commonFavorites.slice(0, 3).map(fav => fav.replace('Fav ', '')).join(', ')} to {request.commonFavorites.slice(-2).map(fav => fav.replace('Fav ', '')).join(' and ')}, we discover the beautiful connections that make friendship meaningful."

                            </p>

                          </div>

                        </div>

                      </div>



                      {/* Favorites Sections - Mobile Responsive Layout */}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">

                        {/* What They Liked Section - Tab Design Style */}

                        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border border-blue-200">

                          <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5 sm:mb-2 flex items-center space-x-1.5 sm:space-x-2">

                            <Heart className="w-3 h-3 sm:w-4 h-4 md:w-5 md:h-5 text-blue-500" />

                            <span className="text-xs sm:text-sm md:text-base">What They Liked From Your Favorites</span>

                          </h4>

                          

                          {/* Liked Favorites - Tab Style */}

                          <div className="flex space-x-1 sm:space-x-1.5 md:space-x-2 overflow-x-auto pb-1 sm:pb-2 scrollbar-hide">

                            {request.likedFavorites.map((favorite, index) => (

                              <span

                                key={index}

                                className="flex-shrink-0 px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-0.5 md:py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium rounded-full border border-blue-600 shadow-sm"

                              >

                                {favorite.replace('Fav ', '')}

                              </span>

                            ))}

                          </div>

                        </div>



                        {/* Common Favorites Section - Tab Design Style */}

                        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl p-2 sm:p-3 md:p-4 lg:p-5 xl:p-6 border border-blue-200">

                          <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 mb-1.5 sm:mb-2 flex items-center space-x-1.5 sm:space-x-2">

                            <Star className="w-3 h-3 sm:w-4 h-4 md:w-5 md:h-5 text-blue-500" />

                            <span className="text-xs sm:text-sm md:text-base">Common Favorites Between You</span>

                          </h4>

                          

                          {/* Common Favorites - Tab Style */}

                          <div className="flex space-x-1 sm:space-x-1.5 md:space-x-2 overflow-x-auto pb-1 sm:pb-2 scrollbar-hide">

                            {request.commonFavorites.map((favorite, index) => (

                              <span

                                key={index}

                                className="flex-shrink-0 px-1 sm:px-1.5 md:px-2 py-0.5 sm:py-0.5 md:py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-medium rounded-full border border-blue-600 shadow-sm"

                              >

                                {favorite.replace('Fav ', '')}

                              </span>

                            ))}

                          </div>

                        </div>

                      </div>







                      {/* Action Buttons - Friends Universe Design */}

                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 sm:space-x-3 mb-3 sm:mb-4">

                        <button className={buttonStyles.primary.green}>

                          Accept Request

                        </button>

                        <button className={buttonStyles.primary.cyan}>

                          Message First

                        </button>

                        <button className="flex-1 sm:flex-none px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-sm sm:text-base md:text-lg font-medium hover:scale-105 border border-red-600">

                          Decline

                        </button>

                      </div>





                    </div>

                  </div>

                ))}

              </div>



              {/* Empty State */}

              {friendRequestsData.length === 0 && (

                <div className="text-center py-12 sm:py-16">

                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">

                    <UserPlus className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-blue-400" />

                  </div>

                  <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3">No friend requests yet</h3>

                  <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6">When people send you friend requests, they'll appear here</p>

                  <button 

                    onClick={() => setActiveTab('matches')}

                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 text-sm sm:text-base"

                  >

                    Explore Matches

                  </button>

                </div>

              )}

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

                  <button 

                                      onClick={() => {
                    setCommunitiesSubTab('your-groups');
                  }}

                    className={`${communitiesSubTab === 'your-groups' ? buttonStyles.tab.active : buttonStyles.tab.inactive}`}

                  >

                    <Users className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />

                    <span className="text-xs sm:text-sm">Your Communities & Fanclubs</span>

                  </button>

                  <button 

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

                      {communityPosts.slice(0, 3).map((post, i) => (

                        <CommunityPostCard key={post.id} post={post} onNavigate={onNavigate} />

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

                      {fanclubPosts.slice(0, 3).map((post, i) => (

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

                        .filter(community => !community.isJoined && community.matchPercentage >= 70)

                        .slice(0, 6)

                        .map((community, i) => (

                          <CommunityRecommendationCard key={community.id} community={community} />

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

                        .filter(fanclub => !fanclub.isJoined && fanclub.matchPercentage >= 70)

                        .slice(0, 6)

                        .map((fanclub, i) => (

                          <FanclubRecommendationCard key={fanclub.id} fanclub={fanclub} />

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

                        .filter(community => community.matchPercentage >= 70)

                        .slice(0, 6)

                        .map((community) => (

                          <CommunityRecommendationCard key={community.id} community={community} />

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
                {(localEventsRealtime.loading ? [] : localEventsRealtime.events).map((event: any) => (
                  <EventCard
                    key={event.id}
                    event={{
                      id: event.id,
                      title: event.title,
                      date: event.start_time ? new Date(event.start_time).toLocaleString() : 'TBD',
                      attendees: event.currentAttendees ?? 0,
                      maxAttendees: event.max_attendees ?? null,
                      description: event.description,
                      category: event.event_type || 'Community',
                      location: event.location,
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

              <button 

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

          {[

            { id: 'overview', label: 'Home', icon: Users },

            { id: 'matches', label: 'Match', icon: Star },

            { id: 'messages', label: 'Chat', icon: MessageCircle },

            { id: 'requests', label: 'Req', icon: UserPlus, badge: friendRequestsData.length },

            { id: 'communities', label: 'Groups', icon: Home },

            { id: 'events', label: 'Events', icon: Calendar }

          ].map((tab) => {

            const Icon = tab.icon;

            return (

              <button

                key={tab.id}

                onClick={() => setActiveTab(tab.id)}

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

                      {tab.badge}

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

          fanclub={selectedFanclub}

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

  );

};



export default FriendsDashboard;



