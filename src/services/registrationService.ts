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
  photos: string[];
  generatedBio: string;
}

export class RegistrationService {
  static async registerUser(registrationData: RegistrationData): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      // Step 1: Create user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registrationData.email,
        password: registrationData.password,
      });

      if (authError) {
        console.error('Auth error:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'User creation failed' };
      }

      const userId = authData.user.id;

      // Step 2: Upload photos to Supabase Storage
      const photoUrls = await this.uploadPhotos(registrationData.photos, userId);

      // Step 3: Create user profile
      const { error: userError } = await supabase
        .from('users')
        .insert({
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
        .insert({
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
        });

      if (interestsError) {
        console.error('Interests creation error:', interestsError);
        return { success: false, error: interestsError.message };
      }

      // Step 5: Save user preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          spoken_languages: registrationData.spokenLanguages.map(lang => lang.code), // Save language codes
          preferred_age_gap: registrationData.preferredAgeGap,
          gender_preference: registrationData.genderPreference,
          distance_preference: registrationData.distancePreference,
        });

      if (preferencesError) {
        console.error('Preferences creation error:', preferencesError);
        return { success: false, error: preferencesError.message };
      }

      // Step 6: Save user photos (simplified for now)
      if (photoUrls.length > 0) {
        console.log('Photo URLs to save:', photoUrls);
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
          // Don't fail registration if photos fail
        }
      }

      return { success: true, userId };

    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
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

