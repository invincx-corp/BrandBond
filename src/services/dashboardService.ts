import { supabase } from '../lib/supabase';
import { authFetch } from '../lib/authFetch';

export interface DashboardStats {
  totalMatches: number;
  peopleNearby: number;
  communitiesJoined: number;
  conversationsActive: number;
  profileCompleteness: number;
  compatibilityScore: number;
}

export interface DailyMatch {
  id: string;
  fullName: string;
  age: number;
  location: string;
  intent: string;
  compatibilityScore: number;
  sharedInterests: string[];
  matchReason: string;
  profilePhoto: string | null;
}

export interface CommunityPreview {
  id: string;
  name: string;
  category: string;
  description: string;
  memberCount: number;
  isMember: boolean;
  iconUrl: string | null;
  coverImageUrl: string | null;
}

export interface RecentActivity {
  id: string;
  type: 'new_match' | 'community_join' | 'achievement_earned' | 'profile_update' | 'interest_change';
  title: string;
  description: string;
  timestamp: string;
}

export interface UserInsight {
  primaryInterests: string[];
  personalityTraits: string[];
  lifestylePatterns: string[];
  compatibilityTrends: Record<string, number>;
}

export interface LocalEvent {
  id: string;
  title: string;
  description: string;
  startTime: string;
  currentAttendees: number;
}

export interface ConversationPreview {
  conversationId: string;
  otherUserId: string;
  otherName: string;
  otherPhotoUrl: string | null;
  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;
}

const API_BASE = `${import.meta.env.VITE_DASHBOARD_API_BASE || window.location.origin}`;

export class DashboardService {
  static async deleteAccount(): Promise<void> {
    const response = await authFetch(`${API_BASE}/api/account/delete`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      let msg = `Failed to delete account (HTTP ${response.status})`;
      try {
        const json = await response.json();
        if (json?.error) msg = String(json.error);
      } catch {
        // ignore
      }
      throw new Error(msg);
    }
  }

  static async getDashboardData(_userId: string) {
    const response = await authFetch(`${API_BASE}/api/dashboard/data`);
    if (!response.ok) {
      throw new Error(`Failed to load dashboard data (HTTP ${response.status})`);
    }
    const json = await response.json();
    return json?.data ?? json;
  }

  static async getDashboardStats(_userId: string): Promise<DashboardStats> {
    const response = await authFetch(`${API_BASE}/api/dashboard/stats`);
    if (!response.ok) {
      throw new Error(`Failed to load dashboard stats (HTTP ${response.status})`);
    }
    const json = await response.json();
    return json?.data ?? json;
  }

  static async getDailyMatches(_userId: string, limit: number = 5): Promise<DailyMatch[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      throw new Error('No active session');
    }

    const response = await authFetch(`${API_BASE}/api/match/matches?limit=${encodeURIComponent(String(limit))}`);
    if (!response.ok) {
      throw new Error(`Failed to load daily matches (HTTP ${response.status})`);
    }

    const json = await response.json();
    const items = (json?.data || []) as any[];

    return items.map((m: any) => ({
      id: m.id,
      fullName: m.fullName,
      age: m.age,
      location: m.location,
      intent: m.intent,
      compatibilityScore: m.compatibilityScore,
      sharedInterests: m.sharedInterests || [],
      matchReason: m.matchReason || '',
      profilePhoto: m.profilePhoto || null,
    }));
  }

  static async getUserCommunities(userId: string): Promise<CommunityPreview[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('No active session');

    const response = await authFetch(`${API_BASE}/api/dashboard/communities`);
    if (!response.ok) {
      throw new Error(`Failed to load communities (HTTP ${response.status})`);
    }
    const json = await response.json();
    const items = (json?.data || []) as any[];

    return items.map((c: any) => ({
      id: String(c.id),
      name: c.name ?? '',
      category: c.category ?? '',
      description: c.description ?? '',
      memberCount: Number(c.memberCount ?? c.member_count ?? 0),
      isMember: Boolean(c.isMember ?? c.is_member ?? false),
      iconUrl: c.iconUrl ?? c.icon_url ?? null,
      coverImageUrl: c.coverImageUrl ?? c.cover_image_url ?? null,
    }));
  }

  static async getRecentActivities(userId: string, limit: number = 10): Promise<RecentActivity[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('No active session');

    const response = await authFetch(`${API_BASE}/api/dashboard/activities?limit=${encodeURIComponent(String(limit))}`);
    if (!response.ok) {
      throw new Error(`Failed to load activities (HTTP ${response.status})`);
    }

    const json = await response.json();
    const items = (json?.data || []) as any[];
    return items.map((a: any) => ({
      id: String(a.id),
      type: (a.type ?? a.activity_type) as RecentActivity['type'],
      title: String(a.title ?? ''),
      description: String(a.description ?? ''),
      timestamp: String(a.timestamp ?? a.created_at ?? new Date().toISOString()),
    }));
  }

  static async getUserInsights(userId: string): Promise<UserInsight> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('No active session');

    const response = await authFetch(`${API_BASE}/api/dashboard/insights`);
    if (!response.ok) {
      throw new Error(`Failed to load insights (HTTP ${response.status})`);
    }
    const json = await response.json();
    return json?.data ?? json;
  }

  static async getLocalEvents(userId: string): Promise<LocalEvent[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('No active session');

    const response = await authFetch(`${API_BASE}/api/dashboard/events`);
    if (!response.ok) {
      throw new Error(`Failed to load local events (HTTP ${response.status})`);
    }
    const json = await response.json();
    const items = (json?.data || []) as any[];
    return items.map((e: any) => ({
      id: String(e.id),
      title: String(e.title ?? ''),
      description: String(e.description ?? ''),
      startTime: String(e.startTime ?? e.start_time ?? ''),
      currentAttendees: Number(e.currentAttendees ?? e.current_attendees ?? 0),
    }));
  }

  static async joinCommunity(userId: string, communityId: string): Promise<boolean> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('No active session');

    const response = await authFetch(`${API_BASE}/api/dashboard/join-community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ communityId }),
    });
    return response.ok;
  }

  static async leaveCommunity(userId: string, communityId: string): Promise<boolean> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('No active session');

    const response = await authFetch(`${API_BASE}/api/dashboard/leave-community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ communityId }),
    });
    return response.ok;
  }

  static async attendEvent(userId: string, eventId: string, status: 'interested' | 'going' | 'not_going'): Promise<boolean> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('No active session');

    const response = await authFetch(`${API_BASE}/api/dashboard/attend-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, status }),
    });
    return response.ok;
  }

  static async getConversationPreviews(userId: string, limit: number = 5): Promise<ConversationPreview[]> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('No active session');

    if (!userId) return [];

    const convRes = await supabase
      .from('conversations')
      .select('id, user_low, user_high, is_archived, is_blocked, last_message_at, updated_at')
      .or(`user_low.eq.${userId},user_high.eq.${userId}`)
      .eq('is_archived', false)
      .eq('is_blocked', false)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false })
      .limit(Math.max(1, Math.min(50, limit)));

    if (convRes.error) throw convRes.error;

    const conversations = (convRes.data as any[]) || [];
    if (!conversations.length) return [];

    const otherIds = Array.from(
      new Set(
        conversations
          .map((c: any) => (String(c.user_low) === String(userId) ? c.user_high : c.user_low))
          .filter(Boolean)
          .map(String)
      )
    );

    const convIds = conversations.map((c: any) => c.id).filter(Boolean);

    const [profilesRes, photosRes, lastMsgsRes] = await Promise.all([
      otherIds.length
        ? supabase.from('profiles').select('id, full_name').in('id', otherIds)
        : Promise.resolve({ data: [], error: null } as any),
      otherIds.length
        ? supabase
            .from('user_photos')
            .select('user_id, photo_url, is_main_photo, photo_order')
            .in('user_id', otherIds)
        : Promise.resolve({ data: [], error: null } as any),
      convIds.length
        ? supabase
            .from('messages')
            .select('id, conversation_id, text, created_at')
            .in('conversation_id', convIds)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null } as any),
    ]);

    if (profilesRes.error) throw profilesRes.error;
    if (photosRes.error) throw photosRes.error;
    if (lastMsgsRes.error) throw lastMsgsRes.error;

    const profileById = new Map<string, any>((profilesRes.data || []).map((p: any) => [String(p.id), p]));
    const photosByUser = new Map<string, any[]>();
    (photosRes.data || []).forEach((row: any) => {
      const list = photosByUser.get(String(row.user_id)) || [];
      list.push(row);
      photosByUser.set(String(row.user_id), list);
    });

    const lastMsgByConv = new Map<string, any>();
    (lastMsgsRes.data || []).forEach((m: any) => {
      const key = String(m.conversation_id);
      if (!lastMsgByConv.has(key)) lastMsgByConv.set(key, m);
    });

    return conversations
      .map((c: any) => {
        const otherId = String(String(c.user_low) === String(userId) ? c.user_high : c.user_low);
        const otherProfile = profileById.get(otherId);
        const photos = photosByUser.get(otherId) || [];
        const main =
          photos.find((ph) => ph.is_main_photo) ||
          photos.sort((a, b) => (a.photo_order ?? 999) - (b.photo_order ?? 999))[0];
        const lastMsg = lastMsgByConv.get(String(c.id)) || null;

        return {
          conversationId: String(c.id),
          otherUserId: otherId,
          otherName: otherProfile?.full_name || 'Unknown',
          otherPhotoUrl: main?.photo_url ?? null,
          lastMessageText: String(lastMsg?.text ?? ''),
          lastMessageAt: String(lastMsg?.created_at ?? c.last_message_at ?? c.updated_at ?? new Date().toISOString()),
          unreadCount: 0,
        } as ConversationPreview;
      })
      .slice(0, limit);
  }

  static async markRecommendationViewed(userId: string, recommendationId: string): Promise<boolean> {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) throw new Error('No active session');

    const response = await authFetch(`${API_BASE}/api/dashboard/mark-viewed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recommendationId }),
    });
    return response.ok;
  }

  static async getUserAchievements(userId: string) {
    // Demo implementation - return empty array for now
    return [];
  }

  static async getUserPoints(userId: string) {
    // Demo implementation - return 0 for now
    return 0;
  }
}

export default DashboardService;
