import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Trash
} from 'lucide-react';
import IntelligentAIPrompts from './IntelligentAIPrompts';
import { UserProfile } from '../services/aiPromptService';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'voice' | 'location' | 'date-invite' | 'ai-enhanced' | 'story-reply' | 'gif' | 'file' | 'poll' | 'voice-note';
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
  const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'online' | 'recent'>('all');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showDateInviteModal, setShowDateInviteModal] = useState(false);
  const [showAIPromptsModal, setShowAIPromptsModal] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedDateInvite, setSelectedDateInvite] = useState<any>(null);
  
  // Advanced Features State
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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
  }, [messageInput, activeConversation, onSendMessage, userId]);

  // Handle AI enhanced message
  const handleAIEnhancedMessage = (prompt: string) => {
    if (activeConversation) {
      onSendAIEnhancedMessage(activeConversation.conversation.id, prompt);
      setShowAIPromptsModal(false);
    }
  };

  const handleIntelligentPrompt = (prompt: string) => {
    if (activeConversation) {
      setMessageInput(prompt);
      messageInputRef.current?.focus();
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
      // Add reaction to message
      const updatedMessage = activeConversation.messages.find(m => m.id === messageId);
      if (updatedMessage) {
        const reaction = {
          userId,
          emoji,
          timestamp: new Date()
        };
        
        if (!updatedMessage.metadata) updatedMessage.metadata = {};
        if (!updatedMessage.metadata.reactions) updatedMessage.metadata.reactions = [];
        
        // Check if user already reacted with this emoji
        const existingReactionIndex = updatedMessage.metadata.reactions.findIndex(
          (r: any) => r.userId === userId && r.emoji === emoji
        );
        
        if (existingReactionIndex >= 0) {
          // Remove reaction if already exists
          updatedMessage.metadata.reactions.splice(existingReactionIndex, 1);
        } else {
          // Add new reaction
          updatedMessage.metadata.reactions.push(reaction);
        }
        
        // Force re-render
        setActiveConversation({ ...activeConversation });
      }
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

  return (
    <div className={`flex h-full bg-gradient-to-br ${
      theme === 'friends' ? 'from-blue-50 via-cyan-50 to-indigo-50' :
      selectedTheme === 'default' ? 'from-pink-50 via-purple-50 to-indigo-50' :
      selectedTheme === 'sunset' ? 'from-orange-50 via-red-50 to-pink-50' :
      selectedTheme === 'ocean' ? 'from-blue-50 via-cyan-50 to-indigo-50' :
      selectedTheme === 'forest' ? 'from-green-50 via-emerald-50 to-teal-50' :
      selectedTheme === 'midnight' ? 'from-gray-50 via-slate-50 to-gray-100' : 'from-pink-50 via-purple-50 to-indigo-50'
    }`}>
      {/* Conversations Sidebar */}
      <div className={`w-full sm:w-80 lg:w-96 bg-white/80 backdrop-blur-sm border-r ${colorScheme.border} flex flex-col`}>
        {/* Header */}
                  <div className={`p-4 border-b ${colorScheme.border} bg-white/60`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            <button
              onClick={() => setShowNewChatModal(true)}
                              className={`p-2 bg-gradient-to-r ${colorScheme.primary} text-white rounded-full hover:shadow-lg transition-all duration-200`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border ${colorScheme.border} rounded-lg focus:ring-2 ${colorScheme.focus} focus:border-transparent bg-white/80`}
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                          {[
              { key: 'all', label: 'All', count: conversations.length },
              { key: 'unread', label: 'Unread', count: conversations.filter(c => c.conversation.unreadCount > 0).length },
              { key: 'online', label: 'Online', count: conversations.filter(c => c.otherProfile.isOnline).length },
              { key: 'recent', label: 'Recent', count: conversations.filter(c => c.conversation.lastMessage.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)).length }
            ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key as any)}
                  className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-all duration-200 ${
                    filterType === filter.key
                      ? `bg-white ${colorScheme.text} shadow-sm`
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {filter.label}
                  <span className="ml-1 text-xs text-gray-400">({filter.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No conversations found</p>
              <p className="text-xs mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredConversations.map(conversation => (
              <div
                key={conversation.conversation.id}
                onClick={() => {
                  setActiveConversation(conversation);
                  if (conversation.conversation.unreadCount > 0) {
                    onMarkAsRead(conversation.conversation.id);
                  }
                }}
                className={`p-4 border-b ${colorScheme.border} cursor-pointer transition-all duration-200 ${colorScheme.hover} group ${
                  activeConversation?.conversation.id === conversation.conversation.id ? `${colorScheme.bg} ${colorScheme.border}` : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${colorScheme.border}`}>
                      <img
                        src={conversation.otherProfile.photos[0]}
                        alt={conversation.otherProfile.name}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                    {conversation.otherProfile.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-800 text-sm truncate">
                        {conversation.otherProfile.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(conversation.conversation.lastMessage.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs ${colorScheme.text} font-medium`}>
                        {conversation.otherProfile.matchPercentage}% Match
                      </span>
                      <span className="text-xs text-gray-500">
                        {conversation.otherProfile.location}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {conversation.conversation.lastMessage.text}
                    </p>

                    {/* Unread Badge */}
                    {conversation.conversation.unreadCount > 0 && (
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center space-x-2">
                          {conversation.otherProfile.commonInterests.slice(0, 3).map((interest, index) => {
                            const IconComponent = getInterestIcon(interest);
                            return (
                              <div key={index} className="flex items-center space-x-1 text-xs text-gray-500">
                                <IconComponent className="w-3 h-3" />
                                <span>{interest}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className={`${theme === 'friends' ? 'bg-blue-500' : 'bg-pink-500'} text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center`}>
                          {conversation.conversation.unreadCount}
                        </div>
                      </div>
                    )}
                    
                    {/* Conversation Management Actions */}
                    <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePin(conversation.conversation.id);
                          }}
                          className={`p-1 rounded-full transition-colors duration-200 ${
                            conversation.conversation.isPinned 
                              ? 'text-yellow-500 hover:bg-yellow-50' 
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          title={conversation.conversation.isPinned ? 'Unpin' : 'Pin'}
                        >
                          <Star className="w-3 h-3" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleMute(conversation.conversation.id);
                          }}
                          className={`p-1 rounded-full transition-colors duration-200 ${
                            conversation.conversation.isMuted 
                              ? 'text-red-500 hover:bg-red-50' 
                              : 'text-gray-400 hover:bg-gray-50'
                          }`}
                          title={conversation.conversation.isMuted ? 'Unmute' : 'Mute'}
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveConversation(conversation.conversation.id);
                          }}
                          className="p-1 text-gray-400 hover:bg-gray-50 rounded-full transition-colors duration-200"
                          title="Archive"
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conversation.conversation.id);
                          }}
                          className="p-1 text-red-400 hover:bg-red-50 rounded-full transition-colors duration-200"
                          title="Delete"
                        >
                          <Trash className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

                {/* Chat Interface */}
          {activeConversation ? (
            <div className={`flex-1 flex flex-col backdrop-blur-sm ${
              theme === 'friends' ? 'bg-blue-50/60' :
              selectedTheme === 'default' ? 'bg-white/60' :
              selectedTheme === 'sunset' ? 'bg-orange-50/60' :
              selectedTheme === 'ocean' ? 'bg-blue-50/60' :
              selectedTheme === 'forest' ? 'bg-green-50/60' :
              selectedTheme === 'midnight' ? 'bg-gray-50/60' : 'bg-white/60'
            }`}>
              {/* Chat Header */}
              <div className={`bg-white/80 backdrop-blur-sm border-b ${colorScheme.border} p-4 flex items-center justify-between`}>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200 lg:hidden`}
                  >
                    <ArrowLeft className="w-5 h-5 text-pink-600" />
                  </button>
                  
                  <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${colorScheme.border}`}>
                    <img
                      src={activeConversation.otherProfile.photos[0]}
                      alt={activeConversation.otherProfile.name}
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-gray-800">{activeConversation.otherProfile.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{activeConversation.otherProfile.age} years old</span>
                      <span>•</span>
                      <span>{activeConversation.otherProfile.location}</span>
                      <span>•</span>
                      <span className={`${colorScheme.text} font-medium`}>{activeConversation.otherProfile.matchPercentage}% Match</span>
                    </div>
                  </div>
                </div>

                          {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onStartVoiceCall(activeConversation.conversation.id)}
                  className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                  title="Voice Call"
                >
                  <Phone className={`w-5 h-5 ${colorScheme.text}`} />
                </button>
                
                <button
                  onClick={() => onStartVideoCall(activeConversation.conversation.id)}
                  className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                  title="Video Call"
                >
                  <Video className={`w-5 h-5 ${colorScheme.text}`} />
                </button>
                
                <button
                  onClick={() => setShowAIPromptsModal(true)}
                  className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                  title="AI Chat Prompts"
                >
                  <Sparkles className={`w-5 h-5 ${colorScheme.text}`} />
                </button>
                
                <button
                  onClick={() => setShowThemeSelector(!showThemeSelector)}
                  className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200 relative`}
                  title="Chat Theme"
                >
                  <Palette className={`w-5 h-5 ${colorScheme.text}`} />
                  
                  {/* Theme Selector Dropdown */}
                  {showThemeSelector && (
                    <div className={`absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border ${colorScheme.border} z-10 dropdown-container`}>
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                          Chat Themes
                        </div>
                        {[
                          { key: 'default', name: 'Default', color: 'from-pink-50 to-purple-50' },
                          { key: 'sunset', name: 'Sunset', color: 'from-orange-50 to-red-50' },
                          { key: 'ocean', name: 'Ocean', color: 'from-blue-50 to-cyan-50' },
                          { key: 'forest', name: 'Forest', color: 'from-green-50 to-emerald-50' },
                          { key: 'midnight', name: 'Midnight', color: 'from-gray-50 to-slate-50' }
                        ].map(theme => (
                          <button
                            key={theme.key}
                            onClick={() => {
                              setSelectedTheme(theme.key);
                              setShowThemeSelector(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm ${colorScheme.hover} flex items-center space-x-2 ${
                              selectedTheme === theme.key ? `${colorScheme.text} ${colorScheme.bg}` : 'text-gray-700'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${theme.color}`}></div>
                            <span>{theme.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200 relative`}
                  title="More Options"
                >
                  <MoreHorizontal className={`w-5 h-5 ${colorScheme.text}`} />
                  
                  {/* Attachment Menu */}
                  {showAttachmentMenu && (
                    <div className={`absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border ${colorScheme.border} z-10 dropdown-container`}>
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowAttachmentMenu(false);
                            setShowDateInviteModal(true);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm text-gray-700 ${colorScheme.hover} flex items-center space-x-2`}
                        >
                          <Calendar className={`w-4 h-4 ${colorScheme.text}`} />
                          <span>Send Date Invite</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowAttachmentMenu(false);
                            onShareLocation(activeConversation.conversation.id);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm text-gray-700 ${colorScheme.hover} flex items-center space-x-2`}
                        >
                          <MapPin className={`w-4 h-4 ${colorScheme.text}`} />
                          <span>Share Location</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowAttachmentMenu(false);
                            onBlockUser(activeConversation.conversation.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-pink-50 flex items-center space-x-2"
                        >
                          <X className="w-4 h-4 text-red-600" />
                          <span>Block User</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowAttachmentMenu(false);
                            onReportUser(activeConversation.conversation.id);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-pink-50 flex items-center space-x-2"
                        >
                          <Flag className="w-4 h-4 text-orange-600" />
                          <span>Report User</span>
                        </button>
                      </div>
                    </div>
                  )}
                </button>
              </div>
          </div>

          {/* Intelligent AI Prompts */}
          {currentUserProfile && (
            <IntelligentAIPrompts
              currentUser={currentUserProfile}
              otherUser={{
                id: activeConversation.otherProfile.id,
                name: activeConversation.otherProfile.name,
                age: activeConversation.otherProfile.age,
                location: activeConversation.otherProfile.location,
                bio: activeConversation.otherProfile.bio || '',
                commonInterests: activeConversation.otherProfile.commonInterests || [],
                allTimeFavorites: activeConversation.otherProfile.allTimeFavorites || {}
              }}
              theme={theme}
              onSendPrompt={handleIntelligentPrompt}
              isVisible={true}
            />
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeConversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md group ${
                  message.senderId === userId 
                    ? `bg-gradient-to-r ${colorScheme.primary} text-white` 
                    : `bg-white text-gray-800 border ${colorScheme.border}`
                } rounded-2xl px-4 py-2 shadow-sm`}>
                  <p className="text-sm">{message.text}</p>
                  
                  {/* Message Status */}
                  <div className={`flex items-center justify-end space-x-1 mt-1 ${
                    message.senderId === userId ? `${theme === 'friends' ? 'text-blue-100' : 'text-pink-100'}` : 'text-gray-400'
                  }`}>
                    <span className="text-xs">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    
                    {message.senderId === userId && (
                      <div className="flex items-center space-x-1">
                        {message.status === 'sending' && <Clock className="w-3 h-3" />}
                        {message.status === 'sent' && <Check className="w-3 h-3" />}
                        {message.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                        {message.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-400" />}
                      </div>
                    )}
                  </div>
                  
                  {/* Message Reactions */}
                  {message.metadata?.reactions && message.metadata.reactions.length > 0 && (
                    <div className="flex items-center space-x-1 mt-2">
                      {message.metadata.reactions.map((reaction: any, index: number) => (
                        <span key={index} className="text-xs bg-white/20 px-2 py-1 rounded-full">
                          {reaction.emoji}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Message Actions */}
                  <div className="flex items-center justify-between mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleAddReaction(message.id, '❤️')}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                        title="React with ❤️"
                      >
                        ❤️
                      </button>
                      <button
                        onClick={() => handleAddReaction(message.id, '👍')}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                        title="React with 👍"
                      >
                        👍
                      </button>
                      <button
                        onClick={() => handleAddReaction(message.id, '😊')}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                        title="React with 😊"
                      >
                        😊
                      </button>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleReplyToMessage(message)}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                        title="Reply"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleForwardMessage(message)}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                        title="Forward"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {activeConversation.conversation.isTyping && (
              <div className="flex justify-start">
                <div className={`bg-white border ${colorScheme.border} rounded-2xl px-4 py-2 shadow-sm`}>
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className={`w-2 h-2 ${theme === 'friends' ? 'bg-blue-400' : 'bg-pink-400'} rounded-full animate-bounce`}></div>
                      <div className={`w-2 h-2 ${theme === 'friends' ? 'bg-blue-400' : 'bg-pink-400'} rounded-full animate-bounce`} style={{ animationDelay: '0.1s' }}></div>
                      <div className={`w-2 h-2 ${theme === 'friends' ? 'bg-blue-400' : 'bg-pink-400'} rounded-full animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">typing...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Enhanced Message Input with Advanced Features */}
                      <div className={`bg-white/80 backdrop-blur-sm border-t ${colorScheme.border} p-4`}>
            {/* Advanced Feature Row */}
            <div className="flex items-center space-x-2 mb-3">
              <button
                onClick={() => setShowPollCreator(!showPollCreator)}
                className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200 text-xs`}
                title="Create Poll"
              >
                <BarChart3 className={`w-4 h-4 ${colorScheme.text}`} />
              </button>
              
              <button
                onClick={() => setShowGifPicker(!showGifPicker)}
                className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200 text-xs`}
                title="Send GIF"
              >
                <ImageIcon className={`w-4 h-4 ${colorScheme.text}`} />
              </button>
              
              <button
                onClick={() => setShowLocationPicker(!showLocationPicker)}
                className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200 text-xs`}
                title="Share Location"
              >
                <MapPin className={`w-4 h-4 ${colorScheme.text}`} />
              </button>
              
              <button
                onClick={() => setShowFileUpload(!showFileUpload)}
                className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200 text-xs`}
                title="Upload File"
              >
                <Paperclip className={`w-4 h-4 ${colorScheme.text}`} />
              </button>
              
              <button
                onClick={() => setShowStickerPicker(!showStickerPicker)}
                className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200 text-xs`}
                title="Send Sticker"
              >
                <Sparkles className={`w-4 h-4 ${colorScheme.text}`} />
              </button>
            </div>
            
            {/* Main Input Row */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                title="Emoji"
              >
                <Smile className={`w-5 h-5 ${colorScheme.text}`} />
              </button>
              
              {/* Voice Recording Button */}
              <button
                onMouseDown={startVoiceRecording}
                onMouseUp={stopVoiceRecording}
                onTouchStart={startVoiceRecording}
                onTouchEnd={stopVoiceRecording}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isRecording 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : `${colorScheme.hover} ${colorScheme.text}`
                }`}
                title={isRecording ? 'Recording... Release to send' : 'Hold to record voice message'}
              >
                <Mic className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  ref={messageInputRef}
                  type="text"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={() => setIsTyping(true)}
                  className={`w-full px-4 py-2 border ${colorScheme.border} rounded-full focus:ring-2 ${colorScheme.focus} focus:border-transparent bg-white/80`}
                />
                
                {/* Typing Indicator */}
                {isTyping && (
                                  <div className={`absolute -top-8 left-0 ${colorScheme.bg} ${colorScheme.text} text-xs px-2 py-1 rounded-full`}>
                  typing...
                </div>
                )}
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className={`p-2 bg-gradient-to-r ${colorScheme.primary} text-white rounded-full hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Send Message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            {/* Voice Recording Timer */}
            {isRecording && (
              <div className="mt-2 text-center">
                <div className="inline-flex items-center space-x-2 bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Recording... {recordingTime}s</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Welcome Screen */
        <div className={`flex-1 flex items-center justify-center bg-gradient-to-br ${
          theme === 'friends' ? 'from-blue-50 via-cyan-50 to-indigo-50' : 'from-pink-50 via-purple-50 to-indigo-50'
        }`}>
          <div className="text-center p-8">
                            <div className={`w-24 h-24 mx-auto mb-6 bg-gradient-to-r ${colorScheme.primary} rounded-full flex items-center justify-center`}>
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Start a Conversation</h3>
            <p className="text-gray-600 mb-6 max-w-md">
              Choose a conversation from the list to start chatting, or use AI prompts to break the ice with new connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowNewChatModal(true)}
                className={`px-6 py-3 bg-gradient-to-r ${colorScheme.primary} text-white rounded-full font-medium hover:shadow-lg transition-all duration-200`}
              >
                New Chat
              </button>
              <button
                onClick={() => setShowAIPromptsModal(true)}
                className={`px-6 py-3 bg-gradient-to-r ${theme === 'friends' ? 'from-cyan-500 to-teal-500' : 'from-purple-500 to-indigo-500'} text-white rounded-full font-medium hover:shadow-lg transition-all duration-200`}
              >
                AI Chat Prompts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Prompts Modal - Now handled by IntelligentAIPrompts component */}
      {showAIPromptsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className={`p-6 border-b ${colorScheme.border}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">AI Chat Prompts</h3>
                <button
                  onClick={() => setShowAIPromptsModal(false)}
                  className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                This feature has been upgraded to intelligent, personalized prompts that appear in each chat window.
              </p>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className={`p-6 border-b ${colorScheme.border}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800">Send Date Invite</h3>
                <button
                  onClick={() => setShowDateInviteModal(false)}
                  className={`p-2 ${colorScheme.hover} rounded-full transition-colors duration-200`}
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {dateInviteTemplates.map((template, index) => (
                  <button
                    key={index}
                    onClick={() => handleDateInvite(template)}
                    className={`p-4 text-left border rounded-xl transition-all duration-200 ${
                      selectedDateInvite?.title === template.title
                        ? `${colorScheme.border.replace('border-200', 'border-500')} ${colorScheme.bg}`
                        : `${colorScheme.border} hover:${colorScheme.border.replace('border-200', 'border-400')} ${colorScheme.hover}`
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <template.icon className={`w-6 h-6 ${colorScheme.text}`} />
                      <div>
                        <h4 className="font-medium text-gray-800">{template.title}</h4>
                        <p className="text-sm text-gray-600">{template.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
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
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="date"
                      placeholder="Date"
                      className={`px-4 py-2 border ${colorScheme.border} rounded-lg focus:ring-2 ${colorScheme.focus} focus:border-transparent`}
                    />
                    <input
                      type="time"
                      placeholder="Time"
                      className={`px-4 py-2 border ${colorScheme.border} rounded-lg focus:ring-2 ${colorScheme.focus} focus:border-transparent`}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Location (optional)"
                    className={`w-full px-4 py-2 border ${colorScheme.border} rounded-lg focus:ring-2 ${colorScheme.focus} focus:border-transparent`}
                  />
                  <textarea
                    placeholder="Personal message (optional)"
                    rows={3}
                    className={`w-full px-4 py-2 border ${colorScheme.border} rounded-lg focus:ring-2 ${colorScheme.focus} focus:border-transparent`}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowDateInviteModal(false)}
                      className={`flex-1 px-6 py-3 border ${colorScheme.border} text-gray-700 rounded-lg ${colorScheme.hover} transition-colors duration-200`}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => sendDateInvite({})}
                      className={`flex-1 px-6 py-3 bg-gradient-to-r ${colorScheme.primary} text-white rounded-lg hover:shadow-lg transition-all duration-200`}
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
    </div>
  );
};

export default ChatSystem;
