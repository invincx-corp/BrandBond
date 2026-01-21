import { supabase } from '../lib/supabase';

// Language interface
export interface Language {
  code: string;
  name: string;
  nativeName: string;
}

// Interface for registration data (matching our form)
export interface RegistrationData {
  intent: 'dating' | 'friends' | 'both';
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  dob: string;
  age: number;
  gender: string;
  location: string;
  spokenLanguages: Language[];
  preferredAgeGap: number;
  genderPreference: string;
  distancePreference: number;
  interests: {
    musicCategory: string;
    song: string;
    singer: string;
    singerGroups: string;
    singerIdols: string;
    musicBands: string;
    movie: string;
    movieCategory: string;
    tvSeries: string;
    tvSeriesCategory: string;
    book: string;
    bookCategory: string;
    cartoon: string;
    travelDestination: string;
    travelDestinationCategory: string;
    foodCuisine: string;
    foodCuisineCategory: string;
    sport: string;
    athlete: string;
    videoGame: string;
    techGadget: string;
    shoppingBrand: string;
    hobbyInterest: string;
    habit: string;
  };
  additionalFavorites: {
    musicCategory: string[];
    song: string[];
    singer: string[];
    singerGroups: string[];
    singerIdols: string[];
    musicBands: string[];
    movie: string[];
    movieCategory: string[];
    tvSeries: string[];
    tvSeriesCategory: string[];
    book: string[];
    bookCategory: string[];
    cartoon: string[];
    travelDestination: string[];
    travelDestinationCategory: string[];
    foodCuisine: string[];
    foodCuisineCategory: string[];
    sport: string[];
    athlete: string[];
    videoGame: string[];
    techGadget: string[];
    shoppingBrand: string[];
    hobbyInterest: string[];
  };
  photos: string[];
  generatedBio: string;
}

