import { supabase } from '../lib/supabase';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'voice' | 'location' | 'date-invite' | 'ai-enhanced' | 'story-reply' | 'gif' | 'file' | 'poll' | 'voice-note';
  metadata?: {
    originalPrompt?: string;
    fileUrl?: string;
    fileSize?: number;
    fileType?: string;
    duration?: number; // for voice messages
    location?: {
      lat: number;
      lng: number;
      name: string;
    };
    reactions?: MessageReaction[];
    replyTo?: string; // message ID being replied to
    storyId?: string; // for story replies
    pollOptions?: string[];
    pollResults?: { [key: string]: number };
    gifUrl?: string;
    gifId?: string;
  };
  isDeleted?: boolean;
  isEdited?: boolean;
  editHistory?: string[];
  expiresAt?: Date; // for temporary messages
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: Date;
}

export interface ChatConversation {
  id: string;
  participantIds: string[];
  lastMessage: Message;
  unreadCount: number;
  isTyping: boolean;
  isPinned: boolean;
  isMuted: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Advanced features
  isArchived?: boolean;
  isBlocked?: boolean;
  customName?: string; // for group chats
  theme?: string; // chat theme
  notificationSettings?: {
    sound: boolean;
    vibration: boolean;
    preview: boolean;
  };
}

export interface ConversationWithProfile {
  conversation: ChatConversation;
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
    // Enhanced profile features
    status?: string; // custom status
    mood?: string; // current mood
    activity?: string; // current activity
  };
  messages: Message[];
  // Smart features
  compatibilityScore?: number;
  conversationInsights?: {
    totalMessages: number;
    averageResponseTime: number;
    commonTopics: string[];
    sentimentScore: number;
    bestTimeToChat: string;
  };
}

export interface DateInvite {
  id: string;
  conversationId: string;
  fromUserId: string;
  toUserId: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location?: string;
  personalMessage?: string;
  status: 'pending' | 'accepted' | 'declined' | 'rescheduled';
  createdAt: Date;
  updatedAt: Date;
}

export interface AIEnhancedMessage {
  id: string;
  conversationId: string;
  originalPrompt: string;
  enhancedText: string;
  context: string;
  timestamp: Date;
}

export interface ChatAnalytics {
  totalConversations: number;
  totalMessages: number;
  averageResponseTime: number;
  mostActiveHours: { [hour: number]: number };
  topConversationPartners: Array<{
    profileId: string;
    name: string;
    messageCount: number;
    averageResponseTime: number;
  }>;
  sentimentTrends: Array<{
    date: string;
    positiveMessages: number;
    negativeMessages: number;
    neutralMessages: number;
  }>;
}

class MessagingService {
  private conversations: Map<string, ConversationWithProfile> = new Map();
  private messageListeners: Map<string, (message: Message) => void> = new Map();
  private typingListeners: Map<string, (conversationId: string, isTyping: boolean) => void> = new Map();
  private onlineStatusListeners: Map<string, (conversationId: string, isOnline: boolean) => void> = new Map();
  private reactionListeners: Map<string, (messageId: string, reaction: MessageReaction) => void> = new Map();
  private searchIndex: Map<string, Message[]> = new Map(); // for message search

  // Initialize messaging service
  async initialize(userId: string): Promise<void> {
    try {
      // Load existing conversations
      await this.loadConversations(userId);
      
      // Set up real-time listeners
      this.setupRealtimeListeners(userId);
      
      // Initialize search index
      this.buildSearchIndex();
      
      console.log('Enhanced messaging service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize messaging service:', error);
      throw error;
    }
  }

  // Build search index for message search
  private buildSearchIndex(): void {
    this.searchIndex.clear();
    this.conversations.forEach((conversation) => {
      conversation.messages.forEach((message) => {
        const words = message.text.toLowerCase().split(/\s+/);
        words.forEach((word) => {
          if (!this.searchIndex.has(word)) {
            this.searchIndex.set(word, []);
          }
          this.searchIndex.get(word)!.push(message);
        });
      });
    });
  }

