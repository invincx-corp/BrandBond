import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Heart, Users, MessageCircle, Search, Settings, Home, Compass, Calendar, Star, Music, Film, Book, MapPin, Utensils, ShoppingBag, Gamepad2, Youtube, Trophy, Plane, Camera, Coffee, Headphones, Tv, Car, Dumbbell, Palette, Code, Briefcase, GraduationCap, Baby, PawPrint, Leaf, Zap, Globe, Smartphone, Watch, Shirt, Gift, Sparkles, Target, TrendingUp, Filter, Plus, X, Send, Phone, Video, MoreHorizontal, ThumbsUp, Share2, Bookmark, Bell, User, ChevronRight, ChevronDown, Play, Pause, Volume2, SkipForward, Repeat, Shuffle, Download, ExternalLink, Check, Clock, MapPin as Location, Calendar as CalendarIcon, Users as UsersIcon, ActivitySquare, ArrowLeft, ChevronLeft, DollarSign, ArrowRight, Building2, Users2, Hash, MessageSquare, Award, Globe2, Shield, Crown, Lightbulb, HeartHandshake, Handshake, UserPlus, UserCheck, UserX, UserMinus, UserCog } from 'lucide-react';
import DashboardService, { DashboardStats, DailyMatch, CommunityPreview, RecentActivity, UserInsight, LocalEvent } from '../services/dashboardService';
import ProfileDetailsModal from './ProfileDetailsModal';
import CommunityProfileModal from './CommunityProfileModal';
import FanclubProfileModal from './FanclubProfileModal';
import ChatSystem from './ChatSystem';
import messagingService, { ConversationWithProfile, Message } from '../services/messagingService';
import { generatePoeticDescription, defaultFavoriteCategories } from '../utils/poeticBioGenerator';

interface FriendsDashboardProps {
  userId: string;
  onNavigate: (page: string) => void;
}

