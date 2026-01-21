import { createServer } from 'http';
import { URL } from 'url';

const PORT = 3002;

// Mock data for demo purposes
const mockDashboardData = {
  stats: {
    totalMatches: 24,
    peopleNearby: 156,
    communitiesJoined: 8,
    profileCompleteness: 87,
    compatibilityScore: 92
  },
  dailyMatches: [
    {
      id: 'match-1',
      fullName: 'Priya Sharma',
      age: 26,
      location: 'Mumbai, Maharashtra',
      intent: 'Friendship',
      compatibilityScore: 94,
      sharedInterests: ['Music', 'Travel', 'Photography'],
      matchReason: 'High compatibility in music taste and travel preferences',
      profilePhoto: null
    },
    {
      id: 'match-2',
      fullName: 'Arjun Patel',
      age: 28,
      location: 'Delhi, NCR',
      intent: 'Romance',
      compatibilityScore: 89,
      sharedInterests: ['Movies', 'Food', 'Fitness'],
      matchReason: 'Shared love for international cuisine and fitness goals',
      profilePhoto: null
    },
    {
      id: 'match-3',
      fullName: 'Zara Khan',
      age: 25,
      location: 'Bangalore, Karnataka',
      intent: 'Community',
      compatibilityScore: 91,
      sharedInterests: ['Technology', 'Art', 'Reading'],
      matchReason: 'Common interest in tech innovation and creative arts',
      profilePhoto: null
    },
    {
      id: 'match-4',
      fullName: 'Rahul Verma',
      age: 27,
      location: 'Pune, Maharashtra',
      intent: 'Friendship',
      compatibilityScore: 87,
      sharedInterests: ['Gaming', 'Music', 'Sports'],
      matchReason: 'Gaming enthusiast with similar music taste',
      profilePhoto: null
    },
    {
      id: 'match-5',
      fullName: 'Ananya Reddy',
      age: 24,
      location: 'Hyderabad, Telangana',
      intent: 'Romance',
      compatibilityScore: 93,
      sharedInterests: ['Travel', 'Photography', 'Cooking'],
      matchReason: 'Adventure seeker with passion for food and photography',
      profilePhoto: null
    }
  ],
  communities: [
    {
      id: 'comm-1',
      name: 'Mumbai Foodies',
      category: 'Food & Dining',
      description: 'Discover the best restaurants and street food in Mumbai',
      memberCount: 1247,
      isMember: true,
      iconUrl: null,
      coverImageUrl: null
    },
    {
      id: 'comm-2',
      name: 'Tech Enthusiasts',
      category: 'Technology',
      description: 'Discuss latest tech trends, startups, and innovation',
      memberCount: 892,
      isMember: false,
      iconUrl: null,
      coverImageUrl: null
    },
    {
      id: 'comm-3',
      name: 'Travel Buddies',
      category: 'Travel',
      description: 'Plan trips, share experiences, and find travel companions',
      memberCount: 2156,
      isMember: true,
      iconUrl: null,
      coverImageUrl: null
    },
    {
      id: 'comm-4',
      name: 'Fitness Freaks',
      category: 'Health & Fitness',
      description: 'Motivate each other to stay fit and healthy',
      memberCount: 743,
      isMember: false,
      iconUrl: null,
      coverImageUrl: null
    },
    {
      id: 'comm-5',
      name: 'Book Club',
      category: 'Literature',
      description: 'Discuss books, share recommendations, and join reading challenges',
      memberCount: 567,
      isMember: true,
      iconUrl: null,
      coverImageUrl: null
    }
  ],
  activities: [
    {
      id: 'act-1',
      type: 'new_match',
      title: 'New match found!',
      description: 'Priya Sharma matched with you (94% compatibility)',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
    },
    {
      id: 'act-2',
      type: 'community_join',
      title: 'Joined Travel Buddies',
      description: 'You are now a member of the Travel Buddies community',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      id: 'act-3',
      type: 'achievement_earned',
      title: 'Profile Completion Milestone',
      description: 'Congratulations! You\'ve completed 87% of your profile',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
    },
    {
      id: 'act-4',
      type: 'profile_update',
      title: 'Profile updated',
      description: 'You added new interests: Photography, Cooking',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
    },
    {
      id: 'act-5',
      type: 'interest_change',
      title: 'Interest preferences updated',
      description: 'Your music preferences have been updated based on recent activity',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString() // 8 hours ago
    }
  ],
  insights: {
    primaryInterests: ['Music', 'Travel', 'Technology', 'Food', 'Fitness'],
    personalityTraits: ['Adventurous', 'Creative', 'Social', 'Analytical', 'Ambitious'],
    lifestylePatterns: ['Active lifestyle', 'Social networking', 'Continuous learning'],
    compatibilityTrends: {
      music: 94,
      movies: 87,
      books: 82,
      travel: 91,
      food: 89,
      sports: 76,
      shopping: 73,
      gaming: 68,
      youtube: 85,
      hobbies: 79
    }
  },
  localEvents: [
    {
      id: 'event-1',
      title: 'Mumbai Food Festival',
      description: 'Annual celebration of Mumbai\'s diverse culinary scene',
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days from now
      currentAttendees: 156
    },
    {
      id: 'event-2',
      title: 'Tech Meetup: AI & Future',
      description: 'Discussion on artificial intelligence and its impact on our future',
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days from now
      currentAttendees: 89
    }
  ]
};

