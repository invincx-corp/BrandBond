import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import messagingService, { 
  ConversationWithProfile, 
  Message, 
  MessageReaction,
  ChatAnalytics 
} from '../services/messagingService';

interface ChatContextType {
  // State
  conversations: ConversationWithProfile[];
  activeConversation: ConversationWithProfile | null;
  unreadCount: number;
  isTyping: boolean;
  searchResults: Message[];
  analytics: ChatAnalytics | null;
  
  // Actions
  setActiveConversation: (conversation: ConversationWithProfile | null) => void;
  sendMessage: (text: string) => Promise<void>;
  sendVoiceMessage: (audioBlob: Blob, duration: number) => Promise<void>;
  sendGifMessage: (gifUrl: string, gifId: string) => Promise<void>;
  sendPoll: (question: string, options: string[]) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  voteOnPoll: (messageId: string, option: string) => Promise<void>;
  searchMessages: (query: string) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  blockUser: (conversationId: string) => Promise<void>;
  reportUser: (conversationId: string, reason: string) => Promise<void>;
  startVoiceCall: (conversationId: string) => Promise<void>;
  startVideoCall: (conversationId: string) => Promise<void>;
  shareLocation: (location: any) => Promise<void>;
  sendDateInvite: (dateDetails: any) => Promise<void>;
  sendAIEnhancedMessage: (prompt: string) => Promise<void>;
  toggleConversationPin: (conversationId: string) => Promise<void>;
  toggleConversationMute: (conversationId: string) => Promise<void>;
  toggleConversationArchive: (conversationId: string) => Promise<void>;
  
  // Utility
  getConversationById: (conversationId: string) => ConversationWithProfile | null;
  getUnreadCount: () => number;
  refreshConversations: () => Promise<void>;
  getAnalytics: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  userId: string;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children, userId }) => {
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationWithProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);

  // Initialize chat service
  useEffect(() => {
    const initializeChat = async () => {
      try {
        await messagingService.initialize(userId);
        await refreshConversations();
        await getAnalytics();
        
        // Set up real-time listeners
        const unsubscribeNewMessage = messagingService.onNewMessage((message) => {
          refreshConversations();
          updateUnreadCount();
        });
        
        const unsubscribeTyping = messagingService.onTypingUpdate((conversationId, typing) => {
          if (activeConversation?.conversation.id === conversationId) {
            setIsTyping(typing);
          }
        });
        
        const unsubscribeOnlineStatus = messagingService.onOnlineStatusChange((conversationId, isOnline) => {
          refreshConversations();
        });
        
        const unsubscribeReaction = messagingService.onReactionUpdate((messageId, reaction) => {
          refreshConversations();
        });

        return () => {
          unsubscribeNewMessage();
          unsubscribeTyping();
          unsubscribeOnlineStatus();
          unsubscribeReaction();
        };
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      }
    };

    if (userId) {
      initializeChat();
    }
  }, [userId]);

  // Update unread count
  const updateUnreadCount = () => {
    const total = conversations.reduce((sum, conv) => sum + conv.conversation.unreadCount, 0);
    setUnreadCount(total);
  };

  // Refresh conversations
  const refreshConversations = async () => {
    try {
      const convs = await messagingService.getConversations(userId);
      setConversations(convs);
      updateUnreadCount();
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
  };

  // Get analytics
  const getAnalytics = async () => {
    try {
      const analyticsData = await messagingService.getChatAnalytics(userId);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to get analytics:', error);
    }
  };

  // Send message
  const sendMessage = async (text: string) => {
    if (!activeConversation) return;
    
    try {
      await messagingService.sendMessage(activeConversation.conversation.id, {
        conversationId: activeConversation.conversation.id,
        senderId: userId,
        receiverId: activeConversation.otherProfile.id,
        text,
        type: 'text'
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Send voice message
  const sendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!activeConversation) return;
    
    try {
      await messagingService.sendVoiceMessage(activeConversation.conversation.id, audioBlob, duration);
    } catch (error) {
      console.error('Failed to send voice message:', error);
    }
  };

  // Send GIF message
  const sendGifMessage = async (gifUrl: string, gifId: string) => {
    if (!activeConversation) return;
    
    try {
      await messagingService.sendGifMessage(activeConversation.conversation.id, gifUrl, gifId);
    } catch (error) {
      console.error('Failed to send GIF message:', error);
    }
  };

  // Send poll
  const sendPoll = async (question: string, options: string[]) => {
    if (!activeConversation) return;
    
    try {
      await messagingService.sendPoll(activeConversation.conversation.id, question, options);
    } catch (error) {
      console.error('Failed to send poll:', error);
    }
  };

  // Add reaction
  const addReaction = async (messageId: string, emoji: string) => {
    try {
      await messagingService.addReaction(messageId, userId, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  // Vote on poll
  const voteOnPoll = async (messageId: string, option: string) => {
    try {
      await messagingService.voteOnPoll(messageId, userId, option);
    } catch (error) {
      console.error('Failed to vote on poll:', error);
    }
  };

  // Search messages
  const searchMessages = async (query: string) => {
    try {
      const results = await messagingService.searchMessages(query, userId);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search messages:', error);
    }
  };

  // Mark as read
  const markAsRead = async (conversationId: string) => {
    try {
      await messagingService.markConversationAsRead(conversationId);
      refreshConversations();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      await messagingService.deleteConversation(conversationId);
      if (activeConversation?.conversation.id === conversationId) {
        setActiveConversation(null);
      }
      refreshConversations();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // Block user
  const blockUser = async (conversationId: string) => {
    try {
      await messagingService.blockUser(conversationId);
      refreshConversations();
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  // Report user
  const reportUser = async (conversationId: string, reason: string) => {
    try {
      await messagingService.reportUser(conversationId, reason);
    } catch (error) {
      console.error('Failed to report user:', error);
    }
  };

  // Start voice call
  const startVoiceCall = async (conversationId: string) => {
    try {
      await messagingService.startVoiceCall(conversationId);
    } catch (error) {
      console.error('Failed to start voice call:', error);
    }
  };

  // Start video call
  const startVideoCall = async (conversationId: string) => {
    try {
      await messagingService.startVideoCall(conversationId);
    } catch (error) {
      console.error('Failed to start video call:', error);
    }
  };

  // Share location
  const shareLocation = async (location: any) => {
    if (!activeConversation) return;
    
    try {
      await messagingService.shareLocation(activeConversation.conversation.id, location);
    } catch (error) {
      console.error('Failed to share location:', error);
    }
  };

  // Send date invite
  const sendDateInvite = async (dateDetails: any) => {
    if (!activeConversation) return;
    
    try {
      await messagingService.sendDateInvite(activeConversation.conversation.id, dateDetails);
    } catch (error) {
      console.error('Failed to send date invite:', error);
    }
  };

  // Send AI enhanced message
  const sendAIEnhancedMessage = async (prompt: string) => {
    if (!activeConversation) return;
    
    try {
      await messagingService.sendAIEnhancedMessage(activeConversation.conversation.id, prompt);
    } catch (error) {
      console.error('Failed to send AI enhanced message:', error);
    }
  };

  // Toggle conversation pin
  const toggleConversationPin = async (conversationId: string) => {
    try {
      await messagingService.toggleConversationPin(conversationId);
      refreshConversations();
    } catch (error) {
      console.error('Failed to toggle conversation pin:', error);
    }
  };

  // Toggle conversation mute
  const toggleConversationMute = async (conversationId: string) => {
    try {
      await messagingService.toggleConversationMute(conversationId);
      refreshConversations();
    } catch (error) {
      console.error('Failed to toggle conversation mute:', error);
    }
  };

  // Toggle conversation archive
  const toggleConversationArchive = async (conversationId: string) => {
    try {
      await messagingService.toggleConversationArchive(conversationId);
      refreshConversations();
    } catch (error) {
      console.error('Failed to toggle conversation archive:', error);
    }
  };

  // Get conversation by ID
  const getConversationById = (conversationId: string): ConversationWithProfile | null => {
    return conversations.find(conv => conv.conversation.id === conversationId) || null;
  };

  // Get unread count
  const getUnreadCount = (): number => {
    return conversations.reduce((sum, conv) => sum + conv.conversation.unreadCount, 0);
  };

  const contextValue: ChatContextType = {
    // State
    conversations,
    activeConversation,
    unreadCount,
    isTyping,
    searchResults,
    analytics,
    
    // Actions
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
    
    // Utility
    getConversationById,
    getUnreadCount,
    refreshConversations,
    getAnalytics,
  };

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
