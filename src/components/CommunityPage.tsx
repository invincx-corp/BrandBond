import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Heart, MessageCircle, Calendar, Star, Plus, Search, Video, FileText, MapPin, ThumbsUp, ThumbsDown, Share2, Bookmark, Image, Music, Globe, BarChart3, Activity, Bell, Hash, Play, TrendingUp, Phone } from 'lucide-react';
import CreatePostModal from './CreatePostModal';

interface CommunityMember {
  id: number;
  name: string;
  avatar: string;
  sharedInterests: string[];
  matchPercentage: number;
  isOnline: boolean;
  lastSeen: string;
  role: 'member' | 'moderator' | 'admin';
  reputation: number;
}

interface CommunityPost {
  id: number;
  author: {
    name: string;
    avatar: string;
    reputation: number;
  };
  content: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'question' | 'poll' | 'event' | 'link' | 'file' | 'discussion';
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
  // Additional fields for different content types
  pollOptions?: string[];
  pollResults?: { [key: string]: number };
  fileSize?: string;
  fileType?: string;
  eventDate?: string;
  eventLocation?: string;
  eventAttendees?: number;
  maxAttendees?: number;
  discussionTags?: string[];
  isLive?: boolean;
}

interface CommunityEvent {
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
  };
  type: 'online' | 'in-person' | 'hybrid';
  interests: string[];
}

interface CommunityChat {
  id: number;
  name: string;
  type: 'general' | 'interests' | 'events' | 'moderators';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isActive: boolean;
}

interface CommunityPageProps {
  communityId: number;
  userProfile: {
    interests: string[];
    name: string;
    avatar: string;
    role: 'member' | 'moderator' | 'admin';
  };
}

