import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Heart, Users, MessageCircle, Search, Settings, Home, Compass, Calendar, Star, Music, Film, Book, MapPin, Utensils, ShoppingBag, Gamepad2, Youtube, Trophy, Plane, Camera, Coffee, Headphones, Tv, Palette, Zap, Globe, Smartphone, Gift, Sparkles, Target, TrendingUp, X, Send, ThumbsUp, Bookmark, Bell, User, ChevronRight, ChevronLeft, DollarSign, ArrowRight, ArrowLeft } from 'lucide-react';
import DashboardService from '../services/dashboardService';
import ChatSystem from './ChatSystem';
import messagingService, { ConversationWithProfile, Message } from '../services/messagingService';
import ProfileModal from './ProfileModal';
import DatePlanningModal from './DatePlanningModal';
import NotificationsPanel from './NotificationsPanel';
import ChatInterface from './ChatInterface';
import MainDashboard from './MainDashboard';

interface LoveDashboardProps {
  userId: string;
  onNavigate: (page: string) => void;
}

const LoveDashboard: React.FC<LoveDashboardProps> = ({ userId, onNavigate }) => {
  // Fallback image URLs for when Unsplash images fail to load
  const fallbackImages = [
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=500&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500&h=500&fit=crop&crop=face"
  ];

  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demoNotifications, setDemoNotifications] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Demo mode states for love universe
  const [totalMatches, setTotalMatches] = useState(47);
  const [peopleNearby, setPeopleNearby] = useState(23);
  const [compatibilityScore, setCompatibilityScore] = useState(92);
  const [romanticInterests, setRomanticInterests] = useState(18);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // User action states for saving profiles
  const [likedProfiles, setLikedProfiles] = useState<any[]>([]);
  const [lovedProfiles, setLovedProfiles] = useState<any[]>([]);
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
  
  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: 1,
      type: 'new_match',
              title: 'New Match! <i className="fas fa-party-horn text-yellow-500"></i>',
      message: 'You have a new 94% match with Priya Sharma!',
      profile: {
        id: 101,
        name: "Priya Sharma",
        age: 26,
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
      type: 'date_request',
      title: 'New Date Request! 💕',
      message: 'Ananya Patel wants to plan a coffee date with you!',
      profile: {
        id: 102,
        name: "Ananya Patel",
        age: 28,
        location: "Delhi, NCR",
        photos: [fallbackImages[1]],
        matchPercentage: 89
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      isRead: false,
      action: 'view_date_request'
    },
    {
      id: 3,
      type: 'message',
      title: 'New Message! 💬',
      message: 'Zara Khan sent you a new message',
      profile: {
        id: 103,
        name: "Zara Khan",
        age: 25,
        location: "Bangalore, Karnataka",
        photos: [fallbackImages[2]],
        matchPercentage: 87
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      isRead: false,
      action: 'open_chat'
    },
    {
      id: 4,
      type: 'date_accepted',
      title: 'Date Accepted! 🎊',
      message: 'Your coffee date with Kavya Reddy has been confirmed!',
      profile: {
        id: 104,
        name: "Kavya Reddy",
        age: 27,
        location: "Hyderabad, Telangana",
        photos: [fallbackImages[3]],
        matchPercentage: 92
      },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      isRead: false,
      action: 'view_date_details'
    },
    {
      id: 5,
      type: 'profile_view',
      title: 'Profile Viewed! 👀',
      message: 'Someone viewed your profile recently',
      profile: null,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
      isRead: false,
      action: 'view_insights'
    }
  ]);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(5);
  
  // Date requests state
  const [dateRequests, setDateRequests] = useState<any[]>([
    {
      id: 1,
      fromProfile: {
        id: 101,
        name: "Priya Sharma",
        age: 26,
        location: "Mumbai, Maharashtra",
        photos: [
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500&h=500&fit=crop&crop=face"
        ],
        matchPercentage: 94,
        commonInterests: ["Taylor Swift", "Travel Photography", "Yoga", "Coffee", "Adventure Sports", "Reading"],
        allTimeFavorites: {
          singers: ["Taylor Swift", "Arijit Singh", "Ed Sheeran"],
          movies: ["La La Land", "The Notebook", "Before Sunrise"],
          food: ["Biryani", "Pizza", "Sushi"],
          books: ["The Alchemist", "Pride and Prejudice", "The Great Gatsby"],
          hobbies: ["Photography", "Yoga", "Travel", "Cooking", "Reading", "Music"]
        },
        bio: "Adventure seeker who loves exploring new places and trying different cuisines. Looking for someone who shares my passion for life and growth."
      },
      requestType: "Coffee Date",
      message: "Hey! I'd love to grab coffee with you sometime. I noticed we both love Taylor Swift and travel photography. Would love to hear about your adventures! ☕✨",
      proposedDate: "This weekend",
      proposedTime: "Saturday afternoon",
      proposedLocation: "Starbucks, Bandra West",
      status: "pending", // pending, accepted, declined
      timestamp: "2024-12-19T10:00:00Z",
      isRead: false
    },
    {
      id: 2,
      fromProfile: {
        id: 102,
        name: "Ananya Patel",
        age: 28,
        location: "Delhi, NCR",
        photos: [
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&h=500&fit=crop&crop=face"
        ],
        matchPercentage: 89,
        commonInterests: ["Arijit Singh", "Italian Food", "Painting", "Netflix", "Reading", "Art"],
        allTimeFavorites: {
          singers: ["Arijit Singh", "Shreya Ghoshal", "Atif Aslam"],
          movies: ["Dilwale Dulhania Le Jayenge", "Jab We Met", "Yeh Jawaani Hai Deewani"],
          food: ["Pizza", "Pasta", "Biryani", "Butter Chicken"],
          books: ["The Kite Runner", "To Kill a Mockingbird", "The Book Thief"],
          hobbies: ["Painting", "Cooking", "Reading", "Travel", "Photography", "Music"]
        },
        bio: "Creative soul who finds beauty in everyday moments. Love deep conversations and meaningful connections."
      },
      requestType: "Dinner Date",
      message: "Hi there! I'm really impressed by your profile. Would you be interested in having dinner together? I know this amazing Italian place in Connaught Place. 🍝💕",
      proposedDate: "Next Friday",
      proposedTime: "7:30 PM",
      proposedLocation: "Olive Bar & Kitchen, Mehrauli",
      status: "pending",
      timestamp: "2024-12-18T15:30:00Z",
      isRead: true
    },
    {
      id: 3,
      fromProfile: {
        id: 103,
        name: "Zara Khan",
        age: 25,
        location: "Bangalore, Karnataka",
        photos: [
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop&crop=face"
        ],
        matchPercentage: 91,
        commonInterests: ["Ed Sheeran", "Movies", "Books", "Gaming", "Fitness", "Technology"],
        allTimeFavorites: {
          singers: ["Ed Sheeran", "Post Malone", "Dua Lipa"],
          movies: ["Inception", "Interstellar", "The Dark Knight"],
          food: ["Burgers", "Sushi", "Street Food", "Desserts"],
          books: ["1984", "The Hobbit", "Harry Potter Series"],
          hobbies: ["Gaming", "Fitness", "Technology", "Reading", "Movies", "Travel"]
        },
        bio: "Tech enthusiast who believes in work-life balance. Looking for someone who can keep up with my energy and share my dreams."
      },
      requestType: "Movie Date",
      message: "Hello! I see we both love movies and books. There's this new romantic comedy releasing this weekend. Would you like to watch it together? 🎬📚",
      proposedDate: "This Sunday",
      proposedTime: "3:00 PM",
      proposedLocation: "PVR, Forum Mall, Koramangala",
      status: "pending",
      timestamp: "2024-12-17T12:00:00Z",
      isRead: false
    }
  ]);

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

  // Update unread count when notifications change
  useEffect(() => {
    updateUnreadCount();
  }, [notifications]);

  // Check daily challenge reset
  useEffect(() => {
    checkDailyReset();
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

  // Love Challenge state and logic
  const [dailyChallenge, setDailyChallenge] = useState({
    id: 1,
    type: 'send_messages',
    title: 'Send thoughtful messages to 3 potential matches today!',
    target: 3,
    completed: 0,
    reward: '50 Love Points + Profile Boost',
    isCompleted: false,
    lastReset: new Date().toDateString(),
    progress: [] as Array<{
      profileId: number;
      profileName: string;
      message: string;
      timestamp: string;
      type: string;
    }>
  });

  const [challengeHistory, setChallengeHistory] = useState<any[]>([]);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeRewards, setChallengeRewards] = useState<any[]>([]);

  // Mutual Match System - "It's a Match" Feature
  const [mutualMatches, setMutualMatches] = useState<any[]>([]);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<any>(null);
  const [userInteractions, setUserInteractions] = useState<{
    [profileId: number]: {
      hasMessaged: boolean;
      hasDateRequested: boolean;
      timestamp: string;
    }
  }>({});
  const [otherPartyInteractions, setOtherPartyInteractions] = useState<{
    [profileId: number]: {
      hasMessaged: boolean;
      hasDateRequested: boolean;
      timestamp: string;
    }
  }>({});

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

  // Information Collection Popup System - Subtle Data Gathering
  const [showPersonalityPopup, setShowPersonalityPopup] = useState(false);
  const [showDatingPopup, setShowDatingPopup] = useState(false);
  const [personalityData, setPersonalityData] = useState({
    communicationStyle: '',
    socialPreferences: '',
    lifeGoals: '',
    values: '',
    lifestyle: ''
  });
  const [datingData, setDatingData] = useState({
    children: '',
    dealBreakers: [] as string[],
    firstDatePreferences: '',
    communicationFrequency: '',
    meetingPace: '',
    physicalIntimacy: '',
    futurePlanning: ''
  });
  const [popupShownCount, setPopupShownCount] = useState(0);
  const [lastPopupTime, setLastPopupTime] = useState<number>(0);

  // Memoized values for performance optimization
  const unreadNotificationsCount = useMemo(() => 
    notifications.filter(notif => !notif.isRead).length, 
    [notifications]
  );

  const totalNotificationsCount = useMemo(() => notifications.length, [notifications]);
  
  const hasUnreadDateRequests = useMemo(() => 
    dateRequests.some(request => !request.isRead), 
    [dateRequests]
  );

  const unreadDateRequestsCount = useMemo(() => 
    dateRequests.filter(request => !request.isRead).length, 
    [dateRequests]
  );

  // Function to get a working image URL with fallback - Memoized for performance
  const getWorkingImageUrl = useCallback((originalUrl: string, index: number) => {
    // Check if the original URL contains the problematic photo ID
    if (originalUrl.includes('1494790108755-2616b612b786')) {
      return fallbackImages[index % fallbackImages.length];
    }
    return originalUrl;
  }, [fallbackImages]);

  // Notification functions - Optimized with useCallback for performance
  const markNotificationAsRead = useCallback((notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
    updateUnreadCount();
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
    setUnreadNotifications(0);
  }, []);

  const deleteNotification = useCallback((notificationId: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    updateUnreadCount();
  }, []);

  const updateUnreadCount = useCallback(() => {
    const unreadCount = notifications.filter(notif => !notif.isRead).length;
    setUnreadNotifications(unreadCount);
  }, [notifications]);

  const handleNotificationAction = useCallback((notification: any) => {
    // Mark as read first
    markNotificationAsRead(notification.id);
    
    // Handle different notification actions
    switch (notification.action) {
      case 'view_profile':
        if (notification.profile) {
          setSelectedProfile(notification.profile);
          setShowProfileModal(true);
        }
        break;
      case 'view_date_request':
        setActiveTab('date-requests');
        break;
      case 'open_chat':
        if (notification.profile) {
          setActiveChat(notification.profile);
          setActiveTab('messages');
        }
        break;
      case 'view_date_details':
        setActiveTab('dates');
        break;
      case 'view_insights':
        setActiveTab('overview');
        break;
      case 'view_rewards':
        setShowChallengeModal(true);
        break;
      case 'view_match':
        // Find the mutual match and show the popup
        const matchNotification = notifications.find(n => n.id === notification.id);
        if (matchNotification && matchNotification.profile) {
          const match = mutualMatches.find(m => m.profile.id === matchNotification.profile.id);
          if (match) {
            setCurrentMatch(match);
            setShowMatchPopup(true);
          }
        }
        break;
    }
    
    // Close notifications modal
    setShowNotificationsModal(false);
  }, [markNotificationAsRead, notifications, mutualMatches]);

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

  // Love Challenge functions
  const checkDailyReset = () => {
    const today = new Date().toDateString();
    if (dailyChallenge.lastReset !== today) {
      // Reset challenge for new day
      setDailyChallenge(prev => {
        // Add to history if previous challenge was completed
        if (prev.isCompleted) {
          setChallengeHistory(prevHistory => [{
            id: Date.now(),
            date: prev.lastReset,
            type: prev.type,
            completed: prev.completed,
            target: prev.target,
            reward: prev.reward
          }, ...prevHistory]);
        }
        
        return {
          ...prev,
          completed: 0,
          isCompleted: false,
          lastReset: today,
          progress: []
        };
      });
    }
  };

  // Messaging Service Functions
  const handleSendMessage = useCallback(async (conversationId: string, message: Message) => {
    try {
      const newMessage = await messagingService.sendMessage(conversationId, message);
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
      addDemoNotification('User blocked successfully', 'success');
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  }, []);

  const handleReportUser = useCallback(async (conversationId: string) => {
    try {
      await messagingService.reportUser(conversationId, 'Inappropriate behavior');
      addDemoNotification('User reported successfully', 'success');
    } catch (error) {
      console.error('Failed to report user:', error);
    }
  }, []);

  const handleStartVideoCall = useCallback(async (conversationId: string) => {
    try {
      await messagingService.startVideoCall(conversationId);
      addDemoNotification('Video call started', 'success');
    } catch (error) {
      console.error('Failed to start video call:', error);
    }
  }, []);

  const handleStartVoiceCall = useCallback(async (conversationId: string) => {
    try {
      await messagingService.startVoiceCall(conversationId);
      addDemoNotification('Voice call started', 'success');
    } catch (error) {
      console.error('Failed to start voice call:', error);
    }
  }, []);

  const handleShareLocation = useCallback(async (conversationId: string) => {
    try {
      const location = { name: 'Current Location', lat: 0, lng: 0 };
      await messagingService.shareLocation(conversationId, location);
      addDemoNotification('Location shared successfully', 'success');
    } catch (error) {
      console.error('Failed to share location:', error);
    }
  }, []);

  const handleSendDateInvite = useCallback(async (conversationId: string, dateDetails: any) => {
    try {
      await messagingService.sendDateInvite(conversationId, dateDetails);
      addDemoNotification('Date invite sent successfully', 'success');
    } catch (error) {
      console.error('Failed to send date invite:', error);
    }
  }, []);

  const handleSendAIEnhancedMessage = useCallback(async (conversationId: string, prompt: string) => {
    try {
      await messagingService.sendAIEnhancedMessage(conversationId, prompt);
      addDemoNotification('AI enhanced message sent', 'success');
    } catch (error) {
      console.error('Failed to send AI enhanced message:', error);
    }
  }, []);

  const updateChallengeProgress = useCallback((messageData: any) => {
    // Check if this is a new message to a new person
    const existingProgress = dailyChallenge.progress.find(p => p.profileId === messageData.toProfile.id);
    
    if (!existingProgress) {
      const newProgress = {
        profileId: messageData.toProfile.id,
        profileName: messageData.toProfile.name,
        message: messageData.message,
        timestamp: new Date().toISOString(),
        type: 'first_message'
      };

      setDailyChallenge(prev => {
        const newCompleted = prev.completed + 1;
        const isCompleted = newCompleted >= prev.target;
        
        // Show progress notification
        if (newCompleted === prev.target) {
          completeChallenge();
        } else if (newCompleted === prev.target - 1) {
          addDemoNotification(`🎉 Challenge almost complete! Just 1 more message needed!`, 'success');
        }
        
        return {
          ...prev,
          completed: newCompleted,
          isCompleted: isCompleted,
          progress: [...prev.progress, newProgress]
        };
      });
    }
  }, [dailyChallenge.progress, dailyChallenge.target, dailyChallenge.reward]);

  const completeChallenge = useCallback(() => {
    setDailyChallenge(prev => ({ ...prev, isCompleted: true }));
    
    // Add rewards
    const newReward = {
      id: Date.now(),
      type: 'challenge_completion',
              title: 'Daily Challenge Completed! <i className="fas fa-trophy text-yellow-500"></i>',
      description: `You've earned ${dailyChallenge.reward}!`,
      timestamp: new Date().toISOString(),
      isClaimed: false
    };
    
    setChallengeRewards(prev => [newReward, ...prev]);
    
    // Show completion notification
    addDemoNotification(`🏆 Daily Love Challenge completed! You've earned ${dailyChallenge.reward}!`, 'success');
    
    // Add to notifications
    const challengeNotification = {
      id: Date.now(),
      type: 'challenge_completion',
              title: 'Challenge Completed! <i className="fas fa-trophy text-yellow-500"></i>',
      message: `Daily Love Challenge completed! You've earned ${dailyChallenge.reward}!`,
      profile: null,
      timestamp: new Date().toISOString(),
      isRead: false,
      action: 'view_rewards'
    };
    
    setNotifications(prev => [challengeNotification, ...prev]);
  }, [dailyChallenge.reward]);

  const handleTakeChallenge = useCallback(() => {
    setShowChallengeModal(true);
  }, []);

  const claimReward = useCallback((rewardId: number) => {
    setChallengeRewards(prev => 
      prev.map(reward => 
        reward.id === rewardId 
          ? { ...reward, isClaimed: true }
          : reward
      )
    );
    
    addDemoNotification('🎁 Reward claimed successfully! Your profile has been boosted!', 'success');
  }, []);

  // Mutual Match Functions - Optimized with useCallback for performance
  const createMutualMatch = useCallback((profileId: number) => {
    // Find the profile details
    const profile = [...lovedProfiles, ...bookmarkedProfiles, ...likedProfiles].find(p => p.id === profileId);
    
    if (!profile) return;
    
    const newMatch = {
      id: Date.now(),
      profile: profile,
      matchType: 'mutual',
      timestamp: new Date().toISOString(),
      celebration: true,
      userInteraction: userInteractions[profileId],
      otherInteraction: otherPartyInteractions[profileId]
    };
    
    setMutualMatches(prev => [newMatch, ...prev]);
    setCurrentMatch(newMatch);
    setShowMatchPopup(true);
    
    // Add to notifications
    const matchNotification = {
      id: Date.now(),
      type: 'mutual_match',
      title: "It's a Match! 💕",
      message: `You and ${profile.name} have both shown interest in each other!`,
      profile: profile,
      timestamp: new Date().toISOString(),
      isRead: false,
      action: 'view_match'
    };
    
    setNotifications(prev => [matchNotification, ...prev]);
    
    // Show celebration notification
    addDemoNotification(`🎉 It's a Match with ${profile.name}! The feeling is mutual!`, 'success');
  }, [lovedProfiles, bookmarkedProfiles, likedProfiles, userInteractions, otherPartyInteractions]);

  const checkForMutualMatch = useCallback((profileId: number, interactionType: 'message' | 'dateRequest') => {
    const userInteraction = userInteractions[profileId];
    const otherInteraction = otherPartyInteractions[profileId];
    
    if (!userInteraction || !otherInteraction) return;
    
    // Check if both parties have shown interest
    const userHasInterest = userInteraction.hasMessaged || userInteraction.hasDateRequested;
    const otherHasInterest = otherInteraction.hasMessaged || otherInteraction.hasDateRequested;
    
    if (userHasInterest && otherHasInterest) {
      // It's a mutual match! 🎉
      createMutualMatch(profileId);
    }
  }, [userInteractions, otherPartyInteractions, createMutualMatch]);

  const simulateOtherPartyInterest = useCallback((profileId: number, interactionType: 'message' | 'dateRequest') => {
    // Simulate the other person also showing interest
    setOtherPartyInteractions(prev => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        [interactionType === 'message' ? 'hasMessaged' : 'hasDateRequested']: true,
        timestamp: new Date().toISOString()
      }
    }));
    
    // Check for mutual match
    checkForMutualMatch(profileId, interactionType);
  }, [checkForMutualMatch]);

  const handleUserInteraction = useCallback((profileId: number, interactionType: 'message' | 'dateRequest') => {
    setUserInteractions(prev => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        [interactionType === 'message' ? 'hasMessaged' : 'hasDateRequested']: true,
        timestamp: new Date().toISOString()
      }
    }));
    
    // Simulate other party's interest (in real app, this would come from backend)
    setTimeout(() => {
      simulateOtherPartyInterest(profileId, interactionType);
    }, Math.random() * 5000 + 2000); // Random delay between 2-7 seconds
  }, [simulateOtherPartyInterest]);

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

  const startChatWithMatch = () => {
    if (currentMatch) {
      setActiveChat(currentMatch.profile);
      setActiveTab('messages');
      closeMatchPopup();
    }
  };

  const planDateWithMatch = () => {
    if (currentMatch) {
      openDatePlanningModal(currentMatch.profile);
      closeMatchPopup();
    }
  };

  // Sample romantic matches data
  const [romanticMatches] = useState([
    {
      id: 1,
      name: "Priya Sharma",
      age: 26,
      location: "Mumbai, Maharashtra",
      matchPercentage: 94,
      commonInterests: ["Taylor Swift", "Biryani", "Yoga", "Travel Photography", "Harry Potter Books", "Coffee"],
      photos: [
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500&h=500&fit=crop&crop=face"
      ],
      isRevealed: false,
      bio: "Adventure seeker who loves exploring new places and trying different cuisines. Looking for someone who shares my passion for life and growth."
    },
    {
      id: 2,
      name: "Ananya Patel",
      age: 28,
      location: "Delhi, NCR",
      matchPercentage: 89,
      commonInterests: ["Arijit Singh", "Pizza", "Painting", "Netflix", "Reading Novels", "Tea"],
      photos: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&h=500&fit=crop&crop=face"
      ],
      isRevealed: false,
      bio: "Creative soul who finds beauty in everyday moments. Love deep conversations and meaningful connections."
    },
    {
      id: 3,
      name: "Zara Khan",
      age: 25,
      location: "Bangalore, Karnataka",
      matchPercentage: 87,
      commonInterests: ["Ed Sheeran", "Burgers", "Gym", "Gaming", "Movies", "Smoothies"],
      photos: [
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop&crop=face"
      ],
      isRevealed: false,
      bio: "Tech enthusiast who believes in work-life balance. Looking for someone who can keep up with my energy and share my dreams."
    },
    {
      id: 4,
      name: "Kavya Reddy",
      age: 27,
      location: "Hyderabad, Telangana",
      matchPercentage: 92,
      commonInterests: ["Classical Music", "South Indian Food", "Dance", "Travel", "Photography", "Reading"],
      photos: [
        "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop&crop=face"
      ],
      isRevealed: false,
      bio: "Passionate about preserving our cultural heritage through dance and music. Looking for someone who values traditions and modern thinking."
    },
    {
      id: 5,
      name: "Ishita Singh",
      age: 24,
      location: "Pune, Maharashtra",
      matchPercentage: 85,
      commonInterests: ["Rock Music", "Street Food", "Hiking", "Photography", "Art Galleries", "Coffee Shops"],
      photos: [
        "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop&crop=face"
      ],
      isRevealed: false,
      bio: "Free spirit who loves exploring the world through art and adventure. Seeking someone who can keep up with my spontaneous nature."
    },
    {
      id: 6,
      name: "Riya Malhotra",
      age: 29,
      location: "Chennai, Tamil Nadu",
      matchPercentage: 91,
      commonInterests: ["Carnatic Music", "Filter Coffee", "Beach Walks", "Cooking", "Yoga", "Meditation"],
      photos: [
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop&crop=face"
      ],
      isRevealed: false,
      bio: "Soulful person who finds peace in music and nature. Looking for someone who understands the importance of inner peace and growth."
    },
    {
      id: 7,
      name: "Aditi Sharma",
      age: 26,
      location: "Kolkata, West Bengal",
      matchPercentage: 88,
      commonInterests: ["Bengali Literature", "Street Food", "Classical Dance", "Poetry", "Tea Culture", "Heritage Walks"],
      photos: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face"
      ],
      isRevealed: false,
      bio: "Cultural enthusiast who loves exploring the rich heritage of our country. Seeking someone who appreciates art, culture, and meaningful conversations."
    },
    {
      id: 8,
      name: "Neha Kapoor",
      age: 25,
      location: "Ahmedabad, Gujarat",
      matchPercentage: 86,
      commonInterests: ["Gujarati Folk Music", "Street Food", "Textile Art", "Travel", "Photography", "Craft Workshops"],
      photos: [
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face"
      ],
      isRevealed: false,
      bio: "Creative soul who finds inspiration in traditional arts and crafts. Looking for someone who values creativity and cultural heritage."
    },
    {
      id: 9,
      name: "Maya Iyer",
      age: 28,
      location: "Kochi, Kerala",
      matchPercentage: 93,
      commonInterests: ["Backwaters", "Seafood", "Ayurveda", "Kathakali", "Beach Yoga", "Coconut Water"],
      photos: [
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face"
      ],
      isRevealed: false,
      bio: "Nature lover who finds solace in the backwaters and beaches of Kerala. Seeking someone who appreciates the simple joys of life."
    },
    {
      id: 10,
      name: "Pooja Verma",
      age: 24,
      location: "Jaipur, Rajasthan",
      matchPercentage: 90,
      commonInterests: ["Rajasthani Cuisine", "Folk Music", "Heritage Sites", "Shopping", "Desert Safaris", "Traditional Jewelry"],
      photos: [
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop&crop=face",
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face"
      ],
      isRevealed: false,
      bio: "Proud Rajasthani who loves showcasing the beauty of our heritage. Looking for someone who can be my partner in exploring life's adventures."
    }
  ]);

  useEffect(() => {
    loadDashboardData();
    
    // Demo mode: Update data every 5 seconds to simulate real-time updates
    const interval = setInterval(() => {
      updateDemoData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Prevent background scroll when modals are open
  useEffect(() => {
    const isAnyModalOpen = showProfileModal || showDatePlanningModal || showAIPromptsModal || 
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
  }, [showProfileModal, showDatePlanningModal, showAIPromptsModal, showNotificationsModal, 
      showChallengeModal, showMatchPopup, showSpinwheelModal, showSpinResultModal]);

  // Information Collection Popup Functions - Optimized for performance
  const showRandomPopup = useCallback(() => {
    const now = Date.now();
    const timeSinceLastPopup = now - lastPopupTime;
    
    // Don't show popup if one was shown recently (within 2 minutes)
    if (timeSinceLastPopup < 2 * 60 * 1000) return;
    
    // Random chance to show popup (30% probability)
    if (Math.random() < 0.3) {
      const popupType = Math.random() < 0.5 ? 'personality' : 'dating';
      
      if (popupType === 'personality' && !showPersonalityPopup) {
        setShowPersonalityPopup(true);
        setLastPopupTime(now);
        setPopupShownCount(prev => prev + 1);
      } else if (popupType === 'dating' && !showDatingPopup) {
        setShowDatingPopup(true);
        setLastPopupTime(now);
        setPopupShownCount(prev => prev + 1);
      }
    }
  }, [lastPopupTime, showPersonalityPopup, showDatingPopup]);

  // Scroll event listener for random popup triggers - Optimized with throttling and debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let lastScrollTime = 0;
    let scrollTimeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      const now = Date.now();
      
      // Throttle to maximum 1 call per 100ms for better performance
      if (now - lastScrollTime > 100) {
        lastScrollTime = now;
        
        // Clear previous timeout to debounce
        if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
        
        // Debounce popup trigger for better performance
        scrollTimeoutId = setTimeout(() => {
          // Only 5% chance on each throttled scroll event for better performance
          if (Math.random() < 0.05) {
            showRandomPopup();
          }
        }, 150); // 150ms debounce
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
      if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
    };
  }, [lastPopupTime, showPersonalityPopup, showDatingPopup, showRandomPopup]);

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

  const addDemoNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    // Add to demo notifications (bottom screen notifications)
    setDemoNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setDemoNotifications(prev => prev.filter(n => n !== message));
    }, 4000);

    // Also add to main notifications system
    const newNotification = {
      id: Date.now(),
      type: type === 'success' ? 'date_accepted' : 
            type === 'warning' ? 'profile_view' : 'message',
              title: type === 'success' ? 'Action Completed! <i className="fas fa-party-horn text-yellow-500"></i>' :
                           type === 'warning' ? 'Profile Action! <i className="fas fa-eye text-blue-500"></i>' : 'New Activity! <i className="fas fa-comment text-green-500"></i>',
      message: message,
      profile: null,
      timestamp: new Date().toISOString(),
      isRead: false,
      action: 'view_insights'
    };

    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const updateDemoData = () => {
    // Simulate real-time data updates for love universe
    setTotalMatches(prev => prev + Math.floor(Math.random() * 2));
    setPeopleNearby(prev => prev + Math.floor(Math.random() * 1));
    setCompatibilityScore(prev => Math.max(75, Math.min(98, prev + (Math.random() > 0.5 ? 1 : -1))));
    setRomanticInterests(prev => prev + (Math.random() > 0.9 ? 1 : 0));
    
    // Add romantic demo notifications
    const notifications = [
      "💕 New romantic match found!",
      "💌 Someone sent you a love message",
      "💝 Profile view from a potential soulmate",
      "💖 Your compatibility score increased!"
    ];
    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    addDemoNotification(randomNotification);
  };

  const handleMatchAction = useCallback((action: string, matchId: string) => {
    addDemoNotification(`💕 ${action} action completed!`, 'success');
  }, [addDemoNotification]);

  // Function to handle profile actions - Optimized with useCallback for performance
  const handleProfileAction = useCallback((action: 'like' | 'love' | 'bookmark', profile: any) => {
    const timestamp = new Date().toISOString();
    const profileWithTimestamp = { ...profile, actionTimestamp: timestamp };

    switch (action) {
      case 'like':
        setLikedProfiles(prev => {
          const exists = prev.find(p => p.id === profile.id);
          if (exists) {
            return prev.filter(p => p.id !== profile.id);
          } else {
            return [...prev, profileWithTimestamp];
          }
        });
        break;
      case 'love':
        setLovedProfiles(prev => {
          const exists = prev.find(p => p.id === profile.id);
          if (exists) {
            return prev.filter(p => p.id !== profile.id);
          } else {
            return [...prev, profileWithTimestamp];
          }
        });
        // Mark profile as revealed when love button is clicked
        if (!profile.isRevealed) {
          profile.isRevealed = true;
        }
        break;
      case 'bookmark':
        setBookmarkedProfiles(prev => {
          const exists = prev.find(p => p.id === profile.id);
          if (exists) {
            return prev.filter(p => p.id !== profile.id);
          } else {
            return [...prev, profileWithTimestamp];
          }
        });
        break;
    }
  }, []);

  // Function to check if a profile has a specific action - Memoized for performance
  const hasProfileAction = useCallback((profileId: number, action: 'like' | 'love' | 'bookmark') => {
    switch (action) {
      case 'like':
        return likedProfiles.some(p => p.id === profileId);
      case 'love':
        return lovedProfiles.some(p => p.id === profileId);
      case 'bookmark':
        return bookmarkedProfiles.some(p => p.id === profileId);
      default:
        return false;
    }
  }, [likedProfiles, lovedProfiles, bookmarkedProfiles]);

  // Function to get action count - Memoized for performance
  const getActionCount = useCallback((action: 'like' | 'love' | 'bookmark') => {
    switch (action) {
      case 'like':
        return likedProfiles.length;
      case 'love':
        return lovedProfiles.length;
      case 'bookmark':
        return bookmarkedProfiles.length;
      default:
        return 0;
    }
  }, [likedProfiles.length, lovedProfiles.length, bookmarkedProfiles.length]);

  // Function to handle date request actions - Optimized with useCallback for performance
  const handleDateRequest = useCallback((requestId: number, action: 'accept' | 'decline') => {
    setDateRequests(prev => prev.map(request => {
      if (request.id === requestId) {
        return { ...request, status: action };
      }
      return request;
    }));
    
    // Add notification
    const request = dateRequests.find(r => r.id === requestId);
    if (request) {
      const actionText = action === 'accept' ? 'accepted' : 'declined';
      addDemoNotification(`💕 You ${actionText} ${request.fromProfile.name}'s date request!`, 'success');
    }
  }, [dateRequests, addDemoNotification]);

  // Function to mark date request as read - Optimized with useCallback for performance
  const markDateRequestAsRead = useCallback((requestId: number) => {
    setDateRequests(prev => prev.map(request => {
      if (request.id === requestId) {
        return { ...request, isRead: true };
      }
      return request;
    }));
  }, []);

  // Function to get unread date requests count - Memoized for performance
  const getUnreadDateRequestsCount = useCallback(() => {
    return dateRequests.filter(request => !request.isRead).length;
  }, [dateRequests]);

  // Function to open date request profile modal - Optimized with useCallback for performance
  const openDateRequestProfile = useCallback((profile: any) => {
      setSelectedProfile(profile);
      setShowProfileModal(true);
  }, []);

  // Function to remove profile from loved list - Optimized with useCallback for performance
  const removeFromLoved = useCallback((profileId: number) => {
    setLovedProfiles(prev => prev.filter(p => p.id !== profileId));
  }, []);

  // Function to remove profile from bookmarked list - Optimized with useCallback for performance
  const removeFromBookmarked = useCallback((profileId: number) => {
    setBookmarkedProfiles(prev => prev.filter(p => p.id !== profileId));
  }, []);

  // Function to generate emotionally intelligent, human, and connecting AI chat prompts
  const generateAIPrompts = (profile: any) => {
    const commonInterests = profile.commonInterests || [];
    const prompts = [];
    
    // Music & Emotional Connection
    if (commonInterests.includes('Taylor Swift')) {
      prompts.push("I feel like we might have similar souls since we both connect with Taylor's music. Her lyrics always seem to capture exactly what I'm feeling. Which song resonates with you the most right now? 🎵💫");
    }
    if (commonInterests.includes('Arijit Singh')) {
      prompts.push("There's something so raw and honest about Arijit's voice that speaks directly to the heart. I'd love to know which of his songs has been your companion during both happy and difficult times? 🎤💕");
    }
    
    // Food & Cultural Connection
    if (commonInterests.includes('Biryani')) {
      prompts.push("Food has this incredible way of bringing people together, doesn't it? Biryani always feels like a warm hug to me. What's your favorite memory associated with this dish? 🍛✨");
    }
    if (commonInterests.includes('Pizza')) {
      prompts.push("I love how pizza can be both comfort food and an adventure! It's fascinating how everyone has their own perfect combination. What does your ideal pizza say about your personality? 🍕💭");
    }
    
    // Creative & Artistic Expression
    if (commonInterests.includes('Travel Photography')) {
      prompts.push("Photography has this magical ability to freeze moments that touch our hearts. I'm curious - what's the story behind the most meaningful photo you've ever taken? 📸💫");
    }
    if (commonInterests.includes('Painting')) {
      prompts.push("Art is such a beautiful way to express what words sometimes can't. I'd love to know what emotions or experiences inspire you to pick up a brush? 🎨💭");
    }
    
    // Wellness & Personal Growth
    if (commonInterests.includes('Yoga')) {
      prompts.push("Yoga has taught me so much about finding peace within chaos. I'm curious - what's the biggest lesson you've learned about yourself through your practice? 🧘‍♀️💫");
    }
    
    // Intellectual & Emotional Growth
    if (commonInterests.includes('Reading Novels')) {
      prompts.push("Books have this incredible power to change how we see the world and ourselves. What's a story that left you different after reading it? 📚💭");
    }
    if (commonInterests.includes('Harry Potter Books')) {
      prompts.push("The magic of Harry Potter goes beyond just the story - it's about friendship, courage, and finding your place in the world. Which character's journey do you see yourself in? 🧙‍♂️💫");
    }
    
    // Lifestyle & Daily Moments
    if (commonInterests.includes('Coffee')) {
      prompts.push("There's something so intimate about coffee rituals - they're these little moments of pause in our busy lives. What does your perfect coffee moment look like? ☕💭");
    }
    if (commonInterests.includes('Tea')) {
      prompts.push("Tea has this gentle way of slowing down time, doesn't it? I'd love to know what your tea ritual says about how you take care of yourself? 🫖💫");
    }
    
    // Entertainment & Shared Experiences
    if (commonInterests.includes('Netflix')) {
      prompts.push("Stories have this amazing way of making us feel less alone in our experiences. What's a show or movie that made you feel truly seen and understood? 📺💭");
    }
    
    // Deep & Meaningful Connection Prompts
    if (prompts.length < 3) {
      prompts.push("I feel like there's something special about your energy that I'm drawn to. I'd love to understand what makes your heart smile and what challenges have shaped who you are today? 💫💭");
      prompts.push("Your profile has this beautiful authenticity that's rare to find. I'm curious - what's something you're passionate about that you wish more people understood? ✨💕");
      prompts.push("There's something about your story that feels important to hear. What's a moment in your life that changed everything for you? 💭💫");
    }
    
    // Add emotional intelligence prompts
    prompts.push("I believe everyone has a story worth telling. What's something you've experienced that you think has made you more compassionate or understanding? 💕💭");
    prompts.push("Life has this way of teaching us lessons when we least expect it. What's something difficult you've gone through that actually made you stronger? 💪💫");
    
    return prompts.slice(0, 6); // Return max 6 prompts
  };

  // Function to handle opening AI prompts modal
  const openAIPromptsModal = (profile: any) => {
    setSelectedProfileForChat(profile);
    setAiPrompts(generateAIPrompts(profile));
    setShowAIPromptsModal(true);
  };

  // Function to select an AI prompt and start chat
  const selectAIPrompt = (prompt: string) => {
    if (selectedProfileForChat) {
      // Check if we already have a chat with this person
      const existingChat = chatMessages.find(msg => msg.profile.id === selectedProfileForChat.id);
      
      // Create a new message
      const newMessage = {
        id: Date.now(),
        text: prompt,
        sender: 'me',
        timestamp: new Date().toISOString(),
        profile: selectedProfileForChat
      };
      
      // Add message to existing chat or create new one
      if (existingChat) {
        // Continue existing conversation
        setChatMessages(prev => [...prev, newMessage]);
              addDemoNotification(`💬 Message sent to ${selectedProfileForChat.name}!`, 'info');
      } else {
        // Start new conversation
        setChatMessages(prev => [...prev, newMessage]);
      addDemoNotification(`💬 New conversation started with ${selectedProfileForChat.name}!`, 'info');
      }
      
      // Set this person as active chat
      setActiveChat(selectedProfileForChat);
      
      // Close both modals and open chat
      setShowAIPromptsModal(false);
      setShowProfileModal(false);
      
      // Immediately open the chat interface with this person
      setActiveTab('chat-interface');
      
      // Simulate response after 2 seconds to make the conversation feel alive
      setTimeout(() => {
        const responses = [
          "That's really interesting! Tell me more about that 💫",
          "I love how you think about things! What made you feel that way? 💭",
          "That's such a beautiful perspective! I'd love to hear your story 💕",
          "You have such a unique way of looking at life! What inspires you? ✨",
          "I feel like we're really connecting here! What else should I know about you? 💫",
          "I'm really enjoying our conversation! What's something you're passionate about? 💫",
          "You have such a thoughtful way of expressing yourself! Tell me more 💭",
          "This is exactly the kind of connection I was hoping to find! What's next? ✨"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const responseMessage = {
          id: Date.now() + 1,
          text: randomResponse,
          sender: 'them',
          timestamp: new Date().toISOString(),
          profile: selectedProfileForChat
        };
        
        setChatMessages(prev => [...prev, responseMessage]);
      }, 2000);
    }
  };

  // Function to open a chat with a specific profile
  const openChat = (profile: any) => {
    setActiveChat(profile);
    setActiveTab('chat-interface');
  };

  // Function to send a message in the chat
  const sendMessage = (text: string) => {
    if (activeChat && text.trim()) {
      const newMessage = {
        id: Date.now(),
        text: text.trim(),
        sender: 'me',
        timestamp: new Date().toISOString(),
        profile: activeChat
      };
      
      setChatMessages(prev => [...prev, newMessage]);
      
      // Update challenge progress for first message to this person
      updateChallengeProgress({
        toProfile: activeChat,
        message: text.trim()
      });
      
      // Track user interaction for mutual match system
      handleUserInteraction(activeChat.id, 'message');
      
      // Simulate response after 2 seconds
      setTimeout(() => {
        const responses = [
          "That's really interesting! Tell me more about that 💫",
          "I love how you think about things! What made you feel that way? 💭",
          "That's such a beautiful perspective! I'd love to hear your story 💕",
          "You have such a unique way of looking at life! What inspires you? ✨",
          "I feel like we're really connecting here! What else should I know about you? 💫",
          "I'm really enjoying our conversation! What's something you're passionate about? 💫",
          "You have such a thoughtful way of expressing yourself! Tell me more 💭",
          "This is exactly the kind of connection I was hoping to find! What's next? ✨"
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const responseMessage = {
          id: Date.now() + 1,
          text: randomResponse,
          sender: 'them',
          timestamp: new Date().toISOString(),
          profile: activeChat
        };
        
        setChatMessages(prev => [...prev, responseMessage]);
      }, 2000);
    }
  };

  // Function to close chat and return to messages list
  const closeChat = () => {
    setActiveChat(null);
    setActiveTab('messages');
  };

  // Date Planning Functions
  const openDatePlanningModal = (profile: any) => {
    setSelectedProfileForDate(profile);
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
  };

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
    
    // Based on common interests
    if (profile.commonInterests.includes('Coffee')) {
      suggestions.push({
        type: 'Coffee Date',
        activity: 'Visit a cozy coffee shop',
        budget: 'Low',
        description: 'Perfect for getting to know each other in a relaxed atmosphere'
      });
    }
    
    if (profile.commonInterests.includes('Food') || profile.commonInterests.includes('Biryani') || profile.commonInterests.includes('Pizza')) {
      suggestions.push({
        type: 'Dinner Date',
        activity: 'Try a new restaurant together',
        budget: 'Medium',
        description: 'Explore new cuisines and share a memorable meal'
      });
    }
    
    if (profile.commonInterests.includes('Travel') || profile.commonInterests.includes('Photography')) {
      suggestions.push({
        type: 'Adventure Date',
        activity: 'Visit a local landmark or scenic spot',
        budget: 'Low',
        description: 'Capture beautiful moments and explore together'
      });
    }
    
    if (profile.commonInterests.includes('Movies') || profile.commonInterests.includes('Netflix')) {
      suggestions.push({
        type: 'Movie Date',
        activity: 'Watch a film together',
        budget: 'Medium',
        description: 'Share cinematic experiences and discuss your thoughts'
      });
    }
    
    if (profile.commonInterests.includes('Art') || profile.commonInterests.includes('Museums')) {
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

  const sendDateRequest = () => {
    if (selectedProfileForDate && datePlan.type && datePlan.date && datePlan.time) {
      const newDateRequest = {
        id: Date.now(),
        fromProfile: selectedProfileForDate,
        toProfile: {
          id: 'current-user',
          name: 'You',
          photos: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=face']
        },
        message: `I've planned a special ${datePlan.type.toLowerCase()} for us!`,
        proposedDate: datePlan.date,
        proposedTime: datePlan.time,
        proposedLocation: datePlan.location,
        proposedActivity: datePlan.activity,
        budget: datePlan.budget,
        description: datePlan.description,
        specialNotes: datePlan.specialNotes,
        status: 'pending',
        timestamp: new Date().toISOString(),
        isRead: false
      };
      
      // Add to date requests (simulating sending to the other person)
      setDateRequests(prev => [newDateRequest, ...prev]);
      
      // Add to planned dates
      setPlannedDates(prev => [{
        ...newDateRequest,
        status: 'planned'
      }, ...prev]);
      
      // Track user interaction for mutual match system
      handleUserInteraction(selectedProfileForDate.id, 'dateRequest');
      
      // Close modal and show success
      closeDatePlanningModal();
      addDemoNotification(`💕 Date request sent to ${selectedProfileForDate.name}!`, 'success');
    }
  };

  const getPlannedDatesCount = () => {
    return plannedDates.filter(date => date.status === 'planned').length;
  };

  const openProfileModal = (profile: any) => {
    if (profile.isRevealed) {
      setSelectedProfile(profile);
      setShowProfileModal(true);
    } else {
      addDemoNotification(`💕 Click the Love button first to reveal ${profile.name}'s profile!`, 'warning');
    }
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedProfile(null);
  };

  const refreshData = () => {
    setIsRefreshing(true);
    loadDashboardData();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Spinwheel Functions - Deciding Who Makes First Move
  const openSpinwheelModal = (profile: any, type: 'mutual_match' | 'loved_profile') => {
    setSpinwheelProfile(profile);
    setSpinwheelType(type);
    setShowSpinwheelModal(true);
    setUserSpinResult(null);
    setOtherPartySpinResult(null);
  };

  const spinWheel = () => {
    // Generate random number between 1-100
    const result = Math.floor(Math.random() * 100) + 1;
    setUserSpinResult(result);
    
    // Simulate other party spinning after a delay
    setTimeout(() => {
      const otherResult = Math.floor(Math.random() * 100) + 1;
      setOtherPartySpinResult(otherResult);
      
      // Determine winner and loser
      const winner = result < otherResult ? 'You' : spinwheelProfile.name;
      const loser = result < otherResult ? spinwheelProfile.name : 'You';
      const firstMoveBy = result < otherResult ? spinwheelProfile.name : 'You';
      
      setSpinResult({
        winner,
        loser,
        firstMoveBy,
        userScore: result,
        otherScore: otherResult
      });
      
      // Close spinwheel modal and show result
      setShowSpinwheelModal(false);
      setTimeout(() => setShowSpinResultModal(true), 500);
    }, 2000);
  };

  const closeSpinwheelModal = () => {
    setShowSpinwheelModal(false);
    setSpinwheelProfile(null);
    setUserSpinResult(null);
    setOtherPartySpinResult(null);
  };

  const closeSpinResultModal = () => {
    setShowSpinResultModal(false);
    setSpinResult(null);
  };

  const handleFindMoreDates = () => {
    closeSpinResultModal();
    setActiveTab('matches');
  };

  const handleAIChatPrompts = () => {
    closeSpinResultModal();
    if (spinwheelProfile) {
      openAIPromptsModal(spinwheelProfile);
    }
  };

  const handlePersonalitySubmit = useCallback((data: any) => {
    setPersonalityData(data);
    setShowPersonalityPopup(false);
    
    // Silently save to background (no obvious indication)
    console.log('Personality data collected:', data);
    
    // Show subtle success feedback
    addDemoNotification('✨ Your preferences help us find better matches!', 'success');
  }, [addDemoNotification]);

  const handleDatingSubmit = useCallback((data: any) => {
    setDatingData(data);
    setShowDatingPopup(false);
    
    // Silently save to background (no obvious indication)
    console.log('Dating preferences collected:', data);
    
    // Show subtle success feedback
    addDemoNotification('💕 Dating preferences updated for better compatibility!', 'success');
  }, [addDemoNotification]);

  const closePersonalityPopup = useCallback(() => {
    setShowPersonalityPopup(false);
  }, []);

  const closeDatingPopup = useCallback(() => {
    setShowDatingPopup(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full mx-auto mb-3 sm:mb-4 animate-pulse"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base">Loading your romantic world...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 sm:py-3 md:py-4 space-y-2 sm:space-y-0">
            {/* Left Section - Brand & Back Button */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 w-full sm:w-auto">
              <button 
                onClick={() => onNavigate('landing')}
                className="p-1 sm:p-1.5 md:p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors duration-75 flex-shrink-0"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
              </button>
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 flex-1 sm:flex-none">
                <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                </div>
                <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  BrandBond
                </span>
                <div className="ml-1 sm:ml-2 md:ml-3 px-1 sm:px-2 md:px-3 py-0.5 sm:py-1 md:py-1.5 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 text-white text-xs sm:text-sm font-bold rounded-full shadow-lg animate-pulse flex-shrink-0">
                  💕 LOVE MODE
                </div>
              </div>
            </div>

            {/* Right Section - Action Buttons & Exit (Hidden on mobile, shown on desktop) */}
            <div className="hidden sm:flex items-center space-x-1 sm:space-x-2 md:space-x-3 lg:space-x-4 w-full sm:w-auto justify-end">
              {/* Action Icons - Stacked on mobile, horizontal on larger screens */}
              <div className="flex items-center space-x-2 md:space-x-3">
                              <button 
                onClick={() => setShowNotificationsModal(true)}
                className="flex items-center justify-center p-2 md:p-2.5 lg:p-3 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group relative"
              >
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bell className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-red-500 text-white text-xs rounded-full w-4.5 h-4.5 md:w-5 md:h-5 flex items-center justify-center font-bold shadow-lg">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
              <button 
                  onClick={() => setActiveTab('liked')}
                  className="flex items-center justify-center p-2 md:p-2.5 lg:p-3 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group relative"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ThumbsUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  {getActionCount('like') > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-blue-500 text-white text-xs rounded-full w-4.5 h-4.5 md:w-5 md:h-5 flex items-center justify-center font-bold shadow-lg">
                      {getActionCount('like')}
                    </span>
                  )}
              </button>
                <button 
                  onClick={() => setActiveTab('loved')}
                  className="flex items-center justify-center p-2 md:p-2.5 lg:p-3 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group relative"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-red-400 to-pink-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
                  <span className="absolute -top-0.5 sm:-top-1 -right-0.5 sm:-right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">{getActionCount('love')}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('bookmarked')}
                  className="flex items-center justify-center p-2 md:p-2.5 lg:p-3 bg-white/80 backdrop-blur-sm rounded-full border border-indigo-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group relative"
                >
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bookmark className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  {getActionCount('bookmark') > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 md:-top-2 md:-right-2 bg-purple-500 text-white text-xs rounded-full w-4.5 h-4.5 md:w-5 md:h-5 flex items-center justify-center font-bold shadow-lg">
                      {getActionCount('bookmark')}
                    </span>
                  )}
                </button>
                


              </div>
              

            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Action Icons Bar - Love Universe Style */}
      <div className="sm:hidden bg-white/80 backdrop-blur-md border-b border-indigo-200 z-40">
        <div className="px-2 py-2.5">
          <div className="flex items-center justify-center space-x-2.5">
            <button 
              onClick={() => setShowNotificationsModal(true)}
              className="flex items-center justify-center p-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-indigo-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group relative"
            >
              <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bell className="w-3 h-3 text-white" />
              </div>
              {unreadNotifications > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold shadow-lg">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('liked')}
              className="flex items-center justify-center p-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-indigo-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group relative"
            >
              <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <ThumbsUp className="w-3 h-3 text-white" />
              </div>
              {getActionCount('like') > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-xs rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold shadow-lg">
                  {getActionCount('like')}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('loved')}
              className="flex items-center justify-center p-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-indigo-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group relative"
            >
              <div className="w-5 h-5 bg-gradient-to-r from-red-400 to-pink-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Heart className="w-3 h-3 text-white" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold shadow-lg">{getActionCount('love')}</span>
            </button>
            <button 
              onClick={() => setActiveTab('bookmarked')}
              className="flex items-center justify-center p-1.5 bg-white/90 backdrop-blur-sm rounded-lg border border-indigo-200 hover:shadow-lg transition-all duration-200 hover:scale-105 group relative"
            >
              <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Bookmark className="w-3 h-3 text-white" />
              </div>
              {getActionCount('bookmark') > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-purple-500 text-white text-xs rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold shadow-lg">
                  {getActionCount('bookmark')}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>




      {/* Demo Information Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-100 border-b border-indigo-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 w-full sm:w-auto">
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
              </div>
              <div className="flex-1 sm:flex-none">
                <p className="text-xs sm:text-sm font-medium text-indigo-800">
                  💕 Welcome to the Love Universe!
                </p>
                <p className="text-xs text-indigo-600 hidden sm:block">
                  Experience romantic matching, compatibility scoring, and relationship building
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 w-full sm:w-auto">
              <button 
                onClick={refreshData}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs sm:text-sm rounded-full hover:shadow-md transition-all duration-200"
              >
                Refresh Data
              </button>
              <button 
                onClick={() => onNavigate('friends-dashboard')}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs sm:text-sm rounded-full hover:shadow-md transition-all duration-200"
              >
                Switch to Friends
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 md:py-6 pb-20 sm:pb-6">
        {/* Tab Navigation - Hidden on Mobile */}
        <div className="hidden sm:block bg-white/60 backdrop-blur-sm rounded-full p-1 sm:p-1.5 md:p-2 shadow-lg border border-indigo-200 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
          {/* Desktop: Main Navigation Tabs */}
          <div className="flex space-x-1">
          {[
            { id: 'overview', label: 'Love Overview', icon: Heart },
            { id: 'matches', label: 'Romantic Matches', icon: Star },
            { id: 'its-a-match', label: "It's a Match", icon: Sparkles },
            { id: 'messages', label: 'Love Messages', icon: MessageCircle },
            { id: 'dates', label: 'Date Planning', icon: Calendar },
            { id: 'date-requests', label: 'Date Requests', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 sm:py-3 md:py-4 px-2 sm:px-3 md:px-4 rounded-lg sm:rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                      ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-white/80'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm md:text-base">{tab.label}</span>
              </button>
            );
          })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl shadow-xl border border-indigo-200 overflow-hidden">
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
                  { label: 'Romantic Matches', value: totalMatches, icon: Heart, color: 'from-blue-500 to-cyan-500' },
                  { label: 'People Nearby', value: peopleNearby, icon: MapPin, color: 'from-blue-500 to-cyan-500' },
                  { label: 'Compatibility', value: `${compatibilityScore}%`, icon: Star, color: 'from-yellow-500 to-orange-500' },
                  { label: 'Love Interests', value: romanticInterests, icon: Sparkles, color: 'from-purple-500 to-pink-500' }
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-150 hover:scale-105 group"
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
                      <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
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
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">Love Messages</h3>
                      <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        12 New
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed italic bg-gray-50 p-3 rounded-lg border border-gray-100 mb-6">
                    "Connect with your matches through meaningful conversations"
                  </p>
                  <button 
                    onClick={() => setActiveTab('messages')}
                    className="flex-1 py-2.5 px-4 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors duration-75 text-sm"
                  >
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    View Messages
                  </button>
                </div>
              </div>



              {/* Hot Matches Preview - CENTERED WITH SPACING */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-4 sm:p-6 md:p-8 border border-indigo-200 mb-6 sm:mb-8 md:mb-12">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 text-center flex items-center justify-center space-x-1.5 sm:space-x-2 md:space-x-3">
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-indigo-500" />
                  <span><i className="fas fa-fire text-red-500 mr-2"></i>Your Hottest Matches This Week</span>
                </h3>
                <p className="text-center text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                  These profiles match with your All Time Favorites! <i className="fas fa-star text-yellow-500"></i>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
                  {romanticMatches.slice(0, 4).map((profile) => (
                    <div key={profile.id} className="relative bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-150 cursor-pointer group hover:scale-105 h-64 sm:h-72 md:h-80 lg:h-96 border border-gray-200 shadow-lg max-w-sm lg:max-w-md xl:max-w-lg">
                      {/* Background Profile Image - Blurred */}
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={profile.photos[0]} 
                          alt={`${profile.name}'s profile`}
                          className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-300"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        {/* Fallback gradient background */}
                        <div className="w-full h-full bg-gradient-to-br from-blue-200 via-cyan-200 to-blue-100 opacity-60"></div>
                      </div>
                      
                      {/* Content Overlay */}
                      <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-5 md:p-6">
                        {/* Top Section - Profile Info */}
                        <div className="text-center">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center text-blue-600 font-bold text-xl sm:text-2xl md:text-3xl mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform border-2 border-gray-200 shadow-lg">
                        {profile.name.charAt(0)}
                      </div>
                          <h4 className="font-bold text-gray-800 text-base sm:text-lg md:text-xl mb-1 sm:mb-2 drop-shadow-sm">
                            {profile.name}
                          </h4>
                          <div className="inline-flex items-center space-x-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-300 mb-3 sm:mb-4 shadow-sm">
                            <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-yellow-500" />
                            <span className="font-semibold text-xs sm:text-sm">{profile.matchPercentage}% Match</span>
                          </div>
                        </div>
                        
                        {/* Bottom Section - All Time Favorite */}
                        <div className="text-center">
                          <div className="text-xs sm:text-sm text-blue-700 font-medium mb-2 opacity-90">
                            <i className="fas fa-sparkles text-blue-500 mr-2"></i>Matches your All Time Favorites:
                          </div>
                          <span className="inline-block bg-blue-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm shadow-lg border border-white/20">
                          {profile.commonInterests[0]}
                        </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <button 
                    onClick={() => setActiveTab('matches')}
                    className="w-full sm:w-auto px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 bg-blue-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-sm sm:text-base md:text-lg font-medium hover:bg-blue-600"
                  >
                    <i className="fas fa-rocket text-blue-500 mr-2"></i>Explore All Matches
                  </button>
                </div>
              </div>

              {/* It's a Match Section - Mutual Connections */}
              {mutualMatches.length > 0 && (
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
                    {mutualMatches.slice(0, 8).map((match) => (
                      <div key={match.id} className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-200 hover:shadow-lg transition-all duration-200 hover:scale-105 shadow-lg max-w-sm lg:max-w-md xl:max-w-lg">
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
                            <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                              {match.profile.name}
                            </h4>
                            <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-300">
                              <Star className="w-3 h-3 mr-1 text-yellow-500" />
                              {match.profile.matchPercentage}% Match
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
                              setActiveChat(match.profile);
                              setActiveTab('messages');
                            }}
                            className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-500 text-white text-xs sm:text-sm rounded-full font-medium hover:shadow-lg transition-all duration-200 hover:bg-blue-600"
                          >
                            Chat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {mutualMatches.length > 8 && (
                    <div className="text-center mt-4">
                      <button className="px-4 sm:px-6 py-2 sm:py-2.5 bg-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 text-sm sm:text-base hover:bg-pink-600">
                        View All {mutualMatches.length} Matches
                      </button>
                    </div>
                  )}
                </div>
              )}

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
                  
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setActiveTab('its-a-match')}
                      className="flex-1 py-2.5 px-4 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 transition-colors duration-75 text-sm"
                    >
                      <Sparkles className="w-4 h-4 inline mr-2" />
                      {mutualMatches.length > 0 ? 'View All Matches' : 'Discover Matches'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Row - 3 COLUMNS WITH EQUAL SPACING */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {/* Compatibility Insights */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl p-3 sm:p-4 md:p-6 border border-blue-200 hover:shadow-lg transition-all duration-200">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center space-x-1.5 sm:space-x-2">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-500" />
                    <span><i className="fas fa-star text-purple-500 mr-2"></i>Insights</span>
                  </h3>
                  <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
                    <div className="bg-white/80 rounded-xl p-2.5 sm:p-3 md:p-4 text-center hover:shadow-md transition-all duration-200 hover:scale-105 group">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1">📈 Trending Up</h4>
                      <p className="text-xs text-gray-600">Score increasing daily!</p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-2.5 sm:p-3 md:p-4 text-center hover:shadow-md transition-all duration-200 hover:scale-105 group">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1">⭐ High Potential</h4>
                      <p className="text-xs text-gray-600">Quality matches!</p>
                    </div>
                    <div className="bg-white/80 rounded-xl p-2.5 sm:p-3 md:p-4 text-center hover:shadow-md transition-all duration-200 hover:scale-105 group">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-800 text-xs sm:text-sm mb-1"><i className="fas fa-bolt text-yellow-500 mr-1"></i>Active</h4>
                      <p className="text-xs text-gray-600">Getting noticed!</p>
                    </div>
                  </div>
                </div>

                {/* Love Journey Progress */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-3xl p-3 sm:p-4 md:p-6 border border-purple-200 hover:shadow-lg transition-all duration-200">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center space-x-1.5 sm:space-x-2">
                    <Compass className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-500" />
                    <span>🗺️ Progress</span>
                  </h3>
                  <div className="space-y-3 sm:space-y-4 md:space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm text-gray-700">Profile</span>
                        <span className="text-xs sm:text-sm font-semibold text-indigo-600">95%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                        <div className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 h-2.5 sm:h-3 rounded-full w-[95%]"></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm text-gray-700">Chats</span>
                        <span className="text-xs sm:text-sm font-semibold text-indigo-600">3</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                        <div className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 h-2.5 sm:h-3 rounded-full w-[60%]"></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm text-gray-700">Dates</span>
                        <span className="text-xs sm:text-sm font-semibold text-indigo-600">1</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3">
                        <div className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 h-2.5 sm:h-3 rounded-full w-[25%]"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Summary */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-3xl p-3 sm:p-4 md:p-6 border border-slate-200 hover:shadow-lg transition-all duration-200">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center space-x-1.5 sm:space-x-2">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-slate-500" />
                    <span>📊 Analytics</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
                    <div className="bg-white/80 rounded-xl p-1.5 sm:p-2 md:p-3 text-center hover:shadow-md transition-all duration-200 hover:scale-105 group">
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-700 mb-1 group-hover:text-indigo-600 transition-colors duration-75">89%</div>
                      <div className="text-xs text-slate-600">Profile Views</div>
                    </div>
                    <div className="bg-white/80 rounded-xl p-1.5 sm:p-2 md:p-3 text-center hover:shadow-md transition-all duration-200 hover:scale-105 group">
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-700 mb-1 group-hover:text-green-600 transition-colors duration-75">67%</div>
                      <div className="text-xs text-slate-600">Response Rate</div>
                    </div>
                    <div className="bg-white/80 rounded-xl p-1.5 sm:p-2 md:p-3 text-center hover:shadow-md transition-all duration-200 hover:scale-105 group">
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-700 mb-1 group-hover:text-blue-600 transition-colors duration-75">23</div>
                      <div className="text-xs text-slate-600">Active Chats</div>
                    </div>
                    <div className="bg-white/80 rounded-xl p-1.5 sm:p-2 md:p-3 text-center hover:shadow-md transition-all duration-200 hover:scale-105 group">
                      <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-slate-700 mb-1 group-hover:text-yellow-600 transition-colors duration-75">4.8★</div>
                      <div className="text-xs text-slate-600">Rating</div>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 md:mt-4 text-center">
                    <button className="w-full sm:w-auto px-2.5 sm:px-3 md:px-4 lg:px-6 py-1 sm:py-1.5 md:py-2 bg-gradient-to-r from-slate-500 to-gray-500 text-white rounded-full hover:shadow-lg transition-all duration-200 text-xs sm:text-sm font-medium hover:scale-105">
                      📈 View Full Analytics
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'its-a-match' && (
            <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 md:space-y-8">
              {/* Magical "It's a Match" Header */}
              <div className="text-center mb-6 sm:mb-8 md:mb-12">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-gradient-to-r from-pink-400 via-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-2xl animate-pulse">
                  <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-white" />
                </div>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-pink-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-2 sm:mb-3 md:mb-4">
                  <i className="fas fa-sparkles text-blue-500 mr-2"></i>It's a Match! <i className="fas fa-sparkles text-blue-500 ml-2"></i>
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg lg:text-xl">Where mutual feelings create magical connections</p>
              </div>

              {/* Current Mutual Matches */}
              {mutualMatches.length > 0 ? (
                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 text-center mb-4 sm:mb-6">
                    <i className="fas fa-party-horn text-yellow-500 mr-2"></i>Your Current Matches
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                    {mutualMatches.map((match) => (
                      <div 
                        key={match.id}
                        className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200 hover:shadow-xl transition-all duration-150 cursor-pointer group shadow-lg max-w-sm lg:max-w-md xl:max-w-lg"
                        onClick={() => {
                          setCurrentMatch(match);
                          setShowMatchPopup(true);
                        }}
                      >
                        <div className="text-center">
                          <div className="w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-lg">
                            <img
                              src={getWorkingImageUrl(match.profile.photos[0], 0)}
                              alt={match.profile.name}
                              className="w-full h-full rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = fallbackImages[0];
                              }}
                            />
                          </div>
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2">
                            {match.profile.name}
                          </h3>
                          <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-3 border border-green-300">
                            <Star className="w-4 h-4 mr-1 text-yellow-500" />
                            {match.profile.matchPercentage}% Match
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewMatchProfile();
                              }}
                              className="flex-1 py-2.5 px-4 bg-pink-500 text-white rounded-full font-medium hover:bg-pink-600 transition-colors duration-75 text-sm"
                            >
                              View Profile
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startChatWithMatch();
                              }}
                              className="flex-1 py-2.5 px-4 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors duration-75 text-sm"
                            >
                              Chat
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Beautiful Empty State - Always Visible */
                <div className="text-center py-8 sm:py-12 md:py-16">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-r from-pink-100 via-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-lg">
                    <div className="relative">
                      <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-pink-400" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-white text-xs sm:text-sm md:text-base">💕</span>
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                    The Magic Awaits... <i className="fas fa-sparkles text-blue-500 ml-2"></i>
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 max-w-2xl mx-auto leading-relaxed">
                    This is where your mutual matches will appear - when both you and someone special show interest in each other. 
                    It's not just a match, it's destiny recognizing itself! <i className="fas fa-star text-purple-500 ml-2"></i>
                  </p>
                  
                  {/* How It Works Section */}
                  <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200 max-w-4xl mx-auto mb-6 sm:mb-8 shadow-lg">
                    <h4 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
                      <i className="fas fa-star text-yellow-500 mr-2"></i>How "It's a Match" Works
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white shadow-lg">
                          <MessageCircle className="w-8 h-8 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-800 mb-2">1. Send a Message</h5>
                        <p className="text-sm text-gray-600">Start a conversation with someone you're interested in</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white shadow-lg">
                          <Heart className="w-8 h-8 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-800 mb-2">2. Mutual Interest</h5>
                        <p className="text-sm text-gray-600">When they respond, the magic begins to happen</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-white shadow-lg">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h5 className="font-semibold text-gray-800 mb-2">3. It's a Match!</h5>
                        <p className="text-sm text-gray-600">Celebrate your mutual connection and start building something beautiful</p>
                      </div>
                    </div>
                  </div>

                  {/* Encouragement Section */}
                  <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 border border-gray-200 max-w-3xl mx-auto shadow-lg">
                    <h4 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4 text-center">
                      💝 Ready to Find Your Match?
                    </h4>
                    <p className="text-gray-600 text-sm sm:text-base mb-4 sm:mb-6 text-center">
                      Start by exploring romantic matches and sending messages to people who catch your heart
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                      <button 
                        onClick={() => setActiveTab('matches')}
                        className="px-6 sm:px-8 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors duration-75"
                      >
                        Browse Matches
                      </button>
                      <button 
                        onClick={() => setActiveTab('messages')}
                        className="px-6 sm:px-8 py-3 bg-purple-500 text-white rounded-full font-medium hover:bg-purple-600 transition-colors duration-75"
                      >
                        View Messages
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'matches' && (
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Your Romantic Matches 💕
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">People who could be your perfect romantic partner</p>
                

              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {romanticMatches.map((profile) => (
                  <div 
                    key={profile.id} 
                    className="bg-white rounded-2xl border border-gray-200 hover:shadow-xl transition-all duration-150 cursor-pointer relative overflow-hidden h-[500px] shadow-lg max-w-sm lg:max-w-md xl:max-w-lg"
                    onClick={() => openProfileModal(profile)}
                  >
                     {/* Background Profile Photo - Semi-blurred covering entire card */}
                     <div className="absolute inset-0 z-0">
                       <div className={`w-full h-full transition-all duration-500 ${
                         profile.isRevealed 
                           ? 'blur-none' 
                           : 'blur-sm opacity-60'
                       }`}>
                         <img 
                           src={profile.photos[0]} 
                           alt={`${profile.name}'s profile photo`}
                           className="w-full h-full object-cover rounded-2xl"
                           onError={(e) => {
                             // Fallback to gradient background if image fails to load
                             const target = e.currentTarget as HTMLImageElement;
                             target.style.display = 'none';
                             const fallback = target.nextElementSibling as HTMLElement;
                             if (fallback) fallback.style.display = 'flex';
                           }}
                         />
                         {/* Fallback gradient background */}
                         <div className="w-full h-full bg-gradient-to-br from-blue-200 via-cyan-200 to-blue-100 flex items-center justify-center text-white font-bold text-6xl sm:text-8xl rounded-2xl hidden">
                           👤
                         </div>
                       </div>
                     </div>
                     <div className="absolute inset-0 sm:hidden bg-gradient-to-b from-transparent via-black/5 to-black/20 z-[5] pointer-events-none"></div>
                    
                    {/* Content Overlay - Proper Portrait Layout */}
                    <div className="relative z-10 h-full flex flex-col p-2.5 sm:p-4">
                       {/* Top Section - Profile Info with Proper Hierarchy */}
                      <div className="text-center mb-3 sm:mb-6 mt-4 sm:mt-8">
                         {/* Name - LARGEST FONT */}
                        <h3 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 drop-shadow-lg">
                           {profile.name}
                         </h3>
                         
                         {/* Age & Location - SMALLEST FONT */}
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 drop-shadow-lg font-medium">
                           {profile.age} • {profile.location}
                         </p>
                         
                         {/* Match Percentage */}
                        <div className="inline-flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-300 mb-3 sm:mb-4 shadow-lg">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-yellow-500" />
                          <span className="font-bold text-xs sm:text-sm">{profile.matchPercentage}% Match</span>
                         </div>
                       </div>

                       {/* Middle Section - Common Interests - MEDIUM SIZE */}
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

                       {/* Bottom Section - Circular Action Buttons */}
                      <div className="mt-auto space-y-3 sm:space-y-4">
                         {/* Circular Action Buttons - Mobile Responsive */}
                        <div className="flex justify-center flex-wrap gap-x-2.5 sm:gap-x-3 md:gap-x-4 gap-y-1.5 sm:gap-y-2">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleProfileAction('like', profile);
                             }}
                             className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                           >
                             <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                           </button>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleProfileAction('love', profile);
                               // Open profile modal after love action
                               setTimeout(() => {
                                 openProfileModal(profile);
                               }, 100);
                             }}
                             className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-red-300 hover:border-red-500 hover:bg-red-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                           >
                             <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600" />
                           </button>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleProfileAction('bookmark', profile);
                             }}
                             className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                           >
                             <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600" />
                           </button>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               openDatePlanningModal(profile);
                             }}
                             className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-full border-2 border-green-300 hover:border-green-500 hover:bg-green-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                           >
                             <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                           </button>
                         </div>
                         
                         {/* Hint Text */}
                         {!profile.isRevealed && (
                           <div className="text-center">
                             <p className="text-xs text-gray-500 italic drop-shadow-lg font-medium">
                               * Click Heart to reveal full profile
                             </p>
                           </div>
                         )}
                         <div className="text-center mt-2">
                           <p className="text-xs text-gray-500 italic drop-shadow-lg font-medium">
                             * Click Calendar to plan a date
                           </p>
                         </div>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)]">
              {isMessagingInitialized ? (
                <div className="flex flex-col h-full">
                  {/* Enhanced Messages Header */}
                  <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-200 p-3 sm:p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Messages</h3>
                        <p className="text-xs text-gray-500">Enhanced chat with voice, reactions, and advanced features</p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Chat System with Advanced Features Integrated */}
                  <div className="flex-1 overflow-hidden">
                    <ChatSystem
                      userId={userId}
                      conversations={conversations}
                      theme="love"
                      currentUserProfile={{
                        id: userId,
                        name: "Current User",
                        age: 25,
                        location: "Mumbai, Maharashtra",
                        bio: "Passionate about love and connections",
                        commonInterests: ["Music", "Travel", "Food", "Movies", "Books"],
                        allTimeFavorites: {
                          "Fav Singers": [{ id: "1", name: "Arijit Singh", description: "Melodious voice", image: "" }],
                          "Fav Movies": [{ id: "2", name: "3 Idiots", description: "Comedy drama", image: "" }],
                          "Fav Travel Destinations": [{ id: "3", name: "Goa", description: "Beach paradise", image: "" }]
                        }
                      }}
                      onSendMessage={(conversationId, message) => {
                         const fullMessage = {
                           ...message,
                           id: Date.now().toString(),
                           timestamp: new Date(),
                           status: 'sent' as const
                         };
                         handleSendMessage(conversationId, fullMessage);
                       }}
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
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Messages</h3>
                    <p className="text-gray-600 text-sm">Initializing your advanced messaging system...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat Interface Tab */}
          {activeTab === 'chat-interface' && activeChat && (
            <div className="flex flex-col h-[calc(100vh-200px)] sm:h-[calc(100vh-250px)]">
              {/* Chat Header */}
              <div className="bg-white/80 backdrop-blur-sm border-b border-indigo-200 p-3 sm:p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={closeChat}
                    className="p-2 hover:bg-indigo-50 rounded-full transition-colors duration-75"
                  >
                    <ArrowLeft className="w-5 h-5 text-indigo-600" />
                  </button>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-indigo-200">
                    <img 
                      src={activeChat.photos[0]} 
                      alt={activeChat.name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{activeChat.name}</h3>
                    <p className="text-xs text-gray-500">{activeChat.location} • {activeChat.matchPercentage}% Match</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <button 
                    onClick={() => openDatePlanningModal(activeChat)}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm rounded-full border-2 border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                    title="Plan a Date"
                  >
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                  </button>
                <button 
                  onClick={() => openProfileModal(activeChat)}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm rounded-full border-2 border-gray-300 hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl"
                    title="View Profile"
                >
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
                {/* Welcome Message for New Conversations */}
                {chatMessages.filter(msg => msg.profile.id === activeChat.id).length === 1 && (
                  <div className="flex justify-center">
                    <div className="bg-white/80 backdrop-blur-sm border border-indigo-200 rounded-2xl px-4 py-3 max-w-sm">
                      <p className="text-sm text-indigo-700 text-center font-medium">
                        <i className="fas fa-star text-purple-500 mr-2"></i>Conversation started! You're now chatting with {activeChat.name}
                      </p>
                    </div>
                  </div>
                )}
                
                {chatMessages
                  .filter(msg => msg.profile.id === activeChat.id)
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs sm:max-w-md lg:max-w-lg px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                          message.sender === 'me'
                            ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white'
                            : 'bg-white/90 backdrop-blur-sm text-gray-800 border border-indigo-200'
                        }`}
                      >
                        <p className="text-sm sm:text-base leading-relaxed">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'me' ? 'text-indigo-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Message Input */}
              <div className="bg-white/80 backdrop-blur-sm border-t border-indigo-200 p-3 sm:p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-indigo-200 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/90 backdrop-blur-sm text-gray-800 placeholder-gray-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement;
                        sendMessage(input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement;
                      if (input) {
                        sendMessage(input.value);
                        input.value = '';
                      }
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg transition-all duration-200 flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dates' && (
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  Date Planning 💑
                </h1>
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">Plan romantic dates and activities with your matches</p>
                

              </div>
              
              {/* Always Visible Action Buttons - Love Universe Style - Mobile Responsive */}
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
                    onClick={() => setActiveTab('messages')}
                    className="w-full sm:w-auto px-3 sm:px-4 md:px-6 py-2.5 sm:py-2 md:py-2.5 lg:py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base flex items-center justify-center space-x-1.5 sm:space-x-2 hover:scale-105 shadow-md"
                  >
                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="whitespace-nowrap">Plan Date with Chat</span>
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
                  <div className="w-14 h-14 sm:w-20 sm:w-20 md:w-24 md:h-24 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Calendar className="w-7 h-7 sm:w-10 sm:w-10 md:w-12 md:h-12 text-indigo-400" />
                  </div>
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2 leading-tight">No dates planned yet</h3>
                  <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm md:text-base">Use the buttons above to start planning romantic dates with your matches!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Planned Dates List - Enhanced with All Fields */}
                  <div className="grid gap-3 sm:gap-4">
                    {plannedDates.map((date) => (
                      <div key={date.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-2.5 sm:p-3 md:p-4 border border-indigo-200 hover:border-indigo-300 transition-all duration-200 hover:shadow-lg">
                        <div className="flex items-start space-x-2 sm:space-x-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-indigo-200 flex-shrink-0">
                            <img 
                              src={date.fromProfile.photos[0]} 
                              alt={date.fromProfile.name}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 space-y-1 sm:space-y-0">
                              <h4 className="font-semibold text-gray-800 text-sm sm:text-base break-words">{date.fromProfile.name}</h4>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${
                                date.status === 'planned' ? 'bg-indigo-100 text-indigo-800' : 
                                date.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {date.status === 'planned' ? 'Planned' : 
                                 date.status === 'accepted' ? 'Accepted' : 
                                 'Pending'}
                              </span>
                            </div>
                            
                            {/* Enhanced Date Details - All Fields Displayed - Mobile Responsive */}
                            <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                              {/* Date Type */}
                              {date.type && (
                                <div className="flex items-center space-x-1.5 sm:space-x-2">
                                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-700 font-medium break-words">{date.type}</span>
                              </div>
                              )}
                              
                              {/* Date & Time */}
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-700 break-words">
                                  {date.proposedDate} at {date.proposedTime}
                                </span>
                              </div>
                              
                              {/* Location */}
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-700 break-words">{date.proposedLocation}</span>
                              </div>
                              
                              {/* Activity */}
                              <div className="flex items-center space-x-1.5 sm:space-x-2">
                                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                                <span className="text-xs sm:text-sm text-gray-700 break-words">{date.proposedActivity}</span>
                              </div>
                              
                              {/* Budget */}
                              {date.budget && (
                                <div className="flex items-center space-x-1.5 sm:space-x-2">
                                  <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-700 break-words">Budget: {date.budget}</span>
                                </div>
                              )}
                              
                              {/* Description */}
                            {date.description && (
                                <div className="flex items-start space-x-1.5 sm:space-x-2">
                                  <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-600 italic break-words">"{date.description}"</span>
                                </div>
                              )}
                              
                              {/* Special Notes */}
                              {date.specialNotes && (
                                <div className="flex items-start space-x-1.5 sm:space-x-2">
                                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-600 italic break-words">Notes: {date.specialNotes}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Profile Info & Match Details - Mobile Responsive */}
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 pt-2 border-t border-indigo-100">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 w-fit">
                                {date.fromProfile.matchPercentage}% Match
                              </span>
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-0.5 sm:space-y-0 sm:space-x-2">
                                <span className="text-xs text-gray-500 break-words">
                                {date.fromProfile.location}
                              </span>
                                <span className="text-xs text-gray-400">
                                  • {date.fromProfile.age} years old
                              </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Additional Action Button */}
                  <div className="text-center pt-4">
                    <button 
                      onClick={() => setActiveTab('date-requests')}
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
                            <span className="font-bold text-xs sm:text-sm">{profile.matchPercentage}% Match</span>
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
                            <span className="font-bold text-xs sm:text-sm">{profile.matchPercentage}% Match</span>
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
                                openChat(profile);
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
                                removeFromLoved(profile.id);
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
                              * Click Calendar to plan a date • Click Message to chat
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
                            <span className="font-bold text-xs sm:text-sm">{profile.matchPercentage}% Match</span>
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
                                openChat(profile);
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
                                removeFromBookmarked(profile.id);
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
                              {request.fromProfile.matchPercentage}% Match
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
                                {request.fromProfile.commonInterests?.find(interest => 
                                  ['Taylor Swift', 'Arijit Singh', 'Ed Sheeran', 'Shreya Ghoshal'].includes(interest)
                                ) || "Music"}
                              </p>
                            </div>
                            <div className="text-center p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-200 hover:shadow-md transition-all duration-200 hover:scale-105 group">
                              <Film className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {request.fromProfile.commonInterests?.find(interest => 
                                  ['Movies', 'Netflix', 'Gaming'].includes(interest)
                                ) || "Entertainment"}
                              </p>
                            </div>
                            <div className="text-center p-3 sm:p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-pink-200 hover:shadow-md transition-all duration-200 hover:scale-105 group">
                              <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-pink-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                              <p className="text-sm font-medium text-gray-700 truncate">
                                {request.fromProfile.commonInterests?.find(interest => 
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


        </div>
      </div>

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
                <button 
                  onClick={closeProfileModal}
                  className="p-1 sm:p-1.5 md:p-2 lg:p-2.5 xl:p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors duration-75 self-end sm:self-auto"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7" />
                </button>
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
                    onError={(e) => {
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
                          onError={(e) => {
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
                    {selectedProfile.commonInterests.map((interest: string, index: number) => (
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
                        onClick={() => console.log('Send date request clicked')}
                        className="flex-1 py-1 sm:py-2 md:py-2.5 lg:py-3 xl:py-4 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg sm:rounded-xl md:rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base lg:text-lg flex items-center justify-center space-x-1 sm:space-x-2"
                      >
                        <Calendar className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                        <span>Send Date Request</span>
                      </button>
                      <button 
                        onClick={() => openAIPromptsModal(selectedProfile)}
                        className="flex-1 py-1 sm:py-2 md:py-2.5 lg:py-3 xl:py-4 px-2 sm:px-3 md:px-4 lg:px-5 xl:px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg sm:rounded-xl md:rounded-2xl font-semibold hover:shadow-lg transition-all duration-200 text-xs sm:text-sm md:text-base lg:text-lg flex items-center justify-center space-x-1 sm:space-x-2"
                      >
                        <MessageCircle className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                        <span>Message Them</span>
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
                        When both of you show mutual interest, magic happens! 💕
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

      {/* AI Chat Prompts Modal */}
      {showAIPromptsModal && selectedProfileForChat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border border-indigo-200 max-w-md w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 sm:p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/80 shadow-lg">
                    <img 
                      src={selectedProfileForChat.photos[0]} 
                      alt={selectedProfileForChat.name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                      Message {selectedProfileForChat.name}
                    </h3>
                    <p className="text-indigo-100 text-xs sm:text-sm font-medium">
                      Choose a conversation starter <i className="fas fa-sparkles text-blue-500 ml-2"></i>
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAIPromptsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Prompts */}
            <div className="p-4 sm:p-5 space-y-3 max-h-96 overflow-y-auto">
              {aiPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => selectAIPrompt(prompt)}
                  className="w-full text-left p-3 sm:p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 rounded-xl sm:rounded-2xl hover:border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-100 hover:via-purple-100 hover:to-pink-100 transition-all duration-200 group shadow-sm hover:shadow-md"
                >
                  <p className="text-gray-800 text-sm sm:text-base leading-relaxed font-medium">{prompt}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-indigo-600 font-semibold bg-white/60 px-2 py-1 rounded-full">
                      Click to send
                    </span>
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-t border-indigo-200">
              <p className="text-xs sm:text-sm text-indigo-700 text-center font-medium">
                💡 These prompts are personalized based on your common interests with {selectedProfileForChat.name}
              </p>
            </div>
          </div>
        </div>
      )}

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
                      src={selectedProfileForDate.photos[0]} 
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
                  {currentMatch.profile.matchPercentage}% Match
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
                  {spinwheelProfile.matchPercentage}% Match
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

              {/* Challenge History - Mobile Optimized */}
              {challengeHistory.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border border-indigo-200">
                  <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-2.5 sm:mb-3 flex items-center space-x-2">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                    <span>Challenge History</span>
                  </h4>
                  
                  <div className="space-y-2 sm:space-y-3">
                    {challengeHistory.slice(0, 5).map((challenge) => (
                      <div key={challenge.id} className="bg-white/80 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                            {challenge.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </p>
                          <p className="text-xs text-gray-500">{challenge.date}</p>
                        </div>
                        <div className="text-right ml-2 flex-shrink-0">
                          <p className="text-xs sm:text-sm font-semibold text-indigo-600">
                            {challenge.completed}/{challenge.target}
                          </p>
                          <p className="text-xs text-gray-500">Completed</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rewards Section - Mobile Optimized */}
              {challengeRewards.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-green-200">
                  <h4 className="text-base sm:text-lg font-bold text-gray-800 mb-2.5 sm:mb-3 flex items-center space-x-2">
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span>Your Rewards</span>
                  </h4>
                  
                  <div className="space-y-2 sm:space-y-3">
                    {challengeRewards.map((reward) => (
                      <div key={reward.id} className="bg-white/80 rounded-lg sm:rounded-xl p-2.5 sm:p-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-xs sm:text-sm font-medium text-gray-700 truncate">{reward.title}</p>
                          <p className="text-xs text-gray-500 truncate">{reward.description}</p>
                        </div>
                        <button
                          onClick={() => claimReward(reward.id)}
                          disabled={reward.isClaimed}
                          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-colors duration-75 flex-shrink-0 ${
                            reward.isClaimed
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {reward.isClaimed ? 'Claimed' : 'Claim'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-[95vw] sm:max-w-md w-full max-h-[90vh] sm:max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold">Notifications</h3>
                    <p className="text-indigo-100 text-sm">{unreadNotifications} unread</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors duration-75"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-2 mt-4">
                <button
                  onClick={markAllNotificationsAsRead}
                  className="flex-1 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors duration-75"
                >
                  Mark All Read
                </button>
                <button
                  onClick={() => setShowNotificationsModal(false)}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors duration-75"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[60vh]">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">No notifications</h4>
                  <p className="text-gray-600 text-sm">You're all caught up! <i className="fas fa-party-horn text-yellow-500 ml-2"></i></p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors duration-75 cursor-pointer ${
                        !notification.isRead ? 'bg-indigo-50/50' : ''
                      }`}
                      onClick={() => handleNotificationAction(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Notification Icon */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          notification.type === 'new_match' ? 'bg-green-100' :
                          notification.type === 'date_request' ? 'bg-pink-100' :
                          notification.type === 'message' ? 'bg-blue-100' :
                          notification.type === 'date_accepted' ? 'bg-purple-100' :
                          'bg-gray-100'
                        }`}>
                          {notification.type === 'new_match' ? <Heart className="w-4 h-4 text-green-600" /> :
                           notification.type === 'date_request' ? <Calendar className="w-4 h-4 text-pink-600" /> :
                           notification.type === 'message' ? <MessageCircle className="w-4 h-4 text-blue-600" /> :
                           notification.type === 'date_accepted' ? <Star className="w-4 h-4 text-purple-600" /> :
                           <User className="w-4 h-4 text-gray-600" />}
                        </div>

                        {/* Notification Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className={`font-semibold text-sm ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h5>
                              <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                              
                              {/* Profile Info if available */}
                              {notification.profile && (
                                <div className="flex items-center space-x-2 mt-2">
                                  <img
                                    src={getWorkingImageUrl(notification.profile.photos[0], 0)}
                                    alt={notification.profile.name}
                                    className="w-6 h-6 rounded-full border border-gray-200"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = fallbackImages[0];
                                    }}
                                  />
                                  <span className="text-xs text-gray-500">
                                    {notification.profile.name} • {notification.profile.matchPercentage}% Match
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Timestamp and Actions */}
                            <div className="flex flex-col items-end space-y-2 ml-2">
                              <span className="text-xs text-gray-400">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1 hover:bg-red-100 rounded-full transition-colors duration-75"
                                title="Delete notification"
                              >
                                <X className="w-3 h-3 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Personality & Values Assessment Popup */}
      {showPersonalityPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-[95vw] sm:max-w-md md:max-w-lg w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold"><i className="fas fa-sparkles text-blue-500 mr-2"></i>Personality & Values</h3>
                    <p className="text-indigo-100 text-xs sm:text-sm">Help us understand you better for perfect matches!</p>
                  </div>
                </div>
                <button
                  onClick={closePersonalityPopup}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors duration-75"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[70vh]">
              <form onSubmit={(e) => {
                e.preventDefault();
                handlePersonalitySubmit(personalityData);
              }} className="space-y-4">
                
                {/* Communication Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💬 Communication Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Introvert', 'Extrovert', 'Direct', 'Subtle'].map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setPersonalityData(prev => ({ ...prev, communicationStyle: style }))}
                        className={`p-2 rounded-lg border transition-colors duration-75 ${
                          personalityData.communicationStyle === style
                            ? 'bg-indigo-500 text-white border-indigo-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Social Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">👥 Social Preferences</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['Large groups', 'Small gatherings', 'One-on-one'].map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setPersonalityData(prev => ({ ...prev, socialPreferences: pref }))}
                        className={`p-2 rounded-lg border transition-colors duration-75 ${
                          personalityData.socialPreferences === pref
                            ? 'bg-indigo-500 text-white border-indigo-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Life Goals */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🎯 Life Goals</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['Career-focused', 'Family-oriented', 'Adventure-seeking'].map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => setPersonalityData(prev => ({ ...prev, lifeGoals: goal }))}
                        className={`p-2 rounded-lg border transition-colors duration-75 ${
                          personalityData.lifeGoals === goal
                            ? 'bg-indigo-500 text-white border-indigo-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Values */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">❤️ Values</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Religion', 'Politics', 'Environmental consciousness'].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPersonalityData(prev => ({ ...prev, values: value }))}
                        className={`p-2 rounded-lg border transition-colors duration-75 ${
                          personalityData.values === value
                            ? 'bg-indigo-500 text-white border-indigo-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lifestyle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🌙 Lifestyle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Night owl', 'Early bird', 'Active', 'Relaxed', 'Urban', 'Rural'].map((lifestyle) => (
                      <button
                        key={lifestyle}
                        type="button"
                        onClick={() => setPersonalityData(prev => ({ ...prev, lifestyle: lifestyle }))}
                        className={`p-2 rounded-lg border transition-colors duration-75 ${
                          personalityData.lifestyle === lifestyle
                            ? 'bg-indigo-500 text-white border-indigo-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                        }`}
                      >
                        {lifestyle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!personalityData.communicationStyle || !personalityData.socialPreferences || !personalityData.lifeGoals || !personalityData.values || !personalityData.lifestyle}
                  className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✨ Save Preferences
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Dating-Specific Parameters Popup */}
      {showDatingPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-[95vw] sm:max-w-md md:max-w-lg w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <Heart className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold">💕 Dating Preferences</h3>
                    <p className="text-pink-100 text-xs sm:text-sm">Fine-tune your dating experience!</p>
                  </div>
                </div>
                <button
                  onClick={closeDatingPopup}
                  className="p-1.5 sm:p-2 hover:bg-white/20 rounded-full transition-colors duration-75"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[70vh]">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleDatingSubmit(datingData);
              }} className="space-y-4">
                
                {/* Children */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">👶 Children</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['Want children', 'Have children', "Don't want children"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDatingData(prev => ({ ...prev, children: option }))}
                        className={`p-2 rounded-lg border transition-colors duration-75 ${
                          datingData.children === option
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Deal Breakers */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🚫 Deal Breakers</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Smoking', 'Drinking', 'Religion', 'Politics'].map((breaker) => (
                      <button
                        key={breaker}
                        type="button"
                        onClick={() => {
                          const newBreakers = datingData.dealBreakers.includes(breaker)
                            ? datingData.dealBreakers.filter(b => b !== breaker)
                            : [...datingData.dealBreakers, breaker];
                          setDatingData(prev => ({ ...prev, dealBreakers: newBreakers }));
                        }}
                        className={`p-2 rounded-lg border transition-colors duration-75 ${
                          datingData.dealBreakers.includes(breaker)
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                        }`}
                      >
                        {breaker}
                      </button>
                    ))}
                  </div>
                </div>

                {/* First Date Preferences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">☕ First Date Preferences</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Coffee', 'Dinner', 'Activity', 'Outdoor'].map((pref) => (
                      <button
                        key={pref}
                        type="button"
                        onClick={() => setDatingData(prev => ({ ...prev, firstDatePreferences: pref }))}
                        className={`p-2 rounded-lg border transition-colors duration-75 ${
                          datingData.firstDatePreferences === pref
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                        }`}
                      >
                        {pref}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Communication Frequency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💬 Communication Frequency</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['Daily', 'Weekly', 'Occasional'].map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setDatingData(prev => ({ ...prev, communicationFrequency: freq }))}
                        className={`p-2 rounded-lg border transition-colors duration-75 ${
                          datingData.communicationFrequency === freq
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Meeting Pace */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">⏱️ Meeting Pace</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['Quick meetup', 'Gradual getting to know'].map((pace) => (
                      <button
                        key={pace}
                        type="button"
                        onClick={() => setDatingData(prev => ({ ...prev, meetingPace: pace }))}
                        className={`p-2 rounded-lg border transition-colors duration-75 ${
                          datingData.meetingPace === pace
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                        }`}
                      >
                        {pace}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Physical Intimacy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">💝 Physical Intimacy</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['Conservative', 'Moderate', 'Progressive'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setDatingData(prev => ({ ...prev, physicalIntimacy: level }))}
                        className={`p-2 rounded-lg border transition-colors duration-75 ${
                          datingData.physicalIntimacy === level
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Future Planning */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">🔮 Future Planning</label>
                  <div className="grid grid-cols-1 gap-2">
                    {['Short-term', 'Long-term', 'Marriage-minded'].map((planning) => (
                      <button
                        key={planning}
                        type="button"
                        onClick={() => setDatingData(prev => ({ ...prev, futurePlanning: planning }))}
                        className={`p-2 rounded-lg border transition-colors duration-75 ${
                          datingData.futurePlanning === planning
                            ? 'bg-pink-500 text-white border-pink-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-pink-300'
                        }`}
                      >
                        {planning}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!datingData.children || !datingData.firstDatePreferences || !datingData.communicationFrequency || !datingData.meetingPace || !datingData.physicalIntimacy || !datingData.futurePlanning}
                  className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💕 Save Dating Preferences
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar - Only Visible on Mobile */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-pink-200 shadow-lg">
        <div className="flex items-center justify-around py-2.5">
          {[
            { id: 'overview', label: 'Overview', icon: Heart },
            { id: 'matches', label: 'Matches', icon: Star },
            { id: 'its-a-match', label: 'Match!', icon: Sparkles },
            { id: 'messages', label: 'Messages', icon: MessageCircle },
            { id: 'dates', label: 'Dates', icon: Calendar },
            { id: 'date-requests', label: 'Requests', icon: Calendar }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center space-y-1 py-2 px-2 sm:px-3 rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'text-pink-600 bg-pink-50'
                    : 'text-gray-600 hover:text-pink-600'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    activeTab === tab.id ? 'text-pink-600' : 'text-gray-600'
                  }`} />
                </div>
                <span className={`text-[10px] sm:text-xs font-medium ${
                  activeTab === tab.id ? 'text-pink-600' : 'text-gray-600'
                }`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Demo Notifications - Smaller Font Size */}
      {demoNotifications.length > 0 && (
        <div className="fixed bottom-20 sm:bottom-3 md:bottom-4 right-2 sm:right-3 md:right-4 left-2 sm:right-3 md:right-auto space-y-1.5 sm:space-y-2 z-50">
          {demoNotifications.map((notification, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-full shadow-lg border border-indigo-200 animate-bounce-in text-xs sm:text-xs md:text-xs font-medium"
            >
              {notification}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoveDashboard;
