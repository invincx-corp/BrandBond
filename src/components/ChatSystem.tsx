import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  Video, 
  MoreHorizontal, 
  ArrowLeft, 
  ArrowRight,
  Search, 
  Filter, 
  Plus, 
  X, 
  Image as ImageIcon, 
  Paperclip, 
  Smile, 
  Mic, 
  Check, 
  Clock,
  User,
  Heart,
  Star,
  MapPin,
  Calendar,
  Camera,
  Music,
  Film,
  Book,
  Coffee,
  Plane,
  Palette,
  Gamepad2,
  Dumbbell,
  Leaf,
  Zap,
  Globe,
  Smartphone,
  Watch,
  Gift,
  Sparkles,
  Utensils,
  Flag,
  BarChart3,
  CheckCheck,
  Volume2,
  Archive,
  Trash,
  Bell,
  Wifi
} from 'lucide-react';
import LiveLocationMap from './chat/LiveLocationMap';
import IntelligentAIPrompts from './IntelligentAIPrompts';
import EmojiPicker from 'emoji-picker-react';
import { UserProfile } from '../services/aiPromptService';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'voice' | 'location' | 'date-invite' | 'ai-enhanced' | 'story-reply' | 'gif' | 'file' | 'poll' | 'voice-note' | 'location-share';
  metadata?: any;
}