// Helper function to send JSON response
const sendJsonResponse = (res: any, statusCode: number, data: any) => {
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

// Create HTTP server
const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // Dashboard API endpoints
    if (path.startsWith('/api/dashboard')) {
      const apiPath = path.replace('/api/dashboard', '');
      
      switch (apiPath) {
        case '/data':
          if (req.method === 'GET') {
            // Simulate some real-time updates for demo
            const updatedData = { ...mockDashboardData };
            updatedData.stats.totalMatches += Math.floor(Math.random() * 2);
            updatedData.stats.peopleNearby += Math.floor(Math.random() * 3);
            
            sendJsonResponse(res, 200, updatedData);
            return;
          }
          break;

        case '/stats':
          if (req.method === 'GET') {
            sendJsonResponse(res, 200, mockDashboardData.stats);
            return;
          }
          break;

        case '/matches':
          if (req.method === 'GET') {
            sendJsonResponse(res, 200, mockDashboardData.dailyMatches);
            return;
          }
          break;

        case '/communities':
          if (req.method === 'GET') {
            sendJsonResponse(res, 200, mockDashboardData.communities);
            return;
          }
          break;

        case '/activities':
          if (req.method === 'GET') {
            sendJsonResponse(res, 200, mockDashboardData.activities);
            return;
          }
          break;

        case '/insights':
          if (req.method === 'GET') {
            sendJsonResponse(res, 200, mockDashboardData.insights);
            return;
          }
          break;

        case '/events':
          if (req.method === 'GET') {
            sendJsonResponse(res, 200, mockDashboardData.localEvents);
            return;
          }
          break;

        case '/join-community':
          if (req.method === 'POST') {
            const body = await parseRequestBody(req);
            const { communityId } = body;
            
            // Find and update community membership
            const community = mockDashboardData.communities.find(c => c.id === communityId);
            if (community) {
              community.isMember = true;
              community.memberCount += 1;
            }
            
            sendJsonResponse(res, 200, { success: true, message: 'Joined community successfully' });
            return;
          }
          break;

        case '/leave-community':
          if (req.method === 'POST') {
            const body = await parseRequestBody(req);
            const { communityId } = body;
            
            // Find and update community membership
            const community = mockDashboardData.communities.find(c => c.id === communityId);
            if (community) {
              community.isMember = false;
              community.memberCount = Math.max(0, community.memberCount - 1);
            }
            
            sendJsonResponse(res, 200, { success: true, message: 'Left community successfully' });
            return;
          }
          break;

        case '/attend-event':
          if (req.method === 'POST') {
            const body = await parseRequestBody(req);
            const { eventId, status } = body;
            
            // Find and update event attendance
            const event = mockDashboardData.localEvents.find(e => e.id === eventId);
            if (event && status === 'going') {
              event.currentAttendees += 1;
            }
            
            sendJsonResponse(res, 200, { success: true, message: 'Event attendance updated' });
            return;
          }
          break;

        case '/compatibility':
          if (req.method === 'POST') {
            const body = await parseRequestBody(req);
            const { user1Id, user2Id } = body;
            
            // Mock compatibility calculation
            const compatibilityScore = Math.floor(Math.random() * 30) + 70; // 70-100 range
            const sharedInterests = ['Music', 'Travel', 'Food'].slice(0, Math.floor(Math.random() * 3) + 1);
            
            sendJsonResponse(res, 200, {
              compatibilityScore,
              sharedInterests,
              matchReason: `High compatibility based on shared interests: ${sharedInterests.join(', ')}`
            });
            return;
          }
          break;

        case '/recommendations':
          if (req.method === 'GET') {
            // Mock recommendations
            const recommendations = mockDashboardData.dailyMatches.slice(0, 3).map(match => ({
              ...match,
              recommendationReason: 'Based on your interests and compatibility score'
            }));
            
            sendJsonResponse(res, 200, recommendations);
            return;
          }
          break;

        case '/mark-viewed':
          if (req.method === 'POST') {
            sendJsonResponse(res, 200, { success: true, message: 'Recommendation marked as viewed' });
            return;
          }
          break;
      }
    }

    // Health check endpoint
    if (path === '/health') {
      sendJsonResponse(res, 200, { status: 'ok', message: 'Demo server is running' });
      return;
    }

    // Default response
    sendJsonResponse(res, 404, { error: 'Endpoint not found' });

  } catch (error) {
    console.error('Server error:', error);
    sendJsonResponse(res, 500, { error: 'Internal server error' });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Demo backend server running on port ${PORT}`);
  console.log(`📊 Dashboard API available at http://localhost:${PORT}/api/dashboard`);
  console.log(`❤️  Health check at http://localhost:${PORT}/health`);
  console.log(`✨ This is a demo server with mock data - no external services required`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down demo server...');
  server.close(() => {
    console.log('✅ Demo server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down demo server...');
  server.close(() => {
    console.log('✅ Demo server stopped');
    process.exit(0);
  });
});

