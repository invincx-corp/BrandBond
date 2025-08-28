export interface UserProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  bio: string;
  commonInterests: string[];
  allTimeFavorites: {
    [category: string]: Array<{
      id: string;
      name: string;
      description: string;
      image: string;
    }>;
  };
}

export interface AIPrompt {
  id: string;
  text: string;
  category: 'common-interest' | 'different-favorite' | 'conversation-starter' | 'location-based' | 'age-based';
  confidence: number;
  reasoning: string;
}

export class AIPromptService {
  private static readonly FAVORITE_CATEGORIES = [
    'Fav Singers', 'Fav Songs', 'Fav Music Categories', 'Fav Music Composers',
    'Fav Songwriters', 'Fav Music Bands', 'Fav Idols', 'Fav Singer Groups',
    'Fav Movies', 'Fav Movie Categories', 'Fav TV Series', 'Fav TV Series Categories',
    'Fav Books', 'Fav Book Categories', 'Fav Cartoons', 'Fav Comics',
    'Fav Actors', 'Fav Sports', 'Fav Athletes', 'Fav Travel Destinations',
    'Fav Travel Destination Categories', 'Fav Food/Cuisine', 'Fav Food/Cuisine Categories',
    'Fav Shopping Brands', 'Fav Tech Gadgets', 'Fav Hobbies'
  ];

  private static readonly CONVERSATION_STARTERS: { [key: string]: string[] } = {
    'Fav Singers': [
      "I love {favorite} too! What's your favorite song by them?",
      "Have you been to any {favorite} concerts?",
      "What do you think makes {favorite} so special?",
      "I'd love to hear your thoughts on {favorite}'s latest album"
    ],
    'Fav Movies': [
      "That's such a great choice! What scene from {favorite} always gets you?",
      "Have you watched any other films by the same director?",
      "What makes {favorite} stand out from other movies for you?",
      "I'd love to hear your take on the ending of {favorite}"
    ],
    'Fav Books': [
      "That's one of my favorites too! What chapter really moved you?",
      "Have you read anything else by the same author?",
      "What themes in {favorite} resonated with you most?",
      "I'd love to discuss the characters in {favorite}"
    ],
    'Fav Travel Destinations': [
      "That's my dream destination too! What attracts you to {favorite}?",
      "Have you been there before, or is it on your bucket list?",
      "What would be your perfect day in {favorite}?",
      "I'd love to hear your travel plans for {favorite}"
    ],
    'Fav Food/Cuisine': [
      "That's such delicious cuisine! What's your favorite dish?",
      "Have you tried cooking {favorite} at home?",
      "What restaurant serves the best {favorite} in your area?",
      "I'd love to hear about your food adventures with {favorite}"
    ]
  };

  static generatePersonalizedPrompts(
    currentUser: UserProfile,
    otherUser: UserProfile,
    maxPrompts: number = 8
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];
    
    // 1. Common Interest Prompts (High Priority)
    const commonInterestPrompts = this.generateCommonInterestPrompts(currentUser, otherUser);
    prompts.push(...commonInterestPrompts);

    // 2. Different Favorite Prompts (Medium Priority)
    const differentFavoritePrompts = this.generateDifferentFavoritePrompts(currentUser, otherUser);
    prompts.push(...differentFavoritePrompts);

    // 3. Conversation Starter Prompts (Medium Priority)
    const conversationStarterPrompts = this.generateConversationStarterPrompts(currentUser, otherUser);
    prompts.push(...conversationStarterPrompts);

    // 4. Location-based Prompts (Lower Priority)
    const locationPrompts = this.generateLocationBasedPrompts(currentUser, otherUser);
    prompts.push(...locationPrompts);

    // 5. Age-based Prompts (Lower Priority)
    const agePrompts = this.generateAgeBasedPrompts(currentUser, otherUser);
    prompts.push(...agePrompts);