export class RegistrationService {
  static async createAuthUser(
    email: string,
    password: string
  ): Promise<{ success: boolean; userId?: string; sessionCreated?: boolean; error?: string }> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { success: false, error: authError.message };
      }

      const userId = authData.user?.id;
      if (!userId) {
        return { success: false, error: 'User creation failed' };
      }

      return { success: true, userId, sessionCreated: !!authData.session };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async signIn(email: string, password: string): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: error.message };
      const userId = data.user?.id;
      if (!userId) return { success: false, error: 'Sign-in succeeded but user id is missing' };
      return { success: true, userId };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async finalizeRegistration(
    registrationData: RegistrationData,
    userId: string
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Ensure the client is authenticated before writing to RLS-protected tables
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        return { success: false, error: 'Not signed in. Please sign in to complete registration.' };
      }

      // Step 2: Upload photos to Supabase Storage
      const photoUrls = await this.uploadPhotos(registrationData.photos, userId);

      // Step 3: Create/update user profile
      const { error: userError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: registrationData.email,
          username: registrationData.username,
          full_name: registrationData.name,
          date_of_birth: registrationData.dob,
          age: registrationData.age,
          gender: registrationData.gender,
          location: registrationData.location,
          intent: registrationData.intent,
        });

      if (userError) {
        console.error('User creation error:', userError);
        return { success: false, error: userError.message };
      }

      // Step 4: Save user interests
      const { error: interestsError } = await supabase
        .from('user_interests')
        .upsert({
          user_id: userId,
          music_category: registrationData.interests.musicCategory,
          favorite_song: registrationData.interests.song,
          favorite_singer: registrationData.interests.singer,
          singer_groups: registrationData.interests.singerGroups,
          singer_idols: registrationData.interests.singerIdols,
          music_bands: registrationData.interests.musicBands,
          favorite_movie: registrationData.interests.movie,
          movie_category: registrationData.interests.movieCategory,
          tv_series: registrationData.interests.tvSeries,
          tv_series_category: registrationData.interests.tvSeriesCategory,
          favorite_book: registrationData.interests.book,
          book_category: registrationData.interests.bookCategory,
          cartoon: registrationData.interests.cartoon,
          travel_destination: registrationData.interests.travelDestination,
          travel_category: registrationData.interests.travelDestinationCategory,
          food_cuisine: registrationData.interests.foodCuisine,
          food_category: registrationData.interests.foodCuisineCategory,
          sport: registrationData.interests.sport,
          athlete: registrationData.interests.athlete,
          video_game: registrationData.interests.videoGame,
          tech_gadget: registrationData.interests.techGadget,
          shopping_brand: registrationData.interests.shoppingBrand,
          hobby_interest: registrationData.interests.hobbyInterest,
          habit: registrationData.interests.habit,
          generated_bio: registrationData.generatedBio,
        }, { onConflict: 'user_id' });

      if (interestsError) {
        console.error('Interests creation error:', interestsError);
        return { success: false, error: interestsError.message };
      }

      // Step 4b: Save additional favorites (multi-value) into array columns on user_interests
      const af = registrationData.additionalFavorites;
      const { error: additionalUpdateError } = await supabase
        .from('user_interests')
        .update({
          additional_music_category: af.musicCategory,
          additional_song: af.song,
          additional_singer: af.singer,
          additional_singer_groups: af.singerGroups,
          additional_singer_idols: af.singerIdols,
          additional_music_bands: af.musicBands,
          additional_movie: af.movie,
          additional_movie_category: af.movieCategory,
          additional_tv_series: af.tvSeries,
          additional_tv_series_category: af.tvSeriesCategory,
          additional_book: af.book,
          additional_book_category: af.bookCategory,
          additional_cartoon: af.cartoon,
          additional_travel_destination: af.travelDestination,
          additional_travel_category: af.travelDestinationCategory,
          additional_food_cuisine: af.foodCuisine,
          additional_food_category: af.foodCuisineCategory,
          additional_sport: af.sport,
          additional_athlete: af.athlete,
          additional_video_game: af.videoGame,
          additional_tech_gadget: af.techGadget,
          additional_shopping_brand: af.shoppingBrand,
          additional_hobby_interest: af.hobbyInterest,
        })
        .eq('user_id', userId);

      if (additionalUpdateError) {
        console.error('Additional favorites update error:', additionalUpdateError);
        return { success: false, error: additionalUpdateError.message };
      }

      // Step 5: Save user preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          spoken_languages: registrationData.spokenLanguages.map(lang => lang.code),
          preferred_age_gap: registrationData.preferredAgeGap,
          gender_preference: registrationData.genderPreference,
          distance_preference: registrationData.distancePreference,
        }, { onConflict: 'user_id' });

      if (preferencesError) {
        console.error('Preferences creation error:', preferencesError);
        return { success: false, error: preferencesError.message };
      }

      // Step 6: Save user photos (simplified for now)
      if (photoUrls.length > 0) {
        console.log('Photo URLs to save:', photoUrls);
        const { error: photosDeleteError } = await supabase
          .from('user_photos')
          .delete()
          .eq('user_id', userId);

        if (photosDeleteError) {
          console.error('Photos delete error:', photosDeleteError);
          return { success: false, error: photosDeleteError.message };
        }

        const photoInserts = photoUrls.map((url, index) => ({
          user_id: userId,
          photo_url: url,
          photo_order: index,
          is_main_photo: index === 0,
        }));

        const { error: photosError } = await supabase
          .from('user_photos')
          .insert(photoInserts);

        if (photosError) {
          console.error('Photos creation error:', photosError);
          return { success: false, error: photosError.message };
        }
      }

      return { success: true, userId };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  }

  static async registerUser(
    registrationData: RegistrationData
  ): Promise<{ success: boolean; userId?: string; pendingVerification?: boolean; error?: string }> {
    const authResult = await this.createAuthUser(registrationData.email, registrationData.password);
    if (!authResult.success) return { success: false, error: authResult.error };

    if (!authResult.userId) {
      return { success: false, error: 'User creation failed' };
    }

    if (!authResult.sessionCreated) {
      return { success: false, pendingVerification: true, userId: authResult.userId };
    }

    return this.finalizeRegistration(registrationData, authResult.userId);
  }

  private static async uploadPhotos(photos: string[], userId: string): Promise<string[]> {
    const photoUrls: string[] = [];

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      if (!photo || typeof photo !== 'string') continue;
      
      try {
        // For now, just store the base64 data directly
        // This avoids storage permission issues during registration
        photoUrls.push(photo);
      } catch (error) {
        console.error(`Failed to process photo ${i + 1}:`, error);
        continue;
      }
    }

    return photoUrls;
  }
}

