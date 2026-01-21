import { createServer } from 'http';
import { supabase } from './supabase';

// Types for API responses
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface DashboardStats {
  totalMatches: number;
  compatibilityScore: number;
  peopleNearby: number;
  communitiesJoined: number;
  conversationsActive: number;
  profileCompleteness: number;
}

interface DailyMatch {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  location: string;
  compatibilityScore: number;
  sharedInterests: string[];
  matchReason: string;
  profilePhoto?: string;
  intent: string;
}

interface CommunityPreview {
  id: string;
  name: string;
  description: string;
  category: string;
  memberCount: number;
  iconUrl?: string;
  coverImageUrl?: string;
  isMember: boolean;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

interface UserInsight {
  primaryInterests: string[];
  personalityTraits: string[];
  lifestylePatterns: string[];
  compatibilityTrends: Record<string, number>;
}

interface LocalEvent {
  id: string;
  title: string;
  description: string;
  eventType: string;
  location: string;
  startTime: string;
  endTime?: string;
  maxAttendees?: number;
  currentAttendees: number;
  isAttending: boolean;
}

// Helper function to send JSON response
const sendJsonResponse = (res: any, statusCode: number, data: ApiResponse) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

// Helper function to parse request body
const parseRequestBody = (req: any): Promise<any> => {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
};

// Helper function to extract user ID from request headers
const extractUserId = async (req: any): Promise<string | null> => {
  const devOverrideUserId = req.headers['x-user-id'];
  if (process.env.NODE_ENV !== 'production' && typeof devOverrideUserId === 'string' && devOverrideUserId) {
    return devOverrideUserId;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const accessToken = authHeader.substring(7);
  if (!accessToken) return null;

  try {
    // When the backend client is created with the service role key, the normal
    // supabase.auth.getUser(accessToken) path may not behave as expected.
    // Instead, decode the JWT and validate the user via auth admin.
    const parts = accessToken.split('.');
    if (parts.length < 2) return null;
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);
    const userId = typeof payload?.sub === 'string' ? payload.sub : null;
    if (!userId) return null;

    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) return null;
    return data.user?.id || null;
  } catch {
    return null;
  }
};