const FriendsDashboard: React.FC<FriendsDashboardProps> = ({ userId, onNavigate }) => {
  // Fallback image URLs for when Unsplash images fail to load
  const fallbackImages = [
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=500&fit=crop&crop=face&auto=format&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop&crop=face&auto=format&q=80"
  ];

  // Generalized Button Styles - Consistent across entire dashboard
  const buttonStyles = {
    // Primary Action Buttons (Follow, Join, etc.)
    primary: {
      blue: "w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white py-2.5 px-4 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm flex items-center justify-center space-x-2",
      purple: "w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-2.5 px-4 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm flex items-center justify-center space-x-2",
      green: "w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-2.5 px-4 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm flex items-center justify-center space-x-2",
      cyan: "w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white py-2.5 px-4 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm flex items-center justify-center space-x-2"
    },
    
    // Secondary Action Buttons (Cancel, Secondary actions)
    secondary: {
      blue: "w-full bg-gradient-to-r from-blue-100 to-cyan-100 hover:from-blue-200 hover:to-cyan-200 text-blue-700 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 border border-blue-200 hover:border-blue-300 text-sm flex items-center justify-center space-x-2",
      purple: "w-full bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-700 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 border border-purple-200 hover:border-purple-300 text-sm flex items-center justify-center space-x-2",
      gray: "w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl font-medium transition-all duration-200 border border-gray-200 hover:border-gray-300 text-sm flex items-center justify-center space-x-2"
    },
    
    // Tab Buttons (Active/Inactive states)
    tab: {
      active: "flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition-all duration-200 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg",
      inactive: "flex-1 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-medium transition-all duration-200 text-blue-600 hover:bg-blue-50"
    },
    
    // Icon Buttons (Circular action buttons)
    icon: {
      small: "p-1.5 sm:p-1 bg-white hover:bg-gray-50 rounded-full transition-colors",
      medium: "p-2 hover:bg-blue-100 rounded-full transition-colors text-blue-600",
      large: "w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center"
    },
    
    // Pill Buttons (Small rounded buttons)
    pill: {
      blue: "px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs rounded-full font-medium hover:shadow-lg transition-all duration-200",
      purple: "px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full font-medium hover:shadow-lg transition-all duration-200",
      cyan: "px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs rounded-full font-medium hover:shadow-lg transition-all duration-200"
    },
    
    // Card Buttons (Buttons within cards)
    card: "w-full px-6 py-3 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-sm sm:text-base font-medium hover:scale-105"
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [communitiesSubTab, setCommunitiesSubTab] = useState<'your-groups' | 'explore-new'>('your-groups');
  const [friendshipMatchesSubTab, setFriendshipMatchesSubTab] = useState<'your-friends' | 'find-friends'>('your-friends');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoNotifications, setDemoNotifications] = useState<string[]>([]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Demo mode states for friendship universe
  const [totalFriendshipMatches, setTotalFriendshipMatches] = useState(47);
  const [friendsNearby, setFriendsNearby] = useState(34);
  const [socialScore, setSocialScore] = useState(87);
  const [communitiesJoined, setCommunitiesJoined] = useState(8);
  const [fanclubsJoined, setFanclubsJoined] = useState(12);
  const [eventsAttending, setEventsAttending] = useState(5);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showProfileDetailsModal, setShowProfileDetailsModal] = useState(false);
  const [selectedProfileForDetails, setSelectedProfileForDetails] = useState<any>(null);
  
  // Community & Fanclub Profile Modal states
  const [showCommunityProfileModal, setShowCommunityProfileModal] = useState(false);
  const [showFanclubProfileModal, setShowFanclubProfileModal] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<any>(null);
  const [selectedFanclub, setSelectedFanclub] = useState<any>(null);

  // Registration categories for realistic data
  const registrationCategories = {
    music: ['Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Classical', 'Electronic', 'Country', 'R&B'],
    movies: ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Romance', 'Thriller', 'Horror', 'Documentary'],
    tvShows: ['Drama', 'Comedy', 'Reality', 'Crime', 'Fantasy', 'Sci-Fi', 'Romance', 'Thriller'],
    books: ['Fiction', 'Non-Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Biography', 'Self-Help', 'Fantasy'],
    travel: ['Beach', 'Mountains', 'City', 'Countryside', 'Historical', 'Adventure', 'Relaxation', 'Cultural'],
    food: ['Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'French', 'Thai', 'Mediterranean'],
    sports: ['Football', 'Basketball', 'Tennis', 'Cricket', 'Swimming', 'Running', 'Gym', 'Yoga'],
    tech: ['Smartphones', 'Laptops', 'Gaming', 'AI/ML', 'Web Development', 'Mobile Apps', 'Data Science', 'Cybersecurity'],
    hobbies: ['Photography', 'Painting', 'Cooking', 'Gardening', 'Reading', 'Writing', 'Dancing', 'Singing'],
    shopping: ['Fashion', 'Electronics', 'Books', 'Sports', 'Beauty', 'Home & Garden', 'Food & Beverages', 'Automotive']
  };

  // User action states for saving profiles
  const [likedProfiles, setLikedProfiles] = useState<any[]>([]);
  const [connectedProfiles, setConnectedProfiles] = useState<any[]>([]);
  const [bookmarkedProfiles, setBookmarkedProfiles] = useState<any[]>([]);
  
  // AI Chat Prompts and Chat functionality state
  const [showAIPromptsModal, setShowAIPromptsModal] = useState(false);
  const [selectedProfileForChat, setSelectedProfileForChat] = useState<any>(null);
  const [aiPrompts, setAiPrompts] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);

  // Messaging System State
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [isMessagingInitialized, setIsMessagingInitialized] = useState(false);

  // Community & Fanclub functionality state
  const [plannedMeetups, setPlannedMeetups] = useState<any[]>([]);
  const [showMeetupPlanningModal, setShowMeetupPlanningModal] = useState(false);
  const [selectedProfileForMeetup, setSelectedProfileForMeetup] = useState<any>(null);
  const [meetupPlanningStep, setMeetupPlanningStep] = useState<'type' | 'details' | 'review'>('type');
  const [meetupPlan, setMeetupPlan] = useState({
    type: '',
    date: '',
    time: '',
    location: '',
    activity: '',
    budget: '',
    description: '',
    specialNotes: ''
  });
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 1,
      type: 'new_friendship_match',
      title: 'New Friendship Match!',
      message: 'You have a new 94% friendship match with Rahul Verma!',
      profile: {
        id: 101,
        name: "Rahul Verma",
        age: 27,
        location: "Mumbai, Maharashtra",
        photos: [fallbackImages[0]],
        matchPercentage: 94
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      isRead: false,
      action: 'view_profile'
    },
    {
      id: 2,
      type: 'community_invitation',
      title: 'Community Invitation!',
      message: 'Tech Enthusiasts community wants you to join!',
      profile: {
        id: 102,
        name: "Tech Enthusiasts",
        category: "Technology",
        members: 1247,
        photos: [fallbackImages[1]],
        matchPercentage: 89
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      isRead: false,
      action: 'view_community'
    }
  ]);

  // Realistic friendship matches with meaningful content
  const friendshipMatches = useMemo(() => [
    {
      id: 1,
      name: "Sarah Chen",
      age: 24,
      location: "San Francisco, CA",
      profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
      matchPercentage: 94,
      bio: "Passionate about sustainable living and urban gardening. Love exploring new coffee shops and finding hidden hiking trails. Always up for a good book discussion or board game night!",
      commonFavorites: ["Pop Music", "Action Movies", "Crime TV Series", "Fiction Books", "Beach Travel", "Italian Food"],
      mutualFriends: 8,
      mutualFriendsList: [
        {
          id: 101,
          name: "Lisa Park",
          image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 102,
          name: "Carlos Mendez",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 103,
          name: "Tech for Good",
          image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop"
        }
      ]
    },
    {
      id: 2,
      name: "Marcus Rodriguez",
      age: 27,
      location: "Austin, TX",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      matchPercentage: 89,
      bio: "Tech enthusiast who believes in using innovation for social good. Love playing guitar, trying new cuisines, and discussing the future of AI. Weekend warrior for local volunteer events.",
      commonFavorites: ["Rock Music", "Sci-Fi Movies", "Fantasy TV Series", "Biography Books", "Mountain Travel", "Japanese Food"],
      mutualFriends: 12,
      mutualFriendsList: [
        {
          id: 201,
          name: "Urban Gardeners",
          image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop"
        },
        {
          id: 202,
          name: "Book Enthusiasts",
          image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop"
        },
        {
          id: 203,
          name: "Local Food Explorers",
          image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop"
        }
      ]
    },
    {
      id: 3,
      name: "Emma Thompson",
      age: 26,
      location: "Portland, OR",
      profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      matchPercentage: 87,
      bio: "Creative soul who finds beauty in everyday moments. Love photography, vintage shopping, and supporting local artists. Always seeking new perspectives and meaningful conversations.",
      commonFavorites: ["Jazz Music", "Drama Movies", "Comedy TV Series", "Mystery Books", "City Travel", "French Food"],
      mutualFriends: 6,
      mutualFriendsList: [
        {
          id: 301,
          name: "Indie Music Enthusiasts",
          image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"
        },
        {
          id: 302,
          name: "Adventure Seekers",
          image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop"
        },
        {
          id: 303,
          name: "Sarah Chen",
          image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face"
        }
      ]
    }
  ], []);

  // Friend requests data
  const friendRequestsData = useMemo(() => [
    {
      id: 1,
      name: "Alex Johnson",
      age: 25,
      location: "Seattle, WA",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      matchPercentage: 91,
      bio: "Coffee enthusiast and startup founder. Love discussing business ideas over craft beer. Always looking for mentors and people to collaborate with on innovative projects.",
      commonFavorites: ["Fav Music Categories", "Fav Movie Categories", "Fav TV Series Categories", "Fav Book Categories", "Fav Travel Destinations", "Fav Food/Cuisine"],
      likedFavorites: ["Fav Tech Gadgets", "Fav Hobbies", "Fav Interests", "Fav Shopping Brands"],
      mutualFriends: 2,
      mutualFriendsList: [
        {
          id: 101,
          name: "Tech for Good",
          image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop"
        },
        {
          id: 102,
          name: "Sarah Chen",
          image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face"
        }
      ],
      requestMessage: "Hey! I saw we both love tech and social impact. Would love to connect and maybe collaborate on some projects!",
      requestDate: "2 hours ago"
    },
    {
      id: 2,
      name: "Maya Patel",
      age: 28,
      location: "Denver, CO",
      profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
      matchPercentage: 88,
      bio: "Environmental scientist and outdoor enthusiast. Passionate about climate action and sustainable living. Love hiking, rock climbing, and finding ways to make a positive impact.",
      commonFavorites: ["Fav Music Categories", "Fav Movie Categories", "Fav TV Series Categories", "Fav Book Categories", "Fav Travel Destinations", "Fav Food/Cuisine"],
      likedFavorites: ["Fav Hobbies", "Fav Interests", "Fav Travel Destination Categories", "Fav Food/Cuisine Categories"],
      mutualFriends: 3,
      mutualFriendsList: [
        {
          id: 201,
          name: "Urban Gardeners Collective",
          image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop"
        },
        {
          id: 202,
          name: "Emma Thompson",
          image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 203,
          name: "Green Earth Initiative",
          image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop"
        }
      ],
      requestMessage: "Hi there! I noticed we share a passion for sustainability and outdoor activities. Would be great to connect with like-minded people in the area!",
      requestDate: "1 day ago"
    },
    {
      id: 3,
      name: "David Kim",
      age: 26,
      location: "Boston, MA",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
      matchPercentage: 85,
      bio: "Grad student in computer science with a love for classical music and chess. Always up for intellectual discussions and finding new ways to solve complex problems.",
      commonFavorites: ["Fav Music Categories", "Fav Movie Categories", "Fav TV Series Categories", "Fav Book Categories", "Fav Travel Destinations", "Fav Food/Cuisine"],
      likedFavorites: ["Fav Tech Gadgets", "Fav Hobbies", "Fav Interests", "Fav Shopping Brands"],
      mutualFriends: 1,
      mutualFriendsList: [
        {
          id: 301,
          name: "Book Enthusiasts",
          image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop"
        }
      ],
      requestMessage: "Hello! I'm new to the area and looking to build a network of friends who share my interests. Would love to grab coffee and chat!",
      requestDate: "3 days ago"
    }
  ], []);

  // Realistic mutual connections with meaningful content
  const mutualConnections = useMemo(() => [
    {
      id: 1,
        name: "Lisa Park",
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        mutualFriends: 5,
      lastActive: "2 hours ago",
      mutualFriendsList: [
        {
          id: 101,
          name: "Sarah Chen",
          image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 102,
          name: "Alex Rodriguez",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 103,
          name: "Emma Thompson",
          image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
        }
      ]
    },
    {
      id: 2,
        name: "Carlos Mendez",
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        mutualFriends: 3,
      lastActive: "1 day ago",
      mutualFriendsList: [
        {
          id: 201,
          name: "Tech for Good",
          image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop"
        },
        {
          id: 202,
          name: "Urban Gardeners",
          image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop"
        }
      ]
    }
  ], []);

  // Realistic communities with meaningful content
  const communitiesData = useMemo(() => [
    {
      id: 1,
      name: "Tech for Good",
      members: 2847,
      category: "Technology & Social Impact",
      description: "A community of developers, designers, and changemakers building technology solutions for social and environmental challenges.",
      photo: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop",
      matchPercentage: 92,
      isJoined: true,
      recentActivity: "New project: AI-powered waste sorting system for cities"
    },
    {
      id: 2,
      name: "Urban Gardeners Collective",
      members: 1243,
      category: "Sustainability & Gardening",
      description: "Sharing knowledge about urban farming, sustainable living, and creating green spaces in cities. From balcony gardens to community plots.",
      photo: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop",
      matchPercentage: 87,
      isJoined: true,
      recentActivity: "Spring planting workshop this weekend"
    },
    {
      id: 3,
      name: "Local Food Explorers",
      members: 892,
      category: "Food & Culture",
      description: "Discovering hidden culinary gems, supporting local restaurants, and celebrating diverse food cultures in our community.",
      photo: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop",
      matchPercentage: 85,
      isJoined: false,
      recentActivity: "New restaurant review: Authentic Thai street food"
    }
  ], []);

  // Realistic fanclubs with meaningful content
  const fanclubsData = useMemo(() => [
    {
      id: 1,
      name: "Indie Music Enthusiasts",
      members: 2156,
      memberCount: 2156,
      category: "Music & Entertainment",
      description: "Celebrating independent artists, discovering new sounds, and supporting the local music scene. From folk to electronic, we're passionate about it all!",
      photo: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      avatar: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop",
      banner: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=200&fit=crop",
      matchPercentage: 93,
      isJoined: true,
      recentActivity: "Live acoustic night featuring local artists",
      commonFavorites: ["Indie Rock", "Folk Music", "Live Performances", "Local Artists", "Music Discovery"],
      sharedInterests: ["Indie Rock", "Folk Music", "Live Performances", "Local Artists", "Music Discovery"],
      type: 'public' as const,
      foundedDate: "March 2023",
      location: "Global",
      tags: ["Music", "Indie", "Live Performance", "Local Artists"],
      coreValues: ["Creativity", "Community", "Support", "Discovery", "Passion"],
      activityLevel: 'very-active' as const,
      contentTypes: ["Live Streams", "Music Reviews", "Artist Spotlights", "Event Planning"],
      rules: ["Be supportive of all artists", "Share music respectfully", "No hate speech", "Stay positive"],
      founder: {
        name: "Jake Wilson",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
        bio: "Music producer and indie music advocate"
      },
      moderators: [
        {
          id: 1,
          name: "Maya Patel",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
          role: 'moderator' as const,
          joinedDate: "March 2023",
          interests: ["Indie Rock", "Live Music", "Artist Management"]
        }
      ],
      recentPosts: [
        {
          id: 1,
          author: "Jake Wilson",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
          content: "Tonight's acoustic night was incredible! So many talented local artists. This is what community is all about!",
          likes: 89,
          comments: 23,
          timestamp: "2 hours ago",
          type: 'text' as const
        },
        {
          id: 2,
          author: "Maya Patel",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
          content: "Just discovered this amazing folk artist from Portland. Her voice is absolutely mesmerizing!",
          likes: 156,
          comments: 45,
          timestamp: "1 day ago",
          type: 'text' as const
        }
      ],
      upcomingEvents: [
        {
          id: 1,
          title: "Summer Music Festival",
          date: "July 15-17, 2024",
          type: 'offline' as const,
          attendees: 200,
          maxAttendees: 300
        }
      ],
      memberStories: [
        {
          id: 1,
          member: "David Kim",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
          story: "Found my bandmates through this fanclub! We're now playing gigs every weekend.",
          impact: "Formed successful local band with 3 other members"
        }
      ],
      mutualFriendsList: [
        {
          id: 1,
          name: "Jake Wilson",
          profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 2,
          name: "Maya Patel",
          profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 3,
          name: "David Kim",
          profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face"
        }
      ]
    },
    {
      id: 2,
      name: "Adventure Seekers",
      members: 1678,
      memberCount: 1678,
      category: "Outdoor & Adventure",
      description: "Planning weekend getaways, sharing hiking trails, and organizing outdoor adventures. Life is too short to stay indoors!",
      photo: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
      avatar: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=80&h=80&fit=crop",
      banner: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop",
      matchPercentage: 87,
      isJoined: false,
      recentActivity: "Weekend camping trip to Big Sur",
      commonFavorites: ["Hiking", "Camping", "Rock Climbing", "Photography", "Travel"],
      sharedInterests: ["Hiking", "Camping", "Rock Climbing", "Photography", "Travel"],
      type: 'public' as const,
      foundedDate: "January 2023",
      location: "Global",
      tags: ["Adventure", "Outdoors", "Hiking", "Camping"],
      coreValues: ["Exploration", "Courage", "Respect for Nature", "Teamwork", "Adventure"],
      activityLevel: 'active' as const,
      contentTypes: ["Trip Reports", "Gear Reviews", "Safety Tips", "Photo Sharing"],
      rules: ["Leave no trace", "Safety first", "Respect wildlife", "Share knowledge"],
      founder: {
        name: "Sarah Chen",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
        bio: "Professional mountain guide and outdoor educator"
      },
      moderators: [
        {
          id: 1,
          name: "Alex Rodriguez",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
          role: 'moderator' as const,
          joinedDate: "January 2023",
          interests: ["Rock Climbing", "Mountaineering", "Photography"]
        }
      ],
      recentPosts: [
        {
          id: 1,
          author: "Sarah Chen",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
          content: "Just completed the Big Sur trail! The views were absolutely breathtaking. Who's up for the next adventure?",
          likes: 234,
          comments: 67,
          timestamp: "1 day ago",
          type: 'text' as const
        },
        {
          id: 2,
          author: "Alex Rodriguez",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
          content: "New climbing route discovered at Yosemite! Perfect for intermediate climbers.",
          likes: 189,
          comments: 34,
          timestamp: "3 days ago",
          type: 'text' as const
        }
      ],
      upcomingEvents: [
        {
          id: 1,
          title: "Big Sur Camping Trip",
          date: "April 20-22, 2024",
          type: 'offline' as const,
          attendees: 25,
          maxAttendees: 30
        }
      ],
      memberStories: [
        {
          id: 1,
          member: "Emma Thompson",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
          story: "Started as a beginner hiker here and now I'm leading group trips! The community support is amazing.",
          impact: "Transformed from beginner to trip leader in 2 years"
        }
      ],
      mutualFriendsList: [
        {
          id: 4,
          name: "Sarah Chen",
          profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 5,
          name: "Alex Rodriguez",
          profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 6,
          name: "Emma Thompson",
          profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
        }
      ]
    },
    {
      id: 3,
      name: "Book Enthusiasts Circle",
      members: 2341,
      memberCount: 2341,
      category: "Literature & Reading",
      description: "Monthly book discussions, author meetups, and reading challenges. We believe every book has something to teach us.",
      photo: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop",
      avatar: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=80&h=80&fit=crop",
      banner: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop",
      matchPercentage: 90,
      isJoined: true,
      recentActivity: "Book club discussion on 'The Midnight Library'",
      commonFavorites: ["Fiction", "Mystery", "Classic Literature", "Book Reviews", "Reading Challenges"],
      sharedInterests: ["Fiction", "Mystery", "Classic Literature", "Book Reviews", "Reading Challenges"],
      type: 'public' as const,
      foundedDate: "December 2022",
      location: "Global",
      tags: ["Books", "Reading", "Literature", "Book Club"],
      coreValues: ["Knowledge", "Discussion", "Open-mindedness", "Curiosity", "Respect"],
      activityLevel: 'moderate' as const,
      contentTypes: ["Book Reviews", "Discussion Threads", "Reading Challenges", "Author Q&As"],
      rules: ["Respect different opinions", "No spoilers without warning", "Be inclusive", "Share thoughtfully"],
      founder: {
        name: "Lisa Wang",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
        bio: "Literature professor and book club organizer"
      },
      moderators: [
        {
          id: 1,
          name: "Mike Johnson",
          avatar: "https://images.unsplash.com/photo-1472099645785-53994a69daeb?w=40&h=40&fit=crop&crop=face",
          role: 'moderator' as const,
          joinedDate: "December 2022",
          interests: ["Classic Literature", "Poetry", "Literary Analysis"]
        }
      ],
      recentPosts: [
        {
          id: 1,
          author: "Lisa Wang",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=40&h=40&fit=crop&crop=face",
          content: "Our discussion on 'The Midnight Library' was incredibly insightful! So many different perspectives on life choices.",
          likes: 167,
          comments: 89,
          timestamp: "2 days ago",
          type: 'text' as const
        },
        {
          id: 2,
          author: "Mike Johnson",
          avatar: "https://images.unsplash.com/photo-1472099645785-53994a69daeb?w=40&h=40&fit=crop&crop=face",
          content: "Just finished 'Pride and Prejudice' for the 5th time. Each reading reveals new layers of brilliance!",
          likes: 234,
          comments: 56,
          timestamp: "1 week ago",
          type: 'text' as const
        }
      ],
      upcomingEvents: [
        {
          id: 1,
          title: "Author Meet & Greet",
          date: "May 10, 2024",
          type: 'online' as const,
          attendees: 150,
          maxAttendees: 200
        }
      ],
      memberStories: [
        {
          id: 1,
          member: "Rachel Green",
          avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=40&h=40&fit=crop&crop=face",
          story: "This fanclub helped me discover my love for classic literature. Now I'm writing my own novel!",
          impact: "Started writing career through community inspiration"
        }
      ],
      mutualFriendsList: [
        {
          id: 7,
          name: "Lisa Wang",
          profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 8,
          name: "Mike Johnson",
          profileImage: "https://images.unsplash.com/photo-1472099645785-53994a69daeb?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 9,
          name: "Rachel Green",
          profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face"
        }
      ]
    }
  ], []);

  // Realistic individual posts with meaningful content
  const individualPosts = useMemo(() => [
    {
      id: 1,
      author: {
        name: "Sarah Chen",
        profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
        location: "San Francisco, CA",
        isVerified: true
      },
      content: {
        text: "Just finished reading 'The Midnight Library' by Matt Haig! Such a beautiful exploration of life's infinite possibilities. The way it weaves together quantum physics and human choices is mind-blowing. What are you reading these days?",
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop",
        likes: 127,
        comments: 23,
        timestamp: "2 hours ago"
      }
    },
    {
      id: 2,
      author: {
        name: "Alex Rodriguez",
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        location: "Miami, FL",
        isVerified: false
      },
      content: {
        text: "Morning hike at Mount Tam! The fog rolling in over the bay was absolutely magical. Nature always finds a way to surprise and inspire. Perfect way to start the day with some fresh air and stunning views.",
        image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
        likes: 89,
        comments: 15,
        timestamp: "5 hours ago"
      }
    },
    {
      id: 3,
      author: {
        name: "Emma Thompson",
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        location: "Portland, OR",
        isVerified: true
      },
      content: {
        text: "Made homemade pasta from scratch today! Nothing beats the satisfaction of creating something delicious with your own hands. Used my grandmother's recipe - the secret is in the egg-to-flour ratio. Recipe in comments!",
        image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop",
        likes: 203,
        comments: 31,
        timestamp: "1 day ago"
      }
    }
  ], []);

  // Realistic community posts with meaningful content
  const communityPosts = useMemo(() => [
    {
      id: 1,
      author: {
        name: "Tech for Good",
        profileImage: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop",
        isVerified: true,
        category: "Technology Community",
        memberCount: 2847
      },
      content: {
        text: "Exciting news! Our community project 'AI for Waste Management' just won the city's innovation challenge! This could help reduce landfill waste by 40%. Huge thanks to everyone who contributed their expertise in machine learning, data science, and environmental engineering!",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
        likes: 342,
        comments: 67,
        timestamp: "3 hours ago"
      }
    },
    {
      id: 2,
      author: {
        name: "Urban Gardeners Collective",
        profileImage: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop",
        isVerified: true,
        category: "Sustainability Community",
        memberCount: 1243
      },
      content: {
        text: "🌱 Spring planting workshop this Saturday! Learn how to start your own balcony garden with native plants. We'll provide seeds, pots, and expert guidance. Perfect for beginners! Plus, we'll have a seed swap - bring your extras!",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
        likes: 156,
        comments: 28,
        timestamp: "6 hours ago"
      }
    }
  ], []);

  // Realistic fanclub posts with meaningful content
  const fanclubPosts = useMemo(() => [
    {
      id: 1,
      author: {
        name: "Indie Music Lovers",
        profileImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
        isVerified: true,
        category: "Music Fanclub",
        memberCount: 2156
      },
      content: {
        text: "New album drop alert! 'Midnight Echoes' by The Velvet Underground Collective is everything we hoped for and more. The way they blend shoegaze with electronic elements is pure magic. Who's going to the release party next week?",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
        likes: 289,
        comments: 45,
        timestamp: "4 hours ago"
      }
    },
    {
      id: 2,
      author: {
        name: "Sci-Fi Book Club",
        profileImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop",
        isVerified: true,
        category: "Literature Fanclub",
        memberCount: 892
      },
      content: {
        text: "This month's book discussion: 'The Three-Body Problem' by Liu Cixin. The way it explores first contact through game theory and physics is mind-bending! Join us this Sunday for a deep dive into the Dark Forest theory.",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",
        likes: 167,
        comments: 32,
        timestamp: "8 hours ago"
      }
    }
  ], []);

  // Realistic additional posts with meaningful content
  const additionalPosts = useMemo(() => [
    {
      id: 4,
      author: {
        name: "Maya Patel",
        profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
        location: "Chicago, IL",
        isVerified: false
      },
      content: {
        text: "Just launched my online art store! It's been a dream for years and finally took the leap. Supporting local artists and bringing unique pieces to people's homes. The response has been incredible - art really does connect souls across distances.",
        image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop",
        likes: 156,
        comments: 29,
        timestamp: "8 hours ago"
      }
    },
    {
      id: 5,
      author: {
        name: "David Chen",
        profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
        location: "Boston, MA",
        isVerified: true
      },
      content: {
        text: "Volunteered at the local food bank today. The gratitude and smiles from families we helped were absolutely inspiring. 💝 Remember, even small acts of kindness can make a huge difference. Community service isn't just about giving - it's about building stronger communities together.",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
        likes: 278,
        comments: 42,
        timestamp: "12 hours ago"
      }
    },
    {
      id: 6,
      author: {
        name: "Sophie Rodriguez",
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        location: "San Diego, CA",
        isVerified: false
      },
      content: {
        text: "Beach cleanup with the local environmental group today! 🌊 Collected over 50 pounds of plastic waste. Every piece counts toward a cleaner ocean. The sense of community and purpose was incredible. Who wants to join next time?",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop",
        likes: 234,
        comments: 38,
        timestamp: "1 day ago"
      }
    },
    {
      id: 7,
      author: {
        name: "Ryan Thompson",
        profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
        location: "Nashville, TN",
        isVerified: true
      },
      content: {
        text: "First open mic night at the local coffee shop! 🎤 Nerves were real but the crowd was so supportive. Music really does bring people together. The energy in the room was electric - can't wait for next week!",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
        likes: 189,
        comments: 27,
        timestamp: "2 days ago"
      }
    }
  ], []);

  // Realistic additional community posts with meaningful content
  const additionalCommunityPosts = useMemo(() => [
    {
      id: 3,
      author: {
        name: "Local Food Explorers",
        profileImage: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop",
        isVerified: true,
        category: "Food Community",
        memberCount: 892
      },
      content: {
        text: "New restaurant alert! 🍜 'Pho & More' just opened downtown. Authentic Vietnamese street food with a modern twist. The pho is incredible and they source ingredients from local farms.",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop",
        likes: 134,
        comments: 23,
        timestamp: "9 hours ago"
      }
    },
    {
      id: 4,
      author: {
        name: "Climate Action Network",
        profileImage: "https://images.unsplash.com/photo-1569163139397-4d39c6a5c57c?w=400&h=400&fit=crop",
        isVerified: true,
        category: "Environmental Community",
        memberCount: 3456
      },
      content: {
        text: "City council approved our proposal for solar panels on public buildings! 🌞 This will reduce carbon emissions by 15% annually. Community action works!",
        image: "https://images.unsplash.com/photo-1569163139397-4d39c6a5c57c?w=800&h=600&fit=crop",
        likes: 456,
        comments: 89,
        timestamp: "1 day ago"
      }
    }
  ], []);

  // Realistic additional fanclub posts with meaningful content
  const additionalFanclubPosts = useMemo(() => [
    {
      id: 3,
      author: {
        name: "Book Lovers Circle",
        profileImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop",
        isVerified: true,
        category: "Literature Fanclub",
        memberCount: 2341
      },
      content: {
        text: "Book club discussion on 'The Midnight Library' was incredible! So many different perspectives on life choices and regrets. Next month we're reading 'Project Hail Mary' - sci-fi fans, this one's for you!",
        image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop",
        likes: 167,
        comments: 31,
        timestamp: "2 days ago"
      }
    }
  ], []);

  // Realistic community recommendations with meaningful content
  const communityRecommendations = useMemo(() => [
    {
      id: 1,
      name: "Climate Action Network",
      category: "Environmental Advocacy",
      photo: "https://images.unsplash.com/photo-1569163139397-4d39c6a5c57c?w=400&h=400&fit=crop",
      description: "Working together to address climate change through local action, education, and policy advocacy. We believe small changes lead to big impacts.",
      matchPercentage: 92,
      memberCount: 3456,
      mutualFriendsList: [
        {
          id: 601,
          name: "Sarah Chen",
          image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 602,
          name: "Marcus Rodriguez",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face"
        },
        {
          id: 603,
          name: "Emma Thompson",
          image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face"
        }
      ]
    },
    {
      id: 2,
      name: "Creative Entrepreneurs Hub",
      category: "Business & Innovation",
      photo: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop",
      description: "Supporting creative professionals in building sustainable businesses. From artists to designers, we help turn passion into profit while maintaining artistic integrity.",
      matchPercentage: 89,
      memberCount: 1892,
      mutualFriendsList: [
        {
          id: 604,
          name: "Tech for Good",
          image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop"
        },
        {
          id: 605,
          name: "Urban Gardeners",
          image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop"
        },
        {
          id: 606,
          name: "Local Food Explorers",
          image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop"
        }
      ]
    }
  ], []);

  const dailyChallenge = useMemo(() => ({
    title: "Send a friendly message to someone new in your community",
    completed: 1,
    target: 3,
    reward: "50 Friendship Points + Community Badge",
    isCompleted: false,
    progress: [
      { profileName: "Rahul Verma", action: "Message sent" }
    ]
  }), []);

  // Helper functions
  const getWorkingImageUrl = (url: string, index: number) => {
    try {
      if (!url || url.includes('undefined') || url.includes('null')) {
        return fallbackImages[index % fallbackImages.length];
      }
      return url;
    } catch {
      return fallbackImages[index % fallbackImages.length];
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackIndex: number = 0) => {
    const target = e.target as HTMLImageElement;
    target.src = fallbackImages[fallbackIndex % fallbackImages.length];
    target.onerror = null; // Prevent infinite loop
  };

  const handleViewProfile = (profile: any) => {
    // Navigate to individual profile page instead of opening modal
    onNavigate(`/profile/${profile.id}`);
  };

  const handleProfileLike = (profileId: string) => {
    // Handle liking the profile as a friend
    console.log('Liked profile as friend:', profileId);
    // You can implement the actual like functionality here
  };

  const handleProfileChat = (profileId: string) => {
    // Handle starting a chat with the profile
    console.log('Starting chat with profile:', profileId);
    // You can implement the actual chat functionality here
    setShowProfileDetailsModal(false);
    // Navigate to chat or open chat modal
  };

  const handleTakeChallenge = () => {
    if (dailyChallenge.completed < dailyChallenge.target) {
      setDailyChallenge((prev: any) => ({
        ...prev,
        completed: prev.completed + 1,
        isCompleted: prev.completed + 1 >= prev.target
      }));
      addDemoNotification("Challenge progress updated! Keep going!");
    }
  };

  const setDailyChallenge = (updater: any) => {
    // This would be a proper setter in a real implementation
    console.log('Challenge updated:', updater);
  };

      // Individual Post Card - EXACT Instagram Design
    const IndividualPostCard = ({ post, onNavigate }: { post: any; onNavigate: (path: string) => void }) => (
      <div className="bg-white border border-gray-200 mb-4 sm:mb-6 w-full max-w-[37rem] mx-auto rounded-lg sm:rounded-xl">
      {/* Instagram Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <img
            src={post.author.profileImage}
            alt={post.author.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-gray-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = fallbackImages[0];
            }}
          />
          <div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{post.author.name}</h3>
            <p className="text-[10px] sm:text-xs text-gray-500">{post.author.location}</p>
          </div>
        </div>
        <button className={buttonStyles.icon.medium}>
          <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Instagram Image */}
      <div className="w-full">
        <img
          src={post.content.image}
          alt="Post content"
          className="w-full h-48 sm:h-56 md:h-64 lg:h-80 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1540747913346-19e32e3cdd97?w=800&h=600&fit=crop";
          }}
        />
      </div>

      {/* Instagram Actions */}
      <div className="px-3 sm:px-4 py-3 sm:py-3">
        <div className="flex items-center justify-between mb-3 sm:mb-3">
          <div className="flex items-center space-x-4 sm:space-x-4">
            <button className={buttonStyles.icon.small}>
              <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
            </button>
            <button className={buttonStyles.icon.small}>
              <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
            </button>
            <button className={buttonStyles.icon.small}>
              <Share2 className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
            </button>
          </div>
          <button className={buttonStyles.icon.small}>
            <Bookmark className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
          </button>
        </div>

        {/* Likes */}
        <p className="font-semibold text-gray-900 text-sm sm:text-base mb-3 sm:mb-2">{post.content.likes.toLocaleString()} likes</p>

        {/* Caption */}
        <div className="mb-3 sm:mb-2">
          <p className="text-gray-900 text-sm sm:text-base leading-relaxed">
            <span className="font-semibold mr-2">{post.author.name}</span>
            {post.content.text}
          </p>
        </div>

        {/* Comments */}
        <button className="text-gray-500 text-sm sm:text-base mb-3 sm:mb-2 hover:text-gray-700 hover:underline transition-colors">
          View all {post.content.comments} comments
        </button>

        {/* Time */}
        <p className="text-gray-400 text-xs sm:text-sm mb-3">{post.content.timestamp}</p>
        
        {/* Go to Profile Button */}
        <button 
          onClick={() => onNavigate(`/profile/${post.author.id}`)}
          className={buttonStyles.primary.blue}
        >
          <User className="w-4 h-4" />
          <span>Go to {post.author.name}'s Profile</span>
        </button>
      </div>
    </div>
  );

  const CommunityPostCard = ({ post, onNavigate }: { post: any; onNavigate: (path: string) => void }) => (
    <div className="bg-white border border-gray-200 mb-4 sm:mb-6 overflow-hidden w-full max-w-[37rem] mx-auto rounded-lg sm:rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Community Post Header - Instagram Style with STRONG Community Highlighting */}
      <div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-200 bg-gradient-to-r from-blue-100 to-cyan-100">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="relative">
            <img
              src={post.author.profileImage}
              alt={post.author.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border-2 border-blue-300 shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = fallbackImages[0];
              }}
            />
            {/* LARGE Community Badge - More Prominent */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-7 sm:h-7 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
              <Users className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            {/* Line 1: Profile name + verification badge (always on same line) */}
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base flex-1 min-w-0">{post.author.name}</h3>
              {post.author.isVerified && (
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                </div>
              )}
            </div>
            {/* Line 2: Category + Member count (mobile: stacked, desktop: inline) */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-[10px] sm:text-xs text-gray-600 mt-1">
              <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-blue-200 text-blue-800 rounded-full text-[10px] sm:text-xs font-medium border border-blue-300">
                {post.author.category || 'Community'}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center space-x-1">
                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-600" />
                <span className="font-semibold text-[10px] sm:text-xs">{post.author.memberCount?.toLocaleString() || '0'} members</span>
              </span>
            </div>
          </div>
        </div>
        <button className={buttonStyles.icon.small}>
          <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        </button>
      </div>

      {/* Post Image - Instagram Style with Community Overlay and Fixed Height */}
      <div className="relative w-full">
        <img
          src={post.content.image}
          alt="Community post content"
          className="w-full h-48 sm:h-56 md:h-64 lg:h-80 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop";
          }}
        />
        {/* Community Post Indicator Overlay */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold shadow-lg border border-white">
          Community Post
        </div>
      </div>

      {/* Post Actions - Instagram Style */}
      <div className="p-2.5 sm:p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button className={buttonStyles.icon.small}>
              <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 hover:text-red-500 transition-colors" />
            </button>
            <button className={buttonStyles.icon.small}>
              <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 hover:text-blue-500 transition-colors" />
            </button>
            <button className={buttonStyles.icon.small}>
              <Share2 className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 hover:text-green-500 transition-colors" />
            </button>
          </div>
          <button className={buttonStyles.icon.small}>
            <Bookmark className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 hover:text-gray-800 transition-colors" />
          </button>
        </div>

        {/* Likes Count - Instagram Style */}
        <p className="font-semibold text-gray-900 text-[10px] sm:text-sm mb-2">{post.content.likes.toLocaleString()} likes</p>

        {/* Post Text - Instagram Style with STRONG Community Highlighting */}
        <div className="mb-2">
          <p className="text-gray-900 text-[8px] sm:text-sm leading-relaxed">
            <span className="font-semibold text-blue-600 bg-blue-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs">{post.author.name}</span> {post.content.text}
          </p>
        </div>

        {/* Comments Preview - Instagram Style */}
        <button className="text-gray-500 text-[10px] sm:text-sm hover:text-blue-600 transition-colors mb-2">
          View all {post.content.comments} comments
        </button>

        {/* Timestamp - Instagram Style */}
        <p className="text-gray-400 text-xs mb-3">{post.content.timestamp}</p>
        
        {/* Go to Community Button */}
        <button 
          onClick={() => onNavigate(`/community/${post.author.id}`)}
          className={buttonStyles.primary.blue}
        >
          <Users className="w-4 h-4" />
          <span>Go to {post.author.name}</span>
        </button>
      </div>
    </div>
  );

  const FanclubPostCard = ({ post, onNavigate }: { post: any; onNavigate: (path: string) => void }) => (
    <div className="bg-white border border-gray-200 mb-4 sm:mb-6 overflow-hidden w-full max-w-[37rem] mx-auto rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Fanclub Post Header - Instagram Style with STRONG Fanclub Highlighting */}
      <div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-200 bg-gradient-to-r from-purple-100 to-pink-100">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="relative">
            <img
              src={post.author.profileImage}
              alt={post.author.name}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-3 border-purple-300 shadow-md"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = fallbackImages[4];
              }}
            />
            {/* LARGE Fanclub Badge - More Prominent */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-7 sm:h-7 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center border-3 border-white shadow-lg">
              <Crown className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            {/* Line 1: Profile name + verification badge (always on same line) */}
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900 text-sm sm:text-base flex-1 min-w-0">{post.author.name}</h3>
              {post.author.isVerified && (
                <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                </div>
              )}
            </div>
            {/* Line 2: Category + Member count (mobile: stacked, desktop: inline) */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-[10px] sm:text-xs text-gray-600 mt-1">
              <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-purple-200 text-purple-800 rounded-full text-[10px] sm:text-xs font-medium border border-purple-300">
                {post.author.category || 'Fanclub'}
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center space-x-1">
                <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" />
                <span className="font-semibold text-[10px] sm:text-xs">{post.author.memberCount?.toLocaleString() || '0'} fans</span>
              </span>
            </div>
          </div>
        </div>
        <button className={buttonStyles.icon.small}>
          <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
        </button>
      </div>

      {/* Post Image - Instagram Style with Fanclub Overlay and Fixed Height */}
      <div className="relative w-full">
        <img
          src={post.content.image}
          alt="Fanclub post content"
          className="w-full h-48 sm:h-56 md:h-64 lg:h-80 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = "https://images.unsplash.com/photo-1635805737707-575885abab0b?w=800&h=600&fit=crop";
          }}
        />
        {/* Fanclub Post Indicator Overlay */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs font-bold shadow-lg border border-white">
          👑 Fanclub Post
        </div>
      </div>

      {/* Post Actions - Instagram Style */}
      <div className="p-2.5 sm:p-3">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button className={buttonStyles.icon.small}>
              <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 hover:text-red-500 transition-colors" />
            </button>
            <button className={buttonStyles.icon.small}>
              <MessageCircle className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 hover:text-blue-500 transition-colors" />
            </button>
            <button className={buttonStyles.icon.small}>
              <Share2 className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 hover:text-green-500 transition-colors" />
            </button>
          </div>
          <button className={buttonStyles.icon.small}>
            <Bookmark className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 hover:text-gray-800 transition-colors" />
          </button>
        </div>

        {/* Likes Count - Instagram Style */}
        <p className="font-semibold text-gray-900 text-[10px] sm:text-sm mb-2">{post.content.likes.toLocaleString()} likes</p>

        {/* Post Text - Instagram Style with STRONG Fanclub Highlighting */}
        <div className="mb-2">
          <p className="text-gray-900 text-[8px] sm:text-sm leading-relaxed">
            <span className="font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">{post.author.name}</span> {post.content.text}
          </p>
        </div>

        {/* Comments Preview - Instagram Style */}
        <button className="text-gray-500 text-[10px] sm:text-sm hover:text-purple-600 transition-colors mb-2">
          View all {post.content.comments} comments
        </button>

        {/* Timestamp - Instagram Style */}
        <p className="text-gray-400 text-xs mb-3">{post.content.timestamp}</p>
        
        {/* Go to Fanclub Button */}
        <button 
          onClick={() => onNavigate(`/fanclub/${post.author.id}`)}
          className={buttonStyles.primary.purple}
        >
          <Crown className="w-4 h-4" />
          <span>Go to {post.author.name}</span>
        </button>
      </div>
    </div>
  );

  // Friendship Match Recommendation Card - Professional Friendship Design
  const FriendshipMatchCard = ({ profile }: { profile: any }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 w-full max-w-[37rem] mx-auto hover:shadow-xl transition-all duration-300">
      {/* Profile Header - Top Left Circular Image */}
      <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
        <div className="relative">
          <img
            src={profile.profileImage}
            alt={profile.name}
            className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full object-cover border-4 border-white shadow-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = fallbackImages[0];
            }}
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
            <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-800">{profile.name}</h3>
            <div className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-yellow-500" />
              {profile.matchPercentage}%
            </div>
          </div>
          <p className="text-gray-600 text-[10px] sm:text-sm font-medium mb-1">{profile.age} years old</p>
          <p className="text-gray-500 text-[10px] sm:text-sm flex items-center">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {profile.location}
          </p>
        </div>
      </div>

      {/* About Section */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-500" />
          About
        </h4>
        <p className="text-gray-700 text-[10px] sm:text-sm leading-relaxed italic bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-100">
          "{profile.bio}"
        </p>
      </div>

      {/* Common Interests */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
          <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-500" />
          Common Favorites
        </h4>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {(profile.commonFavorites || []).slice(0, 4).map((favorite: string, index: number) => (
            <span key={index} className="px-2 py-0.5 sm:px-3 sm:py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
              {favorite}
            </span>
          ))}
        </div>
      </div>

      {/* Mutual Connections */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
          <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-green-500" />
          Mutual Connections
        </h4>
        <div className="flex items-center">
          {(profile.mutualFriendsList || []).slice(0, 6).map((friend: any, index: number) => (
            <div key={friend.id} className="relative group" style={{ marginLeft: index === 0 ? '0' : '-8px' }}>
              <img
                src={friend.image}
                alt={friend.name}
                className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform duration-200"
                onError={(e) => handleImageError(e, 0)}
              />
              <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {friend.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
        <button 
          onClick={() => handleViewProfile(profile)}
          className="flex-1 py-2.5 sm:py-3 px-4 sm:px-5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm sm:text-base"
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 sm:mr-3" />
          View Profile
        </button>
        <button className="flex-1 py-2.5 sm:py-3 px-4 sm:px-5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base">
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 sm:mr-3" />
          Message
        </button>
      </div>
    </div>
  );

  // Community Recommendation Card - Professional Community Design
  const CommunityRecommendationCard = ({ community }: { community: any }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 w-full max-w-[37rem] mx-auto hover:shadow-xl transition-all duration-300">
      {/* Profile Header - Top Left Circular Image */}
      <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
        <div className="relative">
          <img
            src={community.photo}
            alt={community.name}
            className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full object-cover border-4 border-white shadow-lg"
            onError={(e) => handleImageError(e, 0)}
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
            <Check className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-800">{community.name}</h3>
            <div className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm font-semibold">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-yellow-500" />
              {community.matchPercentage}%
            </div>
          </div>
          <p className="text-gray-600 text-[10px] sm:text-sm font-medium mb-1">{community.category}</p>
          <p className="text-gray-500 text-[10px] sm:text-sm flex items-center">
            <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Community
          </p>
        </div>
      </div>

      {/* About Section */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-500" />
          About
        </h4>
        <p className="text-gray-700 text-[10px] sm:text-sm leading-relaxed italic bg-gray-50 p-2 sm:p-3 rounded-lg border border-gray-100">
          {community.description}
        </p>
      </div>

      {/* Common Interests */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3 flex items-center">
          <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-blue-500" />
          Common Favorites
        </h4>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {(community.commonFavorites || []).slice(0, 4).map((favorite: string, index: number) => (
            <span key={index} className="px-2 py-0.5 sm:px-3 sm:py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
              {favorite}
            </span>
          ))}
        </div>
      </div>

      {/* Mutual Connections */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <Users className="w-4 h-4 mr-2 text-green-500" />
          Mutual Connections
        </h4>
        <div className="flex items-center">
          {(community.mutualFriendsList || []).slice(0, 6).map((friend: any, index: number) => (
            <div key={friend.id} className="relative group" style={{ marginLeft: index === 0 ? '0' : '-12px' }}>
              <img
                src={friend.image}
                alt={friend.name}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = fallbackImages[0];
                }}
              />
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                {friend.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Statistics - Key Differentiator */}
      <div className="mb-6 p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <Building2 className="w-4 h-4 mr-2 text-cyan-500" />
          Community Statistics
        </h4>
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">Total Members:</span>
          <span className="text-xl font-bold text-cyan-600">{(community.members || community.memberCount || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2 sm:space-x-3">
        <button 
          onClick={() => handleViewCommunity(community)}
          className="flex-1 py-2.5 sm:py-3 px-4 sm:px-5 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors text-sm sm:text-base"
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 sm:mr-3" />
          View Community
        </button>
        <button className="flex-1 py-2.5 sm:py-3 px-4 sm:px-5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base">
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2 sm:mr-3" />
          Preview
        </button>
      </div>
    </div>
  );

  // Fanclub Recommendation Card - Properly Designed with Consistent Sizing
  const FanclubRecommendationCard = ({ fanclub }: { fanclub: any }) => (
    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 rounded-2xl shadow-xl border-2 border-purple-200 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 w-full max-w-[37rem] mx-auto hover:shadow-2xl transition-all duration-300 group">
      {/* Profile Header - Top Left Circular Image with Consistent Spacing */}
      <div className="flex items-start space-x-3 sm:space-x-4 mb-4 sm:mb-6">
        <div className="relative flex-shrink-0">
          <img
            src={fanclub.photo}
            alt={fanclub.name}
            className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full object-cover border-4 border-white shadow-2xl group-hover:shadow-purple-300 transition-all duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = fallbackImages[4];
            }}
          />
          {/* Star Badge - Properly Positioned */}
          <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            <Star className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 text-white" />
          </div>
        </div>
        
        {/* Header Content - Consistent with Other Cards */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col space-y-2 sm:space-y-3">
            {/* Title and Match Percentage */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm sm:text-base font-bold text-gray-800 group-hover:text-purple-700 transition-colors leading-tight flex-1 min-w-0">
                {fanclub.name}
              </h3>
              <div className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 rounded-full text-xs sm:text-sm font-semibold border border-pink-200 shadow-sm flex-shrink-0">
                <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-pink-500" />
                {fanclub.matchPercentage}% Match
              </div>
            </div>
            
            {/* Category and Type */}
            <div className="space-y-1">
              <p className="text-gray-600 text-[10px] sm:text-sm font-medium">
                {fanclub.category}
              </p>
              <div className="flex items-center text-purple-600 text-[10px] sm:text-sm font-semibold">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                Fanclub Community
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* About Section - Consistent with Other Cards */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <User className="w-4 h-4 mr-2 text-pink-500" />
          About This Fanclub
        </h4>
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg border border-pink-200 shadow-sm">
          <p className="text-gray-700 text-[10px] sm:text-sm leading-relaxed italic">
            {fanclub.description}
          </p>
        </div>
      </div>

      {/* Common Favorites - Consistent with Other Cards */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <Star className="w-4 h-4 mr-2 text-purple-500" />
          Common Favorites
        </h4>
        <div className="flex flex-wrap gap-2">
          {(fanclub.commonFavorites || []).slice(0, 4).map((favorite: string, index: number) => (
            <span key={index} className="px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 text-xs font-medium rounded-full border border-pink-200 hover:from-pink-200 hover:to-purple-200 transition-all duration-200 shadow-sm">
              {favorite}
            </span>
          ))}
        </div>
      </div>

      {/* Mutual Connections - Consistent with Other Cards */}
      <div className="mb-4 sm:mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <Users className="w-4 h-4 mr-2 text-purple-500" />
          Mutual Connections
        </h4>
        <div className="flex items-center space-x-1">
          {(fanclub.mutualFriendsList || []).slice(0, 6).map((friend: any, index: number) => (
            <div key={friend.id} className="relative group" style={{ marginLeft: index === 0 ? '0' : '-8px' }}>
              <img
                src={friend.profileImage || friend.image}
                alt={friend.name}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform duration-200 group-hover:shadow-purple-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = fallbackImages[0];
                }}
              />
              {/* Tooltip */}
              <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-purple-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                {friend.name}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-800"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fanclub Statistics - Consistent with Other Cards */}
      <div className="mb-4 sm:mb-6 p-4 bg-gradient-to-r from-pink-100 via-purple-100 to-orange-100 rounded-lg border-2 border-pink-200 shadow-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
          <Users className="w-4 h-4 mr-2 text-pink-500" />
          Fanclub Statistics
        </h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 text-sm font-medium">Total Members:</span>
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {(fanclub.members || fanclub.memberCount || 0).toLocaleString()}
            </span>
          </div>
          <div className="text-xs text-purple-600 font-medium bg-white bg-opacity-50 px-2 py-1 rounded text-center">
            🎉 Most Active Fanclub This Week!
          </div>
        </div>
      </div>

      {/* Action Buttons - Consistent with Other Cards */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
        <button 
          onClick={() => handleViewFanclub(fanclub)}
          className="w-full sm:flex-1 py-2.5 sm:py-3 px-4 sm:px-5 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center"
        >
          <UserPlus className="w-4 h-4 sm:w-5 sm:w-5 mr-2 sm:mr-3" />
          View Fanclub
        </button>
        <button className="w-full sm:flex-1 py-2.5 sm:py-3 px-4 sm:px-5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full font-medium hover:from-purple-200 hover:to-pink-200 transition-all duration-200 text-sm sm:text-base border border-purple-200 flex items-center justify-center">
          <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3" />
          Preview
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Initialize messaging service
  useEffect(() => {
    const initializeMessaging = async () => {
      try {
        await messagingService.initialize(userId);
        const userConversations = await messagingService.getConversations(userId);
        setConversations(userConversations);
        setIsMessagingInitialized(true);
      } catch (error) {
        console.error('Failed to initialize messaging:', error);
      }
    };

    if (userId && !isMessagingInitialized) {
      initializeMessaging();
    }
  }, [userId, isMessagingInitialized]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await DashboardService.getDashboardData(userId);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };



  // Image error handling function

  const addDemoNotification = (message: string) => {
    setDemoNotifications((prev: string[]) => [...prev, message]);
    setTimeout(() => {
      setDemoNotifications((prev: string[]) => prev.filter(n => n !== message));
    }, 4000);
  };

  const handleCommunityAction = (action: string, communityId: string) => {
            addDemoNotification(`${action} action completed!`);
  };

  const handleViewCommunity = (community: any) => {
    setSelectedCommunity(community);
    setShowCommunityProfileModal(true);
  };

  const handleViewFanclub = (fanclub: any) => {
    setSelectedFanclub(fanclub);
    setShowFanclubProfileModal(true);
  };

  // Messaging Service Functions
  const handleSendMessage = useCallback(async (conversationId: string, message: Omit<Message, 'id' | 'timestamp' | 'status'>) => {
    try {
      const fullMessage: Message = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date(),
        status: 'sent' as const
      };
      const newMessage = await messagingService.sendMessage(conversationId, fullMessage);
      // Update conversations state
      setConversations(prev => prev.map(conv => 
        conv.conversation.id === conversationId 
          ? { ...conv, messages: [...conv.messages, newMessage] }
          : conv
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, []);

  const handleMarkAsRead = useCallback(async (conversationId: string) => {
    try {
      await messagingService.markConversationAsRead(conversationId);
      setConversations(prev => prev.map(conv => 
        conv.conversation.id === conversationId 
          ? { ...conv, conversation: { ...conv.conversation, unreadCount: 0 } }
          : conv
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      await messagingService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.conversation.id !== conversationId));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, []);

  const handleBlockUser = useCallback(async (conversationId: string) => {
    try {
      await messagingService.blockUser(conversationId);
      addDemoNotification('User blocked successfully');
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  }, []);

  const handleReportUser = useCallback(async (conversationId: string) => {
    try {
      await messagingService.reportUser(conversationId, 'Inappropriate behavior');
      addDemoNotification('User reported successfully');
    } catch (error) {
      console.error('Failed to report user:', error);
    }
  }, []);

  const handleStartVideoCall = useCallback(async (conversationId: string) => {
    try {
      await messagingService.startVideoCall(conversationId);
      addDemoNotification('Video call started');
    } catch (error) {
      console.error('Failed to start video call:', error);
    }
  }, []);

  const handleStartVoiceCall = useCallback(async (conversationId: string) => {
    try {
      await messagingService.startVoiceCall(conversationId);
      addDemoNotification('Voice call started');
    } catch (error) {
      console.error('Failed to start voice call:', error);
    }
  }, []);

  const handleShareLocation = useCallback(async (conversationId: string) => {
    try {
      const location = { name: 'Current Location', lat: 0, lng: 0 };
      await messagingService.shareLocation(conversationId, location);
      addDemoNotification('Location shared successfully');
    } catch (error) {
      console.error('Failed to share location:', error);
    }
  }, []);

  const handleSendDateInvite = useCallback(async (conversationId: string, dateDetails: any) => {
    try {
      await messagingService.sendDateInvite(conversationId, dateDetails);
      addDemoNotification('Date invite sent successfully');
    } catch (error) {
      console.error('Failed to send date invite:', error);
    }
  }, []);

  const handleSendAIEnhancedMessage = useCallback(async (conversationId: string, prompt: string) => {
    try {
      await messagingService.sendAIEnhancedMessage(conversationId, prompt);
      addDemoNotification('AI enhanced message sent');
    } catch (error) {
      console.error('Failed to send AI enhanced message:', error);
    }
  }, []);

  const refreshData = () => {
    setIsRefreshing(true);
    loadDashboardData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-gray-600 font-medium">Loading your social world...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 sm:py-3 md:py-4 space-y-2 sm:space-y-0">
            {/* Left Section - Brand & Back Button */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 w-full sm:w-auto">
              <button 
                onClick={() => onNavigate('landing')}
                className="p-1 sm:p-1.5 md:p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-75 flex-shrink-0"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 flex-1 sm:flex-none">
                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  BrandBond
                </span>
                <div className="ml-1 sm:ml-2 md:ml-3 px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-gradient-to-r from-blue-400 to-cyan-500 text-white text-xs sm:text-sm font-bold rounded-full shadow-lg flex-shrink-0">
                  FRIENDS MODE
                </div>
              </div>
            </div>

            {/* Right Section - Action Buttons (Hidden on mobile, shown on desktop) */}
            <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 w-full sm:w-auto justify-end">
              {/* Action Icons - Stacked on mobile, horizontal on larger screens */}
              <div className="flex items-center space-x-2 md:space-x-3">
                {/* Notifications Icon */}
                <button
                  onClick={() => setShowNotificationsModal(true)}
                  className="flex items-center justify-center p-2 md:p-2.5 lg:p-3 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group relative"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bell className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  {demoNotifications.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-red-500 text-white text-xs rounded-full w-4.5 h-4.5 md:w-5 md:h-5 flex items-center justify-center font-bold shadow-lg">
                      {demoNotifications.length > 9 ? '9+' : demoNotifications.length}
                    </span>
                  )}
              </button>

                {/* Search Icon */}
              <button 
                  onClick={() => setActiveTab('matches')}
                  className="flex items-center justify-center p-2 md:p-2.5 lg:p-3 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group"
              >
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Search className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
              </button>

                {/* Communities & Fanclubs Icon */}
                <button
                  onClick={() => setActiveTab('communities')}
                  className="flex items-center justify-center p-2 md:p-2.5 lg:p-3 bg-white/80 backdrop-blur-sm rounded-full border border-blue-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
                </button>


              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Information Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-100 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-blue-800">
                  Welcome to the Friends Universe!
                </p>
                <p className="text-[10px] sm:text-xs text-blue-600">
                  Discover communities, build friendships, and share interests
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button 
                onClick={refreshData}
                className="px-2 sm:px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[10px] sm:text-xs rounded-full hover:shadow-md transition-all duration-200"
              >
                Refresh Data
              </button>
              <button 
                onClick={() => onNavigate('love-dashboard')}
                className="px-2 sm:px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] sm:text-xs rounded-full hover:shadow-md transition-all duration-200"
              >
                Switch to Love
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Top Action Icons Bar - Friends Universe Style */}
      <div className="sm:hidden bg-white/80 backdrop-blur-md border-b border-blue-200 z-40">
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-around space-x-1">
            <button 
              onClick={() => setShowNotificationsModal(true)}
              className="flex flex-col items-center justify-center p-2 bg-white/90 backdrop-blur-sm rounded-lg border border-blue-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group relative"
            >
              <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
                <Bell className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] text-blue-600 font-medium">Notifications</span>
              {demoNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold shadow-lg">
                  {demoNotifications.length > 9 ? '9+' : demoNotifications.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('matches')}
              className="flex flex-col items-center justify-center p-2 bg-white/90 backdrop-blur-sm rounded-lg border border-blue-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group relative"
            >
              <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
                <Search className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] text-blue-600 font-medium">Search</span>
            </button>
            <button 
              onClick={() => setActiveTab('communities')}
              className="flex flex-col items-center justify-center p-2 bg-white/90 backdrop-blur-sm rounded-lg border border-blue-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group relative"
            >
              <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-teal-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform mb-1">
                <Users className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] text-blue-600 font-medium">Communities & Fanclubs</span>
            </button>

          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 sm:pb-6">
        {/* Desktop Tab Navigation - Hidden on Mobile */}
        <div className="hidden sm:flex space-x-1 bg-white/60 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-blue-200 mb-6 sm:mb-8">
          {[
            { id: 'overview', label: 'Social Overview', icon: Users },
            { id: 'matches', label: 'Friendship Matches', icon: Star },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'requests', label: 'Friend Requests', icon: UserPlus, badge: friendRequestsData.length },
            { id: 'communities', label: 'Communities & Fanclubs', icon: Home },
            { id: 'events', label: 'Events', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-white/80'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-blue-200 overflow-hidden">
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
                                  <span className="text-blue-700 font-semibold text-xs">{profile.matchPercentage}% Match</span>
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
                          <div className="bg-white/80 rounded-xl p-3 text-center hover:shadow-md transition-all duration-200 hover:scale-105 group">
                            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                              <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-800 text-sm mb-1">Trending Up</h4>
                            <p className="text-xs text-gray-600">Score increasing daily!</p>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3 text-center hover:shadow-md transition-all duration-200 hover:scale-105 group">
                            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                              <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-800 text-sm mb-1">High Potential</h4>
                            <p className="text-xs text-gray-600">Quality matches!</p>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3 text-center hover:shadow-md transition-all duration-200 hover:scale-105 group">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                              <Zap className="w-5 h-5 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-800 text-sm mb-1">Active</h4>
                            <p className="text-xs text-gray-600">Getting noticed!</p>
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
                                  <p className="text-xs text-gray-600">{community.matchPercentage}% Match</p>
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
                    onClick={() => setFriendshipMatchesSubTab('your-friends')}
                    className={`${friendshipMatchesSubTab === 'your-friends' ? buttonStyles.tab.active : buttonStyles.tab.inactive}`}
                  >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Your Friends</span>
                  </button>
                  <button 
                    onClick={() => setFriendshipMatchesSubTab('find-friends')}
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
            <div className="h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)]">
              {isMessagingInitialized ? (
                <ChatSystem
                  userId={userId}
                  conversations={conversations}
                  theme="friends"
                  currentUserProfile={{
                    id: userId,
                    name: "Current User",
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
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 via-cyan-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Messages</h3>
                    <p className="text-gray-600 text-sm">Initializing your chat system...</p>
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
                            {request.matchPercentage}% Match
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
                    onClick={() => setCommunitiesSubTab('your-groups')}
                    className={`${communitiesSubTab === 'your-groups' ? buttonStyles.tab.active : buttonStyles.tab.inactive}`}
                  >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />
                    <span className="text-xs sm:text-sm">Your Communities & Fanclubs</span>
                  </button>
                  <button 
                    onClick={() => setCommunitiesSubTab('explore-new')}
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
            <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
              <div className="text-center mb-4 sm:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                  Community Events
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">Join exciting events and meet new friends</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {[
                  { title: 'Tech Meetup', date: 'Tomorrow', attendees: 45, description: 'Latest in AI and Machine Learning' },
                  { title: 'Music Jam Session', date: 'This Weekend', attendees: 23, description: 'Bring your instruments and join the fun!' }
                ].map((event, i) => (
                  <div key={i} className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 border border-cyan-200">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">{event.title}</h3>
                    <p className="text-gray-600 text-sm sm:text-base mb-2 sm:mb-3">{event.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 space-y-1 sm:space-y-0">
                      <span>{event.date}</span>
                      <span>{event.attendees} attending</span>
                    </div>
                    <button className="w-full py-2 sm:py-2.5 px-3 sm:px-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-lg sm:rounded-xl font-medium hover:shadow-lg transition-all duration-200 text-sm sm:text-base">
                      Interested
                    </button>
                  </div>
                ))}
              </div>
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
        <div className="flex items-center justify-around py-2.5">
          {[
            { id: 'overview', label: 'Overview', icon: Users },
            { id: 'matches', label: 'Matches', icon: Star },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'requests', label: 'Requests', icon: UserPlus, badge: friendRequestsData.length },
            { id: 'communities', label: 'Communities & Fanclubs', icon: Home },
            { id: 'events', label: 'Events', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center space-y-1 py-2 px-2 sm:px-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    activeTab === tab.id ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                  {tab.badge && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs font-medium ${
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