  // Search messages across all conversations
  async searchMessages(query: string, userId: string): Promise<Message[]> {
    const searchTerm = query.toLowerCase();
    const results: Message[] = [];
    
    // Search in text content
    if (this.searchIndex.has(searchTerm)) {
      results.push(...this.searchIndex.get(searchTerm)!);
    }
    
    // Search in partial matches
    this.searchIndex.forEach((messages, word) => {
      if (word.includes(searchTerm) || searchTerm.includes(word)) {
        results.push(...messages);
      }
    });
    
    // Remove duplicates and filter by user's conversations
    const uniqueResults = results.filter((message, index, self) => 
      index === self.findIndex(m => m.id === message.id)
    );
    
    return uniqueResults.filter(message => {
      const conversation = this.conversations.get(message.conversationId);
      return conversation && conversation.conversation.participantIds.includes(userId);
    });
  }

  // Load user's conversations
  private async loadConversations(userId: string): Promise<void> {
    try {
      // In a real app, this would fetch from Supabase
      // For now, we'll use mock data
      const mockConversations = this.generateMockConversations(userId);
      
      mockConversations.forEach(conversation => {
        this.conversations.set(conversation.conversation.id, conversation);
      });
    } catch (error) {
      console.error('Failed to load conversations:', error);
      throw error;
    }
  }

  // Generate mock conversations for demo with enhanced features
  private generateMockConversations(userId: string): ConversationWithProfile[] {
    const fallbackImages = [
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=500&h=500&fit=crop&crop=face"
    ];

    const mockProfiles = [
      {
        id: '101',
        name: "Priya Sharma",
        age: 26,
        location: "Mumbai, Maharashtra",
        photos: [fallbackImages[0]],
        matchPercentage: 94,
        commonInterests: ["Taylor Swift", "Travel Photography", "Yoga", "Coffee"],
        allTimeFavorites: {
          singers: ["Taylor Swift", "Arijit Singh", "Ed Sheeran"],
          movies: ["La La Land", "The Notebook", "Before Sunrise"],
          food: ["Biryani", "Pizza", "Sushi"],
          books: ["The Alchemist", "Pride and Prejudice", "The Great Gatsby"],
          hobbies: ["Photography", "Yoga", "Travel", "Cooking", "Reading", "Music"]
        },
        bio: "Adventure seeker who loves exploring new places and trying different cuisines. Looking for someone who shares my passion for life and growth.",
        isOnline: true,
        lastSeen: new Date(),
        status: "✨ Living life one adventure at a time",
        mood: "Excited",
        activity: "Planning weekend trip"
      },
      {
        id: '102',
        name: "Ananya Patel",
        age: 28,
        location: "Delhi, NCR",
        photos: [fallbackImages[1]],
        matchPercentage: 89,
        commonInterests: ["Classical Music", "Art History", "Cooking", "Reading"],
        allTimeFavorites: {
          singers: ["Lata Mangeshkar", "Kishore Kumar", "Adele"],
          movies: ["Gone with the Wind", "Casablanca", "The Godfather"],
          food: ["Butter Chicken", "Pasta", "Sushi"],
          books: ["War and Peace", "1984", "The Catcher in the Rye"],
          hobbies: ["Painting", "Cooking", "Reading", "Museums", "Classical Music"]
        },
        bio: "Art enthusiast and foodie who believes in the power of meaningful conversations and shared experiences.",
        isOnline: false,
        lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: "🎨 Creating beauty in everyday moments",
        mood: "Peaceful",
        activity: "Reading a book"
      },
      {
        id: '103',
        name: "Zara Khan",
        age: 25,
        location: "Bangalore, Karnataka",
        photos: [fallbackImages[2]],
        matchPercentage: 87,
        commonInterests: ["Technology", "Startups", "Fitness", "Travel"],
        allTimeFavorites: {
          singers: ["Drake", "Post Malone", "The Weeknd"],
          movies: ["Inception", "The Matrix", "Interstellar"],
          food: ["Burgers", "Sushi", "Indian Street Food"],
          books: ["Zero to One", "The Lean Startup", "Atomic Habits"],
          hobbies: ["Coding", "Gym", "Travel", "Networking", "Reading"]
        },
        bio: "Tech entrepreneur and fitness enthusiast who loves building things that make a difference.",
        isOnline: true,
        lastSeen: new Date(),
        status: "🚀 Building the future, one line of code at a time",
        mood: "Focused",
        activity: "Working on startup"
      }
    ];

    return mockProfiles.map((profile, index) => {
      const conversationId = `conv_${userId}_${profile.id}`;
      const messages = this.generateMockMessages(conversationId, userId, profile.id);
      
      // Calculate conversation insights
      const totalMessages = messages.length;
      const averageResponseTime = this.calculateAverageResponseTime(messages);
      const commonTopics = this.extractCommonTopics(messages);
      const sentimentScore = this.calculateSentimentScore(messages);
      const bestTimeToChat = this.determineBestTimeToChat(messages);
      
      return {
        conversation: {
          id: conversationId,
          participantIds: [userId, profile.id],
          lastMessage: messages[messages.length - 1],
          unreadCount: Math.floor(Math.random() * 5),
          isTyping: false,
          isPinned: index === 0,
          isMuted: false,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
          isArchived: false,
          isBlocked: false,
          theme: index === 0 ? 'romantic' : 'default',
          notificationSettings: {
            sound: true,
            vibration: true,
            preview: true
          }
        },
        otherProfile: profile,
        messages,
        compatibilityScore: profile.matchPercentage,
        conversationInsights: {
          totalMessages,
          averageResponseTime,
          commonTopics,
          sentimentScore,
          bestTimeToChat
        }
      };
    });
  }

