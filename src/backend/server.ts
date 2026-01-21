import { createServer } from 'http';
import { supabase, testConnection } from './supabase';
import { backendConfig } from './config';
import dashboardRoutes from './dashboardRoutes';
import matchRoutes from './matchRoutes';

const extractUserId = async (req: any): Promise<string | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const accessToken = authHeader.substring(7);
  if (!accessToken) return null;

  try {
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

const sendJson = (res: any, statusCode: number, payload: any) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
};

 const bestEffortDeleteByUserId = async (table: string, userId: string, column: string = 'user_id') => {
   try {
     const { error } = await supabase.from(table).delete().eq(column, userId);
     if (error) {
       console.warn(`[account-delete] cleanup failed: ${table}.${column} = ${userId}`, error.message);
     }
   } catch (e) {
     const msg = e instanceof Error ? e.message : String(e);
     console.warn(`[account-delete] cleanup exception: ${table}.${column} = ${userId}`, msg);
   }
 };

 const bestEffortDeleteMatches = async (table: string, userId: string) => {
   try {
     const { error } = await supabase
       .from(table)
       .delete()
       .or(`user_low.eq.${userId},user_high.eq.${userId}`);
     if (error) {
       console.warn(`[account-delete] cleanup failed: ${table} for user_low/high = ${userId}`, error.message);
     }
   } catch (e) {
     const msg = e instanceof Error ? e.message : String(e);
     console.warn(`[account-delete] cleanup exception: ${table} for user_low/high = ${userId}`, msg);
   }
 };

 const cleanupUserData = async (userId: string) => {
   // These are best-effort deletes to prevent FK violations when deleting auth.users.
   // They are safe even if the table does not exist (we just log warnings).
   await Promise.all([
     // Core profile tables
     bestEffortDeleteByUserId('user_photos', userId),
     bestEffortDeleteByUserId('user_preferences', userId),
     bestEffortDeleteByUserId('user_interests', userId),
     // If profiles uses id as user PK
     bestEffortDeleteByUserId('profiles', userId, 'id'),

     // Activity/notifications
     bestEffortDeleteByUserId('user_activities', userId),
     bestEffortDeleteByUserId('notifications', userId),
     bestEffortDeleteByUserId('user_love_stats', userId),

     // Recommendations / actions
     bestEffortDeleteByUserId('match_recommendations', userId),
     bestEffortDeleteByUserId('profile_actions', userId),
   ]);

   // Two-party tables
   await Promise.all([
     bestEffortDeleteMatches('matches', userId),
     bestEffortDeleteMatches('conversations', userId),
     bestEffortDeleteByUserId('messages', userId, 'sender_id'),
     bestEffortDeleteByUserId('messages', userId, 'receiver_id'),
     bestEffortDeleteByUserId('message_read_receipts', userId, 'reader_id'),
     bestEffortDeleteByUserId('message_reactions', userId),
     bestEffortDeleteByUserId('poll_votes', userId, 'voter_id'),
     bestEffortDeleteByUserId('date_requests', userId, 'from_user_id'),
     bestEffortDeleteByUserId('date_requests', userId, 'to_user_id'),
   ]);
 };

const PORT = backendConfig.port;

