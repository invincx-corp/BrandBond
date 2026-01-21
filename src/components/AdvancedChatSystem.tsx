import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  MessageCircle, Send, Phone, Video, MoreHorizontal, ArrowLeft, Search, 
  Filter, Plus, X, Image as ImageIcon, Paperclip, Smile, Mic, Check, 
  CheckCheck, Clock, User, Heart, Star, MapPin, Calendar, Camera, 
  Music, Film, Book, Coffee, Plane, Palette, Gamepad2, Dumbbell, 
  Leaf, Zap, Globe, Smartphone, Watch, Gift, Sparkles, Utensils, 
  Flag, Eye, EyeOff, Lock, Unlock, Pin, Volume2, VolumeX, Archive,
  Trash2, Shield, AlertTriangle, Download, Share2, Bookmark, 
  ThumbsUp, ThumbsDown, Laugh, Angry, Sad, Surprised, Meh, BarChart3, ChevronRight, Reply, Settings
} from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

interface AdvancedChatSystemProps {
  userId: string;
  className?: string;
}

const AdvancedChatSystem: React.FC<AdvancedChatSystemProps> = ({ userId, className = '' }) => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    sendMessage,
    sendVoiceMessage,
    sendGifMessage,
    addReaction,
    markAsRead,
    deleteConversation,
    blockUser,
    reportUser,
    startVoiceCall,
    startVideoCall,
    shareLocation,
    sendDateInvite,
    sendAIEnhancedMessage,
    toggleConversationPin,
    toggleConversationMute,
    toggleConversationArchive,
    searchMessages,
    analytics
  } = useChat();

  // Enhanced state management
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'pinned' | 'archived'>('all');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);
  const [showForwardModal, setShowForwardModal] = useState<string | null>(null);
  const [showReplyTo, setShowReplyTo] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showChatThemes, setShowChatThemes] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [showChatBackup, setShowChatBackup] = useState(false);
  const [showChatAnalytics, setShowChatAnalytics] = useState(false);

  // Refs
  const messageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;
    
    if (filterType === 'unread') {
      filtered = filtered.filter(conv => conv.conversation.unreadCount > 0);
    } else if (filterType === 'pinned') {
      filtered = filtered.filter(conv => conv.conversation.isPinned);
    } else if (filterType === 'archived') {
      filtered = filtered.filter(conv => conv.conversation.isArchived);
    }

    if (searchQuery) {
      filtered = filtered.filter(conv => 
        conv.otherProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.messages.some(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Sort by pinned first, then by last message time
    return filtered.sort((a, b) => {
      if (a.conversation.isPinned && !b.conversation.isPinned) return -1;
      if (!a.conversation.isPinned && b.conversation.isPinned) return 1;
      return new Date(b.conversation.lastMessage.timestamp).getTime() - 
             new Date(a.conversation.lastMessage.timestamp).getTime();
    });
  }, [conversations, filterType, searchQuery]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Mark conversation as read when opened
  useEffect(() => {
    if (activeConversation && activeConversation.conversation.unreadCount > 0) {
      markAsRead(activeConversation.conversation.id);
    }
  }, [activeConversation, markAsRead]);

  // Typing indicator
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (messageText && !isTyping) {
      setIsTyping(true);
      // Simulate typing indicator to other user
    }
    
    timeout = setTimeout(() => setIsTyping(false), 1000);
    return () => clearTimeout(timeout);
  }, [messageText, isTyping]);

  // Voice recording functionality
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const duration = recordingTime;
        if (activeConversation) {
          sendVoiceMessage(blob, duration);
        }
        setRecordingTime(0);
        setIsRecording(false);
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
          sendVoiceMessage(blob, duration);
        }
        setRecordingTime(0);
        setIsRecording(false);
      };
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [activeConversation, sendVoiceMessage, recordingTime]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }, [isRecording]);

  // Send message with enhanced features
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !activeConversation) return;

    const messageData = {
      text: messageText,
      replyTo: showReplyTo,
      metadata: {
        // Add any additional metadata
      }
    };

    try {
      await sendMessage(messageData.text);
      setMessageText('');
      setShowReplyTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [messageText, activeConversation, sendMessage, showReplyTo]);

  // Enhanced message actions
  const handleMessageAction = useCallback(async (action: string, messageId: string, data?: any) => {
    switch (action) {
      case 'react':
        if (data?.emoji) {
          await addReaction(messageId, data.emoji);
        }
        break;
      case 'reply':
        setShowReplyTo(messageId);
        messageInputRef.current?.focus();
        break;
      case 'forward':
        setShowForwardModal(messageId);
        break;
      case 'delete':
        // Handle message deletion
        break;
      case 'report':
        // Handle message reporting
        break;
    }
    setShowContextMenu(null);
  }, [addReaction]);

  // Chat themes
  const chatThemes = [
    { id: 'default', name: 'Default', colors: { bg: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50' } },
    { id: 'dark', name: 'Dark Mode', colors: { bg: 'bg-gray-900' } },
    { id: 'sunset', name: 'Sunset', colors: { bg: 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50' } },
    { id: 'ocean', name: 'Ocean', colors: { bg: 'bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50' } },
    { id: 'forest', name: 'Forest', colors: { bg: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50' } }
  ];

  // Emoji reactions
  const quickReactions = ['❤️', '👍', '👎', '😂', '😮', '😢', '😡'];

  if (!activeConversation) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* Chat List View */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Messages</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowChatSettings(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="pinned">Pinned</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No conversations yet</h3>
                <p className="text-gray-500">Start chatting with your matches!</p>
              </div>
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.conversation.id}
                onClick={() => setActiveConversation(conversation)}
                className={`flex items-center space-x-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 ${
                  conversation.conversation.unreadCount > 0 ? 'bg-blue-50' : ''
                }`}
              >
                {/* Profile Image */}
                <div className="relative">
                  <img
                    src={conversation.otherProfile.photos[0]}
                    alt={conversation.otherProfile.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {conversation.otherProfile.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                  )}
                  {conversation.conversation.isPinned && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 border-2 border-white rounded-full flex items-center justify-center">
                      <Pin className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-gray-800 truncate">
                        {conversation.otherProfile.name}
                      </h4>
                      <span className="text-xs text-gray-500 font-medium">
                        {conversation.otherProfile.matchPercentage}%
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(conversation.conversation.lastMessage.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.conversation.lastMessage.text}
                    </p>
                    {conversation.conversation.unreadCount > 0 && (
                      <span className="bg-pink-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {conversation.conversation.unreadCount > 9 ? '9+' : conversation.conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-1">
                  {conversation.conversation.isMuted && (
                    <VolumeX className="w-4 h-4 text-gray-400" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleConversationPin(conversation.conversation.id);
                    }}
                    className={`p-1 rounded transition-colors ${
                      conversation.conversation.isPinned 
                        ? 'text-yellow-500 hover:text-yellow-600' 
                        : 'text-gray-400 hover:text-yellow-500'
                    }`}
                  >
                    <Pin className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveConversation(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-3">
              <img
                src={activeConversation.otherProfile.photos[0]}
                alt={activeConversation.otherProfile.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-800">
                  {activeConversation.otherProfile.name}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {activeConversation.otherProfile.isOnline ? (
                    <span className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span>Online</span>
                    </span>
                  ) : (
                    <span>Last seen {new Date(activeConversation.otherProfile.lastSeen || Date.now()).toLocaleTimeString()}</span>
                  )}
                  <span>•</span>
                  <span>{activeConversation.otherProfile.matchPercentage}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Call Buttons */}
            <button
              onClick={() => startVoiceCall(activeConversation.conversation.id)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Voice Call"
            >
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => startVideoCall(activeConversation.conversation.id)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Video Call"
            >
              <Video className="w-5 h-5 text-gray-600" />
            </button>

            {/* More Options */}
            <button
              onClick={() => setShowChatSettings(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className={`flex-1 overflow-y-auto p-4 ${chatThemes.find(t => t.id === selectedTheme)?.colors.bg || chatThemes[0].colors.bg}`}>
        {activeConversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div className={`max-w-xs lg:max-w-md ${
              message.senderId === userId 
                ? 'bg-pink-500 text-white' 
                : 'bg-white text-gray-800'
            } rounded-2xl px-4 py-2 shadow-sm relative group`}>
              
              {/* Reply Indicator */}
              {message.metadata?.replyTo && (
                <div className="text-xs opacity-70 mb-1 border-l-2 border-current pl-2">
                  Replying to a message...
                </div>
              )}

              {/* Message Content */}
              <p className="text-sm">{message.text}</p>

              {/* Message Metadata */}
              <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                <span>
                  {new Date(message.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                
                {message.senderId === userId && (
                  <div className="flex items-center space-x-1">
                    {message.status === 'sending' && <Clock className="w-3 h-3" />}
                    {message.status === 'sent' && <Check className="w-3 h-3" />}
                    {message.status === 'delivered' && <CheckCheck className="w-3 h-3" />}
                    {message.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                  </div>
                )}
              </div>

              {/* Quick Reactions */}
              <div className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-lg shadow-lg border border-gray-200 p-1 flex items-center space-x-1">
                {quickReactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleMessageAction('react', message.id, { emoji })}
                    className="hover:scale-110 transition-transform p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Context Menu */}
              <button
                onClick={(e) => setShowContextMenu({ 
                  x: e.clientX, 
                  y: e.clientY, 
                  messageId: message.id 
                })}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/10 rounded"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="bg-white text-gray-800 rounded-2xl px-4 py-2 shadow-sm">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span className="text-xs text-gray-500 ml-2">typing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        {/* Reply Indicator */}
        {showReplyTo && (
          <div className="bg-gray-100 rounded-lg p-2 mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-600">Replying to a message...</span>
            <button
              onClick={() => setShowReplyTo(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center space-x-2">
          {/* Attachment Button */}
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Paperclip className="w-5 h-5 text-gray-600" />
          </button>

          {/* GIF Button */}
          <button 
            onClick={() => setShowGifPicker(!showGifPicker)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Smile className="w-5 h-5 text-gray-600" />
          </button>

          {/* Poll Button */}
          <button 
            onClick={() => setShowPollCreator(!showPollCreator)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <BarChart3 className="w-5 h-5 text-gray-600" />
          </button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <input
              ref={messageInputRef}
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Voice Message Button */}
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className={`p-2 rounded-full transition-colors ${
              isRecording ? 'bg-red-500 text-white' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!messageText.trim()}
            className="p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="mt-2 flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-red-500">
              Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[150px]"
          style={{ top: showContextMenu.y, left: showContextMenu.x }}
        >
          <button
            onClick={() => handleMessageAction('reply', showContextMenu.messageId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Reply className="w-4 h-4" />
            <span>Reply</span>
          </button>
          <button
            onClick={() => handleMessageAction('forward', showContextMenu.messageId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Forward</span>
          </button>
          <button
            onClick={() => handleMessageAction('react', showContextMenu.messageId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center space-x-2"
          >
            <Heart className="w-4 h-4" />
            <span>React</span>
          </button>
          <hr className="my-1" />
          <button
            onClick={() => handleMessageAction('delete', showContextMenu.messageId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
          <button
            onClick={() => handleMessageAction('report', showContextMenu.messageId)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center space-x-2"
          >
            <Flag className="w-4 h-4" />
            <span>Report</span>
          </button>
        </div>
      )}

      {/* Modals and Overlays */}
      {/* Chat Settings Modal */}
      {showChatSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Chat Settings</h3>
              <button
                onClick={() => setShowChatSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowChatThemes(true);
                  setShowChatSettings(false);
                }}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>Chat Theme</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
              
              <button
                onClick={() => toggleConversationMute(activeConversation.conversation.id)}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>{activeConversation.conversation.isMuted ? 'Unmute' : 'Mute'} Chat</span>
                  {activeConversation.conversation.isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </div>
              </button>
              
              <button
                onClick={() => toggleConversationArchive(activeConversation.conversation.id)}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>{activeConversation.conversation.isArchived ? 'Unarchive' : 'Archive'} Chat</span>
                  <Archive className="w-4 h-4" />
                </div>
              </button>
              
              <button
                onClick={() => setShowChatAnalytics(true)}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>Chat Analytics</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
              
              <button
                onClick={() => setShowChatBackup(true)}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>Backup Chat</span>
                  <Download className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close context menu */}
      {showContextMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowContextMenu(null)}
        />
      )}
    </div>
  );
};

export default AdvancedChatSystem;
