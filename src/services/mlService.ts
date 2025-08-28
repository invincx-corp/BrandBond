

export interface CompatibilityScore {
  overallScore: number;
  categoryScores: Record<string, number>;
  sharedInterests: string[];
  matchReason: string;
}

export interface UserRecommendation {
  recommended_user_id: string;
  confidence_score: number;
  shared_interests: string[];
  reason: string;
}

export interface InterestAnalysis {
  primary_interests: string[];
  personality_traits: string[];
  lifestyle_patterns: string[];
}

// Demo backend base URL
const DEMO_API_BASE = 'http://localhost:3002/api/dashboard';

export class MLService {
  static async calculateCompatibilityScore(
    user1Id: string,
    user2Id: string
  ): Promise<CompatibilityScore> {
    try {
      const response = await fetch(`${DEMO_API_BASE}/compatibility`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user1Id, user2Id }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        overallScore: data.compatibilityScore,
        categoryScores: {
          music: Math.floor(Math.random() * 30) + 70,
          movies: Math.floor(Math.random() * 30) + 70,
          books: Math.floor(Math.random() * 30) + 70,
          travel: Math.floor(Math.random() * 30) + 70,
          food: Math.floor(Math.random() * 30) + 70,
          lifestyle: Math.floor(Math.random() * 30) + 70,
          personality: Math.floor(Math.random() * 30) + 70
        },
        sharedInterests: data.sharedInterests,
        matchReason: data.matchReason
      };
    } catch (error) {
      console.error('Error calculating compatibility score:', error);
      // Return mock data if API fails
      return {
        overallScore: Math.floor(Math.random() * 30) + 70,
        categoryScores: {
          music: Math.floor(Math.random() * 30) + 70,
          movies: Math.floor(Math.random() * 30) + 70,
          books: Math.floor(Math.random() * 30) + 70,
          travel: Math.floor(Math.random() * 30) + 70,
          food: Math.floor(Math.random() * 30) + 70,
          lifestyle: Math.floor(Math.random() * 30) + 70,
          personality: Math.floor(Math.random() * 30) + 70
        },
        sharedInterests: ['Music', 'Travel', 'Food'],
        matchReason: 'High compatibility based on shared interests'
      };
    }
  }

  static async getDailyMatches(userId: string, limit: number = 5): Promise<UserRecommendation[]> {
    try {
      const response = await fetch(`${DEMO_API_BASE}/recommendations`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const recommendations = await response.json();
      return recommendations.map((rec: any) => ({
        recommended_user_id: rec.id,
        confidence_score: rec.compatibilityScore,
        shared_interests: rec.sharedInterests,
        reason: rec.matchReason
      }));
    } catch (error) {
      console.error('Error getting daily matches:', error);
      // Return mock data if API fails
      return [
        {
          recommended_user_id: 'demo-user-1',
          confidence_score: 94,
          shared_interests: ['Music', 'Travel', 'Photography'],
          reason: 'High compatibility in music taste and travel preferences'
        },
        {
          recommended_user_id: 'demo-user-2',
          confidence_score: 89,
          shared_interests: ['Movies', 'Food', 'Fitness'],
          reason: 'Shared love for international cuisine and fitness goals'
        },
        {
          recommended_user_id: 'demo-user-3',
          confidence_score: 91,
          shared_interests: ['Technology', 'Art', 'Reading'],
          reason: 'Common interest in tech innovation and creative arts'
        }
      ];
    }
  }

  static async analyzeUserInterests(userId: string): Promise<InterestAnalysis> {
    try {
      const response = await fetch(`${DEMO_API_BASE}/insights`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const insights = await response.json();
      return {
        primary_interests: insights.primaryInterests,
        personality_traits: insights.personalityTraits,
        lifestyle_patterns: insights.lifestylePatterns
      };
    } catch (error) {
      console.error('Error analyzing user interests:', error);
      // Return mock data if API fails
      return {
        primary_interests: ['Music', 'Travel', 'Technology', 'Food', 'Fitness'],
        personality_traits: ['Adventurous', 'Creative', 'Social', 'Analytical', 'Ambitious'],
        lifestyle_patterns: ['Active lifestyle', 'Social networking', 'Continuous learning']
      };
    }
  }

  static async generateRecommendations(userId: string): Promise<UserRecommendation[]> {
    try {
      const analysis = await this.analyzeUserInterests(userId);
      
      const [communitySuggestions, interestExploration] = await Promise.all([
        this.generateCommunitySuggestions(userId, analysis),
        this.generateInterestExploration(userId, analysis)
      ]);
      
      return [...communitySuggestions, ...interestExploration];
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  private static async generateCommunitySuggestions(
    userId: string, 
    analysis: InterestAnalysis
  ): Promise<UserRecommendation[]> {
    // Mock community suggestions
    return [
      {
        recommended_user_id: 'community-1',
        confidence_score: 85,
        shared_interests: ['Technology', 'Innovation'],
        reason: 'Join our tech enthusiasts community'
      }
    ];
  }

  private static async generateInterestExploration(
    userId: string, 
    analysis: InterestAnalysis
  ): Promise<UserRecommendation[]> {
    // Mock interest exploration
    return [
      {
        recommended_user_id: 'interest-1',
        confidence_score: 82,
        shared_interests: ['Photography', 'Travel'],
        reason: 'Explore photography communities'
      }
    ];
  }
}

export default MLService;
