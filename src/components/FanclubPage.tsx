import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Heart, MessageCircle, Calendar, Star, Plus, Search, Video, FileText, MapPin, ThumbsUp, ThumbsDown, Share2, Bookmark, Image, Music, Globe, BarChart3, Activity, Bell, Hash, Play, Trophy, TrendingUp, Award, BookOpen, Zap, Phone } from 'lucide-react';
import CreatePostModal from './CreatePostModal';

interface FanclubMember {
  id: number;
  name: string;
  avatar: string;
  sharedInterests: string[];
  matchPercentage: number;
  isOnline: boolean;
  lastSeen: string;
  role: 'member' | 'moderator' | 'admin' | 'founder';
  reputation: number;
  fanLevel: 'New Fan' | 'Active Fan' | 'Super Fan' | 'Legendary Fan';
  achievements: string[];
  joinDate: string;
}

interface FanclubPost {
  id: number;
  author: {
    name: string;
    avatar: string;
    reputation: number;
    fanLevel: string;
  };
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'question' | 'poll' | 'event' | 'link' | 'achievement';
  media?: string;
  likes: number;
  dislikes: number;
  comments: number;
  shares: number;
  bookmarks: number;
  timestamp: string;
  sharedInterests: string[];
  isPinned: boolean;
  isModerated: boolean;
  isExclusive: boolean;
}

interface FanclubEvent {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  organizer: {
    name: string;
    avatar: string;
    fanLevel: string;
  };
  type: 'online' | 'in-person' | 'hybrid';
  interests: string[];
  isExclusive: boolean;
}

interface FanclubAchievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: 'participation' | 'contribution' | 'leadership' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedBy: string[];
  unlockDate?: string;
}

interface FanclubResource {
  id: number;
  name: string;
  description: string;
  type: 'document' | 'template' | 'code' | 'presentation' | 'video' | 'audio';
  fileSize: string;
  downloads: number;
  rating: number;
  author: {
    name: string;
    avatar: string;
    fanLevel: string;
  };
  uploadDate: string;
  isExclusive: boolean;
  tags: string[];
}

interface FanclubPageProps {
  fanclubId: number;
  userProfile: {
    interests: string[];
    name: string;
    avatar: string;
    role: 'member' | 'moderator' | 'admin';
    fanLevel: string;
  };
}