const CommunityPage: React.FC<CommunityPageProps> = ({ communityId, userProfile }) => {
  const { communityId: routeCommunityId } = useParams<{ communityId: string }>();
  const actualCommunityId = routeCommunityId ? parseInt(routeCommunityId) : communityId;
  
  // Provide fallback userProfile if not provided
  const safeUserProfile = userProfile || {
    interests: ["Technology", "Programming", "Innovation"],
    name: "Anonymous User",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop&crop=face",
    role: 'member' as const
  };
  
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [chats, setChats] = useState<CommunityChat[]>([]);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [activeChat, setActiveChat] = useState<CommunityChat | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [communityData, setCommunityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'members' | 'discussions' | 'events' | 'chat' | 'media' | 'polls' | 'files'>('home');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [liveMembers, setLiveMembers] = useState<number>(0);
  const [demoNotifications, setDemoNotifications] = useState<string[]>([]);

  // Demo notification function
  const addDemoNotification = (message: string) => {
    setDemoNotifications(prev => [...prev, message]);
    setTimeout(() => {
      setDemoNotifications(prev => prev.filter(n => n !== message));
    }, 4000);
  };

  // Handle post actions (like, dislike, bookmark)
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



  // Generate dynamic community data based on ID
  const generateCommunityData = (id: number) => {
    // Validate ID and provide fallback
    if (!id || isNaN(id) || id < 0) {
      id = 0; // Default to first community if invalid ID
    }
    const communityNames = [
      "Tech Creators Collective",
      "AI Innovators Hub", 
      "Startup Founders Network",
      "Web Developers Alliance",
      "Data Scientists Society",
      "Mobile App Creators Guild",
      "Cybersecurity Experts League",
      "Cloud Architects Union",
      "Blockchain Developers Coalition",
      "Game Developers Federation",
      "Digital Marketing Masters",
      "UX/UI Designers Circle",
      "DevOps Engineers Network",
      "Product Managers Guild",
      "Tech Entrepreneurs Alliance"
    ];
    
    const communityDescriptions = [
      "Building the future together with cutting-edge technology and innovation. Join us in creating tomorrow's solutions.",
      "Exploring the frontiers of artificial intelligence and machine learning. Share knowledge, collaborate on projects.",
      "Connecting entrepreneurs and startup enthusiasts worldwide. Build your network and grow your business.",
      "Modern web development techniques and best practices. Learn, share, and build amazing web experiences.",
      "Data-driven insights and analytics for the digital age. Transform data into actionable intelligence.",
      "Creating amazing mobile experiences for users everywhere. From concept to deployment, we've got you covered.",
      "Protecting digital assets and securing the online world. Stay ahead of threats and build secure systems.",
      "Building scalable cloud solutions for modern businesses. Architect the future of cloud computing.",
      "Revolutionizing finance and technology with blockchain. Explore decentralized solutions together.",
      "Creating immersive gaming experiences and virtual worlds. From indie to AAA, we celebrate all games.",
      "Mastering digital marketing strategies and techniques. Grow your brand and reach your audience.",
      "Crafting beautiful and functional user experiences. Design with purpose and empathy.",
      "Streamlining development and operations workflows. Build, deploy, and scale efficiently.",
      "Leading product development from idea to launch. Create products that users love.",
      "Building the next generation of tech companies. Connect, collaborate, and succeed together."
    ];
    
    const categories = [
      "Technology", "Artificial Intelligence", "Entrepreneurship", "Web Development", 
      "Data Science", "Mobile Development", "Cybersecurity", "Cloud Computing",
      "Blockchain", "Gaming", "Digital Marketing", "Design", "DevOps", "Product Management"
    ];
    
    const locations = [
      "Global", "North America", "Europe", "Asia Pacific", "Latin America", "Africa", "Middle East"
    ];
    
    const name = communityNames[id % communityNames.length];
    const description = communityDescriptions[id % communityDescriptions.length];
    const category = categories[id % categories.length];
    const location = locations[id % locations.length];
    
    // Generate realistic member count with some randomness
    const baseMembers = 500 + (id * 150);
    const randomFactor = Math.floor(Math.random() * 200) + 100;
    const memberCount = baseMembers + randomFactor;
    
    // Generate founded date based on ID
    const foundedYear = 2020 + (id % 4);
    const foundedMonth = ["January", "March", "June", "September", "November"][id % 5];
    const foundedDate = `${foundedMonth} ${foundedYear}`;
    
    return {
      id,
      name,
      description,
      category,
      type: "Public",
      memberCount,
      foundedDate,
      location,
      avatar: `https://images.unsplash.com/photo-${1557804506 + id}?w=400&h=400&fit=crop`,
      banner: `https://images.unsplash.com/photo-${1494790108 + id}?w=800&h=400&fit=crop`,
      sharedInterests: ["Technology", "Programming", "Artificial Intelligence", "Innovation", "Startups", "Machine Learning", "Data Science", "Web Development"],
      coreValues: ["Innovation", "Collaboration", "Growth", "Support", "Excellence", "Community"],
      recentActivity: "Active discussions about latest tech trends",
      isJoined: true
    };
  };

  // Real-time chat functions
  const handleSendMessage = () => {
    if (chatMessage.trim() && activeChat) {
      const newMessage = {
        id: Date.now(),
        author: userProfile.name,
        avatar: userProfile.avatar,
        content: chatMessage,
        timestamp: new Date().toLocaleTimeString(),
        type: 'text' as const
      };
      
      // Add message to chat
      setChats(prev => prev.map(chat => 
        chat.id === activeChat.id 
          ? { ...chat, lastMessage: chatMessage, lastMessageTime: new Date().toLocaleTimeString() }
          : chat
      ));
      
      setChatMessage('');
      setIsTyping(false);
      
      // Simulate other users typing
      setTimeout(() => {
        setTypingUsers(prev => [...prev, 'Other User']);
        setTimeout(() => setTypingUsers(prev => prev.filter(u => u !== 'Other User')), 2000);
      }, 1000);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // Simulate typing indicator for other users
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  // Real-time data updates - in real app this would come from API with WebSocket
  useEffect(() => {
    // Validate community ID and generate data
    if (actualCommunityId && !isNaN(actualCommunityId)) {
    const community = generateCommunityData(actualCommunityId);
    setCommunityData(community);
    } else {
      // Fallback to default community if invalid ID
      const community = generateCommunityData(0);
      setCommunityData(community);
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
      setLiveMembers(Math.floor(Math.random() * 50) + 20); // Random live members between 20-70
    }, 30000); // Update every 30 seconds
    
    // Simulate new content being added in real-time
    const newContentInterval = setInterval(() => {
      const newPostTypes = ['text', 'image', 'video', 'poll', 'file', 'discussion', 'event'];
      const randomType = newPostTypes[Math.floor(Math.random() * newPostTypes.length)];
      const randomAuthor = mockMembers[Math.floor(Math.random() * mockMembers.length)];
      
      let newPost: CommunityPost = {
        id: Date.now(),
        author: {
          name: randomAuthor.name,
          avatar: randomAuthor.avatar,
          reputation: randomAuthor.reputation
        },
        content: `New ${randomType} content just added! 🚀`,
        type: randomType as any,
        likes: 0,
        dislikes: 0,
        comments: 0,
        shares: 0,
        bookmarks: 0,
        timestamp: "Just now",
        sharedInterests: randomAuthor.sharedInterests.slice(0, 3),
        isPinned: false,
        isModerated: false
      };

      // Add specific content for different types
      if (randomType === 'poll') {
        newPost.pollOptions = ["Option A", "Option B", "Option C"];
        newPost.pollResults = { "Option A": 0, "Option B": 0, "Option C": 0 };
      } else if (randomType === 'file') {
        newPost.fileSize = "1.2 MB";
        newPost.fileType = "Document";
      } else if (randomType === 'discussion') {
        newPost.discussionTags = ["New", "Discussion", "Community"];
      } else if (randomType === 'event') {
        newPost.eventDate = "Tomorrow";
        newPost.eventLocation = "Online";
        newPost.eventAttendees = 0;
        newPost.maxAttendees = 20;
        newPost.isLive = false;
      } else if (randomType === 'image') {
        newPost.media = `https://images.unsplash.com/photo-${1557804506 + Math.floor(Math.random() * 100)}?w=400&h=300&fit=crop`;
      } else if (randomType === 'video') {
        newPost.media = `https://images.unsplash.com/photo-${1494790108 + Math.floor(Math.random() * 100)}?w=400&h=300&fit=crop`;
      }

      setPosts(prev => [newPost, ...prev]);
      
      // Show notification for new content
      addDemoNotification(`New ${randomType} content added to the community! 🎉`);
    }, 45000); // Add new content every 45 seconds
    
    // Cleanup intervals on unmount
    return () => {
      clearInterval(updateInterval);
      clearInterval(newContentInterval);
    };
    
    // Enhanced mock data with new features
    const mockMembers: CommunityMember[] = [
      {
        id: 1,
        name: "Sarah Chen",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
        sharedInterests: ["Technology", "Programming", "Artificial Intelligence", "Innovation"],
        matchPercentage: 95,
        isOnline: true,
        lastSeen: "2 minutes ago",
        role: 'moderator',
        reputation: 1250
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
        reputation: 890
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
        reputation: 650
      }
    ];

    const mockPosts: CommunityPost[] = [
      {
        id: 1,
        author: {
          name: "Sarah Chen",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
          reputation: 1250
        },
        content: "Just finished building an AI-powered recommendation system! Anyone else working on machine learning projects? Would love to collaborate!",
        type: 'question',
        likes: 12,
        dislikes: 0,
        comments: 8,
        shares: 3,
        bookmarks: 5,
        timestamp: "2 hours ago",
        sharedInterests: ["Technology", "Programming", "Artificial Intelligence"],
        isPinned: false,
        isModerated: false
      },
      {
        id: 2,
        author: {
          name: "Alex Rodriguez",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
          reputation: 890
        },
        content: "Found this amazing article about the future of AI in startups. Thought you all would find it interesting!",
        type: 'link',
        likes: 8,
        dislikes: 1,
        comments: 5,
        shares: 2,
        bookmarks: 3,
        timestamp: "4 hours ago",
        sharedInterests: ["Technology", "Startups", "Artificial Intelligence"],
        isPinned: false,
        isModerated: false
      },
      {
        id: 3,
        author: {
          name: "Emma Thompson",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
          reputation: 650
        },
        content: "Check out this amazing visualization of neural networks!",
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
        isModerated: false
      },
      {
        id: 4,
        author: {
          name: "David Kim",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
          reputation: 1100
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
        pollOptions: ["Python", "JavaScript", "R", "Julia", "Other"],
        pollResults: { "Python": 45, "JavaScript": 23, "R": 18, "Julia": 12, "Other": 8 }
      },
      {
        id: 5,
        author: {
          name: "Lisa Wang",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face",
          reputation: 950
        },
        content: "Just uploaded the latest community guidelines document. Please review and let me know your thoughts!",
        type: 'file',
        likes: 8,
        dislikes: 0,
        comments: 12,
        shares: 5,
        bookmarks: 15,
        timestamp: "10 hours ago",
        sharedInterests: ["Technology", "Community", "Guidelines"],
        isPinned: false,
        isModerated: false,
        fileSize: "2.4 MB",
        fileType: "PDF"
      },
      {
        id: 6,
        author: {
          name: "Mike Johnson",
          avatar: "https://images.unsplash.com/photo-1472099645785-53994a69daeb?w=80&h=80&fit=crop&crop=face",
          reputation: 780
        },
        content: "New discussion thread: How can we make our community more inclusive for beginners?",
        type: 'discussion',
        likes: 16,
        dislikes: 1,
        comments: 25,
        shares: 8,
        bookmarks: 20,
        timestamp: "12 hours ago",
        sharedInterests: ["Technology", "Community", "Inclusion"],
        isPinned: false,
        isModerated: false,
        discussionTags: ["Community", "Inclusion", "Beginners", "Discussion"]
      },
      {
        id: 7,
        author: {
          name: "Rachel Green",
          avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face",
          reputation: 1200
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
        isModerated: false
      },
      {
        id: 8,
        author: {
          name: "Alex Rodriguez",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
          reputation: 890
        },
        content: "Live coding session starting in 10 minutes! Join us for some pair programming fun! 🚀",
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
        eventDate: "Today",
        eventLocation: "Online (Discord)",
        eventAttendees: 18,
        maxAttendees: 25,
        isLive: true
      },
      {
        id: 9,
        author: {
          name: "Sophie Turner",
          avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
          reputation: 920
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
        isModerated: false
      },
      {
        id: 10,
        author: {
          name: "James Wilson",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
          reputation: 1100
        },
        content: "Amazing sunset from our office rooftop! Perfect coding weather 🌅",
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
        isModerated: false
      },
      {
        id: 11,
        author: {
          name: "Maria Garcia",
          avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face",
          reputation: 750
        },
        content: "What's your preferred code editor? Let's see what the community thinks!",
        type: 'poll',
        likes: 31,
        dislikes: 3,
        comments: 28,
        shares: 12,
        bookmarks: 18,
        timestamp: "2 days ago",
        sharedInterests: ["Technology", "Programming", "Tools"],
        isPinned: false,
        isModerated: false,
        pollOptions: ["VS Code", "Sublime Text", "Vim/Neovim", "IntelliJ", "Atom", "Other"],
        pollResults: { "VS Code": 67, "Sublime Text": 23, "Vim/Neovim": 18, "IntelliJ": 15, "Atom": 8, "Other": 12 }
      },
      {
        id: 12,
        author: {
          name: "Kevin Chen",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
          reputation: 680
        },
        content: "Just finished reading this comprehensive guide on Docker containers. Highly recommend!",
        type: 'link',
        likes: 25,
        dislikes: 1,
        comments: 16,
        shares: 9,
        bookmarks: 22,
        timestamp: "2 days ago",
        sharedInterests: ["Technology", "DevOps", "Docker"],
        isPinned: false,
        isModerated: false
      },
      {
        id: 13,
        author: {
          name: "Amanda Lee",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
          reputation: 890
        },
        content: "New community project: Building an open-source task management app! Who's in?",
        type: 'discussion',
        likes: 38,
        dislikes: 2,
        comments: 31,
        shares: 20,
        bookmarks: 25,
        timestamp: "2 days ago",
        sharedInterests: ["Technology", "Programming", "Open Source"],
        isPinned: false,
        isModerated: false,
        discussionTags: ["Open Source", "Project", "Collaboration", "Task Management"]
      },
      {
        id: 14,
        author: {
          name: "David Park",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
          reputation: 950
        },
        content: "Check out this amazing 3D visualization of our data pipeline!",
        type: 'video',
        media: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
        likes: 29,
        dislikes: 1,
        comments: 12,
        shares: 18,
        bookmarks: 15,
        timestamp: "3 days ago",
        sharedInterests: ["Technology", "Data Science", "Visualization"],
        isPinned: false,
        isModerated: false
      },
      {
        id: 15,
        author: {
          name: "Lisa Thompson",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face",
          reputation: 720
        },
        content: "Just uploaded the Q4 community roadmap. Let me know what you think!",
        type: 'file',
        likes: 19,
        dislikes: 0,
        comments: 14,
        shares: 8,
        bookmarks: 16,
        timestamp: "3 days ago",
        sharedInterests: ["Technology", "Community", "Planning"],
        isPinned: false,
        isModerated: false,
        fileSize: "1.8 MB",
        fileType: "PDF"
      },
      {
        id: 16,
        author: {
          name: "Ryan Johnson",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
          reputation: 820
        },
        content: "Weekend hackathon results are in! Check out what we built together! 🚀",
        type: 'event',
        likes: 45,
        dislikes: 1,
        comments: 28,
        shares: 25,
        bookmarks: 35,
        timestamp: "3 days ago",
        sharedInterests: ["Technology", "Programming", "Hackathon"],
        isPinned: false,
        isModerated: false,
        eventDate: "Last Weekend",
        eventLocation: "Tech Hub",
        eventAttendees: 45,
        maxAttendees: 50
      },
      {
        id: 17,
        author: {
          name: "Sarah Kim",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
          reputation: 1100
        },
        content: "Just deployed our new CI/CD pipeline to production! The automation is working perfectly!",
        type: 'text',
        likes: 33,
        dislikes: 0,
        comments: 19,
        shares: 12,
        bookmarks: 18,
        timestamp: "4 days ago",
        sharedInterests: ["Technology", "DevOps", "CI/CD"],
        isPinned: false,
        isModerated: false
      },
      {
        id: 18,
        author: {
          name: "Michael Brown",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
          reputation: 780
        },
        content: "What's your favorite database for web applications? Let's discuss the pros and cons!",
        type: 'discussion',
        likes: 27,
        dislikes: 2,
        comments: 35,
        shares: 15,
        bookmarks: 22,
        timestamp: "4 days ago",
        sharedInterests: ["Technology", "Programming", "Databases"],
        isPinned: false,
        isModerated: false,
        discussionTags: ["Databases", "Web Development", "Discussion", "Technology"]
      },
      {
        id: 19,
        author: {
          name: "Emma Davis",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
          reputation: 920
        },
        content: "Amazing architecture photo from our new office! The glass walls are perfect for whiteboarding sessions!",
        type: 'image',
        media: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
        likes: 38,
        dislikes: 0,
        comments: 11,
        shares: 20,
        bookmarks: 14,
        timestamp: "5 days ago",
        sharedInterests: ["Technology", "Lifestyle", "Architecture"],
        isPinned: false,
        isModerated: false
      },
      {
        id: 20,
        author: {
          name: "Alex Chen",
          avatar: "https://images.unsplash.com/photo-1472099645785-53994a69daeb?w=80&h=80&fit=crop&crop=face",
          reputation: 650
        },
        content: "New community challenge: Build a weather app using any tech stack! Deadline: 2 weeks!",
        type: 'event',
        likes: 52,
        dislikes: 1,
        comments: 41,
        shares: 28,
        bookmarks: 38,
        timestamp: "5 days ago",
        sharedInterests: ["Technology", "Programming", "Challenge"],
        isPinned: true,
        isModerated: false,
        eventDate: "2 weeks from now",
        eventLocation: "Online",
        eventAttendees: 67,
        maxAttendees: 100
      },
      {
        id: 21,
        author: {
          name: "Sophia Rodriguez",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
          reputation: 880
        },
        content: "Just finished building a real-time chat application with WebSocket! The performance is incredible!",
        type: 'text',
        likes: 41,
        dislikes: 0,
        comments: 23,
        shares: 15,
        bookmarks: 28,
        timestamp: "6 days ago",
        sharedInterests: ["Technology", "Programming", "Web Development"],
        isPinned: false,
        isModerated: false
      },
      {
        id: 22,
        author: {
          name: "Marcus Johnson",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
          reputation: 720
        },
        content: "Check out this amazing sunset from our coding retreat! Perfect inspiration for late-night debugging!",
        type: 'image',
        media: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
        likes: 67,
        dislikes: 0,
        comments: 18,
        shares: 32,
        bookmarks: 45,
        timestamp: "6 days ago",
        sharedInterests: ["Technology", "Lifestyle", "Photography"],
        isPinned: false,
        isModerated: false
      },
      {
        id: 23,
        author: {
          name: "Elena Petrov",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
          reputation: 950
        },
        content: "What's your favorite database design pattern? Let's discuss the pros and cons!",
        type: 'discussion',
        likes: 38,
        dislikes: 2,
        comments: 42,
        shares: 19,
        bookmarks: 31,
        timestamp: "1 week ago",
        sharedInterests: ["Technology", "Programming", "Databases"],
        isPinned: false,
        isModerated: false,
        discussionTags: ["Database Design", "Architecture", "Best Practices", "Discussion"]
      },
      {
        id: 24,
        author: {
          name: "David Kim",
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
          reputation: 1100
        },
        content: "New tutorial video: Building a REST API with Express.js and MongoDB!",
        type: 'video',
        media: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
        likes: 89,
        dislikes: 3,
        comments: 34,
        shares: 45,
        bookmarks: 67,
        timestamp: "1 week ago",
        sharedInterests: ["Technology", "Programming", "Web Development"],
        isPinned: false,
        isModerated: false
      },
      {
        id: 25,
        author: {
          name: "Lisa Thompson",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face",
          reputation: 720
        },
        content: "Community guidelines v2.0 is now available! Please review and provide feedback.",
        type: 'file',
        likes: 25,
        dislikes: 0,
        comments: 19,
        shares: 12,
        bookmarks: 35,
        timestamp: "1 week ago",
        sharedInterests: ["Technology", "Community", "Guidelines"],
        isPinned: false,
        isModerated: false,
        fileSize: "3.2 MB",
        fileType: "PDF"
      },
      {
        id: 26,
        author: {
          name: "Ryan Wilson",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
          reputation: 820
        },
        content: "What's your preferred testing framework? Let's vote!",
        type: 'poll',
        likes: 56,
        dislikes: 4,
        comments: 38,
        shares: 22,
        bookmarks: 41,
        timestamp: "1 week ago",
        sharedInterests: ["Technology", "Programming", "Testing"],
        isPinned: false,
        isModerated: false,
        pollOptions: ["Jest", "Mocha", "Vitest", "Cypress", "Playwright", "Other"],
        pollResults: { "Jest": 78, "Mocha": 45, "Vitest": 32, "Cypress": 28, "Playwright": 19, "Other": 15 }
      },
      {
        id: 27,
        author: {
          name: "Amanda Lee",
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
          reputation: 890
        },
        content: "Just discovered this amazing new CSS framework! The utility-first approach is revolutionary!",
        type: 'link',
        likes: 34,
        dislikes: 1,
        comments: 21,
        shares: 18,
        bookmarks: 29,
        timestamp: "1 week ago",
        sharedInterests: ["Technology", "Programming", "CSS"],
        isPinned: false,
        isModerated: false
      },
      {
        id: 28,
        author: {
          name: "Michael Brown",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
          reputation: 780
        },
        content: "Community meetup next month: AI and Machine Learning in Modern Web Apps!",
        type: 'event',
        likes: 73,
        dislikes: 1,
        comments: 29,
        shares: 35,
        bookmarks: 52,
        timestamp: "1 week ago",
        sharedInterests: ["Technology", "AI", "Machine Learning"],
        isPinned: false,
        isModerated: false,
        eventDate: "Next Month",
        eventLocation: "Tech Hub Downtown",
        eventAttendees: 89,
        maxAttendees: 120
      },
      {
        id: 29,
        author: {
          name: "Emma Davis",
          avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
          reputation: 920
        },
        content: "Amazing architecture photo from our new office! The open spaces are perfect for collaboration!",
        type: 'image',
        media: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop",
        likes: 58,
        dislikes: 0,
        comments: 16,
        shares: 28,
        bookmarks: 23,
        timestamp: "2 weeks ago",
        sharedInterests: ["Technology", "Lifestyle", "Architecture"],
        isPinned: false,
        isModerated: false
      },
      {
        id: 30,
        author: {
          name: "Kevin Chen",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
          reputation: 680
        },
        content: "New community project: Building an open-source task management app! Who's in?",
        type: 'discussion',
        likes: 67,
        dislikes: 2,
        comments: 45,
        shares: 31,
        bookmarks: 38,
        timestamp: "2 weeks ago",
        sharedInterests: ["Technology", "Programming", "Open Source"],
        isPinned: false,
        isModerated: false,
        discussionTags: ["Open Source", "Project", "Collaboration", "Task Management"]
      }
    ];

    const mockEvents: CommunityEvent[] = [
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
          avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face"
        },
        type: 'in-person',
        interests: ["Technology", "Artificial Intelligence", "Machine Learning"]
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
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
        },
        type: 'online',
        interests: ["Technology", "Programming", "Collaboration"]
      }
    ];

    const mockChats: CommunityChat[] = [
      {
        id: 1,
        name: "General Discussion",
        type: 'general',
        lastMessage: "Anyone up for a quick coding challenge?",
        lastMessageTime: "2 min ago",
        unreadCount: 0,
        isActive: true
      },
      {
        id: 2,
        name: "AI & ML Chat",
        type: 'interests',
        lastMessage: "Great article on transformer models!",
        lastMessageTime: "15 min ago",
        unreadCount: 3,
        isActive: true
      },
      {
        id: 3,
        name: "Event Planning",
        type: 'events',
        lastMessage: "Let's finalize the meetup details",
        lastMessageTime: "1 hour ago",
        unreadCount: 0,
        isActive: false
      }
    ];

    setMembers(mockMembers);
    setPosts(mockPosts);
    setEvents(mockEvents);
    setChats(mockChats);
  }, [actualCommunityId]);

  // Calculate shared interests between user and community
  const communitySharedInterests = ["Technology", "Programming", "Artificial Intelligence", "Innovation", "Startups", "Machine Learning", "Data Science"];
  const userSharedInterests = safeUserProfile.interests.filter(interest => 
    communitySharedInterests.includes(interest)
  );

  const handleCreatePost = (newPost: {
    content: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'question' | 'poll' | 'event' | 'link';
    sharedInterests: string[];
  }) => {
    const post: CommunityPost = {
      id: Date.now(),
      author: {
          name: safeUserProfile.name,
          avatar: safeUserProfile.avatar,
        reputation: 100
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
      isModerated: false
    };
    
    setPosts(prev => [post, ...prev]);
  };

  const handleChatMessage = () => {
    if (!chatMessage.trim() || !activeChat) return;
    
    // In a real app, this would send to backend
    setChatMessage('');
  };

  // Image fallback handler
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiNFNUY3RkEiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyQzIgMTcuNTIgNi40OCAyMiAxMiAyMkMxNy41MiAyMiAyMiAxNy41MiAyMiAxMkMyMiA2LjQ4IDE3LjUyIDIgMTIgMlpNMTIgMjBDNy41OSAyMCA0IDE2LjQxIDQgMTJDNCA3LjU5IDcuNTkgNCAxMiA0QzE2LjQxIDQgMjAgNy41OSAyMCAxMkMyMCAxNi40MSAxNi40MSAyMCAyMCAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEyIDZDNi40OCA2IDIgMTAuNDggMiAxNkMyIDIxLjUyIDYuNDggMjYgMTIgMjZDMjEuNTIgMjYgMjYgMjEuNTIgMjYgMTZDMjYgMTAuNDggMjEuNTIgNiAxMiA2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4KPC9zdmc+';
  };

  // Content type renderers for different post types
  const renderPollContent = (post: CommunityPost) => (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 mb-4">
      <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
        <ThumbsUp className="w-4 h-4 mr-2 text-purple-600" />
        Community Poll
      </h4>
      <div className="space-y-3">
        {post.pollOptions?.map((option, index) => {
          const votes = post.pollResults?.[option] || 0;
          const totalVotes = Object.values(post.pollResults || {}).reduce((a, b) => a + b, 0);
          const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          
          return (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{option}</span>
                <span className="text-sm text-purple-600 font-semibold">{votes} votes ({percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-center">
        <span className="text-xs text-purple-600 font-medium">
          Total votes: {Object.values(post.pollResults || {}).reduce((a, b) => a + b, 0)}
        </span>
      </div>
    </div>
  );

  const renderFileContent = (post: CommunityPost) => (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-blue-800 text-sm">File Upload</h4>
          <p className="text-blue-600 text-xs">{post.fileType} • {post.fileSize}</p>
        </div>
        <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200">
          Download
        </button>
      </div>
    </div>
  );

  const renderDiscussionContent = (post: CommunityPost) => (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
      <h4 className="font-semibold text-green-800 mb-3 flex items-center">
        <MessageCircle className="w-4 h-4 mr-2 text-green-600" />
        Discussion Thread
      </h4>
      <div className="flex flex-wrap gap-2 mb-3">
        {post.discussionTags?.map((tag, index) => (
          <span key={index} className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium border border-green-200">
            #{tag}
          </span>
        ))}
      </div>
      <p className="text-green-700 text-sm leading-relaxed">{post.content}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-green-600 font-medium">
          💬 {post.comments} replies • 🔥 Trending
        </span>
        <button className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors border border-green-200">
          Join Discussion
        </button>
      </div>
    </div>
  );

  const renderEventContent = (post: CommunityPost) => (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4 mb-4">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-orange-800 flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-orange-600" />
          {post.isLive ? '🟢 Live Event' : 'Upcoming Event'}
        </h4>
        {post.isLive && (
                          <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
            LIVE NOW
          </span>
        )}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-orange-600" />
          <span className="text-orange-700">{post.eventDate}</span>
        </div>
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-orange-600" />
          <span className="text-orange-700">{post.eventLocation}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-orange-600" />
          <span className="text-orange-700">
            {post.eventAttendees}/{post.maxAttendees} attending
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
          <div 
            className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((post.eventAttendees || 0) / (post.maxAttendees || 1)) * 100}%` }}
          ></div>
        </div>
        <button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200">
          {post.isLive ? 'Join Now' : 'RSVP'}
        </button>
      </div>
    </div>
  );

  const renderMediaContent = (post: CommunityPost) => {
    if (post.type === 'image') {
      return (
        <div className="mb-4">
          <img 
            src={post.media} 
            alt="Post image" 
            className="w-full max-w-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200" 
            onError={handleImageError} 
          />
        </div>
      );
    }
    
    if (post.type === 'video') {
      return (
        <div className="mb-4">
          <div className="relative w-full max-w-lg h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center group cursor-pointer hover:shadow-xl transition-all duration-200">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Play className="w-8 h-8 text-white" />
            </div>
            <span className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">Video</span>
            <span className="absolute top-3 right-3 bg-blue-500 text-white px-2 py-1 rounded-lg text-xs font-medium">
              {post.type.toUpperCase()}
            </span>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Show loading state while data is being initialized
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Community Header - Social Media Style */}
      <div className="bg-white shadow-lg border-b border-blue-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="py-2 sm:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-blue-200">
                    <span className="text-white text-xs sm:text-sm md:text-lg font-bold">
                      {communityData?.name ? communityData.name.substring(0, 2).toUpperCase() : 'TC'}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm sm:text-base md:text-xl font-bold text-gray-900 flex items-center truncate">
                    <span className="truncate">{communityData?.name || 'Tech Creators'}</span>
                    <span className="ml-1 sm:ml-2 text-blue-600 flex-shrink-0">✨</span>
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center flex-wrap gap-1 sm:gap-2 md:gap-4">
                      <span className="flex items-center">
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-blue-600" />
                        <span className="text-xs sm:text-sm">{communityData?.memberCount ? communityData.memberCount.toLocaleString() : members.length} members</span>
                      </span>
                      <span className="flex items-center">
                        <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-blue-600" />
                        <span className="text-xs sm:text-sm">{communityData?.type || 'Public'}</span>
                      </span>
                      <span className="flex items-center text-blue-600">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-2 md:h-2 bg-blue-500 rounded-full mr-1 sm:mr-2"></div>
                        <span className="text-xs sm:text-sm">{members.filter(m => m.isOnline).length} online</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3 flex-shrink-0">
                <button className="hidden sm:flex bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 items-center text-xs sm:text-sm">
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Invite</span>
                </button>
                <button className="bg-green-100 text-green-600 p-1 sm:p-1.5 md:p-2 rounded-full hover:bg-green-200 transition-all duration-200 hover:scale-105" title="Audio Call">
                  <Phone className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button className="bg-blue-100 text-blue-600 p-1 sm:p-1.5 md:p-2 rounded-full hover:bg-blue-200 transition-all duration-200 hover:scale-105" title="Video Call">
                  <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button className="bg-gray-100 text-gray-600 p-1 sm:p-1.5 md:p-2 rounded-full hover:bg-gray-200 transition-all duration-200">
                  <Search className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
                <button className="bg-gray-100 text-gray-600 p-1 sm:p-1.5 md:p-2 rounded-full hover:bg-gray-200 transition-all duration-200 relative">
                  <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 md:w-3 md:h-3 bg-blue-500 rounded-full"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Banner - Social Media Style */}
      <div className="relative h-24 sm:h-28 md:h-32 lg:h-40 xl:h-48 bg-gradient-to-r from-blue-500 to-cyan-500 overflow-hidden mt-16 sm:mt-16">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        <div className="relative h-full flex items-end">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-8 pb-2 sm:pb-3 md:pb-4 lg:pb-6 w-full">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between space-y-2 sm:space-y-3 md:space-y-0">
              <div className="flex-1">
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-white mb-2 sm:mb-3 leading-tight">
                  {communityData?.about || communityData?.bio || communityData?.description || 'Building the future together ✨'}
                </h2>
                <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
                  {userSharedInterests.slice(0, (typeof window !== 'undefined' && window.innerWidth < 640) ? 2 : (typeof window !== 'undefined' && window.innerWidth < 768) ? 3 : 5).map((interest, index) => (
                    <span key={index} className="bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm text-white font-medium border border-white/30">
                      {interest}
                    </span>
                  ))}
                </div>
                <p className="text-blue-100 text-sm sm:text-base">
                  You share {userSharedInterests.length} interests with this community 💫
                </p>
              </div>
              <div className="self-end sm:text-right">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 sm:p-2.5 md:p-3 border border-white/30 inline-block">
                  <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white">{members.filter(m => m.isOnline).length}</div>
                  <div className="text-sm text-blue-100">online now</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Social Media Layout */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-2 sm:py-4 mt-2 sm:mt-0">
        <div className="flex flex-col lg:flex-row gap-2 sm:gap-4">
          {/* Left Sidebar - Chat Style Navigation */}
          <div className="hidden lg:block w-64 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-4">
              <h3 className="text-gray-900 font-semibold mb-3 flex items-center">
                <Hash className="w-4 h-4 mr-2 text-blue-600" />
                Channels
              </h3>
              <div className="space-y-1">
                {[
                  { id: 'home', label: '🏠 General', icon: Heart, active: activeTab === 'home' },
                  { id: 'members', label: '👥 Members', icon: Users, active: activeTab === 'members' },
                  { id: 'discussions', label: '💬 Discussions', icon: MessageCircle, active: activeTab === 'discussions' },
                  { id: 'events', label: '📅 Events', icon: Calendar, active: activeTab === 'events' },
                  { id: 'chat', label: '⚡ Live Chat', icon: MessageCircle, active: activeTab === 'chat' },
                  { id: 'media', label: '📸 Media', icon: Image, active: activeTab === 'media' },
                  { id: 'polls', label: '📊 Polls', icon: ThumbsUp, active: activeTab === 'polls' },
                  { id: 'files', label: '📁 Files', icon: FileText, active: activeTab === 'files' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 flex items-center ${
                      tab.active
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            

          </div>

          {/* Mobile Tab Navigation */}
          <div className="lg:hidden w-full">
            <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-blue-200 p-3 sm:p-4 mb-4 sm:mb-6">
              {/* First Row - 4 tabs */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-3">
                {[
                  { id: 'home', label: 'Home', icon: '🏠' },
                  { id: 'members', label: 'Members', icon: '👥' },
                  { id: 'discussions', label: 'Chat', icon: '💬' },
                  { id: 'events', label: 'Events', icon: '📅' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center px-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-sm sm:text-base mb-1">{tab.icon}</span>
                    <span className="text-xs sm:text-sm truncate text-center leading-tight">{tab.label}</span>
                  </button>
                ))}
              </div>
              
              {/* Second Row - 4 tabs */}
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {[
                  { id: 'chat', label: 'Live', icon: '⚡' },
                  { id: 'media', label: 'Media', icon: '📸' },
                  { id: 'polls', label: 'Polls', icon: '📊' },
                  { id: 'files', label: 'Files', icon: '📁' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center px-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <span className="text-sm sm:text-base mb-1">{tab.icon}</span>
                    <span className="text-xs sm:text-sm truncate text-center leading-tight">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 space-y-3 sm:space-y-4">

            {/* Create Post - Social Media Style */}
            <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-blue-200 p-2 sm:p-3 md:p-4 lg:p-6">
              <div className="flex items-start space-x-2 sm:space-x-3 md:space-x-4">
                <div className="relative flex-shrink-0">
                  <img
                      src={safeUserProfile.avatar}
                      alt={safeUserProfile.name}
                    className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 border-blue-200"
                    onError={handleImageError}
                  />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="w-full text-left text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50 rounded-lg sm:rounded-xl px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 transition-all duration-200 border border-gray-200 hover:border-gray-300 text-xs sm:text-sm md:text-base"
                  >
                      What's on your mind, {safeUserProfile.name}? ✨
                  </button>
                  <div className="flex items-center justify-between mt-1.5 sm:mt-2 md:mt-3">
                    <div className="flex space-x-1 sm:space-x-2 md:space-x-3 overflow-x-auto">
                      <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors flex-shrink-0">
                        <Image className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Photo</span>
                      </button>
                      <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors flex-shrink-0">
                        <Video className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm hidden sm:inline">Video</span>
                        <span className="text-xs sm:text-sm sm:hidden">Vid</span>
                      </button>
                      <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors flex-shrink-0">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">Event</span>
                      </button>
                    </div>
                    <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex-shrink-0">
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'home' && (
              <div className="space-y-4">
                {/* Featured Community Post - Video Card */}
                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-blue-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face"
                        alt="Sarah Chen"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Sarah Chen</span>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          <span className="text-blue-600 text-xs sm:text-sm bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full">⭐ 1250</span>
                          <span className="text-gray-500 text-xs sm:text-sm">2 hours ago</span>
                          <span className="bg-red-100 text-red-700 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium">VIDEO</span>
                        </div>
                      </div>
                      <p className="text-gray-800 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">Just finished building an AI-powered recommendation system! The performance is incredible and I'm so excited to share this with you all. Anyone else working on machine learning projects? Would love to collaborate! 🚀</p>
                      
                      {/* Video Content */}
                      <div className="relative mb-3 sm:mb-4">
                        <div className="w-full h-32 sm:h-48 md:h-64 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                          <Play className="w-8 h-8 sm:w-12 sm:w-16 sm:h-16 text-white" />
                          <span className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 bg-black/70 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">5:32</span>
                        </div>
                      </div>
                      
                      {/* Shared Interests */}
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                        <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Technology</span>
                        <span className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Programming</span>
                        <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">AI/ML</span>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 space-y-2 sm:space-y-0">
                        <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-6">
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">89</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">34</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">12</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">23</span>
                          </button>
                        </div>
                        <button className="bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-blue-600 text-xs sm:text-sm hover:bg-blue-200 transition-colors">
                          Follow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Poll Card */}
                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-blue-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
                        alt="Ryan Wilson"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Ryan Wilson</span>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          <span className="text-blue-600 text-xs sm:text-sm bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full">⭐ 820</span>
                          <span className="text-gray-500 text-xs sm:text-sm">1 day ago</span>
                          <span className="bg-purple-100 text-purple-700 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium">POLL</span>
                        </div>
                      </div>
                      <p className="text-gray-800 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">What's your preferred testing framework? Let's vote and see what the community thinks! 🧪</p>
                      
                      {/* Poll Options */}
                      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <span className="text-gray-800 font-medium text-sm sm:text-base">Jest</span>
                            <span className="text-blue-600 text-xs sm:text-sm font-medium">78 votes</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div className="bg-blue-500 h-1.5 sm:h-2 rounded-full" style={{width: '45%'}}></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <span className="text-gray-800 font-medium text-sm sm:text-base">Mocha</span>
                            <span className="text-blue-600 text-xs sm:text-sm font-medium">45 votes</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div className="bg-blue-500 h-1.5 sm:h-2 rounded-full" style={{width: '26%'}}></div>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 sm:p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between mb-1 sm:mb-2">
                            <span className="text-gray-800 font-medium text-sm sm:text-base">Vitest</span>
                            <span className="text-blue-600 text-xs sm:text-sm font-medium">32 votes</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                            <div className="bg-blue-500 h-1.5 sm:h-2 rounded-full" style={{width: '18%'}}></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Shared Interests */}
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                        <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Technology</span>
                        <span className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Programming</span>
                        <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Testing</span>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 space-y-2 sm:space-y-0">
                        <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-6">
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">56</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">38</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">22</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">41</span>
                          </button>
                        </div>
                        <button className="bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-blue-600 text-xs sm:text-sm hover:bg-blue-200 transition-colors">
                          Vote
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Event Card */}
                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-blue-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face"
                        alt="Elena Petrov"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Elena Petrov</span>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          <span className="text-blue-600 text-xs sm:text-sm bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full">⭐ 950</span>
                          <span className="text-gray-500 text-xs sm:text-sm">3 hours ago</span>
                          <span className="bg-orange-100 text-orange-700 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium">EVENT</span>
                        </div>
                      </div>
                      <p className="text-gray-800 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">Join us for an exciting AI & Machine Learning meetup! We'll have demos, networking, and pizza! 🍕🤖</p>
                      
                      {/* Event Details */}
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                            <div>
                              <p className="text-orange-800 font-medium text-sm sm:text-base">February 15, 2024</p>
                              <p className="text-orange-600 text-xs sm:text-sm">7:00 PM - 9:00 PM</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                            <div>
                              <p className="text-orange-800 font-medium text-sm sm:text-base">Tech Hub Downtown</p>
                              <p className="text-orange-600 text-xs sm:text-sm">123 Innovation St</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                            <span className="text-orange-800 font-medium text-sm sm:text-base">67 attending</span>
                          </div>
                          <button className="bg-orange-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-orange-600 transition-colors">
                            Join Event
                          </button>
                        </div>
                      </div>
                      
                      {/* Shared Interests */}
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                        <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Technology</span>
                        <span className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">AI</span>
                        <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Machine Learning</span>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 space-y-2 sm:space-y-0">
                        <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-6">
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">73</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">29</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">35</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">52</span>
                          </button>
                        </div>
                        <button className="bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-blue-600 text-xs sm:text-sm hover:bg-blue-200 transition-colors">
                          Follow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discussion Card */}
                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-blue-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"
                        alt="David Kim"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">David Kim</span>
                        <span className="text-blue-600 text-xs sm:text-sm bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full">⭐ 1100</span>
                        <span className="text-gray-500 text-xs sm:text-sm">5 hours ago</span>
                        <span className="bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium">DISCUSSION</span>
                      </div>
                      <p className="text-gray-800 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">What's your favorite database design pattern? I'm working on a new project and would love to hear your thoughts on the pros and cons of different approaches! 🗄️</p>
                      
                      {/* Discussion Tags */}
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                        <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Database Design</span>
                        <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Architecture</span>
                        <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Best Practices</span>
                        <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Discussion</span>
                      </div>
                      
                      {/* Discussion Stats */}
                      <div className="bg-green-50 border border-green-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            <div className="flex items-center space-x-2">
                              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                              <span className="text-green-700 font-medium text-sm sm:text-base">42 replies</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                              <span className="text-green-700 font-medium text-sm sm:text-base">28 participants</span>
                            </div>
                          </div>
                          <button className="bg-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-green-600 transition-colors">
                            Join Discussion
                          </button>
                        </div>
                      </div>
                      
                      {/* Shared Interests */}
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                        <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Technology</span>
                        <span className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Programming</span>
                        <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Databases</span>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 space-y-2 sm:space-y-0">
                        <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-6">
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">38</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">42</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">19</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">31</span>
                          </button>
                        </div>
                        <button className="bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-blue-600 text-xs sm:text-sm hover:bg-blue-200 transition-colors">
                          Follow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* File Card */}
                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-blue-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face"
                        alt="Lisa Thompson"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Lisa Thompson</span>
                        <span className="text-blue-600 text-xs sm:text-sm bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full">⭐ 720</span>
                        <span className="text-gray-500 text-xs sm:text-sm">1 day ago</span>
                        <span className="bg-indigo-100 text-indigo-700 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium">FILE</span>
                      </div>
                      <p className="text-gray-800 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">Community guidelines v2.0 is now available! Please review and provide feedback. This includes updated rules, best practices, and community standards. 📋</p>
                      
                      {/* File Content */}
                      <div className="bg-indigo-50 border border-indigo-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-indigo-800 font-semibold text-sm sm:text-base">Community Guidelines v2.0</h4>
                            <p className="text-indigo-600 text-xs sm:text-sm">PDF • 3.2 MB</p>
                          </div>
                          <button className="bg-indigo-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium hover:bg-indigo-600 transition-colors flex-shrink-0">
                            Download
                          </button>
                        </div>
                      </div>
                      
                      {/* Shared Interests */}
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                        <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Technology</span>
                        <span className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Community</span>
                        <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Guidelines</span>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 space-y-2 sm:space-y-0">
                        <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-6">
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">25</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">19</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">12</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">35</span>
                          </button>
                        </div>
                        <button className="bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-blue-600 text-xs sm:text-sm hover:bg-blue-200 transition-colors">
                          Follow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Image Card */}
                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-blue-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face"
                        alt="Marcus Johnson"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base">Marcus Johnson</span>
                        <span className="text-blue-600 text-xs sm:text-sm bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full">⭐ 720</span>
                        <span className="text-gray-500 text-xs sm:text-sm">1 day ago</span>
                        <span className="bg-pink-100 text-pink-700 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium">IMAGE</span>
                      </div>
                      <p className="text-gray-800 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">Check out this amazing sunset from our coding retreat! Perfect inspiration for late-night debugging! 🌅✨</p>
                      
                      {/* Image Content */}
                      <div className="mb-3 sm:mb-4">
                        <img 
                          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop" 
                          alt="Sunset at coding retreat" 
                          className="w-full rounded-lg sm:rounded-xl shadow-lg"
                        />
                      </div>
                      
                      {/* Shared Interests */}
                      <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                        <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Technology</span>
                        <span className="bg-purple-100 text-purple-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Lifestyle</span>
                        <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">Photography</span>
                      </div>
                      
                      {/* Post Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 sm:pt-4 border-t border-gray-100 space-y-2 sm:space-y-0">
                        <div className="flex items-center justify-center sm:justify-start space-x-4 sm:space-x-6">
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">67</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">18</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">32</span>
                          </button>
                          <button className="flex items-center space-x-1 sm:space-x-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-xs sm:text-sm font-medium">45</span>
                          </button>
                        </div>
                        <button className="bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-blue-600 text-xs sm:text-sm hover:bg-blue-200 transition-colors">
                          Follow
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pinned Posts */}
                {posts.filter(post => post.isPinned).length > 0 && (
                  <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 backdrop-blur-xl">
                    <h3 className="text-blue-800 font-semibold mb-3 flex items-center text-sm sm:text-base lg:text-lg">
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                      📌 Pinned Posts
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      {posts.filter(post => post.isPinned).map((post) => (
                        <div key={post.id} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200 hover:border-blue-300 transition-all duration-200 shadow-lg">
                          <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3">
                            <div className="relative flex-shrink-0">
                              <img
                                src={post.author.avatar}
                                alt={post.author.name}
                                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-blue-400"
                                onError={handleImageError}
                              />
                              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                <Star className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                                <span className="font-semibold text-gray-900 text-sm">{post.author.name}</span>
                                <span className="text-blue-700 text-xs bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full border border-blue-200">Pinned</span>
                                <span className="text-gray-500 text-xs">{post.timestamp}</span>
                              </div>
                              <p className="text-gray-800 mb-2 sm:mb-3 text-sm leading-relaxed">{post.content}</p>
                              {renderMediaContent(post)}
                              <div className="flex items-center space-x-3 sm:space-x-4 text-xs">
                                <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                  <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>{post.likes}</span>
                                </button>
                                <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                  <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>{post.dislikes}</span>
                                </button>
                                <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>{post.comments}</span>
                                </button>
                                <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                  <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
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

                {/* All Content Feed - Mixed Content Types */}
                <div className="space-y-3 sm:space-y-4">
                  {posts.filter(post => !post.isPinned).map((post) => (
                    <div key={post.id} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg border border-blue-200 p-3 sm:p-4 hover:shadow-xl transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-3">
                        <div className="relative flex-shrink-0">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-200"
                            onError={handleImageError}
                          />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                            <span className="font-semibold text-gray-900 text-sm">{post.author.name}</span>
                            <span className="text-blue-600 text-xs bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full">⭐ {post.author.reputation}</span>
                            <span className="text-gray-500 text-xs">{post.timestamp}</span>
                            {post.type !== 'text' && (
                              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium border ${
                                post.type === 'poll' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                post.type === 'file' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                post.type === 'discussion' ? 'bg-green-100 text-green-700 border-green-200' :
                                post.type === 'event' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                post.type === 'video' ? 'bg-red-100 text-red-700 border-red-200' :
                                post.type === 'image' ? 'bg-pink-100 text-pink-700 border-pink-200' :
                                'bg-blue-100 text-blue-700 border-blue-200'
                              }`}>
                                {post.type.toUpperCase()}
                              </span>
                            )}
                          </div>
                          
                          {/* Content based on type */}
                          {post.type === 'poll' && renderPollContent(post)}
                          {post.type === 'file' && renderFileContent(post)}
                          {post.type === 'discussion' && renderDiscussionContent(post)}
                          {post.type === 'event' && renderEventContent(post)}
                          
                          {/* Text content for non-specialized types */}
                          {!['poll', 'file', 'discussion', 'event'].includes(post.type) && (
                            <p className="text-gray-800 mb-3 leading-relaxed text-sm">{post.content}</p>
                          )}
                          
                          {/* Media content */}
                          {renderMediaContent(post)}
                          
                          {/* Shared Interests Tags */}
                          <div className="mb-3 sm:mb-4">
                            <div className="flex flex-wrap gap-1 sm:gap-2">
                              {post.sharedInterests.slice(0, 3).map((interest, index) => (
                                <span key={index} className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-xs font-medium border border-blue-200 hover:bg-blue-200 transition-colors">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          {/* Post Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-gray-100 space-y-2 sm:space-y-0">
                            <div className="flex items-center justify-center sm:justify-start space-x-3 sm:space-x-4">
                              <button 
                                onClick={() => handlePostAction(post.id, 'like')}
                                className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                              >
                                <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.likes}</span>
                              </button>
                              <button 
                                onClick={() => handlePostAction(post.id, 'dislike')}
                                className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                              >
                                <ThumbsDown className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.dislikes}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.comments}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.shares}</span>
                              </button>
                              <button 
                                onClick={() => handlePostAction(post.id, 'bookmark')}
                                className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors"
                              >
                                <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.bookmarks}</span>
                              </button>
                            </div>
                            {safeUserProfile.role === 'moderator' && (
                              <button className="bg-blue-100 px-2 sm:px-3 py-1 rounded-lg text-blue-600 text-xs hover:bg-blue-200 transition-colors border border-blue-200">
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
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-3 md:space-y-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex items-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
                    Community Members 👥
                  </h2>
                  <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <div className="bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                      <span className="text-blue-700 text-xs sm:text-sm font-medium">{members.filter(m => m.isOnline).length} Online</span>
                    </div>
                    <div className="bg-blue-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                      <span className="text-blue-700 text-xs sm:text-sm font-medium">{members.length} Total</span>
                    </div>
                  </div>
                </div>
                
                {/* Member Search & Filters */}
                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg border border-blue-200 p-3 sm:p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                      <input
                        type="text"
                        placeholder="Search members by name or interests..."
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                      />
                    </div>
                    <select className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base">
                      <option>All Roles</option>
                      <option>Members</option>
                      <option>Moderators</option>
                      <option>Admins</option>
                    </select>
                    <select className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl md:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base">
                      <option>All Status</option>
                      <option>Online</option>
                      <option>Offline</option>
                    </select>
                  </div>
                </div>

                {/* Members Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {members.map((member) => (
                    <div key={member.id} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg border border-blue-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                      <div className="text-center mb-3 sm:mb-4">
                        <div className="relative inline-block">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full border-2 sm:border-3 md:border-4 border-blue-200 shadow-lg mx-auto"
                            onError={handleImageError}
                          />
                          {member.isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 bg-blue-500 rounded-full border-2 sm:border-3 md:border-4 border-white shadow-md"></div>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mt-2 sm:mt-3">{member.name}</h3>
                        <div className="flex items-center justify-center space-x-2 mt-2">
                          {member.role !== 'member' && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              member.role === 'admin' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                            }`}>
                              {member.role}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">⭐ {member.reputation}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                        <div className="text-center">
                          <span className="text-base sm:text-lg md:text-xl font-semibold text-blue-600">{member.matchPercentage}%</span>
                          <p className="text-xs text-gray-600">Match</p>
                        </div>
                        <div className="text-center">
                          <span className="text-xs text-gray-500">Last seen: {member.lastSeen}</span>
                        </div>
                      </div>

                      <div className="mb-3 sm:mb-4">
                        <h4 className="text-xs sm:text-sm font-bold text-gray-700 mb-2">Shared Interests:</h4>
                        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
                          {member.sharedInterests.slice(0, 3).map((interest, index) => (
                            <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                              {interest}
                            </span>
                          ))}
                          {member.sharedInterests.length > 3 && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                              +{member.sharedInterests.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <button className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                          Message
                        </button>
                        <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl transition-all duration-200 hover:scale-105">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'discussions' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-3 md:space-y-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex items-center">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
                    Community Discussions 💬
                  </h2>
                  <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                    Start Discussion
                  </button>
                </div>
                
                {/* Discussion Categories */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {[
                    { name: 'General Tech', count: 45, icon: '💻', color: 'blue' },
                    { name: 'Programming', count: 32, icon: '⚡', color: 'purple' },
                    { name: 'AI & ML', count: 28, icon: '🤖', color: 'green' },
                    { name: 'Web Dev', count: 25, icon: '🌐', color: 'indigo' },
                    { name: 'Mobile Dev', count: 18, icon: '📱', color: 'pink' },
                    { name: 'DevOps', count: 15, icon: '🚀', color: 'orange' }
                  ].map((category, index) => (
                    <div key={index} className={`bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg border border-${category.color}-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] cursor-pointer`}>
                      <div className="text-center">
                        <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-${category.color}-500 to-${category.color}-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                          <span className="text-2xl sm:text-3xl md:text-4xl">{category.icon}</span>
                        </div>
                        <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{category.count} discussions</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Active Discussions */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 flex items-center">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                    Active Discussions
                  </h3>
                  
                  {posts.filter(post => post.type === 'discussion').slice(0, 5).map((post) => (
                    <div key={post.id} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg border border-blue-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-200"
                            onError={handleImageError}
                          />
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">{post.author.name}</span>
                            <span className="text-blue-600 text-xs sm:text-sm bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full">⭐ {post.author.reputation}</span>
                            <span className="text-gray-500 text-xs sm:text-sm">{post.timestamp}</span>
                          </div>
                          <p className="text-gray-800 mb-3 leading-relaxed text-sm sm:text-base">{post.content}</p>
                          
                          {/* Discussion Tags */}
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                            {post.discussionTags?.slice(0, 3).map((tag, index) => (
                              <span key={index} className="bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium border border-green-200">
                                #{tag}
                              </span>
                            ))}
                          </div>
                          
                          {/* Discussion Stats */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                            <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                              <span className="flex items-center">
                                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-600" />
                                {post.comments} replies
                              </span>
                              <span className="flex items-center">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-green-600" />
                                {Math.floor(post.comments / 2)} participants
                              </span>
                            </div>
                            <button className="bg-green-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-600 transition-colors">
                              Join Discussion
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-3 md:space-y-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
                    Community Events 📅
                  </h2>
                  <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                    Create Event
                  </button>
                </div>
                
                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                  {posts.filter(post => post.type === 'event').slice(0, 6).map((post) => (
                    <div key={post.id} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg border border-blue-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                      <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-200"
                            onError={handleImageError}
                          />
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">{post.author.name}</span>
                            <span className="text-blue-600 text-xs sm:text-sm bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full">⭐ {post.author.reputation}</span>
                            <span className="text-gray-500 text-xs sm:text-sm">{post.timestamp}</span>
                          </div>
                          <p className="text-gray-800 mb-3 leading-relaxed text-sm sm:text-base">{post.content}</p>
                          
                          {/* Event Details */}
                          <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                              <div className="flex items-center space-x-2 sm:space-x-3">
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                                <div>
                                  <p className="text-orange-800 font-medium text-sm sm:text-base">{post.eventDate}</p>
                                  <p className="text-orange-600 text-xs sm:text-sm">7:00 PM - 9:00 PM</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 sm:space-x-3">
                                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                                <div>
                                  <p className="text-orange-800 font-medium text-sm sm:text-base">{post.eventLocation}</p>
                                  <p className="text-orange-600 text-xs sm:text-sm">Online</p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                                <span className="text-orange-800 font-medium text-sm sm:text-base">{post.eventAttendees} attending</span>
                              </div>
                              <button className="bg-orange-500 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium hover:bg-orange-600 transition-colors">
                                Join Event
                              </button>
                            </div>
                          </div>
                          
                          {/* Shared Interests */}
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                            {post.sharedInterests?.slice(0, 3).map((interest, index) => (
                              <span key={index} className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium border border-blue-200">
                                {interest}
                              </span>
                            ))}
                          </div>
                          
                          {/* Post Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-gray-100 space-y-2 sm:space-y-0">
                            <div className="flex items-center justify-center sm:justify-start space-x-3 sm:space-x-4">
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.likes}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.comments}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.shares}</span>
                              </button>
                            </div>
                            <button className="bg-blue-100 px-2 sm:px-3 py-1 rounded-lg text-blue-600 text-xs hover:bg-blue-200 transition-colors border border-blue-200">
                              Follow
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-3 md:space-y-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex items-center">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
                    Live Chat ⚡
                  </h2>
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="bg-green-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                      <span className="text-green-700 text-xs sm:text-sm font-medium">{liveMembers} Online</span>
                    </div>
                    <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                      New Chat
                    </button>
                  </div>
                </div>
                
                {/* Chat Interface */}
                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg border border-blue-200 overflow-hidden">
                  {/* Chat Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-semibold text-sm sm:text-base md:text-lg flex items-center">
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        {activeChat ? activeChat.name : 'Select a channel to start chatting'}
                      </h3>
                      {activeChat && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-white text-xs sm:text-sm">Live</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Chat Channels */}
                  <div className="p-3 sm:p-4 border-b border-gray-200">
                    <div className="flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto scrollbar-hide">
                      {chats.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => setActiveChat(chat)}
                          className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm transition-all duration-200 ${
                            activeChat?.id === chat.id
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span className="mr-2">{chat.type === 'general' ? '💬' : chat.type === 'interests' ? '🎯' : chat.type === 'events' ? '📅' : '🛡️'}</span>
                          {chat.name}
                          {chat.unreadCount > 0 && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-1.5 sm:px-2 py-0.5 rounded-full">
                              {chat.unreadCount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Chat Messages Area */}
                  <div className="min-h-[300px] sm:min-h-[400px] md:min-h-[500px] p-3 sm:p-4 bg-gray-50">
                    {activeChat ? (
                      <div className="space-y-3 sm:space-y-4">
                        {/* Sample messages */}
                        <div className="flex items-start space-x-3">
                          <img
                            src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
                            alt="Sarah Chen"
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-blue-200 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-sm border border-gray-200">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-semibold text-gray-900 text-sm">Sarah Chen</span>
                                <span className="text-gray-500 text-xs">2 min ago</span>
                              </div>
                              <p className="text-gray-800 text-sm">Hey everyone! Anyone working on AI projects this weekend? 🤖</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3 justify-end">
                          <div className="flex-1 max-w-xs sm:max-w-sm">
                            <div className="bg-blue-500 text-white rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-sm">
                              <p className="text-sm">I'm working on a machine learning model for image recognition! Would love to collaborate 🚀</p>
                            </div>
                          </div>
                          <img
                            src={safeUserProfile.avatar}
                            alt={safeUserProfile.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-blue-200 flex-shrink-0"
                          />
                        </div>
                        
                        {typingUsers.length > 0 && (
                          <div className="flex items-center space-x-2 text-gray-500 text-sm">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <span>{typingUsers.join(', ')} is typing...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8 sm:py-12">
                        <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm sm:text-base">Select a channel to start chatting with the community!</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Chat Input */}
                  {activeChat && (
                    <div className="p-3 sm:p-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          onInput={handleTyping}
                          placeholder="Type your message..."
                          className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!chatMessage.trim()}
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-3 md:space-y-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex items-center">
                    <Image className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
                    Community Media 📸
                  </h2>
                  <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                    Upload Media
                  </button>
                </div>
                
                {/* Media Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 text-center shadow-lg border border-blue-200">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <Image className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{posts.filter(post => post.type === 'image').length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Images</div>
                  </div>
                  
                  <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 text-center shadow-lg border border-blue-200">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <Video className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{posts.filter(post => post.type === 'video').length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Videos</div>
                  </div>
                  
                  <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 text-center shadow-lg border border-blue-200">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <Music className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{posts.filter(post => post.type === 'audio').length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Audio</div>
                  </div>
                  
                  <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 text-center shadow-lg border border-blue-200">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" />
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{posts.filter(post => post.type === 'file').length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Files</div>
                  </div>
                </div>
                
                {/* Media Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {posts.filter(post => ['image', 'video'].includes(post.type)).map((post) => (
                    <div key={post.id} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg border border-blue-200 overflow-hidden hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                      <div className="relative">
                        {post.type === 'image' ? (
                          <img
                            src={post.media}
                            alt="Media content"
                            className="w-full h-32 sm:h-40 md:h-48 object-cover"
                            onError={handleImageError}
                          />
                        ) : (
                          <div className="w-full h-32 sm:h-40 md:h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center group cursor-pointer">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                              <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                            </div>
                            <span className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 bg-black/70 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">Video</span>
                          </div>
                        )}
                        <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
                          <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                            post.type === 'image' ? 'bg-pink-100 text-pink-700 border border-pink-200' : 'bg-red-100 text-red-700 border border-red-200'
                          }`}>
                            {post.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="p-3 sm:p-4">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-blue-200"
                            onError={handleImageError}
                          />
                          <span className="font-medium text-gray-900 text-sm sm:text-base">{post.author.name}</span>
                        </div>
                        <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">{post.content}</p>
                        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
                          <span>{post.timestamp}</span>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="flex items-center">
                              <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {post.likes}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {post.comments}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'polls' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-3 md:space-y-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex items-center">
                    <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
                    Community Polls 📊
                  </h2>
                  <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                    Create Poll
                  </button>
                </div>
                
                {/* Active Polls */}
                <div className="space-y-3 sm:space-y-4 md:space-y-6">
                  {posts.filter(post => post.type === 'poll').map((post) => (
                    <div key={post.id} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg border border-blue-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-200"
                            onError={handleImageError}
                          />
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">{post.author.name}</span>
                            <span className="text-blue-600 text-xs sm:text-sm bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full">⭐ {post.author.reputation}</span>
                            <span className="text-gray-500 text-xs sm:text-sm">{post.timestamp}</span>
                          </div>
                          <p className="text-gray-800 mb-3 leading-relaxed text-sm sm:text-base">{post.content}</p>
                          
                          {/* Poll Options */}
                          <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                            {post.pollOptions?.map((option, index) => {
                              const votes = post.pollResults?.[option] || 0;
                              const totalVotes = Object.values(post.pollResults || {}).reduce((a, b) => a + b, 0);
                              const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                              
                              return (
                                <div key={index} className="bg-gray-50 rounded-lg p-2 sm:p-3 cursor-pointer hover:bg-gray-100 transition-colors">
                                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                                    <span className="text-gray-800 font-medium text-sm sm:text-base">{option}</span>
                                    <span className="text-blue-600 text-xs sm:text-sm font-medium">{votes} votes ({percentage}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                                    <div 
                                      className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Poll Stats */}
                          <div className="text-center mb-3 sm:mb-4">
                            <span className="text-xs sm:text-sm text-blue-600 font-medium">
                              Total votes: {Object.values(post.pollResults || {}).reduce((a, b) => a + b, 0)}
                            </span>
                          </div>
                          
                          {/* Shared Interests */}
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                            {post.sharedInterests?.slice(0, 3).map((interest, index) => (
                              <span key={index} className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium border border-blue-200">
                                {interest}
                              </span>
                            ))}
                          </div>
                          
                          {/* Post Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-gray-100 space-y-2 sm:space-y-0">
                            <div className="flex items-center justify-center sm:justify-start space-x-3 sm:space-x-4">
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.likes}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.comments}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.shares}</span>
                              </button>
                            </div>
                            <button className="bg-blue-100 px-2 sm:px-3 py-1 rounded-lg text-blue-600 text-xs hover:bg-blue-200 transition-colors border border-blue-200">
                              Vote
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'files' && (
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-3 md:space-y-0">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 flex items-center">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
                    Community Files 📁
                  </h2>
                  <button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105">
                    Upload File
                  </button>
                </div>
                
                {/* File Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                  {posts.filter(post => post.type === 'file').map((post) => (
                    <div key={post.id} className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-lg border border-blue-200 p-3 sm:p-4 md:p-6 hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]">
                      <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                        <div className="relative flex-shrink-0">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-200"
                            onError={handleImageError}
                          />
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                            <span className="font-semibold text-gray-900 text-sm sm:text-base">{post.author.name}</span>
                            <span className="text-blue-600 text-xs sm:text-sm bg-blue-100 px-1.5 sm:px-2 py-0.5 rounded-full">⭐ {post.author.reputation}</span>
                            <span className="text-gray-500 text-xs sm:text-sm">{post.timestamp}</span>
                          </div>
                          <p className="text-gray-800 mb-3 leading-relaxed text-sm sm:text-base">{post.content}</p>
                          
                          {/* File Content */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-blue-800 font-semibold text-sm sm:text-base">File Upload</h4>
                                <p className="text-blue-600 text-xs sm:text-sm">{post.fileType} • {post.fileSize}</p>
                              </div>
                              <button className="bg-blue-500 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-600 transition-all duration-200 flex-shrink-0">
                                Download
                              </button>
                            </div>
                          </div>
                          
                          {/* Shared Interests */}
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
                            {post.sharedInterests?.slice(0, 3).map((interest, index) => (
                              <span key={index} className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium border border-blue-200">
                                {interest}
                              </span>
                            ))}
                          </div>
                          
                          {/* Post Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-gray-100 space-y-2 sm:space-y-0">
                            <div className="flex items-center justify-center sm:justify-start space-x-3 sm:space-x-4">
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.likes}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.comments}</span>
                              </button>
                              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-600 transition-colors">
                                <Share2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="text-xs">{post.shares}</span>
                              </button>
                            </div>
                            <button className="bg-blue-100 px-2 sm:px-3 py-1 rounded-lg text-blue-600 text-xs hover:bg-blue-200 transition-colors border border-blue-200">
                              Follow
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Social Media Style */}
          <div className="hidden xl:block w-80 space-y-4">
            {/* Members You Might Connect With */}
            <div className="bg-white rounded-2xl shadow-lg border border-blue-200 p-4">
              <h3 className="text-gray-900 font-semibold mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2 text-blue-600" />
                People Like You 💫
              </h3>
              <div className="space-y-3">
                {members.slice(0, 3).map((member) => (
                  <div key={member.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-50 transition-all duration-200">
                    <div className="relative">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-10 h-10 rounded-full border-2 border-blue-200"
                        onError={handleImageError}
                      />
                      {member.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="font-semibold text-gray-900 truncate text-sm">{member.name}</p>
                        {member.role !== 'member' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            member.role === 'admin' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {member.role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full inline-block">{member.matchPercentage}%</p>
                      <p className="text-xs text-gray-500 mt-1">⭐ {member.reputation}</p>
                    </div>
                                         <button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white p-2 rounded-lg transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 text-blue-600 hover:text-blue-700 font-semibold text-sm bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors">
                View all members → ✨
              </button>
            </div>

            {/* Community Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-lg border border-blue-200 p-4">
              <h3 className="text-gray-900 font-semibold mb-3 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-blue-600" />
                Stats 📊
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Members</span>
                  <span className="text-gray-900 font-medium">{communityData?.memberCount ? communityData.memberCount.toLocaleString() : members.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Online</span>
                                          <span className="text-blue-600 font-medium">{members.filter(m => m.isOnline).length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Posts Today</span>
                  <span className="text-gray-900 font-medium">{posts.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Events</span>
                  <span className="text-gray-900 font-medium">{events.length}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-lg border border-blue-200 p-4">
              <h3 className="text-gray-900 font-semibold mb-3 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-blue-600" />
                Recent Activity 🔥
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-gray-700">Sarah joined the community</p>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-gray-700">New discussion about AI</p>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-gray-700">Event: Tech Meetup</p>
                </div>
                <div className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <p className="text-gray-700">5 new members this week</p>
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
        userProfile={safeUserProfile}
        onSubmit={handleCreatePost}
      />

      {/* Simple Event Creation Modal */}
      {showCreateEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create Event</h2>
              <p className="text-gray-600 mb-4">Event creation feature coming soon! This will allow you to organize meetups, workshops, and gatherings for your community.</p>
              <button
                onClick={() => setShowCreateEvent(false)}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl font-medium hover:from-blue-600 hover:to-cyan-600 transition-all duration-200"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Notifications */}
      {demoNotifications.length > 0 && (
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {demoNotifications.map((notification, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-full shadow-lg border border-blue-200 transform transition-all duration-300 hover:scale-105"
            >
              {notification}
            </div>
          ))}
        </div>
      )}


    </div>
  );
};

export default CommunityPage;