  // Calculate average response time between messages
  private calculateAverageResponseTime(messages: Message[]): number {
    if (messages.length < 2) return 0;
    
    let totalTime = 0;
    let responseCount = 0;
    
    for (let i = 1; i < messages.length; i++) {
      const currentMessage = messages[i];
      const previousMessage = messages[i - 1];
      
      if (currentMessage.senderId !== previousMessage.senderId) {
        const timeDiff = currentMessage.timestamp.getTime() - previousMessage.timestamp.getTime();
        totalTime += timeDiff;
        responseCount++;
      }
    }
    
    return responseCount > 0 ? totalTime / responseCount : 0;
  }

  // Extract common topics from messages
  private extractCommonTopics(messages: Message[]): string[] {
    const topics = ['travel', 'music', 'food', 'books', 'movies', 'hobbies', 'work', 'family', 'dreams', 'goals'];
    const topicCounts: { [key: string]: number } = {};
    
    messages.forEach(message => {
      const text = message.text.toLowerCase();
      topics.forEach(topic => {
        if (text.includes(topic)) {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        }
      });
    });
    
    return Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([topic]) => topic);
  }

  // Calculate sentiment score of conversation
  private calculateSentimentScore(messages: Message[]): number {
    const positiveWords = ['love', 'amazing', 'wonderful', 'great', 'awesome', 'beautiful', 'perfect', 'excited', 'happy'];
    const negativeWords = ['sad', 'angry', 'disappointed', 'terrible', 'awful', 'bad', 'upset', 'frustrated'];
    
    let score = 0;
    messages.forEach(message => {
      const text = message.text.toLowerCase();
      positiveWords.forEach(word => {
        if (text.includes(word)) score += 1;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) score -= 1;
      });
    });
    
    return Math.max(-100, Math.min(100, score));
  }

  // Determine best time to chat based on message patterns
  private determineBestTimeToChat(messages: Message[]): string {
    const hourCounts: { [hour: number]: number } = {};
    
    messages.forEach(message => {
      const hour = message.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const bestHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    if (!bestHour) return 'Evening (6 PM - 9 PM)';
    
    const hour = parseInt(bestHour);
    if (hour < 12) return 'Morning (9 AM - 12 PM)';
    if (hour < 17) return 'Afternoon (12 PM - 5 PM)';
    if (hour < 21) return 'Evening (6 PM - 9 PM)';
    return 'Night (9 PM - 12 AM)';
  }

  // Generate mock messages with enhanced features
  private generateMockMessages(conversationId: string, userId: string, otherUserId: string): Message[] {
    const mockTexts = [
      "Hey! How are you doing today? 😊",
      "I'm doing great! Just finished a really good book. Have you read anything interesting lately?",
      "That sounds amazing! I love reading too. What genre do you usually go for?",
      "I'm really into sci-fi and fantasy. Just finished 'The Three-Body Problem' - mind-blowing stuff!",
      "Oh wow, I've heard great things about that book! Maybe we could do a book club together sometime?",
      "That's such a great idea! I'd love that. What's your favorite book of all time?",
      "It's so hard to choose just one! But I think 'The Alchemist' really changed my perspective on life.",
      "I love that book too! The way it talks about following your dreams really resonates with me.",
      "Exactly! It's amazing how books can connect people who've never even met.",
      "Absolutely! Speaking of connections, I noticed we both love travel. What's your dream destination?",
      "I've always wanted to visit Japan! The culture, the food, the cherry blossoms - it all seems so magical.",
      "Japan is on my list too! Maybe we could plan a trip together someday? 😊",
      "That would be incredible! I can already imagine us exploring Tokyo together.",
      "It sounds like a perfect adventure! What's the most adventurous thing you've ever done?",
      "I went skydiving last year! It was terrifying but absolutely exhilarating. What about you?",
      "That's so brave! I've always wanted to try that. Maybe you could be my skydiving buddy?",
      "I'd love to! It's always more fun when you're not alone. What other adventures are on your bucket list?",
      "I want to learn scuba diving and maybe climb a mountain. What's your biggest dream?",
      "My biggest dream is to start a business that helps people connect and find love, just like this app!",
      "That's such a beautiful dream! I can tell you're really passionate about helping people.",
      "Thank you! It means a lot that you see that in me. What makes you happiest in life?",
      "I think it's the little moments - like having deep conversations like this one. You're really easy to talk to.",
      "That's so sweet! I feel the same way. I think we have a really special connection here.",
      "I completely agree! Maybe we should meet in person sometime? I'd love to continue this conversation over coffee.",
      "I'd love that! Coffee sounds perfect. When are you free?",
      "How about this weekend? I know a great little café in the city center.",
      "This weekend works perfectly! I'm really looking forward to meeting you in person.",
      "Me too! I have a feeling this is going to be the start of something really special. 💕"
    ];

    return mockTexts.map((text, index) => {
      const message: Message = {
        id: `msg_${conversationId}_${index}`,
        conversationId,
        senderId: index % 2 === 0 ? userId : otherUserId,
        receiverId: index % 2 === 0 ? otherUserId : userId,
        text,
        timestamp: new Date(Date.now() - (mockTexts.length - index) * 30 * 60 * 1000), // 30 min intervals
        status: 'read',
        type: 'text',
        metadata: {
          reactions: index % 3 === 0 ? [
            {
              userId: index % 2 === 0 ? otherUserId : userId,
              emoji: '❤️',
              timestamp: new Date()
            }
          ] : undefined
        }
      };
      
      // Add some variety with different message types
      if (index === 5) {
        message.type = 'gif';
        message.metadata = {
          ...message.metadata,
          gifUrl: 'https://media.giphy.com/media/example/giphy.gif',
          gifId: 'gif_123'
        };
      } else if (index === 10) {
        message.type = 'voice-note';
        message.metadata = {
          ...message.metadata,
          duration: 15,
          fileUrl: 'https://example.com/voice-note.mp3'
        };
      } else if (index === 15) {
        message.type = 'poll';
        message.metadata = {
          ...message.metadata,
          pollOptions: ['Coffee ☕', 'Tea 🍵', 'Hot Chocolate 🍫'],
          pollResults: { 'Coffee ☕': 2, 'Tea 🍵': 1, 'Hot Chocolate 🍫': 0 }
        };
      }
      
      return message;
    });
  }

  // Set up real-time listeners
  private setupRealtimeListeners(userId: string): void {
    // In a real app, this would set up Supabase real-time subscriptions
    // For now, we'll simulate real-time updates
    setInterval(() => {
      this.simulateRealtimeUpdates(userId);
    }, 10000); // Simulate updates every 10 seconds
  }

  // Simulate real-time updates for demo
  private simulateRealtimeUpdates(userId: string): void {
    // Randomly update online status
    this.conversations.forEach((conversation) => {
      if (Math.random() > 0.8) {
        conversation.otherProfile.isOnline = Math.random() > 0.5;
        this.notifyOnlineStatusChange(conversation.conversation.id, conversation.otherProfile.isOnline);
      }
    });
  }

  // Get all conversations for a user
  async getConversations(userId: string): Promise<ConversationWithProfile[]> {
    return Array.from(this.conversations.values());
  }

  // Get a specific conversation
  async getConversation(conversationId: string): Promise<ConversationWithProfile | null> {
    return this.conversations.get(conversationId) || null;
  }

  // Send a message
  async sendMessage(conversationId: string, message: Omit<Message, 'id' | 'timestamp' | 'status'>): Promise<Message> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const newMessage: Message = {
        ...message,
        id: `msg_${conversationId}_${Date.now()}`,
        timestamp: new Date(),
        status: 'sending'
      };

      // Add message to conversation
      conversation.messages.push(newMessage);
      conversation.conversation.lastMessage = newMessage;
      conversation.conversation.updatedAt = new Date();

      // Update conversation in map
      this.conversations.set(conversationId, conversation);

      // Update search index
      this.addToSearchIndex(newMessage);

      // Simulate message delivery
      setTimeout(() => {
        newMessage.status = 'sent';
        this.notifyMessageUpdate(newMessage);
      }, 1000);

      setTimeout(() => {
        newMessage.status = 'delivered';
        this.notifyMessageUpdate(newMessage);
      }, 2000);

      setTimeout(() => {
        newMessage.status = 'read';
        this.notifyMessageUpdate(newMessage);
      }, 5000);

      // Notify listeners
      this.notifyNewMessage(newMessage);

      return newMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  // Add message to search index
  private addToSearchIndex(message: Message): void {
    const words = message.text.toLowerCase().split(/\s+/);
    words.forEach((word) => {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, []);
      }
      this.searchIndex.get(word)!.push(message);
    });
  }

  // Send AI enhanced message
  async sendAIEnhancedMessage(conversationId: string, prompt: string): Promise<Message> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Generate AI enhanced message based on prompt
      const enhancedText = this.generateAIEnhancedMessage(prompt, conversation.otherProfile);
      
      const message: Omit<Message, 'id' | 'timestamp' | 'status'> = {
        conversationId,
        senderId: conversation.conversation.participantIds.find(id => id !== conversation.otherProfile.id)!,
        receiverId: conversation.otherProfile.id,
        text: enhancedText,
        type: 'ai-enhanced',
        metadata: { originalPrompt: prompt }
      };

      return await this.sendMessage(conversationId, message);
    } catch (error) {
      console.error('Failed to send AI enhanced message:', error);
      throw error;
    }
  }

  // Generate AI enhanced message
  private generateAIEnhancedMessage(prompt: string, profile: any): string {
    const responses = [
      `Hey ${profile.name}! ${prompt} I'd love to hear your thoughts on this. What do you think? 💫`,
      `Hi ${profile.name}! ${prompt} I feel like we could have such an interesting conversation about this. What's your take? 💭`,
      `Hello ${profile.name}! ${prompt} I'm really curious about your perspective. Would you mind sharing? ✨`,
      `Hey there ${profile.name}! ${prompt} I think this could be a great way for us to get to know each other better. What do you think? 💕`,
      `Hi ${profile.name}! ${prompt} I'd love to hear your story and share mine too. What's your experience with this? 💫`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Send date invite
  async sendDateInvite(conversationId: string, dateDetails: any): Promise<Message> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
        }

      const dateInviteText = `Hey ${conversation.otherProfile.name}! I'd love to invite you on a ${dateDetails.title.toLowerCase()} date. ${dateDetails.description} What do you think? Would you be interested? 💕`;

      const message: Omit<Message, 'id' | 'timestamp' | 'status'> = {
        conversationId,
        senderId: conversation.conversation.participantIds.find(id => id !== conversation.otherProfile.id)!,
        receiverId: conversation.otherProfile.id,
        text: dateInviteText,
        type: 'date-invite',
        metadata: dateDetails
      };

      return await this.sendMessage(conversationId, message);
    } catch (error) {
      console.error('Failed to send date invite:', error);
      throw error;
    }
  }

  // Add reaction to message
  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    try {
      // Find the message in any conversation
      let messageFound = false;
      this.conversations.forEach((conversation) => {
        const message = conversation.messages.find(m => m.id === messageId);
        if (message) {
          if (!message.metadata) message.metadata = {};
          if (!message.metadata.reactions) message.metadata.reactions = [];
          
          // Check if user already reacted
          const existingReaction = message.metadata.reactions.find(r => r.userId === userId);
          if (existingReaction) {
            existingReaction.emoji = emoji;
            existingReaction.timestamp = new Date();
          } else {
            message.metadata.reactions.push({
              userId,
              emoji,
              timestamp: new Date()
            });
          }
          
          messageFound = true;
          this.notifyReactionUpdate(messageId, message.metadata.reactions[message.metadata.reactions.length - 1]);
        }
      });
      
      if (!messageFound) {
        throw new Error('Message not found');
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
      throw error;
    }
  }

  // Send voice message
  async sendVoiceMessage(conversationId: string, audioBlob: Blob, duration: number): Promise<Message> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // In a real app, this would upload to cloud storage
      const audioUrl = URL.createObjectURL(audioBlob);

      const message: Omit<Message, 'id' | 'timestamp' | 'status'> = {
        conversationId,
        senderId: conversation.conversation.participantIds.find(id => id !== conversation.otherProfile.id)!,
        receiverId: conversation.otherProfile.id,
        text: '🎤 Voice message',
        type: 'voice-note',
        metadata: {
          fileUrl: audioUrl,
          duration,
          fileType: 'audio/mp3'
        }
      };

      return await this.sendMessage(conversationId, message);
    } catch (error) {
      console.error('Failed to send voice message:', error);
      throw error;
    }
  }

  // Send GIF message
  async sendGifMessage(conversationId: string, gifUrl: string, gifId: string): Promise<Message> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const message: Omit<Message, 'id' | 'timestamp' | 'status'> = {
        conversationId,
        senderId: conversation.conversation.participantIds.find(id => id !== conversation.otherProfile.id)!,
        receiverId: conversation.otherProfile.id,
        text: '🎬 GIF message',
        type: 'gif',
        metadata: {
          gifUrl,
          gifId
        }
      };

      return await this.sendMessage(conversationId, message);
    } catch (error) {
      console.error('Failed to send GIF message:', error);
      throw error;
    }
  }

  // Create and send poll
  async sendPoll(conversationId: string, question: string, options: string[]): Promise<Message> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const message: Omit<Message, 'id' | 'timestamp' | 'status'> = {
        conversationId,
        senderId: conversation.conversation.participantIds.find(id => id !== conversation.otherProfile.id)!,
        receiverId: conversation.otherProfile.id,
        text: `📊 ${question}`,
        type: 'poll',
        metadata: {
          pollOptions: options,
          pollResults: options.reduce((acc, option) => {
            acc[option] = 0;
            return acc;
          }, {} as { [key: string]: number })
        }
      };

      return await this.sendMessage(conversationId, message);
    } catch (error) {
      console.error('Failed to send poll:', error);
      throw error;
    }
  }

  // Vote on poll
  async voteOnPoll(messageId: string, userId: string, option: string): Promise<void> {
    try {
      this.conversations.forEach((conversation) => {
        const message = conversation.messages.find(m => m.id === messageId);
        if (message && message.type === 'poll' && message.metadata?.pollResults) {
          message.metadata.pollResults[option]++;
          this.notifyMessageUpdate(message);
        }
      });
    } catch (error) {
      console.error('Failed to vote on poll:', error);
      throw error;
    }
  }

  // Mark conversation as read
  async markConversationAsRead(conversationId: string): Promise<void> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.conversation.unreadCount = 0;
        this.conversations.set(conversationId, conversation);
      }
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
      throw error;
    }
  }

  // Set typing indicator
  async setTypingIndicator(conversationId: string, isTyping: boolean): Promise<void> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.conversation.isTyping = isTyping;
        this.conversations.set(conversationId, conversation);
        this.notifyTypingUpdate(conversationId, isTyping);
      }
    } catch (error) {
      console.error('Failed to set typing indicator:', error);
      throw error;
    }
  }

  // Pin/unpin conversation
  async toggleConversationPin(conversationId: string): Promise<void> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.conversation.isPinned = !conversation.conversation.isPinned;
        this.conversations.set(conversationId, conversation);
      }
    } catch (error) {
      console.error('Failed to toggle conversation pin:', error);
      throw error;
    }
  }

  // Mute/unmute conversation
  async toggleConversationMute(conversationId: string): Promise<void> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.conversation.isMuted = !conversation.conversation.isMuted;
        this.conversations.set(conversationId, conversation);
      }
    } catch (error) {
      console.error('Failed to toggle conversation mute:', error);
      throw error;
    }
  }

  // Archive conversation
  async toggleConversationArchive(conversationId: string): Promise<void> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.conversation.isArchived = !conversation.conversation.isArchived;
        this.conversations.set(conversationId, conversation);
      }
    } catch (error) {
      console.error('Failed to toggle conversation archive:', error);
      throw error;
    }
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      this.conversations.delete(conversationId);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      throw error;
    }
  }

  // Block user
  async blockUser(conversationId: string): Promise<void> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (conversation) {
        conversation.conversation.isBlocked = true;
        this.conversations.set(conversationId, conversation);
      }
      // In a real app, this would update the database
      console.log(`User blocked in conversation: ${conversationId}`);
    } catch (error) {
      console.error('Failed to block user:', error);
      throw error;
    }
  }

  // Report user
  async reportUser(conversationId: string, reason: string): Promise<void> {
    try {
      // In a real app, this would create a report in the database
      console.log(`User reported in conversation: ${conversationId}, reason: ${reason}`);
    } catch (error) {
      console.error('Failed to report user:', error);
      throw error;
    }
  }

  // Share location
  async shareLocation(conversationId: string, location: any): Promise<Message> {
    try {
      const conversation = this.conversations.get(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const locationText = `📍 I'm currently at ${location.name || 'this location'}. Would you like to meet here?`;

      const message: Omit<Message, 'id' | 'timestamp' | 'status'> = {
        conversationId,
        senderId: conversation.conversation.participantIds.find(id => id !== conversation.otherProfile.id)!,
        receiverId: conversation.otherProfile.id,
        text: locationText,
        type: 'location',
        metadata: location
      };

      return await this.sendMessage(conversationId, message);
    } catch (error) {
      console.error('Failed to share location:', error);
      throw error;
    }
  }

  // Start voice call
  async startVoiceCall(conversationId: string): Promise<void> {
    try {
      // In a real app, this would integrate with a calling service
      console.log(`Voice call started for conversation: ${conversationId}`);
    } catch (error) {
      console.error('Failed to start voice call:', error);
      throw error;
    }
  }

  // Start video call
  async startVideoCall(conversationId: string): Promise<void> {
    try {
      // In a real app, this would integrate with a video calling service
      console.log(`Video call started for conversation: ${conversationId}`);
    } catch (error) {
      console.error('Failed to start video call:', error);
      throw error;
    }
  }

  // Get chat analytics
  async getChatAnalytics(userId: string): Promise<ChatAnalytics> {
    try {
      const conversations = await this.getConversations(userId);
      const allMessages = conversations.flatMap(c => c.messages);
      
      // Calculate analytics
      const totalConversations = conversations.length;
      const totalMessages = allMessages.length;
      const averageResponseTime = conversations.reduce((sum, c) => 
        sum + (c.conversationInsights?.averageResponseTime || 0), 0) / totalConversations;
      
      // Most active hours
      const hourCounts: { [hour: number]: number } = {};
      allMessages.forEach(message => {
        const hour = message.timestamp.getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      // Top conversation partners
      const partnerStats = conversations.map(c => ({
        profileId: c.otherProfile.id,
        name: c.otherProfile.name,
        messageCount: c.messages.length,
        averageResponseTime: c.conversationInsights?.averageResponseTime || 0
      })).sort((a, b) => b.messageCount - a.messageCount).slice(0, 5);
      
      // Sentiment trends (simplified)
      const sentimentTrends = conversations.map(c => ({
        date: c.conversation.updatedAt.toISOString().split('T')[0],
        positiveMessages: Math.max(0, (c.conversationInsights?.sentimentScore || 0)),
        negativeMessages: Math.max(0, -(c.conversationInsights?.sentimentScore || 0)),
        neutralMessages: Math.max(0, 100 - Math.abs(c.conversationInsights?.sentimentScore || 0))
      }));
      
      return {
        totalConversations,
        totalMessages,
        averageResponseTime,
        mostActiveHours: hourCounts,
        topConversationPartners: partnerStats,
        sentimentTrends
      };
    } catch (error) {
      console.error('Failed to get chat analytics:', error);
      throw error;
    }
  }

  // Event listeners
  onNewMessage(callback: (message: Message) => void): () => void {
    const id = Date.now().toString();
    this.messageListeners.set(id, callback);
    return () => this.messageListeners.delete(id);
  }

  onTypingUpdate(callback: (conversationId: string, isTyping: boolean) => void): () => void {
    const id = Date.now().toString();
    this.typingListeners.set(id, callback);
    return () => this.typingListeners.delete(id);
  }

  onOnlineStatusChange(callback: (conversationId: string, isOnline: boolean) => void): () => void {
    const id = Date.now().toString();
    this.onlineStatusListeners.set(id, callback);
    return () => this.onlineStatusListeners.delete(id);
  }

  onReactionUpdate(callback: (messageId: string, reaction: MessageReaction) => void): () => void {
    const id = Date.now().toString();
    this.reactionListeners.set(id, callback);
    return () => this.reactionListeners.delete(id);
  }

  // Notify listeners
  private notifyNewMessage(message: Message): void {
    this.messageListeners.forEach(callback => callback(message));
  }

  private notifyMessageUpdate(message: Message): void {
    this.messageListeners.forEach(callback => callback(message));
  }

  private notifyTypingUpdate(conversationId: string, isTyping: boolean): void {
    this.typingListeners.forEach(callback => callback(conversationId, isTyping));
  }

  private notifyOnlineStatusChange(conversationId: string, isOnline: boolean): void {
    this.onlineStatusListeners.forEach(callback => callback(conversationId, isOnline));
  }

  private notifyReactionUpdate(messageId: string, reaction: MessageReaction): void {
    this.reactionListeners.forEach(callback => callback(messageId, reaction));
  }

  // Cleanup
  cleanup(): void {
    this.messageListeners.clear();
    this.typingListeners.clear();
    this.onlineStatusListeners.clear();
    this.reactionListeners.clear();
    this.conversations.clear();
    this.searchIndex.clear();
  }
}

export default new MessagingService();