const server = createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', backendConfig.cors.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: process.env.NODE_ENV || 'development'
    }));
    return;
  }

  // Database connection test endpoint
  if (req.url === '/api/db-test' && req.method === 'GET') {
    try {
      const result = await testConnection();
      
      if (result.success) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'connected', 
          message: result.message,
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'error', 
          message: result.message,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'error', 
        message: 'Database connection failed',
        error: errorMessage,
        timestamp: new Date().toISOString()
      }));
    }
    return;
  }

  // Dashboard API endpoints
  if (req.url?.startsWith('/api/dashboard')) {
    const parsed = new URL(req.url, `http://${req.headers.host}`);
    const path = parsed.pathname.replace('/api/dashboard', '');
    
    try {
      switch (path) {
        case '/data':
          if (req.method === 'GET') {
            await dashboardRoutes.getDashboardData(req, res);
            return;
          }
          break;
          
        case '/stats':
          if (req.method === 'GET') {
            await dashboardRoutes.getDashboardStats(req, res);
            return;
          }
          break;
          
        case '/matches':
          if (req.method === 'GET') {
            await dashboardRoutes.getDailyMatches(req, res);
            return;
          }
          break;
          
        case '/communities':
          if (req.method === 'GET') {
            await dashboardRoutes.getUserCommunities(req, res);
            return;
          }
          break;
          
        case '/activities':
          if (req.method === 'GET') {
            await dashboardRoutes.getRecentActivities(req, res);
            return;
          }
          break;
          
        case '/insights':
          if (req.method === 'GET') {
            await dashboardRoutes.getUserInsights(req, res);
            return;
          }
          break;
          
        case '/events':
          if (req.method === 'GET') {
            await dashboardRoutes.getLocalEvents(req, res);
            return;
          }
          break;
          
        case '/join-community':
          if (req.method === 'POST') {
            await dashboardRoutes.joinCommunity(req, res);
            return;
          }
          break;
          
        case '/leave-community':
          if (req.method === 'POST') {
            await dashboardRoutes.leaveCommunity(req, res);
            return;
          }
          break;
          
        case '/attend-event':
          if (req.method === 'POST') {
            await dashboardRoutes.attendEvent(req, res);
            return;
          }
          break;
          
        case '/compatibility':
          if (req.method === 'POST') {
            await dashboardRoutes.calculateCompatibility(req, res);
            return;
          }
          break;
          
        case '/recommendations':
          if (req.method === 'GET') {
            await dashboardRoutes.getRecommendations(req, res);
            return;
          }
          break;

        case '/recommendations/refresh':
          if (req.method === 'POST') {
            await dashboardRoutes.refreshRecommendations(req, res);
            return;
          }
          break;
          
        case '/mark-viewed':
          if (req.method === 'POST') {
            await dashboardRoutes.markRecommendationViewed(req, res);
            return;
          }
          break;

        case '/matches/refresh-metadata':
          if (req.method === 'POST') {
            await dashboardRoutes.refreshMatchMetadata(req, res);
            return;
          }
          break;
      }
    } catch (error) {
      console.error('Dashboard API error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false,
        error: 'Internal server error' 
      }));
      return;
    }
  }

  // Account endpoints
  if (req.url?.startsWith('/api/account')) {
    const parsed = new URL(req.url, `http://${req.headers.host}`);
    const path = parsed.pathname.replace('/api/account', '');

    try {
      switch (path) {
        case '/delete':
          if (req.method === 'DELETE') {
            const userId = await extractUserId(req);
            if (!userId) {
              sendJson(res, 401, { success: false, error: 'Unauthorized' });
              return;
            }

            await cleanupUserData(userId);

            const { error } = await supabase.auth.admin.deleteUser(userId);
            if (error) {
              sendJson(res, 500, { success: false, error: error.message || 'Failed to delete user' });
              return;
            }

            sendJson(res, 200, { success: true });
            return;
          }
          break;
      }
    } catch (error) {
      console.error('Account API error:', error);
      const message = error instanceof Error ? error.message : 'Internal server error';
      sendJson(res, 500, { success: false, error: message });
      return;
    }
  }

  // Match/Profile API endpoints
  if (req.url?.startsWith('/api/match')) {
    const parsed = new URL(req.url, `http://${req.headers.host}`);
    const path = parsed.pathname.replace('/api/match', '');

    try {
      switch (path) {
        case '/me':
          if (req.method === 'GET') {
            await matchRoutes.getMe(req, res);
            return;
          }
          break;
        case '/matches':
          if (req.method === 'GET') {
            await matchRoutes.getMatches(req, res);
            return;
          }
          break;
      }
    } catch (error) {
      console.error('Match API error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }));
      return;
    }
  }

  // Default response
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`🚀 BrandBond Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Database test: http://localhost:${PORT}/api/db-test`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down backend server...');
  server.close(() => {
    console.log('✅ Backend server closed');
    process.exit(0);
  });
});

export default server;