// Dashboard routes
export const dashboardRoutes = {
  // Get comprehensive dashboard data
  async getDashboardData(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized - Invalid or missing token' 
        });
      }

      // Get all dashboard data in parallel
      const [
        stats,
        dailyMatches,
        communities,
        activities,
        insights,
        localEvents
      ] = await Promise.all([
        getDashboardStats(userId),
        getDailyMatches(userId),
        getUserCommunities(userId),
        getRecentActivities(userId),
        getUserInsights(userId),
        getLocalEvents(userId)
      ]);

      sendJsonResponse(res, 200, {
        success: true,
        data: {
          stats,
          dailyMatches,
          communities,
          activities,
          insights,
          localEvents
        }
      });
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to fetch dashboard data'
      });
    }
  },

  // Get dashboard statistics
  async getDashboardStats(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const stats = await getDashboardStats(userId);
      sendJsonResponse(res, 200, { success: true, data: stats });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to fetch dashboard statistics'
      });
    }
  },

  // Get daily matches
  async getDailyMatches(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const matches = await getDailyMatches(userId);
      sendJsonResponse(res, 200, { success: true, data: matches });
    } catch (error) {
      console.error('Error getting daily matches:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to fetch daily matches'
      });
    }
  },

  // Get user communities
  async getUserCommunities(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const communities = await getUserCommunities(userId);
      sendJsonResponse(res, 200, { success: true, data: communities });
    } catch (error) {
      console.error('Error getting user communities:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to fetch user communities'
      });
    }
  },

  // Get recent activities
  async getRecentActivities(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      const limitParam = url.searchParams.get('limit');
      const limit = Math.max(1, Math.min(50, Number(limitParam) || 10));

      const activities = await getRecentActivities(userId, limit);
      sendJsonResponse(res, 200, { success: true, data: activities });
    } catch (error) {
      console.error('Error getting recent activities:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to fetch recent activities'
      });
    }
  },

  // Get user insights
  async getUserInsights(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const insights = await getUserInsights(userId);
      sendJsonResponse(res, 200, { success: true, data: insights });
    } catch (error) {
      console.error('Error getting user insights:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to fetch user insights'
      });
    }
  },

  // Get local events
  async getLocalEvents(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      const limitParam = url.searchParams.get('limit');
      const limit = Math.max(1, Math.min(50, Number(limitParam) || 5));

      const events = await getLocalEvents(userId, limit);
      sendJsonResponse(res, 200, { success: true, data: events });
    } catch (error) {
      console.error('Error getting local events:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to fetch local events'
      });
    }
  },

  // Join community
  async joinCommunity(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const body = await parseRequestBody(req);
      const { communityId } = body;

      if (!communityId) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Community ID is required'
        });
      }

      const { error } = await supabase
        .from('community_members')
        .insert({
          community_id: communityId,
          user_id: userId,
          role: 'member'
        });

      if (error) throw error;

      sendJsonResponse(res, 200, {
        success: true,
        message: 'Successfully joined community'
      });
    } catch (error) {
      console.error('Error joining community:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to join community'
      });
    }
  },

  // Leave community
  async leaveCommunity(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const body = await parseRequestBody(req);
      const { communityId } = body;

      if (!communityId) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Community ID is required'
        });
      }

      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);

      if (error) throw error;

      sendJsonResponse(res, 200, {
        success: true,
        message: 'Successfully left community'
      });
    } catch (error) {
      console.error('Error leaving community:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to leave community'
      });
    }
  },

  // Attend event
  async attendEvent(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const body = await parseRequestBody(req);
      const { eventId, status } = body;

      if (!eventId || !status) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Event ID and status are required'
        });
      }

      if (!['interested', 'going', 'not_going'].includes(status)) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Invalid status. Must be interested, going, or not_going'
        });
      }

      const { error } = await supabase
        .from('event_attendees')
        .upsert({
          event_id: eventId,
          user_id: userId,
          status
        });

      if (error) throw error;

      sendJsonResponse(res, 200, {
        success: true,
        message: `Successfully updated event attendance to ${status}`
      });
    } catch (error) {
      console.error('Error updating event attendance:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to update event attendance'
      });
    }
  },

  // Calculate compatibility score
  async calculateCompatibility(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const body = await parseRequestBody(req);
      const { otherUserId } = body;

      if (!otherUserId) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Other user ID is required'
        });
      }

      // Simple baseline compatibility until a full algorithm is implemented.
      // This writes into user_compatibility via a SECURITY DEFINER function (service role on backend).
      const low = (a: string, b: string) => (a < b ? a : b);
      const high = (a: string, b: string) => (a < b ? b : a);
      const userLow = low(userId, otherUserId);
      const userHigh = high(userId, otherUserId);

      // Heuristic: base 60, +10 if same location, +10 if same intent.
      const [meRes, otherRes] = await Promise.all([
        supabase.from('profiles').select('location, intent').eq('id', userId).maybeSingle(),
        supabase.from('profiles').select('location, intent').eq('id', otherUserId).maybeSingle(),
      ]);
      if (meRes.error) throw meRes.error;
      if (otherRes.error) throw otherRes.error;

      let score = 60;
      if (meRes.data?.location && otherRes.data?.location && meRes.data.location === otherRes.data.location) score += 10;
      if (meRes.data?.intent && otherRes.data?.intent && meRes.data.intent === otherRes.data.intent) score += 10;
      score = Math.max(0, Math.min(100, score));

      const breakdown = {
        version: 'v1_heuristic',
        same_location: Boolean(meRes.data?.location && otherRes.data?.location && meRes.data.location === otherRes.data.location),
        same_intent: Boolean(meRes.data?.intent && otherRes.data?.intent && meRes.data.intent === otherRes.data.intent),
      };

      const { error: upsertErr } = await supabase.rpc('upsert_user_compatibility', {
        p_user_low: userLow,
        p_user_high: userHigh,
        p_score: score,
        p_score_breakdown: breakdown,
      });
      if (upsertErr) throw upsertErr;

      sendJsonResponse(res, 200, {
        success: true,
        data: {
          overallScore: score,
          categoryScores: breakdown,
          sharedInterests: [],
          matchReason: 'Baseline compatibility computed',
        },
      });
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to calculate compatibility score'
      });
    }
  },

  // Get recommendations
  async getRecommendations(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      const limitParam = url.searchParams.get('limit');
      const limit = Math.max(1, Math.min(50, Number(limitParam) || 20));

      const { data, error } = await supabase
        .from('match_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('score', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;

      sendJsonResponse(res, 200, { success: true, data: data || [] });
    } catch (error) {
      console.error('Error getting recommendations:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to fetch recommendations'
      });
    }
  },

  // Mark recommendation as viewed
  async markRecommendationViewed(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const body = await parseRequestBody(req);
      const { recommendationId } = body;

      if (!recommendationId) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Recommendation ID is required'
        });
      }

      const { error } = await supabase
        .from('match_recommendations')
        .update({ status: 'viewed' })
        .eq('id', recommendationId)
        .eq('user_id', userId);

      if (error) throw error;

      sendJsonResponse(res, 200, {
        success: true,
        message: 'Recommendation marked as viewed'
      });
    } catch (error) {
      console.error('Error marking recommendation as viewed:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to mark recommendation as viewed'
      });
    }
  },

  // Generate / refresh recommendations (baseline).
  // This populates match_recommendations so the frontend realtime feed has real data.
  async refreshRecommendations(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, {
          success: false,
          error: 'Unauthorized'
        });
      }

      const body = await parseRequestBody(req);
      const limit = Math.max(1, Math.min(50, Number(body?.limit) || 20));

      // Simple baseline: recommend other profiles (excluding self). Real scoring can be added later.
      const { data: candidates, error: candErr } = await supabase
        .from('profiles')
        .select('id, location, intent')
        .neq('id', userId)
        .limit(limit * 5);
      if (candErr) throw candErr;

      const { data: me, error: meErr } = await supabase
        .from('profiles')
        .select('location, intent')
        .eq('id', userId)
        .maybeSingle();
      if (meErr) throw meErr;

      const scored = (candidates || [])
        .map((c: any) => {
          let score = 55;
          if (me?.location && c.location && me.location === c.location) score += 15;
          if (me?.intent && c.intent && me.intent === c.intent) score += 10;
          score = Math.max(0, Math.min(100, score));
          return {
            user_id: userId,
            recommended_user_id: c.id,
            score,
            reasons: {
              version: 'v1_heuristic',
              common_interests: [],
              same_location: Boolean(me?.location && c.location && me.location === c.location),
              same_intent: Boolean(me?.intent && c.intent && me.intent === c.intent),
            },
            status: 'active',
          };
        })
        .sort((a: any, b: any) => b.score - a.score)
        .slice(0, limit);

      const { error: upsertErr } = await supabase
        .from('match_recommendations')
        .upsert(scored, { onConflict: 'user_id,recommended_user_id' });
      if (upsertErr) throw upsertErr;

      sendJsonResponse(res, 200, {
        success: true,
        data: { insertedOrUpdated: scored.length }
      });
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to refresh recommendations'
      });
    }
  }
  ,

  // Refresh server-generated match metadata (matches.metadata)
  // Optionally provide { matchId } to refresh one match, or { recomputeAll: true } to refresh all matches for the user.
  async refreshMatchMetadata(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, {
          success: false,
          error: 'Unauthorized'
        });
      }

      const body = await parseRequestBody(req);
      const matchId = typeof body?.matchId === 'string' ? body.matchId : null;
      const recomputeAll = Boolean(body?.recomputeAll);

      if (!matchId && !recomputeAll) {
        return sendJsonResponse(res, 400, {
          success: false,
          error: 'Provide matchId or recomputeAll'
        });
      }

      if (matchId) {
        const { data: matchRow, error: matchErr } = await supabase
          .from('matches')
          .select('id, user_low, user_high')
          .eq('id', matchId)
          .maybeSingle();
        if (matchErr) throw matchErr;
        if (!matchRow) {
          return sendJsonResponse(res, 404, { success: false, error: 'Match not found' });
        }
        if (matchRow.user_low !== userId && matchRow.user_high !== userId) {
          return sendJsonResponse(res, 403, { success: false, error: 'Forbidden' });
        }

        const { data: refreshed, error: rpcErr } = await supabase.rpc('refresh_match_metadata', {
          p_match_id: matchId,
        });
        if (rpcErr) throw rpcErr;

        return sendJsonResponse(res, 200, { success: true, data: refreshed });
      }

      // recomputeAll
      const { data: matches, error: listErr } = await supabase
        .from('matches')
        .select('id')
        .or(`user_low.eq.${userId},user_high.eq.${userId}`)
        .limit(200);
      if (listErr) throw listErr;

      const ids = (matches || []).map((m: any) => m.id).filter(Boolean);
      let refreshedCount = 0;

      for (const id of ids) {
        const { error: rpcErr } = await supabase.rpc('refresh_match_metadata', { p_match_id: id });
        if (!rpcErr) refreshedCount += 1;
      }

      return sendJsonResponse(res, 200, { success: true, data: { refreshedCount } });
    } catch (error) {
      console.error('Error refreshing match metadata:', error);
      return sendJsonResponse(res, 500, {
        success: false,
        error: 'Failed to refresh match metadata'
      });
    }
  }
};
// Helper functions for data fetching
async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const meRes = await supabase.from('profiles').select('location').eq('id', userId).maybeSingle();
  if (meRes.error) throw meRes.error;
  
  const [loveStatsRes, peopleNearbyRes, communitiesJoinedRes, conversationsActiveRes] = await Promise.all([
    supabase.from('user_love_stats').select('total_matches').eq('user_id', userId).maybeSingle(),
    meRes.data?.location
      ? supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('location', meRes.data.location)
          .neq('id', userId)
      : Promise.resolve({ count: 0, error: null } as any),
    supabase
      .from('community_members')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .or(`user_low.eq.${userId},user_high.eq.${userId}`)
      .gte('last_message_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('is_archived', false),
  ]);
  
  if (loveStatsRes.error) throw loveStatsRes.error;
  if (peopleNearbyRes.error) throw peopleNearbyRes.error;
  if (communitiesJoinedRes.error) throw communitiesJoinedRes.error;
  if (conversationsActiveRes.error) throw conversationsActiveRes.error;

  const totalMatches = Number(loveStatsRes.data?.total_matches || 0);

  // Compatibility: take best score among accepted matches (same behavior as LoveDashboard overview)
  const acceptedRes = await supabase
    .from('my_matches')
    .select('other_user_id')
    .eq('status', 'accepted')
    .limit(50);
  if (acceptedRes.error) throw acceptedRes.error;

  const acceptedOtherIds = Array.from(new Set(((acceptedRes.data as any[]) || []).map((r: any) => r.other_user_id).filter(Boolean)));
  let compatibilityScore = 0;
  if (acceptedOtherIds.length) {
    const low = (a: string, b: string) => (a < b ? a : b);
    const high = (a: string, b: string) => (a < b ? b : a);
    const pairs = acceptedOtherIds.map((other: string) => ({ user_low: low(userId, other), user_high: high(userId, other) }));

    const compRes = await supabase
      .from('user_compatibility')
      .select('score, user_low, user_high')
      .in('user_low', pairs.map((p) => p.user_low))
      .in('user_high', pairs.map((p) => p.user_high));
    if (compRes.error) throw compRes.error;
    compatibilityScore = Math.max(0, ...(compRes.data || []).map((r: any) => Number(r.score) || 0));
  }

  const communitiesJoined = Number(communitiesJoinedRes.count || 0);
  const conversationsActive = Number(conversationsActiveRes.count || 0);

  const profileCompleteness = await calculateProfileCompleteness(userId);

  return {
    totalMatches,
    compatibilityScore,
    peopleNearby: Number(peopleNearbyRes.count || 0),
    communitiesJoined,
    conversationsActive,
    profileCompleteness,
  };
}

