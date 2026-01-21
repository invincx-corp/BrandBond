import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Users, MessageCircle, MapPin, Star, Image as ImageIcon, 
  BookOpen, Calendar, Music, Film, Utensils, Plane, Camera, Video, FileText, 
  MoreHorizontal, Settings, Share2, Bookmark, ThumbsUp, MessageSquare, 
  UserPlus, UserMinus, Check, X, Play, User, Crown, Sparkles, Target, 
  TrendingUp, Award, Globe, Shield, Zap, ActivitySquare, Users2, Hash, 
  MessageSquare as MessageSquareIcon, Award as AwardIcon, Globe2, Shield as ShieldIcon,
  Building2, Hash as HashIcon, Users as UsersIcon, Calendar as CalendarIcon, Trophy
} from 'lucide-react';

interface IndividualProfile {
  id: number;
  username: string;
  name: string;
  age: number;
  location: string;
  profileImage: string;
  coverImage?: string;
  bio: string;
  followers: number;
  following: number;
  posts: number;
  engagements: number;
  isFollowing: boolean;
  isFriend: boolean;
  isVerified: boolean;
  joinDate: string;
  lastActive: string;
  interests: string[];
  dieHardFavorites: string[];
  otherFavorites: string[];
  photos: string[];
  videos: string[];
  profilePosts: ProfilePost[];
  matchPercentage: number;
  commonFavorites: string[];
  socialScore: number;
  friendshipLevel: string;
  mutualFriends: number;
  sharedCommunities: number;
  sharedFanclubs: number;
}

interface ProfilePost {
  id: number;
  image: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
  type: 'photo' | 'video' | 'story';
}

interface IndividualProfilePageProps {
  profileId: number;
  userProfile: {
    id: number;
    name: string;
    avatar: string;
    interests: string[];
  };
}

