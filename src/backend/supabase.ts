import { createClient } from '@supabase/supabase-js';
import { backendConfig } from './config';

// Validate config before creating client
if (!backendConfig.supabase.url || !backendConfig.supabase.serviceRoleKey) {
  throw new Error('Supabase configuration is incomplete. Please check your .env file.');
}

// Create Supabase client for backend use
export const supabase = createClient(
  backendConfig.supabase.url,
  backendConfig.supabase.serviceRoleKey
);

// Test database connection
export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    return { success: true, message: 'Database connection successful' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, message: `Database connection failed: ${errorMessage}` };
  }
};