interface ConversationWithProfile {
  conversation: {
    id: string;
    participantIds: string[];
    lastMessage: Message;
    unreadCount: number;
    isTyping: boolean;
    isPinned: boolean;
    isMuted: boolean;
    isArchived?: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  otherProfile: {
    id: string;
    name: string;
    age: number;
    location: string;
    photos: string[];
    matchPercentage: number;
    commonInterests: string[];
    allTimeFavorites: any;
    bio: string;
    isOnline?: boolean;
    lastSeen?: Date;
  };
  messages: Message[];
}

type ChatConversation = ConversationWithProfile;

interface ChatSystemProps {
  userId: string;
  conversations: ConversationWithProfile[];
  startChatCandidates?: Array<{ id: string; name: string; age?: number; location?: string; photo_url?: string }>;
  onStartNewChat?: (otherUserId: string) => void;
  theme?: 'love' | 'friends';
  currentUserProfile?: UserProfile;
  onSendMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp' | 'status'>) => void;
  onMarkAsRead: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onBlockUser: (conversationId: string) => void;
  onReportUser: (conversationId: string) => void;
  onStartVideoCall: (conversationId: string) => void;
  onStartVoiceCall: (conversationId: string) => void;
  onShareLocation: (conversationId: string) => void;
  onSendDateInvite: (conversationId: string, dateDetails: any) => void;
  onSendAIEnhancedMessage: (conversationId: string, prompt: string) => void;
}

const ChatSystem: React.FC<ChatSystemProps> = ({
  userId,
  conversations,
  startChatCandidates = [],
  onStartNewChat,
  theme = 'love',
  currentUserProfile,
  onSendMessage,
  onMarkAsRead,
  onDeleteConversation,
  onBlockUser,
  onReportUser,
  onStartVideoCall,
  onStartVoiceCall,
  onShareLocation,
  onSendDateInvite,
  onSendAIEnhancedMessage
}) => {
  const location = useLocation();
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'online' | 'recent'>('all');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearchQuery, setNewChatSearchQuery] = useState('');
  const [showDateInviteModal, setShowDateInviteModal] = useState(false);
  const [showLiveLocationModal, setShowLiveLocationModal] = useState(false);
  const [liveLocationModalShareId, setLiveLocationModalShareId] = useState<string | null>(null);
  const [liveLocationOtherMarker, setLiveLocationOtherMarker] = useState<{ lat: number; lng: number; updatedAt: Date } | null>(null);
  const [showAIPromptsModal, setShowAIPromptsModal] = useState(false);
  const [showAIPrompts, setShowAIPrompts] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedDateInvite, setSelectedDateInvite] = useState<any>(null);
  
  // Advanced Features State
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    messageId: string;
    message: Message | null;
  }>({
    visible: false,
    x: 0,
    y: 0,
    messageId: '',
    message: null
  });

  // Message emoji picker state
  const [messageEmojiPicker, setMessageEmojiPicker] = useState<{
    visible: boolean;
    messageId: string;
    x: number;
    y: number;
  }>({
    visible: false,
    messageId: '',
    x: 0,
    y: 0
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  // Modals are controlled locally (no route syncing)

  // Context menu functions for 3-dots menu

  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      x: 0,
      y: 0,
      messageId: '',
      message: null
    });
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu.message) return;
    
    switch (action) {
      case 'reply':
        handleReplyToMessage(contextMenu.message);
        break;
      case 'forward':
        handleForwardMessage(contextMenu.message);
        break;
      case 'react-heart':
        handleAddReaction(contextMenu.message.id, '❤️');
        break;
      case 'react-thumbsup':
        handleAddReaction(contextMenu.message.id, '👍');
        break;
      case 'react-smile':
        handleAddReaction(contextMenu.message.id, '😊');
        break;
      case 'copy':
        navigator.clipboard.writeText(contextMenu.message.text);
        break;
    }
    
    closeContextMenu();
  };

  // Handle emoji selection for messages
  const handleMessageEmojiSelect = (emojiObject: any, messageId: string) => {
    handleAddReaction(messageId, emojiObject.emoji);
    setMessageEmojiPicker({
      visible: false,
      messageId: '',
      x: 0,
      y: 0
    });
  };

  // Close context menu and emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        closeContextMenu();
      }
      if (messageEmojiPicker.visible) {
        setMessageEmojiPicker({
          visible: false,
          messageId: '',
          x: 0,
          y: 0
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible, messageEmojiPicker.visible]);

  // Color scheme based on theme
  const colorScheme = theme === 'friends' ? {
    primary: 'from-blue-500 to-cyan-500',
    primaryHover: 'from-blue-600 to-cyan-600',
    secondary: 'from-blue-100 to-cyan-100',
    secondaryHover: 'from-blue-200 to-cyan-200',
    text: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-50',
    focus: 'focus:ring-blue-500',
    focusBorder: 'focus:border-blue-500'
  } : {
    primary: 'from-pink-500 to-purple-500',
    primaryHover: 'from-pink-600 to-purple-600',
    secondary: 'from-pink-100 to-purple-100',
    secondaryHover: 'from-pink-200 to-purple-200',
    text: 'text-pink-600',
    bg: 'bg-pink-100',
    border: 'border-pink-200',
    hover: 'hover:bg-pink-50',
    focus: 'focus:ring-pink-500',
    focusBorder: 'focus:border-pink-500'
  };

  // AI Chat Prompts - Now handled by IntelligentAIPrompts component
  // Legacy prompts removed in favor of personalized, intelligent prompts

  // Date Invite Templates
  const dateInviteTemplates = [
    {
      title: "Coffee & Conversation ☕",
      description: "Let's grab coffee and get to know each other better",
      icon: Coffee,
      duration: "1-2 hours",
      budget: "Low",
      vibe: "Casual & Friendly"
    },
    {
      title: "Adventure Walk 🚶‍♀️",
      description: "Explore the city together and discover hidden gems",
      icon: MapPin,
      duration: "2-3 hours",
      budget: "Free",
      vibe: "Adventurous & Fun"
    },
    {
      title: "Dinner & Stories 🍽️",
      description: "Share a meal and exchange life stories",
      icon: Utensils,
      duration: "2-3 hours",
      budget: "Medium",
      vibe: "Intimate & Meaningful"
    },
    {
      title: "Creative Workshop 🎨",
      description: "Try something new together - painting, pottery, or cooking",
      icon: Palette,
      duration: "3-4 hours",
      budget: "Medium",
      vibe: "Creative & Engaging"
    },
    {
      title: "Movie Night 🎬",
      description: "Watch a film together and discuss it over snacks",
      icon: Film,
      duration: "3-4 hours",
      budget: "Low",
      vibe: "Relaxed & Entertaining"
    },
    {
      title: "Music & Dance 🎵",
      description: "Share favorite songs and maybe dance a little",
      icon: Music,
      duration: "2-3 hours",
      budget: "Low",
      vibe: "Energetic & Fun"
    }
  ];

  // Filter conversations based on search and filter type
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.otherProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conversation.otherProfile.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (filterType) {
      case 'unread':
        return matchesSearch && conversation.conversation.unreadCount > 0;
      case 'online':
        return matchesSearch && conversation.otherProfile.isOnline;
      case 'recent':
        return matchesSearch && conversation.conversation.lastMessage.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000);
      default:
        return matchesSearch;
    }
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Deep-link support: allow parent screens to open a specific conversation.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conversationId = params.get('conversationId');
    const toUserId = params.get('to');

    const target = (() => {
      if (conversationId) {
        return conversations.find((c) => String(c.conversation.id) === String(conversationId)) || null;
      }
      if (toUserId) {
        return conversations.find((c) => String(c.otherProfile.id) === String(toUserId)) || null;
      }
      return null;
    })();

    if (!target) return;
    if (activeConversation?.conversation?.id === target.conversation.id) return;
    setActiveConversation(target);
  }, [activeConversation?.conversation?.id, conversations, location.search]);

  // Keep local activeConversation in sync with incoming prop updates (new messages, unread count, etc.).
  useEffect(() => {
    if (!activeConversation?.conversation?.id) return;
    const updated = conversations.find((c) => String(c.conversation.id) === String(activeConversation.conversation.id)) || null;
    if (!updated) return;
    setActiveConversation(updated);
  }, [activeConversation?.conversation?.id, conversations]);

  // Live location: subscribe to user_locations updates for a given shareId
  useEffect(() => {
    if (!showLiveLocationModal) return;
    if (!liveLocationModalShareId) return;

    const shareId = liveLocationModalShareId;

    const channel = supabase
      .channel(`live_location_modal_${shareId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_locations', filter: `share_id=eq.${shareId}` },
        (payload: any) => {
          const row = (payload?.new || payload?.record) as any;
          if (!row) return;
          if (row.user_id === userId) return;
          if (typeof row.lat !== 'number' || typeof row.lng !== 'number') return;
          setLiveLocationOtherMarker({ lat: row.lat, lng: row.lng, updatedAt: new Date(row.updated_at) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showLiveLocationModal, liveLocationModalShareId, userId]);

  // Handle typing indicator
  useEffect(() => {
    if (isTyping && activeConversation) {
      const timer = setTimeout(() => setIsTyping(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isTyping, activeConversation]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showThemeSelector || showAttachmentMenu || showAIPromptsModal) {
        const target = event.target as Element;
        if (!target.closest('.dropdown-container')) {
          setShowThemeSelector(false);
          setShowAttachmentMenu(false);
          setShowAIPromptsModal(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showThemeSelector, showAttachmentMenu, showAIPromptsModal]);

  // Real-time message status updates
  const updateMessageStatus = useCallback((messageId: string, status: 'sent' | 'delivered' | 'read') => {
    if (activeConversation) {
      const updatedMessages = activeConversation.messages.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      );
      setActiveConversation({ ...activeConversation, messages: updatedMessages });
    }
  }, [activeConversation]);

  // Send message function
  const handleSendMessage = useCallback(() => {
    if (messageInput.trim() && activeConversation) {
      const newMessage: Omit<Message, 'id' | 'timestamp' | 'status'> = {
        conversationId: activeConversation.conversation.id,
        senderId: userId,
        receiverId: activeConversation.otherProfile.id,
        text: messageInput.trim(),
        type: 'text'
      };

      onSendMessage(activeConversation.conversation.id, newMessage);

      setMessageInput('');
      setIsTyping(false);
    }
  }, [messageInput, activeConversation, onSendMessage, userId, updateMessageStatus]);



  const handleIntelligentPrompt = (prompt: string) => {
    if (activeConversation) {
      handleAIEnhancedMessage(activeConversation.conversation.id, prompt);
      setShowAIPromptsModal(false);
    }
  };

  // Handle date invite
  const handleDateInvite = (template: any) => {
    setSelectedDateInvite(template);
    setShowDateInviteModal(true);
  };

  // Send date invite
  const sendDateInvite = (dateDetails: any) => {
    if (activeConversation) {
      onSendDateInvite(activeConversation.conversation.id, dateDetails);
      setShowDateInviteModal(false);
      setSelectedDateInvite(null);
    }
  };

  // Handle key press for sending message
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Voice Recording Functions
  const startVoiceRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const duration = recordingTime;
        if (activeConversation) {
          // Send voice message using the existing onSendMessage
          const voiceMessage: Omit<Message, 'id' | 'timestamp' | 'status'> = {
            conversationId: activeConversation.conversation.id,
            senderId: userId,
            receiverId: activeConversation.otherProfile.id,
            text: `🎤 Voice Message (${duration}s)`,
            type: 'voice',
            metadata: { audioBlob: blob, duration }
          };
          onSendMessage(activeConversation.conversation.id, voiceMessage);
        }
        setRecordingTime(0);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      mediaRecorder.onstop = () => {
        clearInterval(timer);
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const duration = recordingTime;
        if (activeConversation) {
          const voiceMessage: Omit<Message, 'id' | 'timestamp' | 'status'> = {
            conversationId: activeConversation.conversation.id,
            senderId: userId,
            receiverId: activeConversation.otherProfile.id,
            text: `🎤 Voice Message (${duration}s)`,
            type: 'voice',
            metadata: { audioBlob: blob, duration }
          };
          onSendMessage(activeConversation.conversation.id, voiceMessage);
        }
        setRecordingTime(0);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [activeConversation, onSendMessage, userId, recordingTime]);

  const stopVoiceRecording = useCallback(() => {
    // This will be handled by the onstop event
    setIsRecording(false);
  }, []);

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Get interest icon
  const getInterestIcon = (interest: string) => {
    const iconMap: { [key: string]: any } = {
      'Music': Music,
      'Movies': Film,
      'Books': Book,
      'Travel': Plane,
      'Food': Coffee,
      'Art': Palette,
      'Gaming': Gamepad2,
      'Fitness': Dumbbell,
      'Nature': Leaf,
      'Technology': Zap,
      'Culture': Globe,
      'Fashion': Watch,
      'Sports': Dumbbell,
      'Photography': Camera,
      'Cooking': Coffee,
      'Dancing': Music,
      'Writing': Book,
      'Meditation': Leaf,
      'Volunteering': Heart,
      'Learning': Book
    };
    return iconMap[interest] || Star;
  };

  // Advanced Chat Features Handlers
  const handleAddReaction = useCallback((messageId: string, emoji: string) => {
    if (activeConversation) {
      const updatedMessages = activeConversation.messages.map(msg => {
        if (msg.id === messageId) {
          const message = { ...msg };
          if (!message.metadata) message.metadata = {};
          if (!message.metadata.reactions) message.metadata.reactions = [];
          
          // Check if user already reacted with this emoji
          const existingReactionIndex = message.metadata.reactions.findIndex(
            (r: any) => r.userId === userId && r.emoji === emoji
          );
          
          if (existingReactionIndex >= 0) {
            // Remove reaction if already exists
            message.metadata.reactions.splice(existingReactionIndex, 1);
          } else {
            // Add new reaction
            message.metadata.reactions.push({
              userId,
              emoji,
              timestamp: new Date()
            });
          }
          
          return message;
        }
        return msg;
      });
      
      setActiveConversation({ ...activeConversation, messages: updatedMessages });
    }
  }, [activeConversation, userId]);

  const handleReplyToMessage = useCallback((message: Message) => {
    if (activeConversation) {
      setMessageInput(`Replying to: ${message.text} `);
      messageInputRef.current?.focus();
    }
  }, [activeConversation]);

  const handleForwardMessage = useCallback((message: Message) => {
    // This would typically open a conversation selector
    // For now, we'll just show an alert
    alert(`Forwarding message: ${message.text}`);
  }, []);

  const handleStartChatWith = useCallback(
    (otherUserId: string) => {
      if (!otherUserId) return;
      onStartNewChat?.(otherUserId);
      setShowNewChatModal(false);
      setNewChatSearchQuery('');
    },
    [onStartNewChat]
  );

  // Real-time typing indicator (handled by Supabase broadcast/presence in ChatContext)
  const handleTypingStart = useCallback(() => {
    // no-op
  }, []);







  // Conversation Management Handlers
  const handleTogglePin = useCallback((conversationId: string) => {
    const conversation = conversations.find(c => c.conversation.id === conversationId);
    if (conversation) {
      conversation.conversation.isPinned = !conversation.conversation.isPinned;
      // Force re-render
      setActiveConversation(activeConversation ? { ...activeConversation } : null);
    }
  }, [conversations, activeConversation]);

  const handleToggleMute = useCallback((conversationId: string) => {
    const conversation = conversations.find(c => c.conversation.id === conversationId);
    if (conversation) {
      conversation.conversation.isMuted = !conversation.conversation.isMuted;
      // Force re-render
      setActiveConversation(activeConversation ? { ...activeConversation } : null);
    }
  }, [conversations, activeConversation]);

  const handleArchiveConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(c => c.conversation.id === conversationId);
    if (conversation) {
      conversation.conversation.isArchived = !conversation.conversation.isArchived;
      // Force re-render
      setActiveConversation(activeConversation ? { ...activeConversation } : null);
    }
  }, [conversations, activeConversation]);

  // Real-time conversation actions
  const handleDeleteConversation = useCallback((conversationId: string) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      onDeleteConversation(conversationId);
      if (activeConversation?.conversation.id === conversationId) {
        setActiveConversation(null);
      }
    }
  }, [activeConversation, onDeleteConversation]);

  const handleBlockUser = useCallback((conversationId: string) => {
    if (window.confirm('Are you sure you want to block this user?')) {
      onBlockUser(conversationId);
      if (activeConversation?.conversation.id === conversationId) {
        setActiveConversation(null);
      }
    }
  }, [activeConversation, onBlockUser]);

  const handleReportUser = useCallback((conversationId: string) => {
    if (window.confirm('Are you sure you want to report this user?')) {
      onReportUser(conversationId);
    }
  }, [onReportUser]);

  // Real-time call handling
  const handleStartVideoCall = useCallback((conversationId: string) => {
    onStartVideoCall(conversationId);
  }, [onStartVideoCall]);

  const handleStartVoiceCall = useCallback((conversationId: string) => {
    onStartVoiceCall(conversationId);
  }, [onStartVoiceCall]);

  // Real-time location sharing
  const handleShareLocation = useCallback(async (conversationId: string) => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const locationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: new Date().toISOString()
            };
            onShareLocation(conversationId);
            // Add location message to chat
            if (activeConversation) {
              const locationMessage: Message = {
                id: `loc_${Date.now()}`,
                conversationId,
                senderId: userId,
                receiverId: activeConversation.otherProfile.id,
                text: `📍 Shared location: ${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`,
                timestamp: new Date(),
                status: 'sent',
                type: 'location',
                metadata: locationData
              };
              const updatedMessages = [...activeConversation.messages, locationMessage];
              setActiveConversation({ ...activeConversation, messages: updatedMessages });
            }
          },
          (error) => {
            alert('Unable to get your location. Please check your permissions.');
          }
        );
      } else {
        alert('Geolocation is not supported by this browser.');
      }
    } catch (error) {
      alert('Error sharing location. Please try again.');
    }
  }, [activeConversation, userId, onShareLocation]);

  // AI enhanced messaging (persisted by parent; realtime insert will render it)
  const handleAIEnhancedMessage = useCallback((conversationId: string, prompt: string) => {
    onSendAIEnhancedMessage(conversationId, prompt);
  }, [onSendAIEnhancedMessage]);

  return (
    <div className="flex h-full w-full">
            {/* Chat List Sidebar - Clean, Balanced Design */}
      <div className={`${activeConversation ? 'hidden sm:flex' : 'flex'} w-full sm:w-80 lg:w-96 bg-white border-r ${colorScheme.border} flex-col h-full`}>
        {/* Clean Header with Proper Visual Hierarchy */}
        <div className="p-2 sm:p-3 border-b border-gray-200 bg-white">
          {/* Title and New Chat Button */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r ${colorScheme.primary} flex items-center justify-center shadow-sm`}>
                <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-800">Messages</h2>
              </div>
            </div>
            
            <button
              onClick={() => {
                setShowNewChatModal(true);
              }}
              className={`p-1.5 sm:p-2 bg-gradient-to-r ${colorScheme.primary} text-white rounded-lg hover:shadow-md transition-all duration-200 shadow-sm`}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
          
          {/* Clean Search Bar */}
          <div className="relative mb-2 sm:mb-3">
            <Search className="absolute left-2 sm:left-2.5 top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 sm:pl-8 pr-2 sm:pr-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 bg-white text-xs sm:text-sm"
            />
          </div>
          
          {/* Balanced Filter Tabs */}
          <div className="flex space-x-1 sm:space-x-1.5">
            {[
              { key: 'all', label: 'All', count: conversations.length },
              { key: 'unread', label: 'Unread', count: conversations.filter(c => c.conversation.unreadCount > 0).length },
              { key: 'online', label: 'Online', count: conversations.filter(c => c.otherProfile.isOnline).length },
              { key: 'recent', label: 'Recent', count: conversations.filter(c => c.conversation.lastMessage.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)).length }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key as any)}
                className={`flex-1 py-1 sm:py-1.5 px-1.5 sm:px-2 text-[10px] sm:text-xs font-medium rounded-md transition-all duration-200 ${
                  filterType === filter.key
                    ? `bg-gradient-to-r ${colorScheme.primary} text-white shadow-sm`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="inline text-[10px] sm:text-xs">{filter.label}</span>
                <span className="inline text-[10px] sm:text-xs ml-0.5 sm:ml-1 opacity-75">({filter.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List with Clean Card Design */}
        <div className="flex-1 overflow-y-auto">
          {(() => {
            // Real-time filtering logic
            let filtered = conversations;
            
            // Search filter
            if (searchQuery.trim()) {
              filtered = filtered.filter(conversation =>
                conversation.otherProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                conversation.otherProfile.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                conversation.otherProfile.commonInterests.some(interest => 
                  interest.toLowerCase().includes(searchQuery.toLowerCase())
                ) ||
                (conversation.conversation.lastMessage && 
                 conversation.conversation.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase()))
              );
            }
            
            // Type filter
            switch (filterType) {
              case 'unread':
                filtered = filtered.filter(c => c.conversation.unreadCount > 0);
                break;
              case 'online':
                filtered = filtered.filter(c => c.otherProfile.isOnline);
                break;
              case 'recent':
                filtered = filtered.filter(c => 
                  c.conversation.lastMessage.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
                );
                break;
              default:
                break;
            }
            
            // Sort by pinned first, then by last message time
            filtered.sort((a, b) => {
              if (a.conversation.isPinned && !b.conversation.isPinned) return -1;
              if (!a.conversation.isPinned && b.conversation.isPinned) return 1;
              return new Date(b.conversation.lastMessage.timestamp).getTime() - 
                     new Date(a.conversation.lastMessage.timestamp).getTime();
            });
            
            return filtered;
          })().length === 0 ? (
            /* Show nothing when no conversations - clean empty state */
            <div className="hidden">
              {/* Empty state - no content shown */}
            </div>
          ) : (
            (() => {
              // Real-time filtering logic
              let filtered = conversations;
              
              // Search filter
              if (searchQuery.trim()) {
                filtered = filtered.filter(conversation =>
                  conversation.otherProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  conversation.otherProfile.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  conversation.otherProfile.commonInterests.some(interest => 
                    interest.toLowerCase().includes(searchQuery.toLowerCase())
                  ) ||
                  (conversation.conversation.lastMessage && 
                   conversation.conversation.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase()))
                );
              }
              
              // Type filter
              switch (filterType) {
                case 'unread':
                  filtered = filtered.filter(c => c.conversation.unreadCount > 0);
                  break;
                case 'online':
                  filtered = filtered.filter(c => c.otherProfile.isOnline);
                  break;
                case 'recent':
                  filtered = filtered.filter(c => 
                    c.conversation.lastMessage.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
                  );
                  break;
                default:
                  break;
              }
              
              // Sort by pinned first, then by last message time
              filtered.sort((a, b) => {
                if (a.conversation.isPinned && !b.conversation.isPinned) return -1;
                if (!a.conversation.isPinned && b.conversation.isPinned) return 1;
                return new Date(b.conversation.lastMessage.timestamp).getTime() - 
                       new Date(a.conversation.lastMessage.timestamp).getTime();
              });
              
              return filtered;
            })().map(conversation => (
              <div
                key={conversation.conversation.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setActiveConversation(conversation);
                  if (conversation.conversation.unreadCount > 0) {
                    onMarkAsRead(conversation.conversation.id);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveConversation(conversation);
                    if (conversation.conversation.unreadCount > 0) {
                      onMarkAsRead(conversation.conversation.id);
                    }
                  }
                }}
                className={`group w-full text-left p-1 sm:p-1.5 border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                  activeConversation?.conversation.id === conversation.conversation.id ? 'bg-pink-50 border-pink-200' : ''
                }`}
              >
                <div className="flex items-start space-x-1.5 sm:space-x-2">
                  {/* Profile Picture with Clean Status */}
                  <div className="relative flex-shrink-0">
                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden border-2 ${
                      conversation.otherProfile.isOnline ? 'border-green-400' : 'border-gray-200'
                    }`}>
                      <img
                        src={conversation.otherProfile.photos[0]}
                        alt={conversation.otherProfile.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                    {conversation.otherProfile.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                    )}

      {/* Live Location Modal */}
      {showLiveLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className={`p-4 sm:p-5 border-b ${colorScheme.border} flex items-center justify-between`}> 
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate">Live Location</h3>
                <p className="text-xs text-gray-500 truncate">Updates in real time until sharing is stopped</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    // Stop only stops if you are the sharer (enforced by RLS)
                    if (activeConversation) onShareLocation(activeConversation.conversation.id);
                  }}
                  className="hidden"
                />
                <button
                  onClick={() => {
                    setShowLiveLocationModal(false);
                    setLiveLocationModalShareId(null);
                    setLiveLocationOtherMarker(null);
                  }}
                  className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                  title="Close"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-3 sm:p-4 flex-1 min-h-[320px]">
              <div className="w-full h-[55vh] min-h-[320px]">
                <LiveLocationMap
                  center={
                    liveLocationOtherMarker
                      ? { lng: liveLocationOtherMarker.lng, lat: liveLocationOtherMarker.lat }
                      : { lng: 77.209, lat: 28.6139 }
                  }
                  marker={liveLocationOtherMarker ? { lng: liveLocationOtherMarker.lng, lat: liveLocationOtherMarker.lat } : undefined}
                />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  {liveLocationOtherMarker?.updatedAt
                    ? `Last update: ${liveLocationOtherMarker.updatedAt.toLocaleTimeString()}`
                    : 'Waiting for location updates...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
                  </div>
                  
                  {/* Conversation Details - Clean Layout */}
                  <div className="flex-1 min-w-0">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-800 text-xs sm:text-sm truncate">
                          {conversation.otherProfile.name}
                        </h3>
                        <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold text-white bg-gradient-to-r ${colorScheme.primary}`}>
                          {conversation.otherProfile.matchPercentage}%
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-1 sm:px-1.5 py-0.5 rounded-full">
                        {formatTimestamp(conversation.conversation.lastMessage.timestamp)}
                      </span>
                    </div>
                    
                    {/* Match Info Row */}
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center space-x-1 sm:space-x-1.5">
                        <span className="bg-blue-50 text-blue-700 px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium">
                          {conversation.otherProfile.age}
                        </span>
                        <span className="bg-purple-50 text-purple-700 px-1 sm:px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium">
                          {conversation.otherProfile.location}
                        </span>
                      </div>
                    </div>
                    
                    {/* Last Message */}
                    {conversation.conversation.lastMessage && (
                      <div className="bg-gray-50 rounded p-0.5 sm:p-1 mb-0.5 border border-gray-100">
                        <p className="text-[10px] sm:text-xs text-gray-700 truncate">
                          {conversation.conversation.lastMessage.text}
                        </p>
                      </div>
                    )}
                    
                    {/* Common Interests Tags with Unread Badge */}
                    <div className="flex items-center justify-between mb-0.5">
                      {conversation.otherProfile.commonInterests && conversation.otherProfile.commonInterests.length > 0 && (
                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                          {conversation.otherProfile.commonInterests.slice(0, 3).map((interest, index) => {
                            const IconComponent = getInterestIcon(interest);
                            return (
                              <span key={index} className="flex items-center space-x-0.5 sm:space-x-1 px-1 sm:px-1.5 py-0.5 bg-gray-100 text-[10px] sm:text-xs text-gray-600 rounded">
                                <IconComponent className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                <span>{interest}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Unread Badge - Inline with Common Interests */}
                      {conversation.conversation.unreadCount > 0 && (
                        <div className={`${theme === 'friends' ? 'bg-blue-500' : 'bg-pink-500'} text-white text-[10px] sm:text-xs font-semibold rounded-full px-1 sm:px-1.5 py-0.5 min-w-[16px] sm:min-w-[18px] text-center flex-shrink-0`}>
                          {conversation.conversation.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action Bar - Clean and Subtle */}
                <div className="flex items-center justify-between mt-0.5 pt-0.5 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <div className="flex items-center space-x-1 sm:space-x-1.5">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePin(conversation.conversation.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleTogglePin(conversation.conversation.id);
                        }
                      }}
                      className={`p-0.5 sm:p-1 rounded-md transition-colors duration-200 ${
                        conversation.conversation.isPinned 
                          ? 'text-yellow-500 hover:bg-yellow-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={conversation.conversation.isPinned ? 'Unpin' : 'Pin'}
                    >
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </span>
                    
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMute(conversation.conversation.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleMute(conversation.conversation.id);
                        }
                      }}
                      className={`p-0.5 sm:p-1 rounded-md transition-colors duration-200 ${
                        conversation.conversation.isMuted 
                          ? 'text-red-500 hover:bg-red-50' 
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={conversation.conversation.isMuted ? 'Unmute' : 'Mute'}
                    >
                      <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-1 sm:space-x-1.5">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveConversation(conversation.conversation.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleArchiveConversation(conversation.conversation.id);
                        }
                      }}
                      className="p-0.5 sm:p-1 text-gray-400 hover:bg-gray-50 rounded-md transition-colors duration-200"
                      title="Archive"
                    >
                      <Archive className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </span>
                    
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.conversation.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDeleteConversation(conversation.conversation.id);
                        }
                      }}
                      className="p-0.5 sm:p-1 text-red-400 hover:bg-gray-50 rounded-md transition-colors duration-200"
                      title="Delete"
                    >
                      <Trash className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area - Only show when conversation is active */}
          {activeConversation ? (
        <div className="flex-1 flex flex-col min-h-0 w-full">
          {/* Header - Mobile Responsive */}
          <div className={`bg-white/80 backdrop-blur-sm border-b ${colorScheme.border} px-2 sm:px-3 md:px-4 lg:px-4 xl:px-5 py-2 sm:py-3 md:py-3 lg:py-3 xl:py-4 flex-shrink-0`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className={`p-1.5 sm:p-2 md:p-2.5 lg:p-2.5 xl:p-3 ${colorScheme.hover} rounded-full transition-colors duration-200 flex-shrink-0`}
                  >
                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                  </button>
                  
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 ${colorScheme.border} flex-shrink-0`}>
                    <img
                      src={activeConversation.otherProfile.photos[0]}
                      alt={activeConversation.otherProfile.name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  
                  <div className="min-w-0 flex-1 ml-2 sm:ml-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-800 text-sm sm:text-base md:text-lg truncate">{activeConversation.otherProfile.name}</h3>
                      <span className={`text-[10px] sm:text-xs ${colorScheme.text} font-medium px-1.5 py-0.5 rounded bg-gradient-to-r ${colorScheme.primary} text-white`}>
                        {activeConversation.otherProfile.matchPercentage}%
                      </span>
                    </div>
                    {/* Mobile: Stacked Layout, Desktop: Side by Side */}
                    <div className="sm:hidden space-y-0.5">
                      <div className="text-[10px] sm:text-xs text-gray-500">
                        <span>{activeConversation.otherProfile.age}</span>
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500">
                        <span>{activeConversation.otherProfile.location}</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                      <span>{activeConversation.otherProfile.age}</span>
                      <span>•</span>
                      <span>{activeConversation.otherProfile.location}</span>
                      <span>•</span>
                    <span className={`${colorScheme.text} font-medium`}>{activeConversation.otherProfile.matchPercentage}%</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Mobile Responsive */}
                <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-2 lg:space-x-3 flex-shrink-0">
                <button
                  onClick={() => handleStartVoiceCall(activeConversation.conversation.id)}
                    className={`p-1 sm:p-1.5 md:p-2 lg:p-2.5 xl:p-3 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                  title="Voice Call"
                >
                    <Phone className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${colorScheme.text}`} />
                </button>
                
                <button
                  onClick={() => handleStartVideoCall(activeConversation.conversation.id)}
                    className={`p-1 sm:p-1.5 md:p-2 lg:p-2.5 xl:p-3 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                  title="Video Call"
                >
                    <Video className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${colorScheme.text}`} />
                </button>
                
                {/* AI Prompts button - Always visible */}
                <button
                  onClick={() => setShowAIPrompts(!showAIPrompts)}
                  className={`p-1 sm:p-1.5 md:p-2 lg:p-2.5 xl:p-3 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                  title="AI Chat Prompts"
                >
                  <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${colorScheme.text}`} />
                </button>
                

                
                <button
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className={`p-1 sm:p-1.5 md:p-2 ${colorScheme.hover} rounded-full transition-colors duration-200 relative`}
                  title="More Options"
                >
                  <MoreHorizontal className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colorScheme.text}`} />
                  
                  {/* Attachment Menu */}
                  {showAttachmentMenu && (
                    <div className={`absolute right-0 top-full mt-2 w-32 sm:w-40 md:w-48 lg:w-56 bg-white rounded-lg shadow-lg border ${colorScheme.border} z-10 dropdown-container`}>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowAttachmentMenu(false);
                            setShowDateInviteModal(true);
                          }}
                          className={`w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs md:text-sm text-gray-700 ${colorScheme.hover} flex items-center space-x-1.5 sm:space-x-2`}
                        >
                          <Calendar className={`w-3 h-3 sm:w-4 sm:h-4 ${colorScheme.text}`} />
                          <span>Send Date Invite</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowAttachmentMenu(false);
                            if (activeConversation) onShareLocation(activeConversation.conversation.id);
                          }}
                          className={`w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs md:text-sm text-gray-700 ${colorScheme.hover} flex items-center space-x-1.5 sm:space-x-2`}
                        >
                          <MapPin className={`w-3 h-3 sm:w-4 sm:h-4 ${colorScheme.text}`} />
                          <span>Share Location</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowAttachmentMenu(false);
                            if (activeConversation) onBlockUser(activeConversation.conversation.id);
                          }}
                          className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs md:text-sm text-gray-700 hover:bg-pink-50 flex items-center space-x-1.5 sm:space-x-2"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                          <span>Block User</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowAttachmentMenu(false);
                            if (activeConversation) onReportUser(activeConversation.conversation.id);
                          }}
                          className="w-full px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-left text-[10px] sm:text-xs md:text-sm text-gray-700 hover:bg-red-50 flex items-center space-x-1.5 sm:space-x-2"
                        >
                          <Flag className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                          <span>Report User</span>
                        </button>
                      </div>
                    </div>
                  )}
                </button>
              </div>
              </div>
          </div>



          {/* Messages Area - Proper height without unnecessary scrolling */}
          <div className="flex-1 overflow-y-auto scrollbar-hide px-1.5 sm:px-2 md:px-4 lg:px-6 xl:px-8 py-1.5 sm:py-2 md:py-3 lg:py-4 xl:py-6 space-y-1.5 sm:space-y-2 md:space-y-3 lg:space-y-4 xl:space-y-5 chat-messages-container relative">
            {activeConversation.messages.map((message) => (
                              <div
                  key={message.id}
                  className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
                >
                <div className={`max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[75%] xl:max-w-[70%] 2xl:max-w-[65%] group h-auto min-h-0 message-card ${
                  message.senderId === userId 
                    ? `bg-gradient-to-r ${colorScheme.primary} text-white` 
                    : `bg-white text-gray-800 border ${colorScheme.border}`
                } rounded-xl px-1.5 sm:px-2 md:px-3 lg:px-4 xl:px-5 py-1 sm:py-1.5 md:py-2 lg:py-3 xl:py-4 shadow-sm`}>
                  {/* Message Text - Dynamic height based on content */}
                  <div className="h-auto min-h-0">
                    {message.type === 'location-share' && message.metadata?.shareId ? (
                      <div className="space-y-2">
                        <div className="text-[10px] sm:text-xs md:text-sm lg:text-base break-words leading-relaxed whitespace-pre-wrap chat-message-text max-w-none">
                          {message.text || '📍 Live location'}
                        </div>
                        <button
                          onClick={() => {
                            setLiveLocationModalShareId(message.metadata.shareId);
                            setShowLiveLocationModal(true);
                          }}
                          className={`w-full px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold ${message.senderId === userId ? 'bg-white/20 hover:bg-white/30' : `${colorScheme.hover}`} transition-colors`}
                        >
                          Open Live Location
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] sm:text-xs md:text-sm lg:text-base break-words leading-relaxed whitespace-pre-wrap chat-message-text max-w-none">{message.text}</p>
                    )}
                  </div>
                  
                  {/* Message Status - Only show if there's content */}
                  <div className={`flex items-center justify-end mt-0.5 sm:mt-1 md:mt-1.5 ${
                    message.senderId === userId ? `${theme === 'friends' ? 'text-blue-100' : 'text-pink-100'}` : 'text-gray-400'
                  }`}>
                    {/* Right side - Status only */}
                    {message.senderId === userId && (
                      <div className="flex items-center space-x-0.5 sm:space-x-1 md:space-x-1.5">
                        {message.status === 'sending' && <Clock className="w-2.5 h-2.5 sm:w-3 h-3 md:w-3.5 md:h-3.5" />}
                        {message.status === 'sent' && <Check className="w-2.5 h-2.5 sm:w-3 h-3 md:w-3.5 md:h-3.5" />}
                        {message.status === 'delivered' && <CheckCheck className="w-2.5 h-2.5 sm:w-3 h-3 md:w-3.5 md:h-3.5" />}
                        {message.status === 'read' && <CheckCheck className="w-2.5 h-2.5 sm:w-3 h-3 md:w-3.5 md:h-3.5 text-blue-400" />}
                      </div>
                    )}
                  </div>
                  
                  {/* Bottom Line - Emoji Picker, 3-dots Menu, and Timestamp */}
                  <div className="flex items-center justify-between mt-0.5">
                    {/* Left side - Emoji Picker and 3-dots Menu */}
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const button = e.currentTarget;
                          const messageCard = button.closest('.message-card');
                          if (messageCard) {
                            const cardRect = messageCard.getBoundingClientRect();
                            const chatContainer = document.querySelector('.chat-messages-container');
                            if (chatContainer) {
                              const containerRect = chatContainer.getBoundingClientRect();
                              setMessageEmojiPicker({
                                visible: true,
                                messageId: message.id,
                                x: cardRect.left - containerRect.left + cardRect.width / 2,
                                y: cardRect.top - containerRect.top - 10
                              });
                            }
                          }
                        }}
                        className="p-1 sm:p-1.5 hover:bg-white/20 rounded-full transition-colors duration-200 opacity-70 hover:opacity-100"
                        title="Add emoji reaction"
                      >
                        <Smile className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const button = e.currentTarget;
                          const messageCard = button.closest('.messageCard');
                          if (messageCard) {
                            const cardRect = messageCard.getBoundingClientRect();
                            const chatContainer = document.querySelector('.chat-messages-container');
                            if (chatContainer) {
                              const containerRect = chatContainer.getBoundingClientRect();
                              setContextMenu({
                                visible: true,
                                x: cardRect.left - containerRect.left + cardRect.width / 2,
                                y: cardRect.top - containerRect.top - 10,
                                messageId: message.id,
                                message: message
                              });
                            }
                          }
                        }}
                        className="p-0.5 sm:p-1 hover:bg-white/20 rounded-full transition-colors duration-200 opacity-60 hover:opacity-100"
                        title="More options"
                      >
                        <MoreHorizontal className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>

                    {/* Right side - Timestamp */}
                    <span className={`text-[10px] sm:text-xs md:text-sm ${
                      message.senderId === userId ? `${theme === 'friends' ? 'text-blue-100' : 'text-pink-100'}` : 'text-gray-400'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {activeConversation.conversation.isTyping && (
              <div className="flex justify-start">
                <div className={`bg-white border ${colorScheme.border} rounded-2xl px-2 sm:px-3 md:px-4 lg:px-5 py-2 sm:py-2.5 md:py-3 lg:py-3.5 shadow-sm`}>
                  <div className="flex items-center space-x-1 sm:space-x-1.5">
                    <div className="flex space-x-0.5 sm:space-x-1 md:space-x-1.5">
                      <div className={`w-1.5 h-1.5 sm:w-2 h-2 md:w-2.5 md:h-2.5 ${theme === 'friends' ? 'bg-blue-400' : 'bg-pink-400'} rounded-full animate-bounce`}></div>
                      <div className={`w-1.5 h-1.5 sm:w-2 h-2 md:w-2.5 md:h-2.5 ${theme === 'friends' ? 'bg-blue-400' : 'bg-pink-400'} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
                      <div className={`w-1.5 h-1.5 sm:w-2 h-2 md:w-2.5 md:h-2.5 ${theme === 'friends' ? 'bg-blue-400' : 'bg-pink-400'} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-[10px] sm:text-xs md:text-sm text-gray-500 ml-1.5 sm:ml-2 md:ml-2.5">typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Message Input with Advanced Features - Mobile Responsive */}
          <div className={`bg-white/80 backdrop-blur-sm border-t ${colorScheme.border} px-2 sm:px-3 md:px-4 lg:px-4 xl:px-6 py-1.5 sm:py-2 md:py-2.5 lg:py-3 xl:py-3.5 flex-shrink-0`}>
                        {/* Main Input Row - Properly Distributed Layout */}
            <div className="flex items-center justify-between w-full">
              {/* Left Section - Emoji and Voice */}
              <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-1.5 sm:p-1 md:p-1.5 lg:p-1.5 xl:p-2 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                title="Emoji"
              >
                  <Smile className={`w-4 h-4 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ${colorScheme.text}`} />
              </button>
              
              <button
                onMouseDown={startVoiceRecording}
                onMouseUp={stopVoiceRecording}
                onTouchStart={startVoiceRecording}
                onTouchEnd={stopVoiceRecording}
                  className={`p-1.5 sm:p-1 md:p-1.5 lg:p-1.5 xl:p-2 rounded-full transition-all duration-200 ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : `${colorScheme.hover} ${colorScheme.text}`
                }`}
                title={isRecording ? 'Recording... Release to send' : 'Hold to record voice message'}
              >
                  <Mic className="w-4 h-4 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
              </button>
              </div>
              
              {/* Center Section - Message Input */}
              <div className="flex-1 mx-3 sm:mx-4 md:mx-6">
                <div className="relative max-w-full">
                <input
                  ref={messageInputRef}
                  type="text"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => {
                    setMessageInput(e.target.value);
                    if (e.target.value.length > 0) {
                      handleTypingStart();
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsTyping(true)}
                    className={`w-full px-3 sm:px-4 md:px-4 lg:px-5 xl:px-6 py-2 sm:py-2.5 md:py-2.5 lg:py-2.5 xl:py-3 border ${colorScheme.border} rounded-full focus:ring-2 ${colorScheme.focus} focus:border-transparent bg-white/80 text-sm sm:text-base md:text-base lg:text-lg`}
                />
                
                {/* Typing Indicator */}
                {isTyping && (
                    <div className={`absolute -top-6 sm:-top-7 md:-top-8 left-0 ${colorScheme.bg} ${colorScheme.text} text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-full`}>
                    typing...
                  </div>
                )}
                </div>
              </div>
              
              {/* Right Section - Send and Attachments */}
              <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                  className={`p-1.5 sm:p-1 md:p-1.5 lg:p-1.5 xl:p-2 bg-gradient-to-r ${colorScheme.primary} text-white rounded-full hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Send Message"
              >
                  <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" />
                </button>
                
                <button
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  className={`p-1.5 sm:p-1 md:p-1.5 lg:p-1.5 xl:p-2 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                  title="Attachments & More"
                >
                  <Paperclip className="w-4 h-4 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ${colorScheme.text}" />
                </button>
              </div>
            </div>
            
            {/* Voice Recording Timer */}
            {isRecording && (
              <div className="mt-1 sm:mt-1.5 md:mt-2 text-center">
                <div className="inline-flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 bg-red-100 text-red-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs">
                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 md:w-2 md:h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Recording... {recordingTime}s</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty State - Show nothing when no conversations */
        <div className="hidden">
          {/* Empty state - no content shown */}
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className={`p-4 sm:p-6 border-b ${colorScheme.border}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Start a new chat</h3>
                <button
                  onClick={() => {
                    setShowNewChatModal(false);
                    setNewChatSearchQuery('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="mt-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={newChatSearchQuery}
                    onChange={(e) => setNewChatSearchQuery(e.target.value)}
                    placeholder="Search your matches..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-4">
              {(() => {
                const q = newChatSearchQuery.trim().toLowerCase();
                const items = (startChatCandidates || [])
                  .filter((c) => c?.id && c.id !== userId)
                  .filter((c) => {
                    if (!q) return true;
                    return (
                      (c.name || '').toLowerCase().includes(q) ||
                      (c.location || '').toLowerCase().includes(q)
                    );
                  });

                if (!items.length) {
                  return (
                    <div className="text-center py-8 text-sm text-gray-600">
                      No matches found.
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {items.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => handleStartChatWith(c.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleStartChatWith(c.id);
                          }
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {c.photo_url ? (
                            <img
                              src={c.photo_url}
                              alt={c.name}
                              className="w-full h-full object-cover"
                              crossOrigin="anonymous"
                            />
                          ) : (
                            <User className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="font-semibold text-gray-800 text-sm truncate">{c.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {typeof c.age === 'number' && c.age > 0 ? `${c.age}` : ''}
                            {typeof c.age === 'number' && c.age > 0 && c.location ? ' • ' : ''}
                            {c.location || ''}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* AI Prompts Modal - Now handled by IntelligentAIPrompts component */}
      {showAIPromptsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className={`p-4 sm:p-5 md:p-6 border-b ${colorScheme.border}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">AI Chat Prompts</h3>
                <button
                  onClick={() => setShowAIPromptsModal(false)}
                  className={`p-1.5 sm:p-2 md:p-2.5 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                >
                  <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-xs sm:text-sm md:text-base text-gray-600 mt-2 sm:mt-3">
                This feature has been upgraded to intelligent, personalized prompts that appear in each chat window.
              </p>
              <div className="mt-3 sm:mt-4 p-3 sm:p-3.5 md:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-800">
                  <strong>New Feature:</strong> AI prompts are now personalized for each conversation based on your shared interests and preferences. 
                  Look for the "Smart Chat Starters" section in your active chat window!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Invite Modal */}
      {showDateInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`p-4 sm:p-6 border-b ${colorScheme.border}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Send Date Invite</h3>
                <button
                  onClick={() => setShowDateInviteModal(false)}
                  className={`p-1.5 sm:p-2 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {dateInviteTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateInvite(template)}
                    className={`p-3 sm:p-4 text-left border rounded-xl transition-all duration-200 ${
                      selectedDateInvite?.title === template.title
                        ? `${colorScheme.border.replace('border-200', 'border-500')} ${colorScheme.bg}`
                        : `${colorScheme.border} hover:${colorScheme.border.replace('border-200', 'border-400')} ${colorScheme.hover}`
                    }`}
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <template.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colorScheme.text}`} />
                      <div>
                        <h4 className="font-medium text-gray-800 text-sm sm:text-base">{template.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600">{template.description}</p>
                        <div className="flex items-center space-x-2 sm:space-x-4 mt-2 text-xs text-gray-500">
                          <span>{template.duration}</span>
                          <span>{template.budget}</span>
                          <span>{template.vibe}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              {selectedDateInvite && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <input
                      type="date"
                      placeholder="Date"
                      className={`px-3 sm:px-4 py-2 border ${colorScheme.border} rounded-lg focus:ring-2 ${colorScheme.focus} focus:border-transparent text-sm sm:text-base`}
                    />
                    <input
                      type="time"
                      placeholder="Time"
                      className={`px-3 sm:px-4 py-2 border ${colorScheme.border} rounded-lg focus:ring-2 ${colorScheme.focus} focus:border-transparent text-sm sm:text-base`}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    className={`w-full px-3 sm:px-4 py-2 border ${colorScheme.border} rounded-lg focus:ring-2 ${colorScheme.focus} focus:border-transparent text-sm sm:text-base`}
                  />
                  <textarea
                    placeholder="Personal message (optional)"
                    rows={3}
                    className={`w-full px-3 sm:px-4 py-2 border ${colorScheme.border} rounded-lg focus:ring-2 ${colorScheme.focus} focus:border-transparent text-sm sm:text-base`}
                  />
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      onClick={() => setShowDateInviteModal(false)}
                      className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 border ${colorScheme.border} text-gray-700 rounded-lg ${colorScheme.hover} transition-colors duration-200 text-sm sm:text-base`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => sendDateInvite({})}
                      className={`flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r ${colorScheme.primary} text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm sm:text-base`}
                    >
                      Send Invite
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Emoji Picker */}
      {messageEmojiPicker.visible && (
        <div 
          className="absolute z-50"
          style={{ 
            left: messageEmojiPicker.x, 
            top: messageEmojiPicker.y,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
            <EmojiPicker
              onEmojiClick={(emojiObject) => handleMessageEmojiSelect(emojiObject, messageEmojiPicker.messageId)}
              width={280}
              height={350}
              searchDisabled={false}
              skinTonesDisabled={false}
              lazyLoadEmojis={true}
              previewConfig={{
                showPreview: false
              }}
              searchPlaceholder="Search emojis..."
            />
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu.visible && (
        <div 
          className="absolute z-50 bg-white rounded-lg shadow-2xl border border-gray-200 py-1 min-w-[180px]"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            transform: 'translateX(-50%)'
          }}
        >
          <button
            onClick={() => handleContextMenuAction('reply')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Reply</span>
          </button>
          <button
            onClick={() => handleContextMenuAction('forward')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Forward</span>
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => handleContextMenuAction('react-heart')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <span>❤️ React with Heart</span>
          </button>
          <button
            onClick={() => handleContextMenuAction('react-thumbsup')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <span>👍 React with Thumbs Up</span>
          </button>
          <button
            onClick={() => handleContextMenuAction('react-smile')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <span>😊 React with Smile</span>
          </button>
          <div className="border-t border-gray-200 my-1"></div>
          <button
            onClick={() => handleContextMenuAction('copy')}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
          >
            <span>📋 Copy Message</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatSystem;