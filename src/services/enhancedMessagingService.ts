import { supabase } from '../lib/supabase';

export interface EnhancedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'voice' | 'location' | 'date-invite' | 'ai-enhanced' | 'story-reply' | 'gif' | 'file' | 'poll' | 'voice-note' | 'sticker' | 'contact' | 'location-share';
  metadata?: {
    originalPrompt?: string;
    fileUrl?: string;
    fileSize?: number;
    fileType?: string;
    duration?: number;
    location?: {
      lat: number;
      lng: number;
      name: string;
      address?: string;
    };
    reactions?: MessageReaction[];
    replyTo?: string;
    storyId?: string;
    pollOptions?: string[];
    pollResults?: { [key: string]: number };
    gifUrl?: string;
    gifId?: string;
    stickerId?: string;
    contactInfo?: {
      name: string;
      phone?: string;
      email?: string;
    };
    editHistory?: string[];
    isEdited?: boolean;
    expiresAt?: Date;
    isForwarded?: boolean;
    forwardedFrom?: string;
    forwardedAt?: Date;
  };
  isDeleted?: boolean;
  isEdited?: boolean;
  editHistory?: string[];
  expiresAt?: Date;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Date;
  reactionId: string;
}

export interface EnhancedChatConversation {
  id: string;
  participantIds: string[];
  lastMessage: EnhancedMessage;
  unreadCount: number;
  isTyping: boolean;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
  isArchived?: boolean;
  isBlocked?: boolean;
  customName?: string;
  theme?: string;
  notificationSettings?: {
    sound: boolean;
    vibration: boolean;
    preview: boolean;
    doNotDisturb: boolean;
    quietHours?: {
      start: string;
      end: string;
    };
  };
  typingUsers?: string[];
  lastSeen?: Date;
  isGroupChat?: boolean;
  groupInfo?: {
    name: string;
    description?: string;
    avatar?: string;
    admins: string[];
    members: string[];
  };
}

export interface ConversationWithEnhancedProfile {
  conversation: EnhancedChatConversation;
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
    status?: string;
    mood?: string;
    activity?: string;
    typingStatus?: 'typing' | 'recording' | 'online' | 'offline';
  };
  messages: EnhancedMessage[];
  compatibilityScore?: number;
  conversationInsights?: {
    totalMessages: number;
    averageResponseTime: number;
    commonTopics: string[];
    sentimentScore: number;
    bestTimeToChat: string;
    messageFrequency: 'high' | 'medium' | 'low';
    conversationQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface ChatAnalytics {
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  mostActiveHours: { hour: number; count: number }[];
  topEmojis: { emoji: string; count: number }[];
  conversationQuality: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  messageTypes: {
    text: number;
    image: number;
    voice: number;
    location: number;
    other: number;
  };
  weeklyActivity: { date: string; messages: number }[];
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface MessageSearchResult {
  message: EnhancedMessage;
  conversation: EnhancedChatConversation;
  profile: any;
  relevanceScore: number;
  context: string;
}

class EnhancedMessagingService {
  private userId: string | null = null;
  private conversations: ConversationWithEnhancedProfile[] = [];
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private realtimeSubscriptions: any[] = [];
  private messageCache: Map<string, EnhancedMessage[]> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map();
  private onlineUsers: Set<string> = new Set();

  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.setupRealtimeSubscriptions();
    await this.loadConversations();
    await this.setupPresence();
  }

  private async setupRealtimeSubscriptions(): Promise<void> {
    if (!this.userId) return;

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${this.userId}`
      }, (payload) => {
        this.handleNewMessage(payload.new as EnhancedMessage);
      })
      .subscribe();

    // Subscribe to message updates (reactions, edits, etc.)
    const messageUpdatesSubscription = supabase
      .channel('message_updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        this.handleMessageUpdate(payload.new as EnhancedMessage);
      })
      .subscribe();

    // Subscribe to conversation updates
    const conversationUpdatesSubscription = supabase
      .channel('conversation_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations'
      }, (payload) => {
        this.handleConversationUpdate(payload);
      })
      .subscribe();

    // Subscribe to typing indicators
    const typingSubscription = supabase
      .channel('typing')
      .on('broadcast', { event: 'typing' }, (payload) => {
        this.handleTypingIndicator(payload);
      })
      .subscribe();

    // Subscribe to presence updates
    const presenceSubscription = supabase
      .channel('presence')
      .on('presence', { event: 'sync' }, () => {
        this.handlePresenceSync();
      })
      .on('presence', { event: 'join' }, (payload) => {
        this.handleUserJoin(payload);
      })
      .on('presence', { event: 'leave' }, (payload) => {
        this.handleUserLeave(payload);
      })
      .subscribe();

    this.realtimeSubscriptions.push(
      messagesSubscription,
      messageUpdatesSubscription,
      conversationUpdatesSubscription,
      typingSubscription,
      presenceSubscription
    );
  }

  private async setupPresence(): Promise<void> {
    if (!this.userId) return;

    const channel = supabase.channel('presence');
    await channel.track({
      user_id: this.userId,
      online_at: new Date().toISOString(),
      last_seen: new Date().toISOString()
    });
  }

  private async handleNewMessage(message: EnhancedMessage): Promise<void> {
    // Update conversation list
    await this.loadConversations();
    
    // Update message cache
    const conversationMessages = this.messageCache.get(message.conversationId) || [];
    conversationMessages.push(message);
    this.messageCache.set(message.conversationId, conversationMessages);
    
    // Emit event for UI updates
    this.emit('newMessage', message);
  }

  private async handleMessageUpdate(message: EnhancedMessage): Promise<void> {
    // Update message in cache
    const conversationMessages = this.messageCache.get(message.conversationId) || [];
    const messageIndex = conversationMessages.findIndex(m => m.id === message.id);
    if (messageIndex !== -1) {
      conversationMessages[messageIndex] = message;
      this.messageCache.set(message.conversationId, conversationMessages);
    }
    
    // Emit event for UI updates
    this.emit('messageUpdate', message);
  }

  private async handleConversationUpdate(payload: any): Promise<void> {
    // Reload conversations to get latest updates
    await this.loadConversations();
    
    // Emit event for UI updates
    this.emit('conversationUpdate', payload);
  }

  private handleTypingIndicator(payload: any): void {
    const { conversationId, userId, isTyping } = payload;
    
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    
    const typingSet = this.typingUsers.get(conversationId)!;
    
    if (isTyping) {
      typingSet.add(userId);
    } else {
      typingSet.delete(userId);
    }
    
    // Emit typing update event
    this.emit('typingUpdate', conversationId, Array.from(typingSet));
  }

  private handlePresenceSync(): void {
    // Handle presence sync
  }

  private handleUserJoin(payload: any): void {
    const { key, newPresences } = payload;
    newPresences.forEach((presence: any) => {
      this.onlineUsers.add(presence.user_id);
    });
    this.emit('onlineStatusChange', key, true);
  }

  private handleUserLeave(payload: any): void {
    const { key, leftPresences } = payload;
    leftPresences.forEach((presence: any) => {
      this.onlineUsers.delete(presence.user_id);
    });
    this.emit('onlineStatusChange', key, false);
  }

  async loadConversations(): Promise<ConversationWithEnhancedProfile[]> {
    if (!this.userId) return [];

    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages (
            *,
            reactions (*)
          ),
          profiles!conversations_participant_ids_fkey (
            id,
            name,
            age,
            location,
            photos,
            match_percentage,
            common_interests,
            all_time_favorites,
            bio,
            last_seen
          )
        `)
        .contains('participant_ids', [this.userId]);

      if (error) throw error;

      this.conversations = conversations.map(this.transformConversationData);
      return this.conversations;
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  private transformConversationData(rawData: any): ConversationWithEnhancedProfile {
    // Transform raw database data to our interface format
    return {
      conversation: {
        id: rawData.id,
        participantIds: rawData.participant_ids,
        lastMessage: rawData.messages?.[0] || this.createEmptyMessage(),
        unreadCount: rawData.unread_count || 0,
        isTyping: false,
        isPinned: rawData.is_pinned || false,
        isMuted: rawData.is_muted || false,
        createdAt: new Date(rawData.created_at),
        updatedAt: new Date(rawData.updated_at),
        isArchived: rawData.is_archived || false,
        isBlocked: rawData.is_blocked || false,
        customName: rawData.custom_name,
        theme: rawData.theme,
        notificationSettings: rawData.notification_settings,
        typingUsers: [],
        lastSeen: rawData.last_seen ? new Date(rawData.last_seen) : undefined,
        isGroupChat: rawData.is_group_chat || false,
        groupInfo: rawData.group_info
      },
      otherProfile: {
        id: rawData.profiles?.id || '',
        name: rawData.profiles?.name || 'Unknown',
        age: rawData.profiles?.age || 0,
        location: rawData.profiles?.location || '',
        photos: rawData.profiles?.photos || [],
        matchPercentage: rawData.profiles?.match_percentage || 0,
        commonInterests: rawData.profiles?.common_interests || [],
        allTimeFavorites: rawData.profiles?.all_time_favorites || {},
        bio: rawData.profiles?.bio || '',
        isOnline: this.onlineUsers.has(rawData.profiles?.id),
        lastSeen: rawData.profiles?.last_seen ? new Date(rawData.profiles.last_seen) : undefined,
        status: rawData.profiles?.status,
        mood: rawData.profiles?.mood,
        activity: rawData.profiles?.activity,
        typingStatus: 'offline'
      },
      messages: rawData.messages || [],
      compatibilityScore: this.calculateCompatibilityScore(rawData),
      conversationInsights: this.generateConversationInsights(rawData.messages || [])
    };
  }

  private createEmptyMessage(): EnhancedMessage {
    return {
      id: '',
      conversationId: '',
      senderId: '',
      receiverId: '',
      text: '',
      timestamp: new Date(),
      status: 'sent',
      type: 'text'
    };
  }

  private calculateCompatibilityScore(data: any): number {
    // Implement compatibility scoring algorithm
    let score = 50; // Base score
    
    // Add points for common interests
    if (data.profiles?.common_interests) {
      score += Math.min(data.profiles.common_interests.length * 5, 30);
    }
    
    // Add points for match percentage
    if (data.profiles?.match_percentage) {
      score += (data.profiles.match_percentage - 50) * 0.4;
    }
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateConversationInsights(messages: EnhancedMessage[]): any {
    if (messages.length === 0) {
      return {
        totalMessages: 0,
        averageResponseTime: 0,
        commonTopics: [],
        sentimentScore: 0,
        bestTimeToChat: 'Unknown',
        messageFrequency: 'low' as const,
        conversationQuality: 'poor' as const
      };
    }

    // Calculate response times
    const responseTimes: number[] = [];
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].senderId !== messages[i-1].senderId) {
        const timeDiff = new Date(messages[i].timestamp).getTime() - 
                        new Date(messages[i-1].timestamp).getTime();
        responseTimes.push(timeDiff);
      }
    }

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Determine message frequency
    const totalTime = new Date(messages[messages.length - 1].timestamp).getTime() - 
                     new Date(messages[0].timestamp).getTime();
    const messagesPerHour = (messages.length / (totalTime / (1000 * 60 * 60)));
    
    let messageFrequency: 'high' | 'medium' | 'low' = 'low';
    if (messagesPerHour > 10) messageFrequency = 'high';
    else if (messagesPerHour > 3) messageFrequency = 'medium';

    // Determine conversation quality based on engagement
    let conversationQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor';
    if (messages.length > 50 && avgResponseTime < 300000) conversationQuality = 'excellent';
    else if (messages.length > 20 && avgResponseTime < 600000) conversationQuality = 'good';
    else if (messages.length > 10) conversationQuality = 'fair';

    return {
      totalMessages: messages.length,
      averageResponseTime: avgResponseTime,
      commonTopics: this.extractCommonTopics(messages),
      sentimentScore: this.calculateSentimentScore(messages),
      bestTimeToChat: this.findBestTimeToChat(messages),
      messageFrequency,
      conversationQuality
    };
  }

  private extractCommonTopics(messages: EnhancedMessage[]): string[] {
    // Simple keyword extraction - in a real app, you'd use NLP
    const commonWords = ['love', 'date', 'coffee', 'movie', 'dinner', 'travel', 'music'];
    const topicCounts: { [key: string]: number } = {};
    
    messages.forEach(message => {
      const text = message.text.toLowerCase();
      commonWords.forEach(word => {
        if (text.includes(word)) {
          topicCounts[word] = (topicCounts[word] || 0) + 1;
        }
      });
    });

    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private calculateSentimentScore(messages: EnhancedMessage[]): number {
    // Simple sentiment analysis - in a real app, you'd use a proper sentiment analysis service
    const positiveWords = ['love', 'great', 'amazing', 'wonderful', 'happy', 'excited'];
    const negativeWords = ['hate', 'terrible', 'awful', 'sad', 'angry', 'disappointed'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    messages.forEach(message => {
      const text = message.text.toLowerCase();
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeCount++;
      });
    });

    const total = positiveCount + negativeCount;
    if (total === 0) return 0;
    
    return Math.round(((positiveCount - negativeCount) / total) * 100);
  }

  private findBestTimeToChat(messages: EnhancedMessage[]): string {
    if (messages.length === 0) return 'Unknown';
    
    const hourCounts: { [key: number]: number } = {};
    messages.forEach(message => {
      const hour = new Date(message.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const bestHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    return `${bestHour}:00`;
  }

  // Public API methods
  async sendMessage(conversationId: string, messageData: Partial<EnhancedMessage>): Promise<EnhancedMessage> {
    if (!this.userId) throw new Error('User not initialized');

    const message: Partial<EnhancedMessage> = {
      conversationId,
      senderId: this.userId,
      receiverId: messageData.receiverId || '',
      text: messageData.text || '',
      timestamp: new Date(),
      status: 'sending',
      type: messageData.type || 'text',
      metadata: messageData.metadata || {}
    };

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select()
        .single();

      if (error) throw error;

      // Update local cache
      const conversationMessages = this.messageCache.get(conversationId) || [];
      conversationMessages.push(data as EnhancedMessage);
      this.messageCache.set(conversationId, conversationMessages);

      // Update conversation
      await this.loadConversations();

      return data as EnhancedMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendVoiceMessage(conversationId: string, audioBlob: Blob, duration: number): Promise<EnhancedMessage> {
    // Upload audio file first
    const fileName = `voice_${Date.now()}.webm`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(fileName, audioBlob);

    if (uploadError) throw uploadError;

    const fileUrl = supabase.storage
      .from('voice-messages')
      .getPublicUrl(fileName).data.publicUrl;

    // Send message with voice metadata
    return this.sendMessage(conversationId, {
      type: 'voice-note',
      text: '🎤 Voice message',
      metadata: {
        fileUrl,
        duration,
        fileSize: audioBlob.size,
        fileType: 'audio/webm'
      }
    });
  }

  async sendGifMessage(conversationId: string, gifUrl: string, gifId: string): Promise<EnhancedMessage> {
    return this.sendMessage(conversationId, {
      type: 'gif',
      text: '🎬 GIF',
      metadata: {
        gifUrl,
        gifId
      }
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('message_reactions')
        .upsert({
          message_id: messageId,
          user_id: userId,
          emoji,
          timestamp: new Date().toISOString()
        });

      if (error) throw error;

      // Update local cache
      this.updateMessageReaction(messageId, userId, emoji);
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  }

  private updateMessageReaction(messageId: string, userId: string, emoji: string): void {
    // Update reaction in message cache
    for (const [conversationId, messages] of this.messageCache) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        if (!message.metadata) message.metadata = {};
        if (!message.metadata.reactions) message.metadata.reactions = [];
        
        const existingReactionIndex = message.metadata.reactions.findIndex(
          r => r.userId === userId
        );
        
        if (existingReactionIndex !== -1) {
          message.metadata.reactions[existingReactionIndex].emoji = emoji;
        } else {
          message.metadata.reactions.push({
            userId,
            emoji,
            timestamp: new Date(),
            reactionId: `${messageId}_${userId}`
          });
        }
        break;
      }
    }
  }

  async markConversationAsRead(conversationId: string): Promise<void> {
    if (!this.userId) return;

    try {
      const { error } = await supabase
        .from('conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId);

      if (error) throw error;

      // Update local state
      const conversation = this.conversations.find(c => c.conversation.id === conversationId);
      if (conversation) {
        conversation.conversation.unreadCount = 0;
      }
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }

  async toggleConversationPin(conversationId: string): Promise<void> {
    try {
      const conversation = this.conversations.find(c => c.conversation.id === conversationId);
      if (!conversation) return;

      const newPinStatus = !conversation.conversation.isPinned;
      
      const { error } = await supabase
        .from('conversations')
        .update({ is_pinned: newPinStatus })
        .eq('id', conversationId);

      if (error) throw error;

      // Update local state
      conversation.conversation.isPinned = newPinStatus;
    } catch (error) {
      console.error('Error toggling conversation pin:', error);
    }
  }

  async toggleConversationMute(conversationId: string): Promise<void> {
    try {
      const conversation = this.conversations.find(c => c.conversation.id === conversationId);
      if (!conversation) return;

      const newMuteStatus = !conversation.conversation.isMuted;
      
      const { error } = await supabase
        .from('conversations')
        .update({ is_muted: newMuteStatus })
        .eq('id', conversationId);

      if (error) throw error;

      // Update local state
      conversation.conversation.isMuted = newMuteStatus;
    } catch (error) {
      console.error('Error toggling conversation mute:', error);
    }
  }

  async toggleConversationArchive(conversationId: string): Promise<void> {
    try {
      const conversation = this.conversations.find(c => c.conversation.id === conversationId);
      if (!conversation) return;

      const newArchiveStatus = !conversation.conversation.isArchived;
      
      const { error } = await supabase
        .from('conversations')
        .update({ is_archived: newArchiveStatus })
        .eq('id', conversationId);

      if (error) throw error;

      // Update local state
      conversation.conversation.isArchived = newArchiveStatus;
    } catch (error) {
      console.error('Error toggling conversation archive:', error);
    }
  }

  async searchMessages(query: string, userId: string): Promise<MessageSearchResult[]> {
    if (!this.userId) return [];

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          *,
          conversations (*),
          profiles!messages_sender_id_fkey (*)
        `)
        .textSearch('text', query)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      if (error) throw error;

      return messages.map((msg: any) => ({
        message: this.transformMessageData(msg),
        conversation: this.transformConversationData(msg.conversations),
        profile: msg.profiles,
        relevanceScore: this.calculateRelevanceScore(msg.text, query),
        context: this.extractContext(msg.text, query)
      })).sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  private transformMessageData(rawData: any): EnhancedMessage {
    return {
      id: rawData.id,
      conversationId: rawData.conversation_id,
      senderId: rawData.sender_id,
      receiverId: rawData.receiver_id,
      text: rawData.text,
      timestamp: new Date(rawData.timestamp),
      status: rawData.status,
      type: rawData.type,
      metadata: rawData.metadata,
      isDeleted: rawData.is_deleted,
      isEdited: rawData.is_edited,
      editHistory: rawData.edit_history,
      expiresAt: rawData.expires_at ? new Date(rawData.expires_at) : undefined
    };
  }

  private calculateRelevanceScore(text: string, query: string): number {
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    if (textLower.includes(queryLower)) return 100;
    if (textLower.includes(queryLower.split(' ')[0])) return 80;
    if (textLower.includes(queryLower.split(' ').slice(-1)[0])) return 60;
    
    // Simple word similarity
    const textWords = textLower.split(' ');
    const queryWords = queryLower.split(' ');
    const commonWords = textWords.filter(word => queryWords.includes(word));
    
    return (commonWords.length / queryWords.length) * 50;
  }

  private extractContext(text: string, query: string): string {
    const queryIndex = text.toLowerCase().indexOf(query.toLowerCase());
    if (queryIndex === -1) return text.substring(0, 100) + '...';
    
    const start = Math.max(0, queryIndex - 50);
    const end = Math.min(text.length, queryIndex + query.length + 50);
    
    return (start > 0 ? '...' : '') + 
           text.substring(start, end) + 
           (end < text.length ? '...' : '');
  }

  async getChatAnalytics(userId: string): Promise<ChatAnalytics> {
    if (!this.userId) throw new Error('User not initialized');

    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      if (error) throw error;

      return this.calculateAnalytics(messages);
    } catch (error) {
      console.error('Error getting chat analytics:', error);
      throw error;
    }
  }

  private calculateAnalytics(messages: any[]): ChatAnalytics {
    const totalMessages = messages.length;
    const messageTypes: { [key: string]: number } = {};
    const emojiCounts: { [key: string]: number } = {};
    const hourlyActivity: { [key: number]: number } = {};
    const weeklyActivity: { [key: string]: number } = {};

    messages.forEach(message => {
      // Count message types
      messageTypes[message.type] = (messageTypes[message.type] || 0) + 1;
      
      // Count emojis in text
      const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
      const emojis = message.text.match(emojiRegex) || [];
      emojis.forEach((emoji: string) => {
        emojiCounts[emoji] = (emojiCounts[emoji] || 0) + 1;
      });
      
      // Count hourly activity
      const hour = new Date(message.timestamp).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      
      // Count weekly activity
      const date = new Date(message.timestamp).toISOString().split('T')[0];
      weeklyActivity[date] = (weeklyActivity[date] || 0) + 1;
    });

    return {
      totalConversations: this.conversations.length,
      totalMessages,
      averageResponseTime: this.calculateAverageResponseTime(messages),
      mostActiveHours: Object.entries(hourlyActivity)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      topEmojis: Object.entries(emojiCounts)
        .map(([emoji, count]) => ({ emoji, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      conversationQuality: {
        excellent: Math.floor(totalMessages * 0.3),
        good: Math.floor(totalMessages * 0.4),
        fair: Math.floor(totalMessages * 0.2),
        poor: Math.floor(totalMessages * 0.1)
      },
      messageTypes: {
        text: messageTypes.text || 0,
        image: messageTypes.image || 0,
        voice: messageTypes.voice || 0,
        location: messageTypes.location || 0,
        other: totalMessages - (messageTypes.text || 0) - (messageTypes.image || 0) - (messageTypes.voice || 0) - (messageTypes.location || 0)
      },
      weeklyActivity: Object.entries(weeklyActivity)
        .map(([date, messages]) => ({ date, messages }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7)
    };
  }

  private calculateAverageResponseTime(messages: any[]): number {
    const responseTimes: number[] = [];
    
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].sender_id !== messages[i-1].sender_id) {
        const timeDiff = new Date(messages[i].timestamp).getTime() - 
                        new Date(messages[i-1].timestamp).getTime();
        responseTimes.push(timeDiff);
      }
    }
    
    return responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
  }

  // Typing indicator methods
  async setTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    if (!this.userId) return;

    try {
      await supabase.channel('typing').send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          conversationId,
          userId: this.userId,
          isTyping
        }
      });

      // Clear existing timeout
      const existingTimeout = this.typingTimeouts.get(conversationId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout to stop typing indicator
      if (isTyping) {
        const timeout = setTimeout(() => {
          this.setTypingIndicator(conversationId, false);
        }, 5000); // Stop typing indicator after 5 seconds
        this.typingTimeouts.set(conversationId, timeout);
      } else {
        this.typingTimeouts.delete(conversationId);
      }
    } catch (error) {
      console.error('Error setting typing indicator:', error);
    }
  }

  // Event emitter methods
  private eventListeners: { [key: string]: Function[] } = {};

  on(event: string, callback: Function): () => void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);

    return () => {
      const index = this.eventListeners[event].indexOf(callback);
      if (index > -1) {
        this.eventListeners[event].splice(index, 1);
      }
    };
  }

  private emit(event: string, ...args: any[]): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(...args));
    }
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    // Clear all timeouts
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();

    // Unsubscribe from all realtime subscriptions
    this.realtimeSubscriptions.forEach(subscription => {
      subscription.unsubscribe();
    });
    this.realtimeSubscriptions = [];

    // Clear caches
    this.messageCache.clear();
    this.typingUsers.clear();
    this.onlineUsers.clear();
  }

  // Getters
  getConversations(): ConversationWithEnhancedProfile[] {
    return this.conversations;
  }

  getConversationById(conversationId: string): ConversationWithEnhancedProfile | null {
    return this.conversations.find(c => c.conversation.id === conversationId) || null;
  }

  getMessages(conversationId: string): EnhancedMessage[] {
    return this.messageCache.get(conversationId) || [];
  }

  isUserTyping(conversationId: string): boolean {
    const typingSet = this.typingUsers.get(conversationId);
    return typingSet ? typingSet.size > 0 : false;
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}

export default new EnhancedMessagingService();
