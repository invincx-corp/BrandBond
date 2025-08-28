import { createServer } from 'http';
import { supabase } from './supabase';
import MLService from '../services/mlService';

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
const extractUserId = (req: any): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  // In a real app, you'd verify the JWT token here
  // For now, we'll extract a user ID from the token
  const token = authHeader.substring(7);
  // This is a simplified approach - in production, verify the JWT properly
  return token || null;
};

// Dashboard routes
export const dashboardRoutes = {
  // Get comprehensive dashboard data
  async getDashboardData(req: any, res: any) {
    try {
      const userId = extractUserId(req);
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
      const userId = extractUserId(req);
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
      const userId = extractUserId(req);
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
      const userId = extractUserId(req);
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
      const userId = extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const activities = await getRecentActivities(userId);
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
      const userId = extractUserId(req);
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
      const userId = extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const events = await getLocalEvents(userId);
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
      const userId = extractUserId(req);
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
      const userId = extractUserId(req);
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
      const userId = extractUserId(req);
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
      const userId = extractUserId(req);
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

      const compatibilityScore = await MLService.calculateCompatibilityScore(userId, otherUserId);
      
      sendJsonResponse(res, 200, {
        success: true,
        data: compatibilityScore
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
      const userId = extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { 
          success: false, 
          error: 'Unauthorized' 
        });
      }

      const recommendations = await MLService.generateRecommendations(userId);
      
      sendJsonResponse(res, 200, {
        success: true,
        data: recommendations
      });
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
      const userId = extractUserId(req);
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
        .from('user_recommendations')
        .update({ is_viewed: true })
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
  }
};

// Helper functions for data fetching
async function getDashboardStats(userId: string): Promise<DashboardStats> {
  // Get total matches
  const { count: totalMatches } = await supabase
    .from('user_matches')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'accepted');

  // Get average compatibility score
  const { data: compatibilityData } = await supabase
    .from('compatibility_scores')
    .select('overall_score')
    .eq('user_id', userId)
    .gte('overall_score', 60);

  const compatibilityScore = compatibilityData && compatibilityData.length > 0
    ? Math.round(compatibilityData.reduce((sum, item) => sum + item.overall_score, 0) / compatibilityData.length)
    : 0;

  // Get people nearby
  const { data: userData } = await supabase
    .from('users')
    .select('location')
    .eq('id', userId)
    .single();

  const { count: peopleNearby } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('location', userData?.location || '')
    .neq('id', userId);

  // Get communities joined
  const { count: communitiesJoined } = await supabase
    .from('community_members')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get active conversations
  const { count: conversationsActive } = await supabase
    .from('user_conversations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_archived', false);

  // Calculate profile completeness
  const profileCompleteness = await calculateProfileCompleteness(userId);

  return {
    totalMatches: totalMatches || 0,
    compatibilityScore,
    peopleNearby: peopleNearby || 0,
    communitiesJoined: communitiesJoined || 0,
    conversationsActive: conversationsActive || 0,
    profileCompleteness
  };
}

async function getDailyMatches(userId: string): Promise<DailyMatch[]> {
  try {
    const recommendations = await MLService.getDailyMatches(userId, 5);
    
    const matchesWithDetails = await Promise.all(
      recommendations.map(async (rec) => {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, age, location, intent')
          .eq('id', rec.recommended_user_id)
          .single();

        const { data: photoData } = await supabase
          .from('user_photos')
          .select('photo_url')
          .eq('user_id', rec.recommended_user_id)
          .eq('is_main_photo', true)
          .single();

        return {
          id: rec.recommended_user_id,
          userId: rec.recommended_user_id,
          fullName: userData?.full_name || 'Unknown User',
          age: userData?.age || 0,
          location: userData?.location || 'Unknown Location',
          compatibilityScore: rec.confidence_score,
          sharedInterests: rec.shared_interests,
          matchReason: rec.reason,
          profilePhoto: photoData?.photo_url,
          intent: userData?.intent || 'both'
        };
      })
    );

    return matchesWithDetails;
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

async function getRecentActivities(userId: string): Promise<RecentActivity[]> {
  try {
    const { data: activities, error } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

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
    const analysis = await MLService.analyzeUserInterests(userId);
    
    // Get compatibility trends
    const { data: compatibilityData } = await supabase
      .from('compatibility_scores')
      .select('*')
      .eq('user_id', userId)
      .gte('overall_score', 60)
      .order('calculated_at', { ascending: false })
      .limit(10);

    const compatibilityTrends = {
      music: calculateAverageCompatibility(compatibilityData, 'music_compatibility'),
      movies: calculateAverageCompatibility(compatibilityData, 'movie_compatibility'),
      books: calculateAverageCompatibility(compatibilityData, 'book_compatibility'),
      travel: calculateAverageCompatibility(compatibilityData, 'travel_compatibility'),
      food: calculateAverageCompatibility(compatibilityData, 'food_compatibility'),
      lifestyle: calculateAverageCompatibility(compatibilityData, 'lifestyle_compatibility')
    };

    return {
      primaryInterests: analysis.primary_interests,
      personalityTraits: analysis.personality_traits,
      lifestylePatterns: analysis.lifestyle_patterns,
      compatibilityTrends
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

async function getLocalEvents(userId: string): Promise<LocalEvent[]> {
  try {
    // Get user's location
    const { data: userData } = await supabase
      .from('users')
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
      .limit(5);

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
      .from('users')
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

function calculateAverageCompatibility(data: any[], field: string): number {
  if (!data || data.length === 0) return 0;
  
  const validScores = data
    .map(item => item[field])
    .filter(score => score !== null && score !== undefined);
  
  if (validScores.length === 0) return 0;
  
  return Math.round(validScores.reduce((sum, score) => sum + score, 0) / validScores.length);
}

export default dashboardRoutes;

