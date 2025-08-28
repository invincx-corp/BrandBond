import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../contexts/ChatContext';
import { Message, MessageReaction } from '../services/messagingService';

interface EnhancedChatSystemProps {
  userId: string;
  className?: string;
}

const EnhancedChatSystem: React.FC<EnhancedChatSystemProps> = ({ userId, className = '' }) => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    sendMessage,
    sendVoiceMessage,
    sendGifMessage,
    sendPoll,
    addReaction,
    voteOnPoll,
    searchMessages,
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
    searchResults,
    analytics
  } = useChat();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'online' | 'recent' | 'pinned'>('all');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showDateInviteModal, setShowDateInviteModal] = useState(false);
  const [showAIPromptsModal, setShowAIPromptsModal] = useState(false);
  const [showGifModal, setShowGifModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedDateInvite, setSelectedDateInvite] = useState<any>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '', '']);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();

  // AI Prompts for conversation starters
  const aiPrompts = [
    "What's your favorite travel destination and why?",
    "If you could have dinner with anyone, who would it be?",
    "What's the most adventurous thing you've ever done?",
    "What's your dream job and what's stopping you from pursuing it?",
    "What's your favorite book and how did it change your perspective?",
    "What's your biggest fear and how do you overcome it?",
    "What's your love language and how do you show affection?",
    "What's your biggest achievement and what did you learn from it?",
    "What's your favorite way to spend a weekend?",
    "What's your biggest dream and what's your plan to achieve it?"
  ];

  // Date invite templates
  const dateInviteTemplates = [
    {
      title: "Coffee Date",
      description: "Let's grab coffee and get to know each other better in a relaxed setting.",
      icon: "☕"
    },
    {
      title: "Dinner Date",
      description: "How about a romantic dinner at a nice restaurant?",
      icon: "🍽️"
    },
    {
      title: "Adventure Date",
      description: "Let's do something exciting together - maybe hiking or exploring?",
      icon: "🏔️"
    },
    {
      title: "Cultural Date",
      description: "Visit a museum or art gallery together and share our thoughts.",
      icon: "🎨"
    },
    {
      title: "Outdoor Date",
      description: "Enjoy nature together with a picnic or walk in the park.",
      icon: "🌳"
    }
  ];

  // Filter conversations based on search and filter type
  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.otherProfile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conversation.messages.some(msg => msg.text.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = (() => {
      switch (filterType) {
        case 'unread':
          return conversation.conversation.unreadCount > 0;
        case 'online':
          return conversation.otherProfile.isOnline;
        case 'recent':
          return conversation.conversation.updatedAt > new Date(Date.now() - 24 * 60 * 60 * 1000);
        case 'pinned':
          return conversation.conversation.isPinned;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Typing indicator effect
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => setIsTyping(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  // Handle sending message
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !activeConversation) return;

    try {
      await sendMessage(messageInput.trim());
      setMessageInput('');
      setIsTyping(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }, [messageInput, activeConversation, sendMessage]);

  // Handle AI enhanced message
  const handleAIEnhancedMessage = useCallback(async (prompt: string) => {
    if (!activeConversation) return;

    try {
      await sendAIEnhancedMessage(prompt);
      setShowAIPromptsModal(false);
    } catch (error) {
      console.error('Failed to send AI enhanced message:', error);
    }
  }, [activeConversation, sendAIEnhancedMessage]);

  // Handle date invite
  const handleDateInvite = useCallback(async (template: any) => {
    if (!activeConversation) return;

    setSelectedDateInvite(template);
    setShowDateInviteModal(true);
  }, [activeConversation]);

  // Send date invite
  const sendDateInvite = useCallback(async () => {
    if (!activeConversation || !selectedDateInvite) return;

    try {
      await sendDateInvite(selectedDateInvite);
      setShowDateInviteModal(false);
      setSelectedDateInvite(null);
    } catch (error) {
      console.error('Failed to send date invite:', error);
    }
  }, [activeConversation, selectedDateInvite, sendDateInvite]);

  // Handle voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        if (activeConversation) {
          await sendVoiceMessage(audioBlob, recordingDuration);
        }
        setAudioChunks([]);
        setRecordingDuration(0);
        setIsRecording(false);
        setShowVoiceRecorder(false);
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setShowVoiceRecorder(true);

      // Start duration timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [activeConversation, sendVoiceMessage]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [mediaRecorder, isRecording]);

  // Handle GIF selection
  const handleGifSelect = useCallback(async (gifUrl: string, gifId: string) => {
    if (!activeConversation) return;

    try {
      await sendGifMessage(gifUrl, gifId);
      setShowGifModal(false);
    } catch (error) {
      console.error('Failed to send GIF:', error);
    }
  }, [activeConversation, sendGifMessage]);

  // Handle poll creation
  const handlePollSubmit = useCallback(async () => {
    if (!activeConversation || !pollQuestion.trim() || pollOptions.some(opt => !opt.trim())) return;

    try {
      await sendPoll(pollQuestion.trim(), pollOptions.filter(opt => opt.trim()));
      setPollQuestion('');
      setPollOptions(['', '', '']);
      setShowPollModal(false);
    } catch (error) {
      console.error('Failed to send poll:', error);
    }
  }, [activeConversation, pollQuestion, pollOptions, sendPoll]);

  // Handle message reaction
  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  }, [addReaction]);

  // Handle poll voting
  const handlePollVote = useCallback(async (messageId: string, option: string) => {
    try {
      await voteOnPoll(messageId, option);
    } catch (error) {
      console.error('Failed to vote on poll:', error);
    }
  }, [voteOnPoll]);

  // Format timestamp
  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // Get interest icon
  const getInterestIcon = (interest: string): string => {
    const iconMap: { [key: string]: string } = {
      'music': '🎵',
      'travel': '✈️',
      'food': '🍕',
      'sports': '⚽',
      'art': '🎨',
      'technology': '💻',
      'reading': '📚',
      'gaming': '🎮',
      'fitness': '💪',
      'photography': '📸'
    };
    return iconMap[interest.toLowerCase()] || '❤️';
  };

  // Render message based on type
  const renderMessage = (message: Message) => {
    const isOwnMessage = message.senderId === userId;

    switch (message.type) {
      case 'gif':
        return (
          <div className="max-w-xs">
            <img 
              src={message.metadata?.gifUrl} 
              alt="GIF" 
              className="rounded-lg max-w-full"
            />
          </div>
        );

      case 'voice-note':
        return (
          <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-lg">
            <i className="fas fa-play text-blue-500"></i>
            <div className="flex-1">
              <div className="w-32 bg-gray-300 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
              <span className="text-sm text-gray-600">{message.metadata?.duration}s</span>
            </div>
          </div>
        );

      case 'poll':
        return (
          <div className="bg-white p-4 rounded-lg border max-w-sm">
            <h4 className="font-medium mb-3">{message.text.replace('📊 ', '')}</h4>
            <div className="space-y-2">
              {message.metadata?.pollOptions?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handlePollVote(message.id, option)}
                  className="w-full text-left p-2 rounded border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span>{option}</span>
                    <span className="text-sm text-gray-500">
                      {message.metadata?.pollResults?.[option] || 0} votes
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <i className="fas fa-map-marker-alt text-blue-500 mr-2"></i>
            <span>{message.text}</span>
          </div>
        );

      default:
        return (
          <div className="bg-white p-3 rounded-lg shadow-sm max-w-xs">
            <p className="text-gray-800">{message.text}</p>
            {message.metadata?.reactions && message.metadata.reactions.length > 0 && (
              <div className="flex gap-1 mt-2">
                {message.metadata.reactions.map((reaction, index) => (
                  <span key={index} className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {reaction.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  if (!activeConversation) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* Welcome Screen */}
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full flex items-center justify-center mb-6">
            <i className="fas fa-comments text-white text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Love Universe Chat</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Start meaningful conversations with your matches. Use AI prompts to break the ice, 
            share your thoughts, and build deeper connections.
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => setShowAIPromptsModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200"
            >
              <i className="fas fa-magic mr-2"></i>
              Get AI Conversation Starters
            </button>
            <button
              onClick={() => setShowDateInviteModal(true)}
              className="px-6 py-3 bg-white text-pink-600 border-2 border-pink-500 rounded-full font-medium hover:bg-pink-50 transition-all duration-200"
            >
              <i className="fas fa-calendar-heart mr-2"></i>
              Plan a Date
            </button>
          </div>

          {/* Chat Statistics */}
          {analytics && (
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{analytics.totalConversations}</div>
                <div className="text-sm text-gray-600">Conversations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">{analytics.totalMessages}</div>
                <div className="text-sm text-gray-600">Messages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">
                  {Math.round(analytics.averageResponseTime / 60000)}m
                </div>
                <div className="text-sm text-gray-600">Avg Response</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-500">
                  {Object.keys(analytics.mostActiveHours).length}
                </div>
                <div className="text-sm text-gray-600">Active Hours</div>
              </div>
            </div>
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
          <div className="flex items-center gap-3">
            <img
              src={activeConversation.otherProfile.photos[0]}
              alt={activeConversation.otherProfile.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-semibold text-gray-800">{activeConversation.otherProfile.name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className={`w-2 h-2 rounded-full ${activeConversation.otherProfile.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span>
                  {activeConversation.otherProfile.isOnline ? 'Online' : 'Offline'}
                </span>
                {activeConversation.otherProfile.status && (
                  <>
                    <span>•</span>
                    <span>{activeConversation.otherProfile.status}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => startVoiceCall(activeConversation.conversation.id)}
              className="p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              title="Voice Call"
            >
              <i className="fas fa-phone"></i>
            </button>
            <button
              onClick={() => startVideoCall(activeConversation.conversation.id)}
              className="p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              title="Video Call"
            >
              <i className="fas fa-video"></i>
            </button>
            <button
              onClick={() => shareLocation({ name: 'Current Location' })}
              className="p-2 text-gray-600 hover:text-green-500 hover:bg-green-50 rounded-full transition-colors"
              title="Share Location"
            >
              <i className="fas fa-map-marker-alt"></i>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="p-2 text-gray-600 hover:text-purple-500 hover:bg-purple-50 rounded-full transition-colors"
                title="More Options"
              >
                <i className="fas fa-ellipsis-v"></i>
              </button>
              
              {showAttachmentMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  <button
                    onClick={() => setShowAIPromptsModal(true)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <i className="fas fa-magic mr-2"></i>
                    AI Prompts
                  </button>
                  <button
                    onClick={() => setShowDateInviteModal(true)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <i className="fas fa-calendar-heart mr-2"></i>
                    Plan Date
                  </button>
                  <button
                    onClick={() => setShowGifModal(true)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <i className="fas fa-gift mr-2"></i>
                    Send GIF
                  </button>
                  <button
                    onClick={() => setShowPollModal(true)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <i className="fas fa-poll mr-2"></i>
                    Create Poll
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={() => blockUser(activeConversation.conversation.id)}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <i className="fas fa-ban mr-2"></i>
                    Block User
                  </button>
                  <button
                    onClick={() => reportUser(activeConversation.conversation.id, 'Inappropriate behavior')}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <i className="fas fa-flag mr-2"></i>
                    Report User
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {activeConversation.messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === userId ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs ${message.senderId === userId ? 'order-2' : 'order-1'}`}>
              {renderMessage(message)}
              <div className={`text-xs text-gray-500 mt-1 ${message.senderId === userId ? 'text-right' : 'text-left'}`}>
                {formatTimestamp(message.timestamp)}
                {message.senderId === userId && (
                  <span className="ml-2">
                    {message.status === 'sending' && <i className="fas fa-clock text-gray-400"></i>}
                    {message.status === 'sent' && <i className="fas fa-check text-gray-400"></i>}
                    {message.status === 'delivered' && <i className="fas fa-check-double text-gray-400"></i>}
                    {message.status === 'read' && <i className="fas fa-check-double text-blue-500"></i>}
                  </span>
                )}
              </div>
              
              {/* Reaction buttons for other person's messages */}
              {message.senderId !== userId && (
                <div className="flex gap-1 mt-2">
                  {['❤️', '👍', '😊', '🎉', '🔥'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(message.id, emoji)}
                      className="text-sm hover:scale-110 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-600 hover:text-yellow-500 hover:bg-yellow-50 rounded-full transition-colors"
            title="Emoji"
          >
            <i className="fas fa-smile"></i>
          </button>
          
          <button
            onClick={() => setShowVoiceRecorder(true)}
            className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-500 text-white' : 'text-gray-600 hover:text-red-500 hover:bg-red-50'}`}
            title="Voice Message"
          >
            <i className={`fas ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="p-2 bg-pink-500 text-white rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send Message"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>

      {/* Modals */}
      {/* AI Prompts Modal */}
      {showAIPromptsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">AI Conversation Starters</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {aiPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleAIEnhancedMessage(prompt)}
                  className="w-full text-left p-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAIPromptsModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Date Invite Modal */}
      {showDateInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Plan a Date</h3>
            <div className="space-y-3">
              {dateInviteTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => handleDateInvite(template)}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{template.icon}</span>
                    <div>
                      <div className="font-medium">{template.title}</div>
                      <div className="text-sm text-gray-600">{template.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowDateInviteModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
            <h3 className="text-lg font-semibold mb-4">Voice Message</h3>
            <div className="mb-6">
              <div className="text-3xl font-bold text-pink-500 mb-2">
                {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-600">
                {isRecording ? 'Recording...' : 'Ready to record'}
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <i className="fas fa-microphone mr-2"></i>
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
                >
                  <i className="fas fa-stop mr-2"></i>
                  Stop Recording
                </button>
              )}
            </div>
            
            <button
              onClick={() => setShowVoiceRecorder(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Poll Modal */}
      {showPollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create a Poll</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
                <input
                  type="text"
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  placeholder="What would you like to ask?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                {pollOptions.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...pollOptions];
                      newOptions[index] = e.target.value;
                      setPollOptions(newOptions);
                    }}
                    placeholder={`Option ${index + 1}`}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePollSubmit}
                disabled={!pollQuestion.trim() || pollOptions.some(opt => !opt.trim())}
                className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Poll
              </button>
              <button
                onClick={() => setShowPollModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GIF Modal (simplified) */}
      {showGifModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Send GIF</h3>
            <div className="space-y-2">
              {['😊', '❤️', '🎉', '🔥', '👍', '😍'].map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => handleGifSelect(`https://example.com/gif${index}.gif`, `gif_${index}`)}
                  className="w-full p-3 text-2xl hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowGifModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedChatSystem;