    // Sort by confidence and return top prompts
    return prompts
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxPrompts);
  }

  private static generateCommonInterestPrompts(
    currentUser: UserProfile,
    otherUser: UserProfile
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];
    const commonInterests = currentUser.commonInterests.filter(interest => 
      otherUser.commonInterests.includes(interest)
    );

    commonInterests.forEach(interest => {
      const category = this.findCategoryForInterest(interest);
      if (category && this.CONVERSATION_STARTERS[category]) {
        const templates = this.CONVERSATION_STARTERS[category];
        const template = templates[Math.floor(Math.random() * templates.length)];
        const prompt = template.replace('{favorite}', interest);
        
        prompts.push({
          id: `common-${interest}-${Date.now()}`,
          text: prompt,
          category: 'common-interest',
          confidence: 0.95,
          reasoning: `Both users share interest in ${interest}`
        });
      }
    });

    return prompts;
  }

  private static generateDifferentFavoritePrompts(
    currentUser: UserProfile,
    otherUser: UserProfile
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];
    
    // Find categories where users have different favorites
    this.FAVORITE_CATEGORIES.forEach(category => {
      const currentFavorites = currentUser.allTimeFavorites[category] || [];
      const otherFavorites = otherUser.allTimeFavorites[category] || [];
      
      if (currentFavorites.length > 0 && otherFavorites.length > 0) {
        const currentFavorite = currentFavorites[0];
        const otherFavorite = otherFavorites[0];
        
        if (currentFavorite.name !== otherFavorite.name) {
          // Generate prompts that introduce each other to different favorites
          prompts.push({
            id: `different-${category}-${Date.now()}`,
            text: `I love ${currentFavorite.name}! Have you ever tried ${otherFavorite.name}? I think you'd really enjoy it.`,
            category: 'different-favorite',
            confidence: 0.85,
            reasoning: `Users have different favorites in ${category} - opportunity for discovery`
          });

          prompts.push({
            id: `different-${category}-2-${Date.now()}`,
            text: `I'm curious about ${otherFavorite.name}! What makes it special to you? I'd love to learn more.`,
            category: 'different-favorite',
            confidence: 0.80,
            reasoning: `Asking about other user's different favorite in ${category}`
          });
        }
      }
    });

    return prompts;
  }

  private static generateConversationStarterPrompts(
    currentUser: UserProfile,
    otherUser: UserProfile
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];
    
    // Generate prompts based on current user's favorites that might interest the other user
    this.FAVORITE_CATEGORIES.forEach(category => {
      const currentFavorites = currentUser.allTimeFavorites[category] || [];
      if (currentFavorites.length > 0) {
        const favorite = currentFavorites[0];
        
        // Check if this category might interest the other user
        const otherUserHasCategory = otherUser.allTimeFavorites[category] && 
                                   otherUser.allTimeFavorites[category].length > 0;
        
        if (!otherUserHasCategory) {
          // Introduce the other user to this category
          prompts.push({
            id: `starter-${category}-${Date.now()}`,
            text: `I'm really into ${category.toLowerCase()}. Have you ever explored ${favorite.name}? It's amazing!`,
            category: 'conversation-starter',
            confidence: 0.75,
            reasoning: `Introducing other user to a new category they might enjoy`
          });
        }
      }
    });

    return prompts;
  }

  private static generateLocationBasedPrompts(
    currentUser: UserProfile,
    otherUser: UserProfile
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];
    
    if (currentUser.location && otherUser.location) {
      if (currentUser.location === otherUser.location) {
        prompts.push({
          id: `location-same-${Date.now()}`,
          text: `It's so cool that we're both from ${currentUser.location}! What's your favorite spot here?`,
          category: 'location-based',
          confidence: 0.90,
          reasoning: `Users share the same location`
        });
      } else {
        prompts.push({
          id: `location-different-${Date.now()}`,
          text: `I'm from ${currentUser.location}! What's ${otherUser.location} like? I'd love to visit someday.`,
          category: 'location-based',
          confidence: 0.80,
          reasoning: `Users are from different locations - opportunity to learn about each other's cities`
        });
      }
    }

    return prompts;
  }

  private static generateAgeBasedPrompts(
    currentUser: UserProfile,
    otherUser: UserProfile
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];
    const ageDifference = Math.abs(currentUser.age - otherUser.age);
    
    if (ageDifference <= 2) {
      prompts.push({
        id: `age-similar-${Date.now()}`,
        text: `We're around the same age! What's been the most exciting part of being ${Math.min(currentUser.age, otherUser.age)} so far?`,
        category: 'age-based',
        confidence: 0.70,
        reasoning: `Users are similar in age - shared life experiences`
      });
    } else if (ageDifference <= 5) {
      prompts.push({
        id: `age-close-${Date.now()}`,
        text: `I'm ${currentUser.age} and you're ${otherUser.age}! What advice would you give to someone my age?`,
        category: 'age-based',
        confidence: 0.65,
        reasoning: `Users are close in age - opportunity for advice and perspective`
      });
    }

    return prompts;
  }

  private static findCategoryForInterest(interest: string): string | null {
    // Find which category this interest belongs to
    for (const category of this.FAVORITE_CATEGORIES) {
      if (category.toLowerCase().includes(interest.toLowerCase()) || 
          interest.toLowerCase().includes(category.toLowerCase())) {
        return category;
      }
    }
    return null;
  }

  static generateUniverseSpecificPrompts(
    currentUser: UserProfile,
    otherUser: UserProfile,
    universe: 'love' | 'friends',
    maxPrompts: number = 6
  ): AIPrompt[] {
    const basePrompts = this.generatePersonalizedPrompts(currentUser, otherUser, maxPrompts);
    
    if (universe === 'love') {
      // Add love-specific prompts
      basePrompts.push({
        id: `love-romantic-${Date.now()}`,
        text: `I feel like we have such a special connection. What's something that makes you feel truly alive?`,
        category: 'conversation-starter',
        confidence: 0.90,
        reasoning: 'Love universe - romantic connection building'
      });
      
      basePrompts.push({
        id: `love-deep-${Date.now()}`,
        text: `I'd love to know what's on your heart today. What's something you're passionate about right now?`,
        category: 'conversation-starter',
        confidence: 0.85,
        reasoning: 'Love universe - emotional depth and vulnerability'
      });
    } else {
      // Add friends-specific prompts
      basePrompts.push({
        id: `friends-casual-${Date.now()}`,
        text: `Hey! I think we'd get along really well. What's something fun you've been up to lately?`,
        category: 'conversation-starter',
        confidence: 0.90,
        reasoning: 'Friends universe - casual friendship building'
      });
      
      basePrompts.push({
        id: `friends-activity-${Date.now()}`,
        text: `We seem to have similar interests! Would you be up for chatting about something we both love?`,
        category: 'conversation-starter',
        confidence: 0.85,
        reasoning: 'Friends universe - activity and interest-based connection'
      });
    }

    return basePrompts
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxPrompts);
  }
}
