import MLService from './mlService';

export interface DashboardStats {
  totalMatches: number;
  peopleNearby: number;
  communitiesJoined: number;
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

// Demo backend base URL - not used in mock mode
// const DEMO_API_BASE = 'http://localhost:3002/api/dashboard';

export class DashboardService {
  static async getDashboardData(userId: string) {
    // Return mock data instead of trying to fetch from backend
    return {
      userId: userId,
      lastUpdated: new Date().toISOString(),
      status: 'demo_mode'
    };
  }

  static async getDashboardStats(userId: string): Promise<DashboardStats> {
    // Return mock stats data
    return {
      totalMatches: 47,
      peopleNearby: 23,
      communitiesJoined: 5,
      profileCompleteness: 92,
      compatibilityScore: 94
    };
  }

  static async getDailyMatches(userId: string, limit: number = 5): Promise<DailyMatch[]> {
    // Return mock daily matches data
    return [
      {
        id: "1",
        fullName: "Priya Sharma",
        age: 26,
        location: "Mumbai, Maharashtra",
        intent: "Long-term relationship",
        compatibilityScore: 94,
        sharedInterests: ["Travel", "Photography", "Yoga"],
        matchReason: "High compatibility in lifestyle and values",
        profilePhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&h=500&fit=crop&crop=face"
      },
      {
        id: "2",
        fullName: "Ananya Patel",
        age: 28,
        location: "Delhi, NCR",
        intent: "Casual dating",
        compatibilityScore: 89,
        sharedInterests: ["Music", "Cooking", "Reading"],
        matchReason: "Great conversation starter potential",
        profilePhoto: "https://images.unsplash.com/photo-1438761681033-94ddf0286df2?w=500&h=500&fit=crop&crop=face"
      }
    ].slice(0, limit);
  }

  static async getUserCommunities(userId: string): Promise<CommunityPreview[]> {
    // Return mock communities data
    return [
      {
        id: "1",
        name: "Travel Enthusiasts",
        category: "Lifestyle",
        description: "For people who love exploring the world",
        memberCount: 1247,
        isMember: true,
        iconUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100&h=100&fit=crop",
        coverImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop"
      },
      {
        id: "2",
        name: "Food & Cooking",
        category: "Hobbies",
        description: "Share recipes and cooking tips",
        memberCount: 892,
        isMember: false,
        iconUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop",
        coverImageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=200&fit=crop"
      }
    ];
  }

  static async getRecentActivities(userId: string, limit: number = 10): Promise<RecentActivity[]> {
    // Return mock activities data
    return [
      {
        id: "1",
        type: "new_match" as const,
        title: "New Match Found",
        description: "You matched with Priya Sharma (94% compatibility)",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: "2",
        type: "achievement_earned" as const,
        title: "Profile Complete",
        description: "You completed your profile setup",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
      }
    ].slice(0, limit);
  }

  static async getUserInsights(userId: string): Promise<UserInsight> {
    // Return mock insights data
    return {
      primaryInterests: ["Travel", "Photography", "Music", "Cooking"],
      personalityTraits: ["Adventurous", "Creative", "Social", "Optimistic"],
      lifestylePatterns: ["Active", "Social", "Creative", "Health-conscious"],
      compatibilityTrends: {
        "Travel": 95,
        "Music": 88,
        "Food": 82,
        "Sports": 75
      }
    };
  }

  static async getLocalEvents(userId: string): Promise<LocalEvent[]> {
    // Return mock events data
    return [
      {
        id: "1",
        title: "Coffee & Conversation Meetup",
        description: "Casual meetup for singles in the area",
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        currentAttendees: 12
      },
      {
        id: "2",
        title: "Weekend Hiking Adventure",
        description: "Group hiking trip for nature lovers",
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
        currentAttendees: 8
      }
    ];
  }

  static async joinCommunity(userId: string, communityId: string): Promise<boolean> {
    // Mock successful join
    return true;
  }

  static async leaveCommunity(userId: string, communityId: string): Promise<boolean> {
    // Mock successful leave
    return true;
  }

  static async attendEvent(userId: string, eventId: string, status: 'interested' | 'going' | 'not_going'): Promise<boolean> {
    // Mock successful attendance update
    return true;
  }

  static async getConversationPreviews(userId: string, limit: number = 5) {
    // Demo implementation - return empty array for now
    return [];
  }

  static async markRecommendationViewed(userId: string, recommendationId: string): Promise<boolean> {
    // Mock successful mark as viewed
    return true;
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
