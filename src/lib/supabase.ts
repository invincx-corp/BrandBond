import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for our registration system
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string;
          full_name: string;
          date_of_birth: string;
          age: number;
          gender: string;
          location: string;
          intent: 'dating' | 'friends' | 'both';
          onboarding_skipped?: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          full_name: string;
          date_of_birth: string;
          age: number;
          gender: string;
          location: string;
          intent: 'dating' | 'friends' | 'both';
          onboarding_skipped?: boolean;
        };
        Update: {
          email?: string;
          username?: string;
          full_name?: string;
          date_of_birth?: string;
          age?: number;
          gender?: string;
          location?: string;
          intent?: 'dating' | 'friends' | 'both';
          onboarding_skipped?: boolean;
        };
      };
      user_interests: {
        Row: {
          id: string;
          user_id: string;
          music_category: string | null;
          favorite_song: string | null;
          favorite_singer: string | null;
          singer_groups: string | null;
          singer_idols: string | null;
          music_bands: string | null;
          favorite_movie: string | null;
          movie_category: string | null;
          tv_series: string | null;
          tv_series_category: string | null;
          favorite_book: string | null;
          book_category: string | null;
          cartoon: string | null;
          travel_destination: string | null;
          travel_category: string | null;
          food_cuisine: string | null;
          food_category: string | null;
          sport: string | null;
          athlete: string | null;
          video_game: string | null;
          tech_gadget: string | null;
          shopping_brand: string | null;
          hobby_interest: string | null;
          habit: string | null;
          generated_bio: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          music_category?: string | null;
          favorite_song?: string | null;
          favorite_singer?: string | null;
          singer_groups?: string | null;
          singer_idols?: string | null;
          music_bands?: string | null;
          favorite_movie?: string | null;
          movie_category?: string | null;
          tv_series?: string | null;
          tv_series_category?: string | null;
          favorite_book?: string | null;
          book_category?: string | null;
          cartoon?: string | null;
          travel_destination?: string | null;
          travel_category?: string | null;
          food_cuisine?: string | null;
          food_category?: string | null;
          sport?: string | null;
          athlete?: string | null;
          video_game?: string | null;
          tech_gadget?: string | null;
          shopping_brand?: string | null;
          hobby_interest?: string | null;
          habit?: string | null;
          generated_bio?: string | null;
        };
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          spoken_languages: string[] | null;
          preferred_age_gap: number | null;
          gender_preference: string | null;
          distance_preference: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          spoken_languages?: string[] | null;
          preferred_age_gap?: number | null;
          gender_preference?: string | null;
          distance_preference?: number | null;
        };
      };
      user_photos: {
        Row: {
          id: string;
          user_id: string;
          photo_url: string;
          photo_order: number;
          is_main_photo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          photo_url: string;
          photo_order: number;
          is_main_photo?: boolean;
        };
      };
    };
  };
}