const IndividualProfilePage: React.FC<IndividualProfilePageProps> = ({ profileId, userProfile }) => {
  const { profileId: routeProfileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const actualProfileId = routeProfileId ? parseInt(routeProfileId) : profileId;
  
  const [profile, setProfile] = useState<IndividualProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'die-hard' | 'other-favorites' | 'photos' | 'videos' | 'posts'>('die-hard');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [followSuccess, setFollowSuccess] = useState(false);
  const [liveFollowers, setLiveFollowers] = useState(0);
  const [liveEngagements, setLiveEngagements] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  
  // Sync modals with URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/follow-modal')) {
      setShowFollowModal(true);
    } else if (path.includes('/message-modal')) {
      setShowMessageModal(true);
    }
  }, [location.pathname]);

  // Generate dynamic profile data based on ID with Friends Dashboard aesthetics
  const generateProfileData = (id: number): IndividualProfile => {
    const profiles = [
      {
        id: 1,
        name: "Sarah Chen",
        username: "sarah_chen",
        age: 24,
        location: "San Francisco, CA",
        profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
        bio: "Adventure seeker and coffee enthusiast. Always exploring new trails and finding hidden gems in the city. Life is too short for boring weekends!",
        isVerified: true,
        followers: 12450,
        following: 892,
        posts: 156,
        engagements: 2340,
        isFollowing: false,
        isFriend: true,
        joinDate: "March 2022",
        lastActive: "2 minutes ago",
        interests: ["Hiking", "Photography", "Coffee", "Travel", "Yoga"],
        dieHardFavorites: ["Rock Climbing", "Mountain Biking", "Adventure Photography"],
        otherFavorites: ["Cooking", "Reading", "Music", "Art"],
        photos: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop"
        ],
        videos: [
          "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop"
        ],
        profilePosts: [
          {
            id: 1,
            image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
            caption: "Morning hike in the mountains! The view was absolutely breathtaking today.",
            likes: 234,
            comments: 18,
            timestamp: "2 hours ago",
            type: 'photo' as const
          },
          {
            id: 2,
            image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop",
            caption: "Found this amazing coffee shop hidden in the city. Best latte ever!",
            likes: 156,
            comments: 12,
            timestamp: "1 day ago",
            type: 'photo' as const
          }
        ],
        matchPercentage: 87,
        commonFavorites: ["Hiking", "Photography", "Coffee", "Travel"],
        socialScore: 92,
        friendshipLevel: "Best Friend",
        mutualFriends: 12,
        sharedCommunities: 3,
        sharedFanclubs: 2
      },
      {
        id: 2,
        name: "Alex Rodriguez",
        username: "alex_rodriguez",
        age: 28,
        location: "Miami, FL",
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        bio: "Fitness enthusiast and food lover. Always pushing my limits in the gym and exploring new cuisines. Let's get stronger together!",
        isVerified: false,
        followers: 8920,
        following: 445,
        posts: 203,
        engagements: 1870,
        isFollowing: true,
        isFriend: false,
        joinDate: "January 2023",
        lastActive: "5 minutes ago",
        interests: ["Fitness", "Cooking", "Travel", "Music", "Sports"],
        dieHardFavorites: ["Weightlifting", "CrossFit", "Healthy Cooking"],
        otherFavorites: ["Gaming", "Movies", "Reading", "Photography"],
        photos: [
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop"
        ],
        videos: [
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop"
        ],
        profilePosts: [
          {
            id: 3,
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop",
            caption: "New personal record today! Deadlift went up by 20 pounds. Consistency is key!",
            likes: 312,
            comments: 24,
            timestamp: "4 hours ago",
            type: 'photo' as const
          },
          {
            id: 4,
            image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop",
            caption: "Homemade protein bowl for post-workout fuel. Healthy and delicious!",
            likes: 189,
            comments: 15,
            timestamp: "2 days ago",
            type: 'photo' as const
          }
        ],
        matchPercentage: 78,
        commonFavorites: ["Fitness", "Cooking", "Travel"],
        socialScore: 85,
        friendshipLevel: "Good Friend",
        mutualFriends: 8,
        sharedCommunities: 2,
        sharedFanclubs: 1
      },
      {
        id: 3,
        name: "Emma Thompson",
        username: "emma_thompson",
        age: 26,
        location: "London, UK",
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        bio: "Creative soul and bookworm. Love exploring art galleries, reading fantasy novels, and finding beauty in everyday moments.",
        isVerified: true,
        followers: 15670,
        following: 678,
        posts: 89,
        engagements: 3120,
        isFollowing: false,
        isFriend: true,
        joinDate: "November 2021",
        lastActive: "1 hour ago",
        interests: ["Art", "Reading", "Writing", "Photography", "Travel"],
        dieHardFavorites: ["Fantasy Novels", "Art History", "Creative Writing"],
        otherFavorites: ["Tea", "Classical Music", "Museums", "Poetry"],
        photos: [
          "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
        ],
        videos: [
          "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop"
        ],
        profilePosts: [
          {
            id: 5,
            image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop",
            caption: "Just finished this amazing fantasy novel. The world-building was incredible!",
            likes: 267,
            comments: 31,
            timestamp: "6 hours ago",
            type: 'photo' as const
          },
          {
            id: 6,
            image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop",
            caption: "Spent the afternoon at the Tate Modern. Art always inspires my creativity.",
            likes: 198,
            comments: 22,
            timestamp: "1 day ago",
            type: 'photo' as const
          }
        ],
        matchPercentage: 91,
        commonFavorites: ["Art", "Reading", "Photography", "Travel"],
        socialScore: 94,
        friendshipLevel: "Close Friend",
        mutualFriends: 15,
        sharedCommunities: 4,
        sharedFanclubs: 3
      }
    ];

    return profiles.find(p => p.id === id) || profiles[0];
  };

  useEffect(() => {
    const profileData = generateProfileData(actualProfileId);
    setProfile(profileData);
    setLiveFollowers(profileData.followers);
    setLiveEngagements(profileData.engagements);
    setIsFollowing(profileData.isFollowing);
    setIsFriend(profileData.isFriend);
  }, [actualProfileId]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveFollowers(prev => prev + Math.floor(Math.random() * 3) - 1);
      setLiveEngagements(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleFollow = () => {
    setIsFollowing(true);
    setLiveFollowers(prev => prev + 1);
    setFollowSuccess(true);
    setTimeout(() => setFollowSuccess(false), 3000);
    navigate(`/profile/${actualProfileId}/follow-modal`);
  };

  const handleUnfollow = () => {
    setIsFollowing(false);
    setLiveFollowers(prev => Math.max(0, prev - 1));
  };

  const handleMessage = () => {
    setShowMessageModal(true);
    navigate(`/profile/${actualProfileId}/message-modal`);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face&auto=format&q=80";
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* Header - Friends Dashboard Style */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm border-b border-blue-200 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-10 lg:px-20 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-5">
              <button 
                onClick={handleBack}
                className="p-3 hover:bg-blue-100 rounded-full transition-colors text-blue-600"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{profile.username}</h1>
                <div className="flex items-center space-x-3">
                  <p className="text-base text-gray-500">{profile.posts} posts</p>
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${profile.lastActive.includes('2 minutes') || profile.lastActive.includes('5 minutes') ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm text-gray-400">{profile.lastActive}</span>
                  </div>
                  {typingUsers.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-blue-500">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span>{typingUsers[0]} is typing...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-3 hover:bg-blue-100 rounded-full transition-colors text-blue-600">
                <MoreHorizontal className="w-6 h-6" />
              </button>
              <button className="p-3 hover:bg-blue-100 rounded-full transition-colors text-blue-600">
                <Share2 className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Hero Section - Friends Dashboard Style */}
      <div className="bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-10 lg:px-20 py-8">
          <div className="flex flex-col lg:flex-row items-start space-y-8 lg:space-y-0 lg:space-x-10">
            {/* Profile Picture & Stats */}
            <div className="flex-shrink-0 w-full lg:w-auto">
              <div className="relative flex flex-col items-center lg:items-start">
                <img
                  src={profile.profileImage}
                  alt={profile.name}
                  className="w-28 h-28 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-white shadow-xl mb-8"
                  onError={handleImageError}
                />
                
                {/* Social Stats Grid - Friends Dashboard Style */}
                <div className="grid grid-cols-3 gap-4 w-full lg:w-auto">
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 text-center border border-blue-200">
                    <div className="text-xl font-bold text-blue-600">{profile.following.toLocaleString()}</div>
                    <div className="text-sm text-blue-500">Following</div>
                  </div>
                  <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl p-4 text-center border border-cyan-200">
                    <div className="text-xl font-bold text-cyan-600">{liveFollowers.toLocaleString()}</div>
                    <div className="text-sm text-cyan-500">Followers</div>
                  </div>
                  <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 text-center border border-teal-200">
                    <div className="text-xl font-bold text-teal-600">{profile.posts.toLocaleString()}</div>
                    <div className="text-sm text-cyan-500">Posts</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Info & Actions */}
            <div className="flex-1 min-w-0 space-y-6">
              <div className="space-y-5">
                <div className="flex items-center space-x-3">
                  <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">{profile.name}</h2>
                  {profile.isVerified && (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-5 text-base text-gray-600">
                  <span className="flex items-center">
                    <User className="w-5 h-5 mr-3" />
                    {profile.age} years old
                  </span>
                  <span className="flex items-center">
                    <MapPin className="w-5 h-5 mr-3" />
                    {profile.location}
                  </span>
                </div>
              </div>

              {/* Poetic About Section */}
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                <p className="text-gray-800 text-lg leading-relaxed italic">
                  "{profile.bio}"
                </p>
              </div>

              {/* CTA Buttons - Friends Dashboard Style */}
              <div className="flex flex-wrap items-center gap-5">
                {!isFollowing ? (
                  <button
                    onClick={handleFollow}
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-8 py-4 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-3"
                  >
                    <UserPlus className="w-6 h-6" />
                    <span>Follow</span>
                  </button>
                ) : (
                  <button
                    onClick={handleUnfollow}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-medium transition-all duration-200 flex items-center space-x-3"
                  >
                    <UserMinus className="w-6 h-6" />
                    <span>Unfollow</span>
                  </button>
                )}
                
                <div className="flex items-center space-x-4">
                  <button className="w-14 h-14 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                  </button>
                  
                  <button
                    onClick={handleMessage}
                    className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
                  >
                    <MessageCircle className="w-6 h-6" />
                  </button>
                  
                  <button className="w-14 h-14 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center">
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Stats & Connection Info - Friends Dashboard Style */}
      <div className="bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-10 lg:px-20 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-lg font-bold text-blue-600">{profile.mutualFriends}</div>
              <div className="text-sm text-blue-500">Mutual Friends</div>
            </div>
            
            <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl p-4 border border-cyan-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-lg font-bold text-cyan-600">{profile.sharedCommunities}</div>
              <div className="text-sm text-cyan-500">Shared Communities</div>
            </div>
            
            <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 border border-teal-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div className="text-lg font-bold text-teal-600">{profile.sharedFanclubs}</div>
              <div className="text-sm text-cyan-500">Shared Fanclubs</div>
              </div>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div className="text-lg font-bold text-yellow-600">{profile.socialScore}%</div>
              <div className="text-sm text-yellow-500">Social Score</div>
            </div>
          </div>
        </div>
      </div>

      {/* Common Favorites Section - Friends Dashboard Style */}
      <div className="bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-10 lg:px-20 py-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-5 flex items-center">
            <Star className="w-6 h-6 mr-3 text-yellow-500" />
            Common Favorites ({profile.commonFavorites.length})
          </h3>
          <div className="flex flex-wrap gap-4">
            {profile.commonFavorites.map((favorite, index) => (
              <span key={index} className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-5 py-2.5 rounded-xl text-base font-medium border border-blue-200 shadow-sm">
                {favorite}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation with Toggle Capsules - Friends Dashboard Style */}
      <div className="bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <div className="flex space-x-6 px-10 lg:px-20 overflow-x-auto">
            {[
              { id: 'die-hard', label: 'Die Hard Favorites', icon: Heart, count: profile.dieHardFavorites.length },
              { id: 'other-favorites', label: 'Other Favorites', icon: Star, count: profile.otherFavorites.length },
              { id: 'photos', label: 'Photos', icon: ImageIcon, count: profile.photos.length },
              { id: 'videos', label: 'Videos', icon: Video, count: profile.videos.length },
              { id: 'posts', label: 'Posts', icon: FileText, count: profile.profilePosts.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3 px-4 rounded-full transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content - Friends Dashboard Style */}
      <div className="bg-white/80 backdrop-blur-sm min-h-96">
        <div className="max-w-2xl mx-auto px-10 lg:px-20 py-6">
          {activeTab === 'die-hard' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Die Hard Favorites</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.dieHardFavorites.map((favorite, index) => (
                  <div key={index} className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 border border-red-200">
                    <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-center">{favorite}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'other-favorites' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Favorites</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.otherFavorites.map((favorite, index) => (
                  <div key={index} className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg p-4 border border-pink-200">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-center">{favorite}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {profile.photos.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      onError={handleImageError}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'videos' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Videos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.videos.map((video, index) => (
                  <div key={index} className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg p-4 border border-cyan-200">
                    <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-center">Video {index + 1}</h4>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Posts</h3>
              <div className="space-y-4">
                {profile.profilePosts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <img
                      src={post.image}
                      alt="Post"
                      className="w-full h-48 object-cover"
                      onError={handleImageError}
                    />
                    <div className="p-4">
                      <p className="text-gray-800 mb-3">{post.caption}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center">
                            <Heart className="w-4 h-4 mr-1" />
                            {post.likes}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {post.comments}
                          </span>
                        </div>
                        <span>{post.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Follow Success Modal */}
      {followSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Successfully Followed!</h3>
            <p className="text-gray-600">You are now following {profile.name}</p>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Message to {profile.name}</h3>
              <button
                onClick={() => setShowMessageModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowMessageModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle message sending
                  setShowMessageModal(false);
                  setMessageText('');
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualProfilePage;
