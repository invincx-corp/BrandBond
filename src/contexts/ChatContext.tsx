import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { resolveMatchPercentage } from '../utils/matchPercentage';

type LocationShareRow = {
  id: string;
  conversation_id: string;
  sharer_id: string;
  viewer_id: string;
  status: 'active' | 'stopped' | 'expired';
  created_at: string;
  expires_at: string;
};

type UserLocationRow = {
  id: string;
  share_id: string;
  user_id: string;
  lat: number;
  lng: number;
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  updated_at: string;
};

export interface EnhancedMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  type: 'text' | 'image' | 'voice' | 'location' | 'date-invite' | 'ai-enhanced' | 'story-reply' | 'gif' | 'file' | 'poll' | 'voice-note' | 'sticker' | 'contact' | 'location-share';
  metadata?: any;
  isDeleted?: boolean;
  isEdited?: boolean;
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

export interface ConversationWithEnhancedProfile {
  conversation: {
    id: string;
    participantIds: string[];
    lastMessage: EnhancedMessage;
    unreadCount: number;
    isTyping: boolean;
    isPinned: boolean;
    isMuted: boolean;
    isBlocked?: boolean;
    createdAt: Date;
    updatedAt: Date;
    isArchived?: boolean;
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
    status?: string;
    mood?: string;
    activity?: string;
    typingStatus?: 'typing' | 'recording' | 'online' | 'offline';
  };
  messages: EnhancedMessage[];
  compatibilityScore?: number;
  conversationInsights?: any;
}

interface ChatContextType {
  // State
  userId: string | undefined;
  conversations: ConversationWithEnhancedProfile[];
  activeConversation: ConversationWithEnhancedProfile | null;
  unreadCount: number;
  isTyping: boolean;
  searchResults: EnhancedMessage[];
  analytics: ChatAnalytics | null;
  
  // Actions
  setActiveConversation: (conversation: ConversationWithEnhancedProfile | null) => void;
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
  refreshConversations: () => Promise<void>;

  // Live location sharing (1:1)
  startLiveLocationSharing: () => Promise<void>;
  stopLiveLocationSharing: () => Promise<void>;
  liveLocationShareId: string | null;
  liveLocationOtherUserLocation: { lat: number; lng: number; updatedAt: Date } | null;
  
  // Utility
  getConversationById: (conversationId: string) => ConversationWithEnhancedProfile | null;
  getUnreadCount: () => number;
  getAnalytics: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [conversationFilters, setConversationFilters] = useState({
    searchTerm: '',
    showPinnedOnly: false,
    showUnreadOnly: false
  });
  const [conversations, setConversations] = useState<ConversationWithEnhancedProfile[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationWithEnhancedProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [searchResults, setSearchResults] = useState<EnhancedMessage[]>([]);
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);

  const [liveLocationShareId, setLiveLocationShareId] = useState<string | null>(null);
  const [liveLocationOtherUserLocation, setLiveLocationOtherUserLocation] = useState<{ lat: number; lng: number; updatedAt: Date } | null>(null);
  const liveLocationWatchIdRef = useRef<number | null>(null);
  const liveLocationChannelRef = useRef<any | null>(null);
  const activeConversationChannelRef = useRef<any | null>(null);

  const realtimeRef = useRef<{ messages?: any; conversations?: any } | null>(null);

  const optimisticByClientIdRef = useRef<Map<string, { conversationId: string; messageId: string }>>(new Map());

  const enableVoiceMessages = true;
  const enableMessageReactions = true;
  const enablePolls = true;

  // Keep local userId in sync with Supabase auth
  useEffect(() => {
    let mounted = true;

    const loadInitialUser = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUserId = sessionData.session?.user?.id;
        if (!sessionUserId) {
          if (mounted) setUserId(undefined);
          return;
        }

        const { data, error } = await supabase.auth.getUser();
        if (error) {
          if (mounted) setUserId(sessionUserId);
          return;
        }
        if (mounted) setUserId(data.user?.id || sessionUserId);
      } catch (error) {
        if (mounted) setUserId(undefined);
      }
    };

    loadInitialUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserId(session?.user?.id);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const toEnhancedMessage = useCallback((row: any): EnhancedMessage => {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      text: row.text,
      timestamp: new Date(row.created_at),
      status: 'sent',
      type: row.type,
      metadata: row.metadata || undefined,
      isDeleted: !!row.deleted_at,
      isEdited: !!row.edited_at,
    };
  }, []);

  const createEmptyMessage = useCallback((): EnhancedMessage => {
    return {
      id: '',
      conversationId: '',
      senderId: '',
      receiverId: '',
      text: '',
      timestamp: new Date(),
      status: 'sent',
      type: 'text',
    };
  }, []);

  // Update unread count
  const updateUnreadCount = () => {
    const total = conversations.reduce((sum, conv) => sum + conv.conversation.unreadCount, 0);
    setUnreadCount(total);
  };

  const refreshConversations = useCallback(async () => {
    if (!userId) return;
    try {
      const { data: convRows, error: convErr } = await supabase
        .from('conversations')
        .select('id, user_low, user_high, universe, created_at, updated_at, is_archived, is_pinned_by_low, is_pinned_by_high, is_muted_by_low, is_muted_by_high, is_blocked')
        .or(`user_low.eq.${userId},user_high.eq.${userId}`)
        .order('updated_at', { ascending: false });
      if (convErr) throw convErr;

      const base = convRows || [];
      const otherUserIds = Array.from(
        new Set(
          base
            .map((c: any) => (c.user_low === userId ? c.user_high : c.user_low))
            .filter(Boolean)
        )
      );

      const [profilesRes, lastMessagesRes, receiptsRes] = await Promise.all([
        otherUserIds.length
          ? supabase
              .from('profiles')
              .select('id, full_name, age, location, photo_url')
              .in('id', otherUserIds)
          : Promise.resolve({ data: [], error: null } as any),
        base.length
          ? supabase
              .from('messages')
              .select('id, conversation_id, sender_id, receiver_id, text, type, metadata, created_at, edited_at, deleted_at')
              .in('conversation_id', base.map((c: any) => c.id))
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null } as any),
        base.length
          ? supabase
              .from('message_read_receipts')
              .select('message_id, conversation_id, reader_id')
              .in('conversation_id', base.map((c: any) => c.id))
              .eq('reader_id', userId)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (lastMessagesRes.error) throw lastMessagesRes.error;
      if (receiptsRes.error) throw receiptsRes.error;

      const low = (a: string, b: string) => (a < b ? a : b);
      const high = (a: string, b: string) => (a < b ? b : a);

      const pairs = otherUserIds.map((other: string) => ({ user_low: low(userId, other), user_high: high(userId, other) }));
      const compatRes = otherUserIds.length
        ? await supabase
            .from('user_compatibility')
            .select('score, user_low, user_high')
            .in('user_low', pairs.map((p) => p.user_low))
            .in('user_high', pairs.map((p) => p.user_high))
        : ({ data: [], error: null } as any);
      if (compatRes.error) throw compatRes.error;

      const compatibilityByPair = new Map<string, number>();
      (compatRes.data || []).forEach((row: any) => {
        const uLow = String(row.user_low);
        const uHigh = String(row.user_high);
        if (!uLow || !uHigh) return;
        const key = uLow < uHigh ? `${uLow}|${uHigh}` : `${uHigh}|${uLow}`;
        compatibilityByPair.set(key, Number(row.score) || 0);
      });

      const profileById = new Map<string, any>((profilesRes.data || []).map((p: any) => [p.id, p]));
      const lastMessageByConversation = new Map<string, any>();
      (lastMessagesRes.data || []).forEach((m: any) => {
        if (!lastMessageByConversation.has(m.conversation_id)) lastMessageByConversation.set(m.conversation_id, m);
      });

      const readByMessageId = new Set<string>((receiptsRes.data || []).map((r: any) => r.message_id));

      const mapped = base.map((c: any) => {
        const otherId = c.user_low === userId ? c.user_high : c.user_low;
        const other = profileById.get(otherId);
        const lastMsg = lastMessageByConversation.get(c.id);
        const lastMessage = lastMsg ? toEnhancedMessage(lastMsg) : createEmptyMessage();

        const matchPct = resolveMatchPercentage({
          myMatches: [],
          userId,
          otherUserId: String(otherId),
          compatibilityScoreByPair: compatibilityByPair,
        });

        const isLow = c.user_low === userId;
        const isPinned = Boolean(isLow ? c.is_pinned_by_low : c.is_pinned_by_high);
        const isMuted = Boolean(isLow ? c.is_muted_by_low : c.is_muted_by_high);
        const isBlocked = Boolean(c.is_blocked);

        // unreadCount: messages addressed to me without a read receipt
        const unreadCount = (lastMessagesRes.data || []).reduce((sum: number, m: any) => {
          if (m.conversation_id !== c.id) return sum;
          if (m.receiver_id !== userId) return sum;
          if (readByMessageId.has(m.id)) return sum;
          return sum + 1;
        }, 0);

        return {
          conversation: {
            id: c.id,
            participantIds: [c.user_low, c.user_high],
            lastMessage,
            unreadCount,
            isTyping: false,
            isPinned,
            isMuted,
            isBlocked,
            createdAt: new Date(c.created_at),
            updatedAt: new Date(c.updated_at),
            isArchived: Boolean(c.is_archived),
          },
          otherProfile: {
            id: other?.id || otherId || '',
            name: other?.full_name || 'Unknown',
            age: other?.age || 0,
            location: other?.location || '',
            photos: other?.photo_url ? [other.photo_url] : [],
            matchPercentage: matchPct,
            commonInterests: [],
            allTimeFavorites: {},
            bio: '',
          },
          messages: lastMsg ? [lastMessage] : [],
        } as ConversationWithEnhancedProfile;
      });

      setConversations(mapped);
      setUnreadCount(mapped.reduce((sum, conv) => sum + (conv?.conversation?.unreadCount || 0), 0));
    } catch (error) {
      console.error('Failed to refresh conversations:', error);
    }
  }, [createEmptyMessage, toEnhancedMessage, userId]);

  const loadMessagesForConversation = useCallback(
    async (conversationId: string) => {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, conversation_id, sender_id, receiver_id, text, type, metadata, created_at, edited_at, deleted_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
          .limit(500);
        if (error) throw error;

        const msgs = (data || []).map((row: any) => toEnhancedMessage(row));

        setConversations((prev) =>
          prev.map((c) => (c.conversation.id === conversationId ? { ...c, messages: msgs } : c))
        );

        setActiveConversation((prev) => {
          if (!prev || prev.conversation.id !== conversationId) return prev;
          return { ...prev, messages: msgs };
        });
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    },
    [toEnhancedMessage, userId]
  );

  const refreshActiveConversationIfMatches = useCallback(
    async (conversationId: string | null | undefined) => {
      if (!conversationId) return;
      if (!activeConversation?.conversation?.id) return;
      if (activeConversation.conversation.id !== conversationId) return;
      await loadMessagesForConversation(conversationId);
    },
    [activeConversation?.conversation?.id, loadMessagesForConversation]
  );

  const ensureActiveConversationSubscription = useCallback(
    (conversationId: string) => {
      if (activeConversationChannelRef.current) {
        supabase.removeChannel(activeConversationChannelRef.current);
        activeConversationChannelRef.current = null;
      }

      const channel = supabase
        .channel(`conversation_messages_${conversationId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
          () => {
            loadMessagesForConversation(conversationId);
            refreshConversations();
          }
        )
        .subscribe();

      activeConversationChannelRef.current = channel;
    },
    [loadMessagesForConversation, refreshConversations]
  );

  // Get analytics
  const getAnalytics = useCallback(async () => {
    setAnalytics(null);
  }, []);

  // Initialize realtime and load conversations
  useEffect(() => {
    if (!userId) return;

    refreshConversations();

    if (realtimeRef.current?.messages) supabase.removeChannel(realtimeRef.current.messages);
    if (realtimeRef.current?.conversations) supabase.removeChannel(realtimeRef.current.conversations);

    const messagesChannel = supabase
      .channel(`messages_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
        (payload: any) => {
          const row = (payload?.new || payload?.record) as any;
          const convId = row?.conversation_id ? String(row.conversation_id) : null;
          refreshConversations();
          void refreshActiveConversationIfMatches(convId);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` },
        (payload: any) => {
          const row = (payload?.new || payload?.record) as any;
          const convId = row?.conversation_id ? String(row.conversation_id) : null;
          refreshConversations();
          void refreshActiveConversationIfMatches(convId);
        }
      )
      .subscribe();

    const conversationsChannel = supabase
      .channel(`conversations_${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => {
          refreshConversations();
        }
      )
      .subscribe();

    realtimeRef.current = { messages: messagesChannel, conversations: conversationsChannel };

    return () => {
      if (messagesChannel) supabase.removeChannel(messagesChannel);
      if (conversationsChannel) supabase.removeChannel(conversationsChannel);
      realtimeRef.current = null;
    };
  }, [refreshActiveConversationIfMatches, refreshConversations, userId]);

  useEffect(() => {
    if (!activeConversation) return;
    const conversationId = activeConversation.conversation.id;
    loadMessagesForConversation(conversationId);
    ensureActiveConversationSubscription(conversationId);
    return () => {
      if (activeConversationChannelRef.current) {
        supabase.removeChannel(activeConversationChannelRef.current);
        activeConversationChannelRef.current = null;
      }
    };
  }, [activeConversation?.conversation.id, ensureActiveConversationSubscription, loadMessagesForConversation]);

  const applyOptimisticMessage = useCallback(
    (conversationId: string, message: EnhancedMessage) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.conversation.id !== conversationId) return c;
          const messages = Array.isArray(c.messages) ? c.messages : [];
          const nextMessages = [...messages, message].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          return {
            ...c,
            messages: nextMessages,
            conversation: {
              ...c.conversation,
              lastMessage: message,
              updatedAt: new Date(),
            },
          };
        })
      );

      setActiveConversation((prev) => {
        if (!prev || prev.conversation.id !== conversationId) return prev;
        const messages = Array.isArray(prev.messages) ? prev.messages : [];
        const nextMessages = [...messages, message].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        return {
          ...prev,
          messages: nextMessages,
          conversation: {
            ...prev.conversation,
            lastMessage: message,
            updatedAt: new Date(),
          },
        };
      });
    },
    []
  );

  const updateMessageById = useCallback((conversationId: string, messageId: string, updater: (m: EnhancedMessage) => EnhancedMessage) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.conversation.id !== conversationId) return c;
        const nextMessages = (c.messages || []).map((m) => (m.id === messageId ? updater(m) : m));
        return { ...c, messages: nextMessages };
      })
    );

    setActiveConversation((prev) => {
      if (!prev || prev.conversation.id !== conversationId) return prev;
      const nextMessages = (prev.messages || []).map((m) => (m.id === messageId ? updater(m) : m));
      return { ...prev, messages: nextMessages };
    });
  }, []);

  const startLiveLocationSharing = useCallback(async () => {
    if (!activeConversation) return;
    try {
      const conversationId = activeConversation.conversation.id;
      const toUserId = activeConversation.otherProfile.id;
      if (!userId || !toUserId) return;

      // manual stop => far-future expiry (still can be stopped via status)
      const farFuture = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5).toISOString();

      const { data: shareRow, error: shareErr } = await supabase
        .from('location_shares')
        .insert([
          {
            conversation_id: conversationId,
            sharer_id: userId,
            viewer_id: toUserId,
            status: 'active',
            expires_at: farFuture,
          },
        ])
        .select('id, conversation_id, sharer_id, viewer_id, status, created_at, expires_at')
        .single();

      if (shareErr) throw shareErr;
      const share = shareRow as LocationShareRow;
      setLiveLocationShareId(share.id);

      // Post a chat message to make it visible in the thread
      await supabase.from('messages').insert([
        {
          conversation_id: conversationId,
          sender_id: userId,
          receiver_id: toUserId,
          type: 'location-share',
          text: '📍 Live location sharing started',
          metadata: { shareId: share.id, mode: 'live' },
        },
      ]);

      // Start tracking
      if (liveLocationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(liveLocationWatchIdRef.current);
        liveLocationWatchIdRef.current = null;
      }

      liveLocationWatchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy, heading, speed } = position.coords;
            await supabase.from('user_locations').upsert(
              {
                share_id: share.id,
                user_id: userId,
                lat: latitude,
                lng: longitude,
                accuracy,
                heading,
                speed,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'share_id,user_id' }
            );
          } catch (e) {
            console.error('Live location upsert failed:', e);
          }
        },
        (err) => {
          console.error('Geolocation watch error:', err);
        },
        { enableHighAccuracy: true }
      );

      // Subscribe viewer updates too (useful when you open your own map)
      if (liveLocationChannelRef.current) {
        supabase.removeChannel(liveLocationChannelRef.current);
        liveLocationChannelRef.current = null;
      }

      const channel = supabase
        .channel(`live_location_${share.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_locations', filter: `share_id=eq.${share.id}` },
          (payload: any) => {
            const row = (payload?.new || payload?.record) as UserLocationRow;
            if (!row || row.user_id === userId) return;
            setLiveLocationOtherUserLocation({ lat: row.lat, lng: row.lng, updatedAt: new Date(row.updated_at) });
          }
        )
        .subscribe();

      liveLocationChannelRef.current = channel;
    } catch (error) {
      console.error('Failed to start live location sharing:', error);
    }
  }, [activeConversation, userId]);

  const stopLiveLocationSharing = useCallback(async () => {
    if (!liveLocationShareId) return;
    try {
      await supabase
        .from('location_shares')
        .update({ status: 'stopped' })
        .eq('id', liveLocationShareId);
    } catch (error) {
      console.error('Failed to stop live location share:', error);
    } finally {
      if (liveLocationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(liveLocationWatchIdRef.current);
        liveLocationWatchIdRef.current = null;
      }
      if (liveLocationChannelRef.current) {
        supabase.removeChannel(liveLocationChannelRef.current);
        liveLocationChannelRef.current = null;
      }
      setLiveLocationShareId(null);
      setLiveLocationOtherUserLocation(null);
    }
  }, [liveLocationShareId]);

  const sendMessage = async (text: string) => {
    if (!activeConversation) return;

    try {
      console.log('[ChatContext] sendMessage called', {
        userId,
        activeConversationId: activeConversation.conversation.id,
        toUserId: activeConversation.otherProfile?.id,
        text,
      });

      const toUserId = activeConversation.otherProfile.id;
      if (!userId || !toUserId) return;

      const clientId = `client_${userId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const optimisticMessageId = clientId;

      const optimisticMessage: EnhancedMessage = {
        id: optimisticMessageId,
        conversationId: activeConversation.conversation.id,
        senderId: userId,
        receiverId: toUserId,
        text,
        timestamp: new Date(),
        status: 'sending',
        type: 'text',
        metadata: { clientId },
      };

      optimisticByClientIdRef.current.set(clientId, {
        conversationId: activeConversation.conversation.id,
        messageId: optimisticMessageId,
      });
      applyOptimisticMessage(activeConversation.conversation.id, optimisticMessage);

      const { data: resolvedConversationId, error: convErr } = await supabase
        .rpc('get_or_create_conversation', {
          p_other_user: toUserId,
          p_universe: 'both',
        });
      if (convErr) {
        console.error('[ChatContext] get_or_create_conversation error', convErr);
        throw convErr;
      }

      console.log('[ChatContext] get_or_create_conversation ok', {
        resolvedConversationId,
        activeConversationId: activeConversation.conversation.id,
      });

      const effectiveConversationId = (resolvedConversationId as string) || activeConversation.conversation.id;

      // If we're chatting in a placeholder/non-canonical conversation id, align UI state to the canonical id.
      if (effectiveConversationId && effectiveConversationId !== activeConversation.conversation.id) {
        setActiveConversation((prev) => {
          if (!prev) return prev;
          if (prev.otherProfile?.id !== toUserId) return prev;
          return {
            ...prev,
            conversation: {
              ...prev.conversation,
              id: effectiveConversationId,
              participantIds: prev.conversation.participantIds,
            },
          };
        });
      }

      const { data: inserted, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: effectiveConversationId,
            sender_id: userId,
            receiver_id: toUserId,
            type: 'text',
            text,
            metadata: { clientId },
          },
        ])
        .select('id, conversation_id, sender_id, receiver_id, text, type, metadata, created_at')
        .single();

      if (error) {
        console.error('[ChatContext] messages.insert error', error);
        throw error;
      }

      console.log('[ChatContext] messages.insert ok', {
        id: inserted?.id,
        conversation_id: inserted?.conversation_id,
      });

      const serverMessage = toEnhancedMessage(inserted);

      // Replace optimistic message id/status with server message
      setConversations((prev) =>
        prev.map((c) => {
          if (c.conversation.id !== activeConversation.conversation.id && c.conversation.id !== effectiveConversationId) return c;
          const nextMessages = (c.messages || []).map((m) => (m.id === optimisticMessageId ? serverMessage : m));
          return {
            ...c,
            messages: nextMessages,
            conversation: {
              ...c.conversation,
              id: effectiveConversationId,
              lastMessage: serverMessage,
              updatedAt: new Date(),
            },
          };
        })
      );

      setActiveConversation((prev) => {
        if (!prev) return prev;
        if (prev.otherProfile?.id !== toUserId) return prev;

        const nextMessages = (prev.messages || []).map((m) => (m.id === optimisticMessageId ? serverMessage : m));
        return {
          ...prev,
          messages: nextMessages,
          conversation: {
            ...prev.conversation,
            id: effectiveConversationId,
            lastMessage: serverMessage,
            updatedAt: new Date(),
          },
        };
      });

      optimisticByClientIdRef.current.delete(clientId);
    } catch (error) {
      console.error('Failed to send message:', error);
      if (!userId) return;

      const clientIdPrefix = `client_${userId}_`;
      const keys = Array.from(optimisticByClientIdRef.current.keys()).filter((k) => k.startsWith(clientIdPrefix));
      const lastKey = keys[keys.length - 1];
      if (!lastKey) return;

      const optimistic = optimisticByClientIdRef.current.get(lastKey);
      if (!optimistic) return;

      updateMessageById(activeConversation.conversation.id, optimistic.messageId, (m) => ({ ...m, status: 'error' }));
    }
  };

  // Send voice message
  const sendVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!activeConversation) return;
    
    try {
      if (!enableVoiceMessages) {
        console.warn('Voice messages are disabled: missing storage bucket/policies (voice-messages).');
        return;
      }

      const toUserId = activeConversation.otherProfile.id;
      if (!userId || !toUserId) return;

      const fileName = `voice_${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, audioBlob);

      if (uploadError) {
        console.warn('Voice upload failed (check voice-messages bucket + RLS):', uploadError);
        return;
      }

      const fileUrl = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName).data.publicUrl;

      const { data: resolvedConversationId, error: convErr } = await supabase
        .rpc('get_or_create_conversation', { p_other_user: toUserId, p_universe: 'both' });
      if (convErr) throw convErr;

      const effectiveConversationId = (resolvedConversationId as string) || activeConversation.conversation.id;

      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: effectiveConversationId,
          sender_id: userId,
          receiver_id: toUserId,
          type: 'voice-note',
          text: '🎤 Voice message',
          metadata: {
            fileUrl,
            duration,
            fileSize: audioBlob.size,
            fileType: audioBlob.type || 'audio/webm',
          },
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send voice message:', error);
    }
  };

  // Send GIF message
  const sendGifMessage = async (gifUrl: string, gifId: string) => {
    if (!activeConversation) return;
    
    try {
      const toUserId = activeConversation.otherProfile.id;
      if (!userId || !toUserId) return;

      const { data: resolvedConversationId, error: convErr } = await supabase
        .rpc('get_or_create_conversation', { p_other_user: toUserId, p_universe: 'both' });
      if (convErr) throw convErr;

      const effectiveConversationId = (resolvedConversationId as string) || activeConversation.conversation.id;

      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: effectiveConversationId,
          sender_id: userId,
          receiver_id: toUserId,
          type: 'gif',
          text: '🎬 GIF',
          metadata: { gifUrl, gifId },
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send GIF message:', error);
    }
  };

  // Send poll
  const sendPoll = async (question: string, options: string[]) => {
    if (!activeConversation) return;
    
    try {
      if (!enablePolls) {
        console.warn('Polls are disabled: missing polls/poll_votes tables and RLS policies.');
        return;
      }

      const toUserId = activeConversation.otherProfile.id;
      if (!userId || !toUserId) return;

      const { data: resolvedConversationId, error: convErr } = await supabase
        .rpc('get_or_create_conversation', { p_other_user: toUserId, p_universe: 'both' });
      if (convErr) throw convErr;

      const effectiveConversationId = (resolvedConversationId as string) || activeConversation.conversation.id;

      const { data: msgRow, error: msgErr } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: effectiveConversationId,
            sender_id: userId,
            receiver_id: toUserId,
            type: 'poll',
            text: question,
            metadata: { pollOptions: options },
          },
        ])
        .select('id')
        .single();

      if (msgErr) throw msgErr;

      const { error: pollErr } = await supabase.from('polls').insert({
        message_id: (msgRow as any).id,
        conversation_id: effectiveConversationId,
        question,
        options,
      });

      if (pollErr) throw pollErr;
    } catch (error) {
      console.error('Failed to send poll:', error);
    }
  };

  // Add reaction
  const addReaction = async (messageId: string, emoji: string) => {
    try {
      if (!enableMessageReactions) {
        console.warn('Message reactions are disabled: missing message_reactions table/RLS.');
        return;
      }

      if (!userId) return;
      const { error } = await supabase
        .from('message_reactions')
        .upsert(
          {
            message_id: messageId,
            user_id: userId,
            emoji,
          },
          { onConflict: 'message_id,user_id' }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  // Vote on poll
  const voteOnPoll = async (messageId: string, option: string) => {
    try {
      if (!enablePolls) {
        console.warn('Polls are disabled: missing polls/poll_votes tables and RLS policies.');
        return;
      }

      if (!userId) return;
      const { data: poll, error: pollErr } = await supabase
        .from('polls')
        .select('conversation_id, options')
        .eq('message_id', messageId)
        .single();

      if (pollErr) throw pollErr;

      const options = (poll as any)?.options as string[];
      const optionIndex = Array.isArray(options) ? options.indexOf(option) : -1;
      if (optionIndex < 0) throw new Error('Invalid poll option');

      const { error } = await supabase
        .from('poll_votes')
        .upsert(
          {
            message_id: messageId,
            conversation_id: (poll as any).conversation_id,
            voter_id: userId,
            option_index: optionIndex,
          },
          { onConflict: 'message_id,voter_id' }
        );

      if (error) throw error;
    } catch (error) {
      console.error('Failed to vote on poll:', error);
    }
  };

  // Search messages
  const searchMessages = async (query: string) => {
    try {
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to search messages:', error);
    }
  };

  // Mark as read
  const markAsRead = async (conversationId: string) => {
    try {
      if (!userId) return;
      const { data: msgs, error: msgErr } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('receiver_id', userId)
        .order('created_at', { ascending: false })
        .limit(200);

      if (msgErr) throw msgErr;

      const messageIds = (msgs || []).map((m: any) => m.id).filter(Boolean);
      if (messageIds.length) {
        const receipts = messageIds.map((messageId: string) => ({
          message_id: messageId,
          conversation_id: conversationId,
          reader_id: userId,
        }));

        const { error: receiptErr } = await supabase
          .from('message_read_receipts')
          .upsert(receipts, { onConflict: 'message_id' });
        if (receiptErr) throw receiptErr;
      }

      await refreshConversations();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      await supabase.from('conversations').delete().eq('id', conversationId);
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
      const { error } = await supabase
        .from('conversations')
        .update({ is_blocked: true })
        .eq('id', conversationId);
      if (error) throw error;
      await refreshConversations();
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  // Report user
  const reportUser = async (conversationId: string, reason: string) => {
    try {
      // Optional table; if not present, we no-op but keep UI responsive.
      const payload = {
        conversation_id: conversationId,
        reporter_id: userId,
        reason,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('user_reports' as any).insert(payload as any);
      if (error) {
        console.warn('Report user failed (missing user_reports table/RLS?)', error);
      }
    } catch (error) {
      console.error('Failed to report user:', error);
    }
  };

  // Start voice call
  const startVoiceCall = async (conversationId: string) => {
    try {
      void conversationId;
    } catch (error) {
      console.error('Failed to start voice call:', error);
    }
  };

  // Start video call
  const startVideoCall = async (conversationId: string) => {
    try {
      void conversationId;
    } catch (error) {
      console.error('Failed to start video call:', error);
    }
  };

  // Share location
  const shareLocation = async (location: any) => {
    void location;
    await startLiveLocationSharing();
  };

  // Send date invite
  const sendDateInvite = async (dateDetails: any) => {
    if (!activeConversation) return;
    
    try {
      const toUserId = activeConversation.otherProfile.id;
      if (!userId || !toUserId) return;

      const { data: resolvedConversationId, error: convErr } = await supabase
        .rpc('get_or_create_conversation', { p_other_user: toUserId, p_universe: 'both' });
      if (convErr) throw convErr;

      const effectiveConversationId = (resolvedConversationId as string) || activeConversation.conversation.id;

      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: effectiveConversationId,
          sender_id: userId,
          receiver_id: toUserId,
          type: 'date-invite',
          text: '💌 Date invite',
          metadata: {
            dateDetails,
          },
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send date invite:', error);
    }
  };

  // Send AI enhanced message
  const sendAIEnhancedMessage = async (prompt: string) => {
    if (!activeConversation) return;
    
    try {
      const toUserId = activeConversation.otherProfile.id;
      if (!toUserId) return;

      const { data: resolvedConversationId, error: convErr } = await supabase
        .rpc('get_or_create_conversation', { p_other_user: toUserId, p_universe: 'both' });
      if (convErr) throw convErr;

      const effectiveConversationId = (resolvedConversationId as string) || activeConversation.conversation.id;

      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: effectiveConversationId,
          sender_id: userId,
          receiver_id: toUserId,
          type: 'ai-enhanced',
          text: prompt,
          metadata: { originalPrompt: prompt },
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to send AI enhanced message:', error);
    }
  };

  // Toggle conversation pin
  const toggleConversationPin = async (conversationId: string) => {
    try {
      if (!userId) return;
      const conv = conversations.find((c) => c.conversation.id === conversationId);
      if (!conv) return;

      const isLow = conv.conversation.participantIds?.[0] === userId;
      const newPinStatus = !conv.conversation.isPinned;
      const updatePayload = isLow ? { is_pinned_by_low: newPinStatus } : { is_pinned_by_high: newPinStatus };
      const { error } = await supabase.from('conversations').update(updatePayload).eq('id', conversationId);
      if (error) throw error;
      refreshConversations();
    } catch (error) {
      console.error('Failed to toggle conversation pin:', error);
    }
  };

  // Toggle conversation mute
  const toggleConversationMute = async (conversationId: string) => {
    try {
      if (!userId) return;
      const conv = conversations.find((c) => c.conversation.id === conversationId);
      if (!conv) return;

      const isLow = conv.conversation.participantIds?.[0] === userId;
      const newMuteStatus = !conv.conversation.isMuted;
      const updatePayload = isLow ? { is_muted_by_low: newMuteStatus } : { is_muted_by_high: newMuteStatus };
      const { error } = await supabase.from('conversations').update(updatePayload).eq('id', conversationId);
      if (error) throw error;
      refreshConversations();
    } catch (error) {
      console.error('Failed to toggle conversation mute:', error);
    }
  };

  // Toggle conversation archive
  const toggleConversationArchive = async (conversationId: string) => {
    try {
      const conv = conversations.find((c) => c.conversation.id === conversationId);
      if (!conv) return;
      const newArchiveStatus = !conv.conversation.isArchived;
      const { error } = await supabase.from('conversations').update({ is_archived: newArchiveStatus }).eq('id', conversationId);
      if (error) throw error;
      refreshConversations();
    } catch (error) {
      console.error('Failed to toggle conversation archive:', error);
    }
  };

  // Get conversation by ID
  const getConversationById = (conversationId: string): ConversationWithEnhancedProfile | null => {
    return conversations.find(conv => conv.conversation.id === conversationId) || null;
  };

  // Get unread count
  const getUnreadCount = (): number => {
    return conversations.reduce((sum, conv) => sum + conv.conversation.unreadCount, 0);
  };

  const contextValue: ChatContextType = {
    // State
    userId,
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
    refreshConversations,

    startLiveLocationSharing,
    stopLiveLocationSharing,
    liveLocationShareId,
    liveLocationOtherUserLocation,
    
    // Utility
    getConversationById,
    getUnreadCount,
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
