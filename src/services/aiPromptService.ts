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
  additionalFavorites?: {
    [category: string]: string[];
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

  private static getAdditionalFavoritesArray(profile: UserProfile, category: string): string[] {
    const raw = profile.additionalFavorites?.[category];
    if (!raw || !Array.isArray(raw)) return [];
    return raw
      .filter(v => typeof v === 'string')
      .map(v => v.trim())
      .filter(Boolean);
  }

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
    maxPrompts: number = 12
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];
    
    // 1. Common Interest Prompts (High Priority - 95% confidence)
    const commonInterestPrompts = this.generateCommonInterestPrompts(currentUser, otherUser);
    prompts.push(...commonInterestPrompts);

    // 2. Different Favorite Prompts (High Priority - 90% confidence)
    const differentFavoritePrompts = this.generateDifferentFavoritePrompts(currentUser, otherUser);
    prompts.push(...differentFavoritePrompts);

    // 3. Non-Common Favorites Discovery Prompts (High Priority - 88% confidence)
    const nonCommonFavoritesPrompts = this.generateNonCommonFavoritesPrompts(currentUser, otherUser);
    prompts.push(...nonCommonFavoritesPrompts);

    // 4. Interest Discovery Prompts (High Priority - 85% confidence)
    const interestDiscoveryPrompts = this.generateInterestDiscoveryPrompts(currentUser, otherUser);
    prompts.push(...interestDiscoveryPrompts);

    // 5. Conversation Starter Prompts (Medium Priority - 80% confidence)
    const conversationStarterPrompts = this.generateConversationStarterPrompts(currentUser, otherUser);
    prompts.push(...conversationStarterPrompts);

    // 6. Location-based Prompts (Medium Priority - 75% confidence)
    const locationPrompts = this.generateLocationBasedPrompts(currentUser, otherUser);
    prompts.push(...locationPrompts);

    // 7. Age-based Prompts (Medium Priority - 70% confidence)
    const agePrompts = this.generateAgeBasedPrompts(currentUser, otherUser);
    prompts.push(...agePrompts);

    // 8. Cross-Category Connection Prompts (Medium Priority - 75% confidence)
    const crossCategoryPrompts = this.generateCrossCategoryConnectionPrompts(currentUser, otherUser);
    prompts.push(...crossCategoryPrompts);

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

      const currentAdditional = this.getAdditionalFavoritesArray(currentUser, category);
      const otherUserHasCategory = otherUser.allTimeFavorites[category] &&
                                 otherUser.allTimeFavorites[category].length > 0;

      if (currentFavorites.length === 0 && currentAdditional.length > 0 && !otherUserHasCategory) {
        const favoriteName = currentAdditional[0];
        prompts.push({
          id: `starter-additional-${category}-${Date.now()}`,
          text: `Lately I've been really into ${favoriteName}. Do you have any favorites in ${category.toLowerCase()}?`,
          category: 'conversation-starter',
          confidence: 0.78,
          reasoning: `Using additional favorites to start a conversation in ${category}`
        });
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
            confidence: 0.80,
            reasoning: `Introducing other user to a new category they might enjoy`
          });
        }
      }
    });

    return prompts;
  }

  private static generateNonCommonFavoritesPrompts(
    currentUser: UserProfile,
    otherUser: UserProfile
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];
    
    // Find categories where users have completely different favorites
    this.FAVORITE_CATEGORIES.forEach(category => {
      const currentFavorites = currentUser.allTimeFavorites[category] || [];
      const otherFavorites = otherUser.allTimeFavorites[category] || [];
      const currentAdditional = this.getAdditionalFavoritesArray(currentUser, category);
      const otherAdditional = this.getAdditionalFavoritesArray(otherUser, category);
      
      if (currentFavorites.length > 0 && otherFavorites.length > 0) {
        const currentFavorite = currentFavorites[0];
        const otherFavorite = otherFavorites[0];
        
        if (currentFavorite.name !== otherFavorite.name) {
          // Generate prompts about discovering each other's different favorites
          prompts.push({
            id: `discovery-${category}-${Date.now()}`,
            text: `I love ${currentFavorite.name}! I see you're into ${otherFavorite.name}. What makes ${otherFavorite.name} special to you?`,
            category: 'different-favorite',
            confidence: 0.88,
            reasoning: `Users have different favorites in ${category} - opportunity for mutual discovery`
          });

          prompts.push({
            id: `discovery-${category}-2-${Date.now()}`,
            text: `I'm curious about ${otherFavorite.name}! Have you ever tried ${currentFavorite.name}? I think you'd love it!`,
            category: 'different-favorite',
            confidence: 0.85,
            reasoning: `Introducing each other to different favorites in ${category}`
          });
        }
      }
    });

    return prompts;
  }

  private static generateInterestDiscoveryPrompts(
    currentUser: UserProfile,
    otherUser: UserProfile
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];
    
    // Find interests that are unique to each user
    const currentUniqueInterests = currentUser.commonInterests.filter(interest => 
      !otherUser.commonInterests.includes(interest)
    );
    
    const otherUniqueInterests = otherUser.commonInterests.filter(interest => 
      !currentUser.commonInterests.includes(interest)
    );

    // Generate prompts about current user's unique interests
    currentUniqueInterests.forEach(interest => {
      prompts.push({
        id: `interest-current-${interest}-${Date.now()}`,
        text: `I'm really passionate about ${interest}! What interests you most about this topic?`,
        category: 'conversation-starter',
        confidence: 0.85,
        reasoning: `Current user has unique interest in ${interest} - opportunity to share passion`
      });
    });

    // Generate prompts about other user's unique interests
    otherUniqueInterests.forEach(interest => {
      prompts.push({
        id: `interest-other-${interest}-${Date.now()}`,
        text: `I see you're into ${interest}! That sounds fascinating. What got you interested in it?`,
        category: 'conversation-starter',
        confidence: 0.85,
        reasoning: `Other user has unique interest in ${interest} - opportunity to learn and connect`
      });
    });

    return prompts;
  }

  private static generateCrossCategoryConnectionPrompts(
    currentUser: UserProfile,
    otherUser: UserProfile
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];
    
    // Find connections between different categories
    const currentCategories = Object.keys(currentUser.allTimeFavorites);
    const otherCategories = Object.keys(otherUser.allTimeFavorites);
    
    // Look for interesting combinations
    currentCategories.forEach(currentCategory => {
      otherCategories.forEach(otherCategory => {
        if (currentCategory !== otherCategory) {
          const currentFavorites = currentUser.allTimeFavorites[currentCategory] || [];
          const otherFavorites = otherUser.allTimeFavorites[otherCategory] || [];
          
          if (currentFavorites.length > 0 && otherFavorites.length > 0) {
            const currentFavorite = currentFavorites[0];
            const otherFavorite = otherFavorites[0];
            
            // Generate prompts that connect different categories
            prompts.push({
              id: `cross-${currentCategory}-${otherCategory}-${Date.now()}`,
              text: `I love ${currentFavorite.name} from ${currentCategory.toLowerCase()}! I wonder if you'd enjoy it too, since you like ${otherFavorite.name} from ${otherCategory.toLowerCase()}.`,
              category: 'conversation-starter',
              confidence: 0.75,
              reasoning: `Connecting different favorite categories for discovery`
            });
          }
        }
      });
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
    maxPrompts: number = 12
  ): AIPrompt[] {
    const prompts: AIPrompt[] = [];
    
    // 1. COMMON INTEREST PROMPTS (High Priority)
    prompts.push({
      id: `common-1-${Date.now()}`,
      text: `I noticed we both love {category}! What's your absolute favorite and why does it mean so much to you?`,
      category: 'common-interest',
      confidence: 0.95,
      reasoning: 'High confidence - shared interests create immediate connection'
    });
    
    prompts.push({
      id: `common-2-${Date.now()}`,
      text: `We have such similar taste in {category}! What's something you've discovered recently that you think I'd love too?`,
      category: 'common-interest',
      confidence: 0.93,
      reasoning: 'High confidence - mutual discovery and sharing'
    });

    prompts.push({
      id: `common-3-${Date.now()}`,
      text: `It's amazing how we both appreciate {category}! What's your most memorable experience with it?`,
      category: 'common-interest',
      confidence: 0.92,
      reasoning: 'High confidence - shared appreciation and experiences'
    });

    // 2. DIFFERENT FAVORITE PROMPTS (High Priority)
    prompts.push({
      id: `different-1-${Date.now()}`,
      text: `I'm curious about your love for {category}! What makes it so special to you? I'd love to understand your perspective.`,
      category: 'different-favorite',
      confidence: 0.90,
      reasoning: 'High confidence - curiosity about different preferences'
    });
    
    prompts.push({
      id: `different-2-${Date.now()}`,
      text: `I've never really explored {category}, but you seem passionate about it! What would you recommend I start with?`,
      category: 'different-favorite',
      confidence: 0.88,
      reasoning: 'High confidence - learning from different interests'
    });

    prompts.push({
      id: `different-3-${Date.now()}`,
      text: `Your taste in {category} is so unique! What's the story behind how you got into it?`,
      category: 'different-favorite',
      confidence: 0.87,
      reasoning: 'High confidence - personal stories and background'
    });

    // 3. CONVERSATION STARTER PROMPTS (High Priority)
    prompts.push({
      id: `conversation-1-${Date.now()}`,
      text: `I'd love to get to know you better! What's something that always makes you smile, no matter what?`,
      category: 'conversation-starter',
      confidence: 0.90,
      reasoning: 'High confidence - universal positive emotion'
    });
    
    prompts.push({
      id: `conversation-2-${Date.now()}`,
      text: `What's the most interesting thing that happened to you this week? I'm genuinely curious!`,
      category: 'conversation-starter',
      confidence: 0.88,
      reasoning: 'High confidence - recent experiences and curiosity'
    });

    prompts.push({
      id: `conversation-3-${Date.now()}`,
      text: `If you could have dinner with anyone, living or historical, who would it be and what would you talk about?`,
      category: 'conversation-starter',
      confidence: 0.87,
      reasoning: 'High confidence - imaginative and personal'
    });

    // 4. LOCATION-BASED PROMPTS (Medium Priority)
    prompts.push({
      id: `location-1-${Date.now()}`,
      text: `I love that you're from {location}! What's the one thing about your hometown that everyone should know?`,
      category: 'location-based',
      confidence: 0.80,
      reasoning: 'Medium confidence - location pride and local knowledge'
    });
    
    prompts.push({
      id: `location-2-${Date.now()}`,
      text: `{location} sounds amazing! What's your favorite hidden gem that tourists usually miss?`,
      category: 'location-based',
      confidence: 0.78,
      reasoning: 'Medium confidence - insider knowledge and recommendations'
    });

    prompts.push({
      id: `location-3-${Date.now()}`,
      text: `What's the most beautiful place you've ever visited? I'm always looking for new travel inspiration!`,
      category: 'location-based',
      confidence: 0.75,
      reasoning: 'Medium confidence - travel experiences and inspiration'
    });

    // 5. AGE-BASED PROMPTS (Medium Priority)
    prompts.push({
      id: `age-1-${Date.now()}`,
      text: `At {age}, what's the most valuable lesson you've learned so far in life?`,
      category: 'age-based',
      confidence: 0.78,
      reasoning: 'Medium confidence - life experience and wisdom'
    });
    
    prompts.push({
      id: `age-2-${Date.now()}`,
      text: `What's something you wish you knew when you were younger? I think we could all learn from each other!`,
      category: 'age-based',
      confidence: 0.75,
      reasoning: 'Medium confidence - reflection and advice sharing'
    });

    prompts.push({
      id: `age-3-${Date.now()}`,
      text: `What's your biggest goal for the next year? I love hearing about people's dreams and aspirations!`,
      category: 'age-based',
      confidence: 0.73,
      reasoning: 'Medium confidence - future planning and motivation'
    });

    // 6. UNIVERSE-SPECIFIC ENHANCEMENTS
    if (universe === 'love') {
      // Love universe specific prompts
      prompts.push({
        id: `love-romantic-${Date.now()}`,
        text: `I feel like we have such a special connection. What's something that makes you feel truly alive?`,
        category: 'conversation-starter',
        confidence: 0.90,
        reasoning: 'Love universe - romantic connection building'
      });
      
      prompts.push({
        id: `love-deep-${Date.now()}`,
        text: `I'd love to know what's on your heart today. What's something you're passionate about right now?`,
        category: 'conversation-starter',
        confidence: 0.85,
        reasoning: 'Love universe - emotional depth and vulnerability'
      });

      prompts.push({
        id: `love-discovery-${Date.now()}`,
        text: `I want to discover every little thing about you. What's a favorite memory that always makes you smile?`,
        category: 'conversation-starter',
        confidence: 0.88,
        reasoning: 'Love universe - deep personal discovery'
      });

      prompts.push({
        id: `love-future-${Date.now()}`,
        text: `I can see us building something beautiful together. What's your biggest dream for the future?`,
        category: 'conversation-starter',
        confidence: 0.87,
        reasoning: 'Love universe - future planning and dreams'
      });
    } else {
      // Friends universe specific prompts
      prompts.push({
        id: `friends-casual-${Date.now()}`,
        text: `Hey! I think we'd get along really well. What's something fun you've been up to lately?`,
        category: 'conversation-starter',
        confidence: 0.90,
        reasoning: 'Friends universe - casual friendship building'
      });
      
      prompts.push({
        id: `friends-activity-${Date.now()}`,
        text: `We seem to have similar interests! Would you be up for chatting about something we both love?`,
        category: 'conversation-starter',
        confidence: 0.85,
        reasoning: 'Friends universe - activity and interest-based connection'
      });

      prompts.push({
        id: `friends-adventure-${Date.now()}`,
        text: `I love trying new things! What's an adventure or experience you'd recommend to a friend?`,
        category: 'conversation-starter',
        confidence: 0.88,
        reasoning: 'Friends universe - adventure and experience sharing'
      });

      prompts.push({
        id: `friends-collaboration-${Date.now()}`,
        text: `I think we could create something amazing together! What's a project or activity you'd love to collaborate on?`,
        category: 'conversation-starter',
        confidence: 0.87,
        reasoning: 'Friends universe - collaboration and teamwork'
      });
    }

    // Ensure we have a good mix of categories
    const categoryCounts = {
      'common-interest': 0,
      'different-favorite': 0,
      'conversation-starter': 0,
      'location-based': 0,
      'age-based': 0
    };

    prompts.forEach(prompt => {
      categoryCounts[prompt.category]++;
    });

    // Add more prompts to underrepresented categories
    if (categoryCounts['common-interest'] < 3) {
      prompts.push({
        id: `common-extra-${Date.now()}`,
        text: `I'm so excited we both love {category}! What's your favorite memory related to it?`,
        category: 'common-interest',
        confidence: 0.85,
        reasoning: 'Additional common interest prompt for balance'
      });
    }

    if (categoryCounts['different-favorite'] < 3) {
      prompts.push({
        id: `different-extra-${Date.now()}`,
        text: `I'm fascinated by your interest in {category}! How did you first discover it?`,
        category: 'different-favorite',
        confidence: 0.82,
        reasoning: 'Additional different favorite prompt for balance'
      });
    }

    return prompts
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, maxPrompts);
  }
}
