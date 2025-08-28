import { createServer } from 'http';
import { supabase, testConnection } from './supabase';
import { backendConfig } from './config';
import dashboardRoutes from './dashboardRoutes';

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
    const path = req.url.replace('/api/dashboard', '');
    
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
          
        case '/mark-viewed':
          if (req.method === 'POST') {
            await dashboardRoutes.markRecommendationViewed(req, res);
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