const FanclubPage: React.FC<FanclubPageProps> = ({ fanclubId, userProfile }) => {
  const { fanclubId: routeFanclubId } = useParams<{ fanclubId: string }>();
  const actualFanclubId = routeFanclubId ? parseInt(routeFanclubId) : fanclubId;
  
  // Provide fallback userProfile if not provided
  const safeUserProfile = userProfile || {
    interests: ["Technology", "Programming", "Innovation"],
    name: "Anonymous User",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face",
    role: 'member' as const,
    fanLevel: 'New Fan'
  };
  
  const [members, setMembers] = useState<FanclubMember[]>([]);
  const [posts, setPosts] = useState<FanclubPost[]>([]);
  const [events, setEvents] = useState<FanclubEvent[]>([]);
  const [achievements, setAchievements] = useState<FanclubAchievement[]>([]);
  const [resources, setResources] = useState<FanclubResource[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [fanclubData, setFanclubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'members' | 'discussions' | 'events' | 'media' | 'achievements' | 'resources' | 'chat'>('home');
  const [isJoined, setIsJoined] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [liveMembers, setLiveMembers] = useState<number>(0);
  const [realTimeUpdates, setRealTimeUpdates] = useState<boolean>(true);

  // Generate fanclub data based on ID - EXCITING & VIBRANT!
  const generateFanclubData = (id: number) => {
    // Validate ID and provide fallback
    if (!id || isNaN(id) || id < 0) {
      id = 0; // Default to first fanclub if invalid ID
    }
    const fanclubNames = [
      "Celebrity Gossip & Tea",
      "Gaming Legends United", 
      "Shopping Addicts Anonymous",
      "Trending Topics & Memes",
      "Fitness & Wellness Cult",
      "Foodie Paradise",
      "Travel & Adventure Seekers",
      "Music & Dance Maniacs",
      "Creative Souls & Artists",
      "Pet Lovers & Animal Friends"
    ];
    
    const fanclubDescriptions = [
      "Spill the tea! Get the latest celebrity gossip, drama, and behind-the-scenes scoop. No judgment, just pure entertainment!",
      "Level up together! From casual gamers to pro streamers, we celebrate all things gaming. Let's dominate the leaderboards!",
      "Retail therapy is real therapy! Share deals, hauls, and shopping wins. Your wallet might hate us, but your closet will love us!",
      "Stay woke to what's popping! Viral memes, trending topics, and internet culture. We're always ahead of the curve!",
      "Transform your life, one workout at a time! Motivation, progress pics, and healthy living tips. Let's build those gains together!",
      "Food is life! Share recipes, restaurant reviews, and food porn. Warning: may cause extreme hunger and food envy!",
      "Wanderlust warriors unite! Travel tips, bucket lists, and adventure stories. The world is your playground!",
      "Feel the rhythm! Share music, dance moves, and concert experiences. Let's make the world dance together!",
      "Unleash your creativity! Art, crafts, DIY projects, and creative inspiration. Every artist was first an amateur!",
      "Pawsome friends forever! Share pet photos, stories, and animal adventures. Because pets make life better!"
    ];
    
    const categories = [
      "Celebrity & Entertainment", "Gaming & Esports", "Shopping & Fashion", "Trending & Viral", 
      "Health & Wellness", "Food & Dining", "Travel & Adventure", "Music & Dance", "Arts & Creativity", "Pets & Animals"
    ];
    
    const name = fanclubNames[id % fanclubNames.length];
    const description = fanclubDescriptions[id % fanclubNames.length];
    const category = categories[id % categories.length];
    
    return {
      id,
      name,
      description,
      category,
      type: "Public",
      memberCount: 15000 + (id * 500),
      maxMembers: 50000 + (id * 1000),
      foundedDate: "2023",
      location: "Global",
      matchPercentage: 85 + (id % 15),
      sharedInterests: ["Entertainment", "Gaming", "Shopping", "Trending", "Wellness", "Food", "Travel", "Music", "Art", "Pets"],
      vibe: "Exciting & Vibrant",
      energy: "High Energy",
      exclusivity: "Premium Access"
    };
  };

  // Real-time data updates - in real app this would come from API with WebSocket
  useEffect(() => {
    // Validate fanclub ID and generate data
    if (actualFanclubId && !isNaN(actualFanclubId)) {
    const fanclub = generateFanclubData(actualFanclubId);
    setFanclubData(fanclub);
    } else {
      // Fallback to default fanclub if invalid ID
      const fanclub = generateFanclubData(0);
      setFanclubData(fanclub);
    }
    setLoading(false);
    
    // Simulate real-time data updates
    const updateInterval = setInterval(() => {
      // Update member online status
      setMembers(prev => prev.map(member => ({
        ...member,
        isOnline: Math.random() > 0.3, // 70% chance of being online
        lastSeen: member.isOnline ? "Online now" : `${Math.floor(Math.random() * 60)} minutes ago`
      })));
      
      // Update post engagement in real-time
      setPosts(prev => prev.map(post => ({
        ...post,
        likes: post.likes + Math.floor(Math.random() * 3), // Random engagement increase
        comments: post.comments + Math.floor(Math.random() * 2)
      })));
      
      // Update live member count
      setLiveMembers(Math.floor(Math.random() * 100) + 50); // Random live members between 50-150
    }, 30000); // Update every 30 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(updateInterval);
    
    // Enhanced mock data with fanclub-specific features
    const mockMembers: FanclubMember[] = [
      {
        id: 1,
        name: "Sarah Chen",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
        sharedInterests: ["Technology", "Programming", "Artificial Intelligence", "Innovation"],
        matchPercentage: 95,
        isOnline: true,
        lastSeen: "2 minutes ago",
        role: 'moderator',
        reputation: 1250,
        fanLevel: 'Super Fan',
        achievements: ['First Post', 'Event Organizer', 'Helpful Member'],
        joinDate: 'January 2023'
      },
      {
        id: 2,
        name: "Alex Rodriguez",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
        sharedInterests: ["Technology", "Programming", "Startups", "Machine Learning"],
        matchPercentage: 88,
        isOnline: true,
        lastSeen: "5 minutes ago",
        role: 'member',
        reputation: 890,
        fanLevel: 'Active Fan',
        achievements: ['First Post', 'Regular Contributor'],
        joinDate: 'February 2023'
      },
      {
        id: 3,
        name: "Emma Thompson",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
        sharedInterests: ["Technology", "Artificial Intelligence", "Data Science", "Innovation"],
        matchPercentage: 92,
        isOnline: false,
        lastSeen: "1 hour ago",
        role: 'member',
        reputation: 650,
        fanLevel: 'New Fan',
        achievements: ['First Post'],
        joinDate: 'March 2023'
      }
    ];

    const mockPosts: FanclubPost[] = [
      {
        id: 1,
        author: {
          name: "Sarah Chen",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
          reputation: 1250,
          fanLevel: 'Super Fan'
        },
        content: "Just finished building an AI-powered recommendation system! Anyone else working on machine learning projects? Would love to collaborate! 🚀",
        type: 'question',
        likes: 12,
        dislikes: 0,
        comments: 8,
        shares: 3,
        bookmarks: 5,
        timestamp: "2 hours ago",
        sharedInterests: ["Technology", "Programming", "Artificial Intelligence"],
        isPinned: false,
        isModerated: false,
        isExclusive: false
      },
      {
        id: 2,
        author: {
          name: "Alex Rodriguez",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
          reputation: 890,
          fanLevel: 'Active Fan'
        },
        content: "Found this amazing article about the future of AI in startups. Thought you all would find it interesting! 💡",
        type: 'link',
        likes: 8,
        dislikes: 1,
        comments: 5,
        shares: 2,
        bookmarks: 3,
        timestamp: "4 hours ago",
        sharedInterests: ["Technology", "Startups", "Artificial Intelligence"],
        isPinned: false,
        isModerated: false,
        isExclusive: false
      },
      {
        id: 3,
        author: {
          name: "Emma Thompson",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
          reputation: 650,
          fanLevel: 'New Fan'
        },
        content: "Check out this amazing visualization of neural networks! 🤖",
        type: 'image',
        media: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop",
        likes: 15,
        dislikes: 0,
        comments: 6,
        shares: 4,
        bookmarks: 8,
        timestamp: "6 hours ago",
        sharedInterests: ["Technology", "Artificial Intelligence", "Data Science"],
        isPinned: true,
        isModerated: false,
        isExclusive: false
      },
      {
        id: 4,
        author: {
          name: "David Kim",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
          reputation: 1100,
          fanLevel: 'Legendary Fan'
        },
        content: "What's your favorite programming language for AI development? Let's vote!",
        type: 'poll',
        likes: 22,
        dislikes: 2,
        comments: 18,
        shares: 7,
        bookmarks: 12,
        timestamp: "8 hours ago",
        sharedInterests: ["Technology", "Programming", "Artificial Intelligence"],
        isPinned: false,
        isModerated: false,
        isExclusive: false
      },
      {
        id: 5,
        author: {
          name: "Lisa Wang",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face",
          reputation: 950,
          fanLevel: 'Active Fan'
        },
        content: "Just uploaded the latest fanclub guidelines document. Please review and let me know your thoughts!",
        type: 'link',
        likes: 8,
        dislikes: 0,
        comments: 12,
        shares: 5,
        bookmarks: 15,
        timestamp: "10 hours ago",
        sharedInterests: ["Technology", "Community", "Guidelines"],
        isPinned: false,
        isModerated: false,
        isExclusive: false
      },
      {
        id: 6,
        author: {
          name: "Mike Johnson",
          avatar: "https://images.unsplash.com/photo-1472099645785-53994a69daeb?w=80&h=80&fit=crop&crop=face",
          reputation: 780,
          fanLevel: 'New Fan'
        },
        content: "New discussion thread: How can we make our fanclub more inclusive for beginners?",
        type: 'question',
        likes: 16,
        dislikes: 1,
        comments: 25,
        shares: 8,
        bookmarks: 20,
        timestamp: "12 hours ago",
        sharedInterests: ["Technology", "Community", "Inclusion"],
        isPinned: false,
        isModerated: false,
        isExclusive: false
      },
      {
        id: 7,
        author: {
          name: "Rachel Green",
          avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face",
          reputation: 1200,
          fanLevel: 'Super Fan'
        },
        content: "Check out this tutorial video I made on building REST APIs with Node.js!",
        type: 'video',
        media: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
        likes: 28,
        dislikes: 2,
        comments: 15,
        shares: 12,
        bookmarks: 25,
        timestamp: "1 day ago",
        sharedInterests: ["Technology", "Programming", "Web Development"],
        isPinned: false,
        isModerated: false,
        isExclusive: false
      },
      {
        id: 8,
        author: {
          name: "Alex Rodriguez",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
          reputation: 890,
          fanLevel: 'Active Fan'
        },
        content: "Live coding session starting in 10 minutes! Join us for some pair programming fun!",
        type: 'event',
        likes: 35,
        dislikes: 1,
        comments: 22,
        shares: 18,
        bookmarks: 30,
        timestamp: "1 day ago",
        sharedInterests: ["Technology", "Programming", "Collaboration"],
        isPinned: false,
        isModerated: false,
        isExclusive: false
      },
      {
        id: 9,
        author: {
          name: "Sophia Rodriguez",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
          reputation: 920,
          fanLevel: 'Active Fan'
        },
        content: "Just discovered this amazing new framework for building microservices! Has anyone tried it yet?",
        type: 'question',
        likes: 18,
        dislikes: 0,
        comments: 14,
        shares: 6,
        bookmarks: 9,
        timestamp: "1 day ago",
        sharedInterests: ["Technology", "Programming", "Microservices"],
        isPinned: false,
        isModerated: false,
        isExclusive: false
      },
      {
        id: 10,
        author: {
          name: "James Wilson",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
          reputation: 1100,
          fanLevel: 'Super Fan'
        },
        content: "Amazing sunset from our office rooftop! Perfect coding weather",
        type: 'image',
        media: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
        likes: 42,
        dislikes: 0,
        comments: 8,
        shares: 15,
        bookmarks: 12,
        timestamp: "1 day ago",
        sharedInterests: ["Technology", "Lifestyle", "Photography"],
        isPinned: false,
        isModerated: false,
        isExclusive: false
      }
    ];

    const mockEvents: FanclubEvent[] = [
      {
        id: 1,
        title: "AI & Machine Learning Meetup",
        description: "Join us for an evening of AI discussions, demos, and networking!",
        date: "2024-02-15",
        time: "7:00 PM",
        location: "Tech Hub Downtown",
        attendees: 23,
        maxAttendees: 50,
        organizer: {
          name: "Sarah Chen",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
          fanLevel: 'Super Fan'
        },
        type: 'in-person',
        interests: ["Technology", "Artificial Intelligence", "Machine Learning"],
        isExclusive: false
      },
      {
        id: 2,
        title: "Virtual Coding Session",
        description: "Let's code together! Bring your projects and let's collaborate.",
        date: "2024-02-20",
        time: "6:00 PM",
        location: "Online (Zoom)",
        attendees: 15,
        maxAttendees: 30,
        organizer: {
          name: "Alex Rodriguez",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
          fanLevel: 'Active Fan'
        },
        type: 'online',
        interests: ["Technology", "Programming", "Collaboration"],
        isExclusive: true
      }
    ];

    const mockAchievements: FanclubAchievement[] = [
      {
        id: 1,
        name: "First Post",
        description: "Made your first post in the fanclub",
        icon: "🎉",
        category: 'participation',
        rarity: 'common',
        unlockedBy: ["Sarah Chen", "Alex Rodriguez", "Emma Thompson"]
      },
      {
        id: 2,
        name: "Event Organizer",
        description: "Successfully organized a fanclub event",
        icon: "🎪",
        category: 'leadership',
        rarity: 'rare',
        unlockedBy: ["Sarah Chen"]
      },
      {
        id: 3,
        name: "Helpful Member",
        description: "Received 10+ helpful votes on your posts",
        icon: "🤝",
        category: 'contribution',
        rarity: 'epic',
        unlockedBy: ["Sarah Chen"]
      }
    ];

    const mockResources: FanclubResource[] = [
      {
        id: 1,
        name: "React Best Practices Guide",
        description: "Comprehensive guide covering React hooks, performance optimization, and best practices",
        type: 'document',
        fileSize: '2.4 MB',
        downloads: 156,
        rating: 4.8,
        author: {
          name: "Sarah Chen",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
          fanLevel: 'Super Fan'
        },
        uploadDate: '2 hours ago',
        isExclusive: false,
        tags: ['React', 'Frontend', 'Best Practices']
      },
      {
        id: 2,
        name: "AI Project Template",
        description: "Starter template for AI/ML projects with common libraries and project structure",
        type: 'template',
        fileSize: '15.7 MB',
        downloads: 89,
        rating: 4.6,
        author: {
          name: "Emma Thompson",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
          fanLevel: 'New Fan'
        },
        uploadDate: '1 day ago',
        isExclusive: true,
        tags: ['AI', 'Machine Learning', 'Template']
      }
    ];

    setMembers(mockMembers);
    setPosts(mockPosts);
    setEvents(mockEvents);
    setAchievements(mockAchievements);
    setResources(mockResources);
  }, [actualFanclubId]);

  // Calculate shared interests between user and fanclub
  const fanclubSharedInterests = fanclubData?.sharedInterests || [];
  const userSharedInterests = safeUserProfile.interests.filter(interest => 
    fanclubSharedInterests.includes(interest)
  );

  const handleCreatePost = (newPost: {
    content: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'question' | 'poll' | 'event' | 'link';
    sharedInterests: string[];
  }) => {
    const post: FanclubPost = {
      id: Date.now(),
      author: {
        name: safeUserProfile.name,
        avatar: safeUserProfile.avatar,
        reputation: 100,
        fanLevel: safeUserProfile.fanLevel
      },
      content: newPost.content,
      type: newPost.type,
      likes: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      bookmarks: 0,
      timestamp: 'Just now',
      sharedInterests: newPost.sharedInterests,
      isPinned: false,
      isModerated: false,
      isExclusive: false
    };
    
    setPosts(prev => [post, ...prev]);
  };

  const handlePostAction = (postId: number, action: 'like' | 'dislike' | 'bookmark') => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        switch (action) {
          case 'like':
            return { ...post, likes: post.likes + 1 };
          case 'dislike':
            return { ...post, dislikes: post.dislikes + 1 };
          case 'bookmark':
            return { ...post, bookmarks: post.bookmarks + 1 };
          default:
            return post;
        }
      }
      return post;
    }));
  };

  const handleJoinFanclub = () => {
    setIsJoined(true);
    // In real app, this would call API to join fanclub
  };

  const handleLeaveFanclub = () => {
    setIsJoined(false);
    // In real app, this would call API to leave fanclub
  };

  // Image fallback handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNFNUY3RkEiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMlpNMTIgMjBDNy41OSAyMCA0IDE2LjQxIDQgMTJDNCA3LjU5IDcuNTkgNCAxMiA0QzE2LjQxIDQgMjAgNy41OSAyMCAxMkMyMCAxNi40MSAxNi40MSAyMCAyMCAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEyIDZDNi40OCA2IDIgMTAuNDggMiAxNkMyIDIxLjUyIDYuNDggMjYgMTIgMjZDMjEuNTIgMjYgMjYgMjEuNTIgMjYgMTZDMjYgMTAuNDggMjEuNTIgNiAxMiA2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4KPC9zdmc+';
  };

  // Show loading state while data is being initialized
  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-gray-600 font-medium">Loading fanclub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fanclub Header - Clean & Vibrant */}
      <div className="bg-white shadow-lg border-b border-purple-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-purple-200 transform hover:scale-105 transition-all duration-300">
                    <span className="text-white text-2xl font-bold">
                      {fanclubData?.name ? fanclubData.name.substring(0, 2).toUpperCase() : 'FC'}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 sm:w-5 sm:h-5 bg-pink-500 rounded-full border-2 border-white shadow-lg"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center truncate mb-1">
                    <span className="truncate">{fanclubData?.name || 'Celebrity Gossip & Tea'}</span>
                    <span className="ml-2 text-pink-500 flex-shrink-0">
                      <i className="fas fa-crown"></i>
                    </span>
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-600">
                    <div className="flex items-center flex-wrap gap-2 sm:gap-4">
                      <span className="flex items-center bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-purple-600" />
                        {fanclubData?.memberCount ? fanclubData.memberCount.toLocaleString() : members.length} fans
                      </span>
                      <span className="flex items-center bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                        <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-pink-600" />
                        {fanclubData?.category || 'Entertainment'}
                      </span>
                      <span className="flex items-center text-pink-600 bg-pink-100 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-pink-500 rounded-full mr-1 sm:mr-2"></div>
                        {members.filter(m => m.isOnline).length} online
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                {!isJoined ? (
                  <button 
                    onClick={handleJoinFanclub}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center text-sm"
                  >
                    <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden sm:inline">Join the Hype!</span>
                    <span className="sm:hidden">Join!</span>
                  </button>
                ) : (
                  <button 
                    onClick={handleLeaveFanclub}
                    className="bg-gray-100 text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold hover:bg-gray-200 transition-all duration-300 border border-gray-300 flex items-center text-sm"
                  >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="hidden sm:inline">Leave Fanclub</span>
                    <span className="sm:hidden">Leave</span>
                  </button>
                )}
                <button className="bg-green-100 text-green-600 p-2 sm:p-3 rounded-full hover:bg-green-200 transition-all duration-300 hover:scale-105" title="Audio Call">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button className="bg-blue-100 text-blue-600 p-2 sm:p-3 rounded-full hover:bg-blue-200 transition-all duration-300 hover:scale-105" title="Video Call">
                  <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button className="bg-gray-100 text-gray-700 p-2 sm:p-3 rounded-full hover:bg-gray-200 transition-all duration-300 hover:scale-105">
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button className="bg-gray-100 text-gray-700 p-2 sm:p-3 rounded-full hover:bg-gray-200 transition-all duration-300 hover:scale-105 relative">
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-pink-500 rounded-full"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fanclub Banner - EXCITING & VIBRANT! */}
      <div className="relative h-32 sm:h-40 md:h-48 lg:h-56 bg-gradient-to-r from-purple-600 to-pink-600 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-700/30 to-pink-700/30"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJkaWFtb25kcyIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cGF0aCBkPSJNMCAyMGwyMC0yMCAyMCAyMC0yMCAyMHoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2RpYW1vbmRzKSIvPjwvc3ZnPg==')] opacity-20"></div>
        <div className="relative h-full flex items-end">
          <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 pb-2 sm:pb-3 md:pb-4 lg:pb-6 w-full">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between space-y-2 sm:space-y-3 md:space-y-0">
              <div className="flex-1">
                <h2 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-2 sm:mb-3 leading-tight">
                  {fanclubData?.about || fanclubData?.bio || fanclubData?.description || 'Spill the tea! Get the latest celebrity gossip, drama, and behind-the-scenes scoop. No judgment, just pure entertainment!'}
                </h2>
                <div className="flex flex-wrap gap-1 sm:gap-2 md:gap-3 mb-2 sm:mb-3 md:mb-4">
                  {userSharedInterests.slice(0, (typeof window !== 'undefined' && window.innerWidth < 640) ? 2 : (typeof window !== 'undefined' && window.innerWidth < 768) ? 3 : 5).map((interest, index) => (
                    <span key={index} className="bg-white/20 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm text-white font-bold border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105">
                      {interest}
                    </span>
                  ))}
                </div>
                <p className="text-pink-100 text-xs sm:text-sm font-medium">
                  <i className="fas fa-party-horn mr-1 sm:mr-2"></i>You share {userSharedInterests.length} interests with this fanclub! Let's get wild! <i className="fas fa-sparkles ml-1 sm:ml-2"></i>
                </p>
              </div>
              <div className="self-end sm:text-right">
                <div className="bg-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 md:p-4 border border-white/30 inline-block transform hover:scale-105 transition-all duration-300">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-0.5 sm:mb-1">{members.filter(m => m.isOnline).length}</div>
                  <div className="text-xs sm:text-sm text-pink-100 font-medium">fans online now!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Clean & Vibrant Layout */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-4">
          {/* Left Sidebar - Clean Fanclub Navigation */}
          <div className="hidden lg:block w-64 space-y-4">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl shadow-lg border border-purple-200 p-6">
              <h3 className="text-purple-800 font-bold text-lg mb-4 flex items-center">
                <Hash className="w-5 h-5 mr-3 text-pink-600" />
                Fanclub Vibes <i className="fas fa-party-horn text-pink-600 ml-2"></i>
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'home', label: 'General Feed', icon: Heart, active: activeTab === 'home', faIcon: 'fas fa-home' },
                  { id: 'members', label: 'Fan Squad', icon: Users, active: activeTab === 'members', faIcon: 'fas fa-users' },
                  { id: 'discussions', label: 'Hot Takes', icon: MessageCircle, active: activeTab === 'discussions', faIcon: 'fas fa-comments' },
                  { id: 'events', label: 'Epic Events', icon: Calendar, active: activeTab === 'events', faIcon: 'fas fa-calendar-star' },
                  { id: 'chat', label: 'Live Hype', icon: MessageCircle, active: activeTab === 'chat', faIcon: 'fas fa-bolt' },
                  { id: 'media', label: 'Fan Content', icon: Image, active: activeTab === 'media', faIcon: 'fas fa-images' },
                  { id: 'achievements', label: 'Fan Badges', icon: Trophy, active: activeTab === 'achievements', faIcon: 'fas fa-trophy' },
                  { id: 'resources', label: 'Fan Stuff', icon: FileText, active: activeTab === 'resources', faIcon: 'fas fa-folder-open' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center group ${
                      tab.active
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                        : 'text-purple-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:shadow-lg'
                    }`}
                  >
                    <i className={`${tab.faIcon} mr-3 text-lg ${tab.active ? 'text-white' : 'text-pink-500'}`}></i>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Tab Navigation - Clean Fanclub Style */}
          <div className="lg:hidden w-full">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-purple-200 p-1.5 sm:p-2 md:p-3 mb-2 sm:mb-3 md:mb-4">
              <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide">
                {[
                  { id: 'home', label: 'Feed', faIcon: 'fas fa-home' },
                  { id: 'members', label: 'Squad', faIcon: 'fas fa-users' },
                  { id: 'discussions', label: 'Hot Takes', faIcon: 'fas fa-comments' },
                  { id: 'events', label: 'Epic', faIcon: 'fas fa-calendar-star' },
                  { id: 'media', label: 'Content', faIcon: 'fas fa-images' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-shrink-0 flex flex-col items-center px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 min-w-0 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                        : 'text-purple-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 hover:shadow-lg'
                    }`}
                  >
                    <i className={`${tab.faIcon} text-base sm:text-lg md:text-xl mb-0.5 sm:mb-1 ${activeTab === tab.id ? 'text-white' : 'text-pink-500'}`}></i>
                    <span className="text-xs sm:text-sm truncate">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-4">
            {/* Create Post - Clean Fanclub Style */}
            <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-purple-200 p-2 sm:p-3 md:p-4 lg:p-6">
              <div className="flex items-start space-x-2 sm:space-x-3 md:space-x-4">
                <div className="relative flex-shrink-0">
                  <img
                    src={safeUserProfile.avatar}
                    alt={safeUserProfile.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl md:rounded-2xl border-2 border-pink-300 shadow-lg"
                    onError={handleImageError}
                  />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-pink-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="w-full text-left text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 transition-all duration-200 border border-gray-200 hover:border-gray-300 text-xs sm:text-sm md:text-base"
                  >
                    What's on your mind, {userProfile.name}? Share with your fanclub! ✨
                  </button>
                  <div className="flex items-center justify-between mt-1.5 sm:mt-2 md:mt-3">
                    <div className="flex space-x-1 sm:space-x-2 md:space-x-3 overflow-x-auto">
                      <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-pink-600 transition-colors flex-shrink-0">
                        <Image className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Photo</span>
                      </button>
                      <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-pink-600 transition-colors flex-shrink-0">
                        <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm hidden sm:inline">Video</span>
                        <span className="text-xs sm:text-sm sm:hidden">Vid</span>
                      </button>
                      <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-pink-600 transition-colors flex-shrink-0">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Event</span>
                      </button>
                    </div>
                    <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0">
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'home' && (
              <div className="space-y-4">
                {/* Featured Fanclub Post - Question Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face"
                        alt="Sarah Chen"
                        className="w-12 h-12 rounded-full border-2 border-purple-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">Sarah Chen</span>
                        <span className="text-pink-600 text-sm bg-pink-100 px-2 py-0.5 rounded-full">👑 Super Fan</span>
                        <span className="text-gray-500 text-sm">2 hours ago</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">QUESTION</span>
                      </div>
                      <p className="text-gray-800 mb-4 leading-relaxed">Just finished building an AI-powered recommendation system! Anyone else working on machine learning projects? Would love to collaborate! 🚀</p>
                      
                      {/* Question Stats */}
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <MessageCircle className="w-5 h-5 text-purple-600" />
                              <span className="text-purple-700 font-medium">8 replies</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="w-5 h-5 text-purple-600" />
                              <span className="text-purple-700 font-medium">12 participants</span>
                            </div>
                          </div>
                          <button className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-600 transition-colors">
                            Answer
                          </button>
                        </div>
                      </div>
                      
                      {/* Shared Interests */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">Technology</span>
                        <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">Programming</span>
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">AI/ML</span>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-6">
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <ThumbsUp className="w-5 h-5" />
                            <span className="text-sm font-medium">12</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">8</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm font-medium">3</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <Bookmark className="w-5 h-5" />
                            <span className="text-sm font-medium">5</span>
                          </button>
                        </div>
                        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-colors">
                          Follow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fanclub Video Post */}
                <div className="bg-white rounded-2xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
                        alt="Alex Rodriguez"
                        className="w-12 h-12 rounded-full border-2 border-purple-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">Alex Rodriguez</span>
                        <span className="text-pink-600 text-sm bg-pink-100 px-2 py-0.5 rounded-full">⭐ Elite Fan</span>
                        <span className="text-gray-500 text-sm">4 hours ago</span>
                        <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-xs font-medium">VIDEO</span>
                      </div>
                      <p className="text-gray-800 mb-4 leading-relaxed">Live coding session on building REST APIs with Node.js! Join me for some real-time development action! 💻🔥</p>
                      
                      {/* Video Content */}
                      <div className="relative mb-4">
                        <div className="w-full h-64 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <Play className="w-16 h-16 text-white" />
                          <span className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">12:45</span>
                        </div>
                      </div>
                      
                      {/* Shared Interests */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">Technology</span>
                        <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">Programming</span>
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">Node.js</span>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-6">
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <ThumbsUp className="w-5 h-5" />
                            <span className="text-sm font-medium">45</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">23</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm font-medium">18</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <Bookmark className="w-5 h-5" />
                            <span className="text-sm font-medium">31</span>
                          </button>
                        </div>
                        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-colors">
                          Follow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fanclub Poll Post */}
                <div className="bg-white rounded-2xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face"
                        alt="Rachel Green"
                        className="w-12 h-12 rounded-full border-2 border-purple-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">Rachel Green</span>
                        <span className="text-pink-600 text-sm bg-pink-100 px-2 py-0.5 rounded-full">🌟 Rising Star</span>
                        <span className="text-gray-500 text-sm">6 hours ago</span>
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">POLL</span>
                      </div>
                      <p className="text-gray-800 mb-4 leading-relaxed">What's your favorite frontend framework? Let's see what the fanclub thinks! 🎨</p>
                      
                      {/* Poll Options */}
                      <div className="space-y-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-800 font-medium">React</span>
                            <span className="text-pink-600 text-sm font-medium">67 votes</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-pink-500 h-2 rounded-full" style={{width: '58%'}}></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-800 font-medium">Vue.js</span>
                            <span className="text-pink-600 text-sm font-medium">28 votes</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-pink-500 h-2 rounded-full" style={{width: '24%'}}></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-800 font-medium">Angular</span>
                            <span className="text-pink-600 text-sm font-medium">22 votes</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-pink-500 h-2 rounded-full" style={{width: '19%'}}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Shared Interests */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">Technology</span>
                        <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">Programming</span>
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">Frontend</span>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-6">
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <ThumbsUp className="w-5 h-5" />
                            <span className="text-sm font-medium">34</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">19</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm font-medium">12</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <Bookmark className="w-5 h-5" />
                            <span className="text-sm font-medium">27</span>
                          </button>
                        </div>
                        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-colors">
                          Vote
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fanclub Event Post */}
                <div className="bg-white rounded-2xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"
                        alt="David Kim"
                        className="w-12 h-12 rounded-full border-2 border-purple-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900">David Kim</span>
                        <span className="text-pink-600 text-sm bg-pink-100 px-2 py-0.5 rounded-full">🔥 Hot Shot</span>
                        <span className="text-gray-500 text-sm">1 day ago</span>
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">EVENT</span>
                      </div>
                      <p className="text-gray-800 mb-4 leading-relaxed">Join us for the ultimate fanclub coding challenge! Build something amazing and win exclusive prizes! 🏆💻</p>
                      
                      {/* Event Details */}
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-orange-600" />
                            <div>
                              <p className="text-orange-800 font-medium">February 20, 2024</p>
                              <p className="text-orange-600 text-sm">6:00 PM - 9:00 PM</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-5 h-5 text-orange-600" />
                            <div>
                              <p className="text-orange-800 font-medium">Virtual Event</p>
                              <p className="text-orange-600 text-sm">Zoom Meeting</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Users className="w-5 h-5 text-orange-600" />
                            <span className="text-orange-800 font-medium">89 attending</span>
                          </div>
                          <button className="bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-orange-600 transition-colors">
                            Join Event
                          </button>
                        </div>
                      </div>
                      
                      {/* Shared Interests */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">Technology</span>
                        <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">Programming</span>
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">Challenge</span>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-6">
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <ThumbsUp className="w-5 h-5" />
                            <span className="text-sm font-medium">67</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <MessageCircle className="w-5 h-5" />
                            <span className="text-sm font-medium">42</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <Share2 className="w-5 h-5" />
                            <span className="text-sm font-medium">28</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-pink-600 transition-colors">
                            <Bookmark className="w-5 h-5" />
                            <span className="text-sm font-medium">53</span>
                          </button>
                        </div>
                        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-purple-600 hover:to-pink-600 transition-colors">
                          Follow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hot Topics & Challenges */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-4">
                  <h3 className="text-pink-800 font-semibold mb-3 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                    🚀 Hot Topics & Challenges
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-pink-100 hover:border-pink-200 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className="text-pink-700 text-sm font-medium">#AI Challenge</span>
                      </div>
                      <p className="text-gray-600 text-xs">Build an AI app • 45 participants • 3 days left</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-pink-100 hover:border-pink-200 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-pink-700 text-sm font-medium">#Code Review</span>
                      </div>
                      <p className="text-gray-600 text-xs">Submit your code • 23 reviews • Get feedback</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-pink-100 hover:border-pink-200 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-pink-700 text-sm font-medium">#Fan Meetup</span>
                      </div>
                      <p className="text-gray-600 text-xs">Virtual hangout • 67 attending • Tonight 8PM</p>
                    </div>
                  </div>
                </div>

                {/* Pinned Posts */}
                {posts.filter(post => post.isPinned).length > 0 && (
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-4 backdrop-blur-xl">
                    <h3 className="text-purple-800 font-semibold mb-3 flex items-center">
                      <Star className="w-5 h-5 mr-2 text-pink-600" />
                      📌 Pinned Posts
                    </h3>
                    <div className="space-y-3">
                      {posts.filter(post => post.isPinned).map((post) => (
                        <div key={post.id} className="bg-white rounded-xl p-4 border border-purple-200 hover:border-purple-300 transition-all duration-200 shadow-lg">
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              <img
                                src={post.author.avatar}
                                alt={post.author.name}
                                className="w-10 h-10 rounded-full border-2 border-pink-400"
                                onError={handleImageError}
                              />
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center">
                                <Star className="w-2 h-2 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-semibold text-gray-900 text-sm">{post.author.name}</span>
                                <span className="text-purple-700 text-xs bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">{post.author.fanLevel}</span>
                                <span className="text-pink-700 text-xs bg-pink-100 px-2 py-0.5 rounded-full border border-pink-200">Pinned</span>
                                <span className="text-gray-500 text-xs">{post.timestamp}</span>
                              </div>
                              <p className="text-gray-800 mb-3 text-sm leading-relaxed">{post.content}</p>
                              {post.media && (
                                <img src={post.media} alt="Post media" className="w-full max-w-lg rounded-lg mb-3" onError={handleImageError} />
                              )}
                              <div className="flex items-center space-x-4 text-xs">
                                <button className="flex items-center space-x-1 text-gray-500 hover:text-pink-600 transition-colors">
                                  <ThumbsUp className="w-4 h-4" />
                                  <span>{post.likes}</span>
                                </button>
                                <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                  <ThumbsDown className="w-4 h-4" />
                                  <span>{post.dislikes}</span>
                                </button>
                                <button className="flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors">
                                  <MessageCircle className="w-4 h-4" />
                                  <span>{post.comments}</span>
                                </button>
                                                                <button className="flex items-center space-x-1 text-gray-500 hover:text-pink-600 transition-colors">
                                  <Share2 className="w-4 h-4" />
                                  <span>{post.shares}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regular Posts Feed */}
                <div className="space-y-4">
                  {posts.filter(post => !post.isPinned).map((post) => (
                    <div key={post.id} className="bg-white rounded-2xl shadow-lg border border-purple-200 p-4 hover:shadow-xl transition-all duration-200">
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-12 h-12 rounded-full border-2 border-purple-200"
                            onError={handleImageError}
                          />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-900 text-sm">{post.author.name}</span>
                            <span className="text-purple-600 text-xs bg-purple-100 px-2 py-0.5 rounded-full">{post.author.fanLevel}</span>
                            <span className="text-pink-600 text-xs bg-pink-100 px-2 py-0.5 rounded-full">⭐ {post.author.reputation}</span>
                            <span className="text-gray-500 text-xs">{post.timestamp}</span>
                            {post.type !== 'text' && (
                              <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium border border-purple-200">
                                {post.type.toUpperCase()}
                              </span>
                            )}
                            {post.isExclusive && (
                              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                                EXCLUSIVE ✨
                              </span>
                            )}
                          </div>
                          <p className="text-gray-800 mb-3 leading-relaxed text-sm">{post.content}</p>
                          
                          {post.media && (
                            <div className="mb-4">
                              {post.type === 'image' && (
                                <img src={post.media} alt="Post image" className="w-full max-w-lg rounded-xl" onError={handleImageError} />
                              )}
                              {post.type === 'video' && (
                                <div className="relative w-full max-w-lg h-48 bg-gray-100 rounded-xl flex items-center justify-center">
                                  <Play className="w-12 h-12 text-pink-600" />
                                  <span className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">Video</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Shared Interests Tags */}
                          <div className="mb-4">
                            <div className="flex flex-wrap gap-2">
                              {post.sharedInterests.slice(0, 3).map((interest, index) => (
                                <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-lg text-xs font-medium border border-purple-200 hover:bg-purple-200 transition-colors">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {/* Post Actions */}
                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <div className="flex items-center space-x-4">
                              <button 
                                onClick={() => handlePostAction(post.id, 'like')}
                                className="flex items-center space-x-1 text-gray-500 hover:text-pink-600 transition-colors"
                              >
                                <ThumbsUp className="w-4 h-4" />
                                <span className="text-xs">{post.likes}</span>
                              </button>
                              <button 
                                onClick={() => handlePostAction(post.id, 'dislike')}
                                className="flex items-center space-x-1 text-gray-500 hover:text-pink-600 transition-colors"
                              >
                                <ThumbsDown className="w-4 h-4" />
                                <span className="text-xs">{post.dislikes}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-purple-600 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                <span className="text-xs">{post.comments}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-pink-600 transition-colors">
                                <Share2 className="w-4 h-4" />
                                <span className="text-xs">{post.shares}</span>
                              </button>
                              <button 
                                onClick={() => handlePostAction(post.id, 'bookmark')}
                                className="flex items-center space-x-1 text-gray-500 hover:text-pink-600 transition-colors"
                              >
                                <Bookmark className="w-4 h-4" />
                                <span className="text-xs">{post.bookmarks}</span>
                              </button>
                            </div>
                            {userProfile.role === 'moderator' && (
                                <button className="bg-purple-100 px-3 py-1 rounded-lg text-purple-600 text-xs hover:bg-purple-200 transition-colors border border-purple-200">
                                Moderate
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                    <Users className="w-6 h-6 mr-2 text-pink-600" />
                    Fanclub Members 👥
                  </h2>
                  <div className="flex items-center space-x-3">
                    <div className="bg-pink-100 px-3 py-1.5 rounded-full">
                      <span className="text-pink-700 text-sm font-medium">{members.filter(m => m.isOnline).length} Online</span>
                    </div>
                    <div className="bg-purple-100 px-3 py-1.5 rounded-full">
                      <span className="text-purple-700 text-sm font-medium">{members.length} Total</span>
                    </div>
                  </div>
                </div>
                
                {/* Member Search & Filters */}
                <div className="bg-white rounded-3xl shadow-lg border border-purple-200 p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search fans by name or interests..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                    <select className="px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200">
                      <option>All Fan Levels</option>
                      <option>New Fan</option>
                      <option>Active Fan</option>
                      <option>Super Fan</option>
                      <option>Legendary Fan</option>
                    </select>
                    <select className="px-4 py-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200">
                      <option>All Status</option>
                      <option>Online</option>
                      <option>Offline</option>
                    </select>
                  </div>
                </div>

                {/* Members Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {members.map((member) => (
                    <div key={member.id} className="bg-white rounded-3xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                      <div className="text-center mb-4">
                        <div className="relative inline-block">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-20 h-20 rounded-full border-4 border-purple-200 shadow-lg mx-auto"
                            onError={handleImageError}
                          />
                          {member.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-500 rounded-full border-4 border-white shadow-md"></div>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mt-3">{member.name}</h3>
                        <div className="flex items-center justify-center space-x-2 mt-2">
                          {member.role !== 'member' && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              member.role === 'founder' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                              member.role === 'admin' ? 'bg-pink-100 text-pink-700 border border-pink-200' : 
                              'bg-purple-100 text-purple-700 border border-purple-200'
                            }`}>
                              {member.role}
                            </span>
                          )}
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium border border-purple-200">
                            {member.fanLevel}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="text-center">
                          <span className="text-xl font-semibold text-pink-600">{member.matchPercentage}%</span>
                          <p className="text-xs text-gray-600">Match</p>
                        </div>
                        <div className="text-center">
                          <span className="text-xs text-gray-500">Joined: {member.joinDate}</span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-2">Achievements:</h4>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {member.achievements.slice(0, 2).map((achievement, index) => (
                            <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                              {achievement}
                            </span>
                          ))}
                          {member.achievements.length > 2 && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                              +{member.achievements.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-2xl text-sm font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <MessageCircle className="w-4 h-4 inline mr-2" />
                          Message
                        </button>
                        <button className="bg-purple-100 hover:bg-purple-200 text-purple-700 p-2.5 rounded-2xl transition-all duration-200 hover:scale-105">
                          <Users className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'discussions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                    <MessageCircle className="w-6 h-6 mr-2 text-pink-600" />
                    Fanclub Discussions 💬
                  </h2>
                  <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                    <Plus className="w-5 h-5 mr-2" />
                    Start Discussion
                  </button>
                </div>

                {/* Discussion Categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">General Tech 💻</h3>
                    <p className="text-gray-600 text-xs mb-3">General technology discussions and news</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">12 active topics</span>
                      <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium">Hot</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">AI & ML 🤖</h3>
                    <p className="text-gray-600 text-xs mb-3">Artificial Intelligence and Machine Learning</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">8 active topics</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Trending</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-6 border border-purple-200">
                    <h3 className="text-base font-semibold text-gray-900 mb-2">Startups 🚀</h3>
                    <p className="text-gray-600 text-xs mb-3">Startup discussions and entrepreneurship</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">5 active topics</span>
                      <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full font-medium">New</span>
                    </div>
                  </div>
                </div>

                {/* Active Discussions */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">Active Discussions</h3>
                  
                  <div className="bg-white rounded-3xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-bold text-gray-900">Best practices for React hooks?</h4>
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">General Tech</span>
                        </div>
                        <p className="text-gray-600 mb-3">I'm working on a large React project and want to optimize my hooks usage. Any tips on custom hooks and performance?</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>by Sarah Chen</span>
                          <span>💬 24 replies</span>
                          <span>🔥 156 views</span>
                          <span>2 hours ago</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-200">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                        <MessageCircle className="w-6 h-6 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-bold text-gray-900">Transformer models for beginners</h4>
                          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">AI & ML</span>
                        </div>
                        <p className="text-gray-600 mb-3">Can someone explain transformer models in simple terms? I'm new to NLP and want to understand the basics.</p>
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <span>by Emma Thompson</span>
                          <span>💬 18 replies</span>
                          <span>🔥 89 views</span>
                          <span>4 hours ago</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-pink-600" />
                    Fanclub Events 🎉
                  </h2>
                  <button 
                    onClick={() => setShowCreateEvent(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Event
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events.map((event) => (
                    <div key={event.id} className="bg-white rounded-3xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                      <div className="flex items-start justify-between mb-5">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h3>
                          <p className="text-gray-600 mb-3 text-base leading-relaxed">{event.description}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                            event.type === 'online' ? 'bg-pink-100 text-pink-700 border border-pink-200' :
                            event.type === 'in-person' ? 'bg-green-100 text-green-700 border border-green-200' :
                            'bg-purple-100 text-purple-700 border border-purple-200'
                          }`}>
                            {event.type}
                          </div>
                          {event.isExclusive && (
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                              EXCLUSIVE ✨
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-3 mb-5">
                        <div className="flex items-center space-x-3 text-sm text-gray-600 bg-pink-50 p-3 rounded-2xl">
                          <Calendar className="w-5 h-5 text-pink-600" />
                          <span className="font-medium">{event.date} at {event.time}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-600 bg-pink-50 p-3 rounded-2xl">
                          <MapPin className="w-5 h-5 text-pink-600" />
                          <span className="text-gray-600 font-medium">{event.location}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-600 bg-pink-50 p-3 rounded-2xl">
                          <Users className="w-5 h-5 text-pink-600" />
                          <span className="font-medium">{event.attendees}/{event.maxAttendees} attending</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center space-x-3">
                          <img src={event.organizer.avatar} alt={event.organizer.name} className="w-8 h-8 rounded-full border-2 border-purple-200" onError={handleImageError} />
                          <span className="text-sm text-gray-600 font-medium">by {event.organizer.name}</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{event.organizer.fanLevel}</span>
                        </div>
                        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2.5 rounded-2xl text-sm font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          Join Event ✨
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                    <Image className="w-6 h-6 mr-2 text-pink-600" />
                    Fanclub Media 📸
                  </h2>
                  <div className="flex items-center space-x-3">
                    <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2.5 rounded-2xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                      <Image className="w-4 h-4 mr-2" />
                      Upload Media
                    </button>
                    <select className="px-4 py-2.5 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200">
                      <option>All Types</option>
                      <option>Images</option>
                      <option>Videos</option>
                      <option>Audio</option>
                    </select>
                  </div>
                </div>

                {/* Media Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-pink-600">{posts.filter(post => post.media).length}</div>
                    <div className="text-sm text-gray-600">Total Media</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-pink-600">12</div>
                    <div className="text-sm text-gray-600">Images</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-pink-600">5</div>
                    <div className="text-sm text-gray-600">Videos</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-pink-600">3</div>
                    <div className="text-sm text-gray-600">Audio</div>
                  </div>
                </div>

                {/* Media Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Sample Media Items */}
                  <div className="bg-white rounded-3xl shadow-lg border border-purple-200 overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                    <img src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop" alt="Neural Networks" className="w-full h-48 object-cover" onError={handleImageError} />
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">Image</span>
                        <span className="text-xs text-gray-500">2 hours ago</span>
                      </div>
                      <p className="text-gray-800 mb-3 font-medium">Amazing visualization of neural networks! This shows the complexity of modern AI systems.</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>by Emma Thompson</span>
                        <span>❤️ 15</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-lg border border-purple-200 overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                    <div className="w-full h-48 bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                      <Video className="w-16 h-16 text-pink-500" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">Video</span>
                        <span className="text-xs text-gray-500">4 hours ago</span>
                      </div>
                      <p className="text-gray-800 mb-3 font-medium">Tutorial: Building a React app from scratch. Step-by-step guide for beginners.</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>by Sarah Chen</span>
                        <span>❤️ 22</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl shadow-lg border border-purple-200 overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                    <img src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop" alt="Code on Screen" className="w-full h-48 object-cover" onError={handleImageError} />
                    <div className="p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">Image</span>
                        <span className="text-xs text-gray-500">6 hours ago</span>
                      </div>
                      <p className="text-gray-800 mb-3 font-medium">Late night coding session! Working on a new feature for our app.</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>by Alex Rodriguez</span>
                        <span>❤️ 8</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                    <Trophy className="w-6 h-6 mr-2 text-pink-600" />
                    Fanclub Achievements 🏆
                  </h2>
                  <div className="flex items-center space-x-3">
                    <div className="bg-pink-100 px-3 py-1.5 rounded-full">
                      <span className="text-pink-700 text-sm font-medium">3 Unlocked</span>
                    </div>
                    <div className="bg-gray-100 px-3 py-1.5 rounded-full">
                      <span className="text-gray-600 text-sm font-medium">12 Total</span>
                    </div>
                  </div>
                </div>

                {/* Achievement Categories */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-pink-600">3</div>
                    <div className="text-sm text-gray-600">Participation</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-pink-600">1</div>
                    <div className="text-sm text-gray-600">Contribution</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-pink-600">1</div>
                    <div className="text-sm text-gray-600">Leadership</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-pink-600">0</div>
                    <div className="text-sm text-gray-600">Special</div>
                  </div>
                </div>

                {/* Achievements Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="bg-white rounded-3xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                      <div className="text-center mb-4">
                        <div className="text-6xl mb-3">{achievement.icon}</div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{achievement.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{achievement.description}</p>
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            achievement.rarity === 'legendary' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' :
                            achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            achievement.rarity === 'rare' ? 'bg-pink-100 text-pink-700 border border-pink-200' :
                            'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {achievement.rarity.toUpperCase()}
                          </span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium border border-purple-200">
                            {achievement.category}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-2">Unlocked by {achievement.unlockedBy.length} fans</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {achievement.unlockedBy.slice(0, 3).map((name, index) => (
                            <span key={index} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {name}
                            </span>
                          ))}
                          {achievement.unlockedBy.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              +{achievement.unlockedBy.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                    <BookOpen className="w-6 h-6 mr-2 text-pink-600" />
                    Fanclub Resources 📚
                  </h2>
                  <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-2xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
                    <Plus className="w-5 h-5 mr-2" />
                    Upload Resource
                  </button>
                </div>

                {/* Resource Categories */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-pink-600">24</div>
                    <div className="text-sm text-gray-600">Documents</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-pink-600">18</div>
                    <div className="text-sm text-gray-600">Templates</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-pink-600">12</div>
                    <div className="text-sm text-gray-600">Code Files</div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-3xl p-4 border border-purple-200 text-center">
                    <div className="text-2xl font-bold text-pink-600">8</div>
                    <div className="text-sm text-gray-600">Presentations</div>
                  </div>
                </div>

                {/* Resource List */}
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div key={resource.id} className="bg-white rounded-3xl shadow-lg border border-purple-200 p-6 hover:shadow-xl transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-pink-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-bold text-gray-900">{resource.name}</h3>
                            {resource.isExclusive && (
                              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                EXCLUSIVE ✨
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{resource.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>by {resource.author.name}</span>
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">{resource.author.fanLevel}</span>
                            <span>📄 {resource.type.toUpperCase()} • {resource.fileSize}</span>
                            <span>💬 {resource.downloads} downloads</span>
                            <span>⭐ {resource.rating}</span>
                            <span>{resource.uploadDate}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {resource.tags.map((tag, index) => (
                              <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-2xl text-sm font-bold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="bg-white rounded-2xl shadow-sm border border-purple-200">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Live Fanclub Chat</h3>
                  <p className="text-sm text-gray-600">Real-time conversations with your fanclub</p>
                </div>
                <div className="p-4">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">⚡</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Live Chat Coming Soon!</h3>
                    <p className="text-gray-600">Real-time messaging with your fanclub members will be available soon.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Premium Social Media Style */}
          <div className="hidden xl:block w-80 space-y-4">
            {/* Members You Might Connect With */}
            <div className="bg-white rounded-2xl shadow-lg border border-purple-200 p-4">
              <h3 className="text-gray-900 font-semibold mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2 text-pink-600" />
                Fans Like You 💫
              </h3>
              <div className="space-y-3">
                {members.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-purple-50 transition-all duration-200">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full border-2 border-purple-200"
                        onError={handleImageError}
                      />
                      {member.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-gray-900 truncate text-sm">{member.name}</p>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          {member.fanLevel}
                        </span>
                      </div>
                      <p className="text-xs text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full inline-block">{member.matchPercentage}%</p>
                      <p className="text-xs text-gray-500 mt-1">⭐ {member.reputation}</p>
                    </div>
                    <button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white p-2 rounded-lg transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 text-pink-600 hover:text-pink-700 font-semibold text-sm bg-pink-50 hover:bg-pink-100 px-3 py-2 rounded-xl transition-colors">
                View all fans → ✨
              </button>
            </div>

            {/* Fanclub Stats */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg border border-purple-200 p-4">
              <h3 className="text-gray-900 font-semibold mb-3 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-pink-600" />
                Fanclub Stats 📊
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Fans</span>
                  <span className="text-gray-900 font-medium">{fanclubData ? fanclubData.memberCount.toLocaleString() : members.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Online Now</span>
                  <span className="text-pink-600 font-medium">{members.filter(m => m.isOnline).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Posts Today</span>
                  <span className="text-gray-900 font-medium">{posts.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Upcoming Events</span>
                  <span className="text-gray-900 font-medium">{events.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your Match</span>
                  <span className="text-pink-600 font-medium">{fanclubData?.matchPercentage || 85}%</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl shadow-lg border border-purple-200 p-4">
              <h3 className="text-gray-900 font-semibold mb-3 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-pink-600" />
                Recent Activity 🔥
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <p className="text-gray-700">Sarah joined the fanclub</p>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <p className="text-gray-700">New discussion about AI</p>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <p className="text-gray-700">Event: Tech Meetup</p>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <p className="text-gray-700">5 new fans this week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        userProfile={userProfile}
        onSubmit={handleCreatePost}
      />
    </div>
  );
};

export default FanclubPage;