async function getDailyMatches(userId: string): Promise<DailyMatch[]> {
  try {
    // Source of truth for "daily matches" / discover feed: match_recommendations
    const recRes = await supabase
      .from('match_recommendations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('score', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(20);
    if (recRes.error) throw recRes.error;

    const base = (recRes.data as any[]) || [];
    const ids = Array.from(new Set(base.map((r: any) => r.recommended_user_id).filter(Boolean)));

    const [profilesRes, photosRes] = await Promise.all([
      ids.length
        ? supabase.from('profiles').select('id, full_name, age, location, intent').in('id', ids)
        : Promise.resolve({ data: [], error: null } as any),
      ids.length
        ? supabase
            .from('user_photos')
            .select('user_id, photo_url, is_main_photo, photo_order')
            .in('user_id', ids)
        : Promise.resolve({ data: [], error: null } as any),
    ]);
    if (profilesRes.error) throw profilesRes.error;
    if (photosRes.error) throw photosRes.error;

    const profileById = new Map<string, any>((profilesRes.data || []).map((p: any) => [p.id, p]));
    const photosByUser = new Map<string, any[]>();
    (photosRes.data || []).forEach((row: any) => {
      const list = photosByUser.get(row.user_id) || [];
      list.push(row);
      photosByUser.set(row.user_id, list);
    });

    return base
      .map((rec: any) => {
        const p = profileById.get(rec.recommended_user_id);
        if (!p) return null;
        const photos = photosByUser.get(rec.recommended_user_id) || [];
        const main = photos.find((ph) => ph.is_main_photo) || photos.sort((a, b) => (a.photo_order ?? 999) - (b.photo_order ?? 999))[0];
        return {
          id: String(rec.id),
          userId: String(rec.recommended_user_id),
          fullName: p.full_name || 'Unknown User',
          age: Number(p.age || 0),
          location: p.location || 'Unknown Location',
          compatibilityScore: Number(rec.score || 0),
          sharedInterests: Array.isArray(rec.reasons?.common_interests) ? rec.reasons.common_interests : [],
          matchReason: typeof rec.reasons?.bio === 'string' ? rec.reasons.bio : (typeof rec.reasons?.version === 'string' ? rec.reasons.version : ''),
          profilePhoto: main?.photo_url,
          intent: p.intent || 'both',
        } as DailyMatch;
      })
      .filter(Boolean) as DailyMatch[];
  } catch (error) {
    console.error('Error getting daily matches:', error);
    return [];
  }
}

async function getUserCommunities(userId: string): Promise<CommunityPreview[]> {
  try {
    // Get communities user is a member of
    const { data: memberCommunities, error: memberError } = await supabase
      .from('community_members')
      .select(`
        community_id,
        user_communities (
          id,
          name,
          description,
          category,
          member_count,
          icon_url,
          cover_image_url
        )
      `)
      .eq('user_id', userId);

    if (memberError) throw memberError;

    // Get suggested communities
    const { data: suggestedCommunities, error: suggestedError } = await supabase
      .from('user_communities')
      .select('*')
      .eq('is_public', true)
      .limit(3);

    if (suggestedError) throw suggestedError;

    // Transform member communities
    const memberCommunitiesList = (memberCommunities || []).map(item => ({
      ...item.user_communities,
      isMember: true
    }));

    // Transform suggested communities
    const suggestedCommunitiesList = (suggestedCommunities || []).map(community => ({
      ...community,
      isMember: false
    }));

    return [...memberCommunitiesList, ...suggestedCommunitiesList];
  } catch (error) {
    console.error('Error getting user communities:', error);
    return [];
  }
}

async function getRecentActivities(userId: string, limit: number = 10): Promise<RecentActivity[]> {
  try {
    const { data: activities, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (activities || []).map(activity => ({
      id: activity.id,
      type: activity.activity_type,
      title: generateActivityTitle(activity.activity_type, activity.activity_data),
      description: generateActivityDescription(activity.activity_type, activity.activity_data),
      timestamp: activity.created_at,
      metadata: activity.activity_data
    }));
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
}

async function getUserInsights(userId: string): Promise<UserInsight> {
  try {
    const insightsRes = await supabase
      .from('user_insights')
      .select('primary_interests, personality_traits, lifestyle_patterns, compatibility_trends')
      .eq('user_id', userId)
      .maybeSingle();
    if (insightsRes.error) throw insightsRes.error;

    if (!insightsRes.data) {
      // Best-effort compute server-side (service role) if the row doesn't exist yet.
      // This function is intended for trusted execution.
      try {
        await supabase.rpc('recompute_user_insights', { p_user_id: userId });
      } catch {
        // ignore
      }
    }

    const resolved = insightsRes.data || {} as any;
    return {
      primaryInterests: Array.isArray(resolved.primary_interests) ? resolved.primary_interests : [],
      personalityTraits: Array.isArray(resolved.personality_traits) ? resolved.personality_traits : [],
      lifestylePatterns: Array.isArray(resolved.lifestyle_patterns) ? resolved.lifestyle_patterns : [],
      compatibilityTrends: (resolved.compatibility_trends && typeof resolved.compatibility_trends === 'object') ? resolved.compatibility_trends : {},
    };
  } catch (error) {
    console.error('Error getting user insights:', error);
    return {
      primaryInterests: [],
      personalityTraits: [],
      lifestylePatterns: [],
      compatibilityTrends: {
        music: 0,
        movies: 0,
        books: 0,
        travel: 0,
        food: 0,
        lifestyle: 0
      }
    };
  }
}

async function getLocalEvents(userId: string, limit: number = 5): Promise<LocalEvent[]> {
  try {
    // Get user's location
    const { data: userData } = await supabase
      .from('profiles')
      .select('location')
      .eq('id', userId)
      .single();

    if (!userData?.location) return [];

    // Get events in user's location
    const { data: events, error } = await supabase
      .from('local_events')
      .select('*')
      .eq('location', userData.location)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit);

    if (error) throw error;

    // Check attendance for each event
    const eventsWithAttendance = await Promise.all(
      (events || []).map(async (event) => {
        const { data: attendance } = await supabase
          .from('event_attendees')
          .select('*')
          .eq('event_id', event.id)
          .eq('user_id', userId)
          .single();

        const { count: currentAttendees } = await supabase
          .from('event_attendees')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'going');

        return {
          id: event.id,
          title: event.title,
          description: event.description,
          eventType: event.event_type,
          location: event.location,
          startTime: event.start_time,
          endTime: event.end_time,
          maxAttendees: event.max_attendees,
          currentAttendees: currentAttendees || 0,
          isAttending: attendance?.status === 'going'
        };
      })
    );

    return eventsWithAttendance;
  } catch (error) {
    console.error('Error getting local events:', error);
    return [];
  }
}

async function calculateProfileCompleteness(userId: string): Promise<number> {
  try {
    const { data: userData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: interestsData } = await supabase
      .from('user_interests')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: photosData } = await supabase
      .from('user_photos')
      .select('*')
      .eq('user_id', userId);

    if (!userData || !interestsData) return 0;

    let completedFields = 0;
    let totalFields = 0;

    // Check user profile fields
    const userFields = ['full_name', 'date_of_birth', 'gender', 'location', 'intent'];
    userFields.forEach(field => {
      totalFields++;
      if (userData[field]) completedFields++;
    });

    // Check interest fields
    const interestFields = [
      'music_category', 'favorite_singer', 'movie_category', 'favorite_movie',
      'book_category', 'favorite_book', 'travel_category', 'travel_destination',
      'food_category', 'food_cuisine', 'sport', 'hobby_interest'
    ];
    interestFields.forEach(field => {
      totalFields++;
      if (interestsData[field]) completedFields++;
    });

    // Check photos
    totalFields++;
    if (photosData && photosData.length > 0) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  } catch (error) {
    console.error('Error calculating profile completeness:', error);
    return 0;
  }
}

function generateActivityTitle(type: string, data: any): string {
  switch (type) {
    case 'profile_update':
      return 'Profile Updated';
    case 'new_match':
      return 'New Match!';
    case 'community_join':
      return 'Joined Community';
    case 'interest_change':
      return 'Interest Updated';
    case 'achievement_earned':
      return 'Achievement Unlocked!';
    default:
      return 'Activity';
  }
}

function generateActivityDescription(type: string, data: any): string {
  switch (type) {
    case 'profile_update':
      return 'You updated your profile information';
    case 'new_match':
      return `You matched with ${data?.matchedUserName || 'someone new'}!`;
    case 'community_join':
      return `You joined the ${data?.communityName || 'community'}`;
    case 'interest_change':
      return 'You updated your interests';
    case 'achievement_earned':
      return `You earned the ${data?.achievementName || 'achievement'}!`;
    default:
      return 'Something happened';
  }
}

function calculateAverageCompatibility(data: any[] | null | undefined, field: string): number {
  if (!data || data.length === 0) return 0;
  
  const validScores = data
    .map(item => item[field])
    .filter(score => typeof score === 'number' && score >= 0);
  
  if (validScores.length === 0) return 0;
  
  return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
}

export default dashboardRoutes;

