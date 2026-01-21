import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file (optional)
try {
  config({ path: resolve(process.cwd(), '.env') });
  console.log('✅ .env file loaded successfully');
} catch (error) {
  console.log('⚠️  .env file not found, using system environment variables');
}

// Try to load from .env.local as fallback
try {
  config({ path: resolve(process.cwd(), '.env.local') });
  console.log('✅ .env.local file loaded successfully');
} catch (error) {
  console.log('⚠️  .env.local file not found');
}

export const backendConfig = {
  port: process.env.PORT || 3002,
  supabase: {
    url: process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  }
};

// Validate required environment variables
if (!backendConfig.supabase.url || !backendConfig.supabase.anonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL or SUPABASE_URL');
  console.error('   VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY');
  console.error('');
  console.error('📁 Please create a .env file in your project root with:');
  console.error('   VITE_SUPABASE_URL=your_supabase_project_url');
  console.error('   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.error('');
  console.error('🔗 Get these values from your Supabase project dashboard');
  console.error('   https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/settings/api');
  console.error('');
  process.exit(1);
}

if (!backendConfig.supabase.serviceRoleKey) {
  console.error('❌ Missing required backend environment variable:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('📁 Please add to your .env file (server-only, never expose to browser):');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key');
  console.error('');
  process.exit(1);
}

console.log('✅ Environment variables loaded successfully');
console.log(`   Supabase URL: ${backendConfig.supabase.url?.substring(0, 30)}...`);
console.log(`   Port: ${backendConfig.port}`);
