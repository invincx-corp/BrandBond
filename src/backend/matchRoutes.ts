import { supabase } from './supabase';

// Types for API responses
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to send JSON response
const sendJsonResponse = (res: any, statusCode: number, data: ApiResponse) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
};

// Helper function to extract user ID from request headers
const extractUserId = async (req: any): Promise<string | null> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const accessToken = authHeader.substring(7);
  if (!accessToken) return null;

  try {
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error) return null;
    return data.user?.id || null;
  } catch {
    return null;
  }
};

type AdditionalFavorites = Record<string, string[]>;

type FavoritesMap = Record<string, string[]>;

interface MatchProfile {
  id: string;
  fullName: string;
  age: number;
  location: string;
  intent: string;
  allTimeFavorites: FavoritesMap;
  additionalFavorites: AdditionalFavorites;
}

const FAVORITE_KEYS: Array<{ key: string; category: string }> = [
  { key: 'music_category', category: 'MusicCategory' },
  { key: 'favorite_song', category: 'Song' },
  { key: 'favorite_singer', category: 'Singer' },
  { key: 'singer_groups', category: 'SingerGroups' },
  { key: 'singer_idols', category: 'SingerIdols' },
  { key: 'music_bands', category: 'MusicBands' },
  { key: 'favorite_movie', category: 'Movie' },
  { key: 'movie_category', category: 'MovieCategory' },
  { key: 'tv_series', category: 'TVSeries' },
  { key: 'tv_series_category', category: 'TVSeriesCategory' },
  { key: 'favorite_book', category: 'Book' },
  { key: 'book_category', category: 'BookCategory' },
  { key: 'cartoon', category: 'Cartoon' },
  { key: 'travel_destination', category: 'TravelDestination' },
  { key: 'travel_category', category: 'TravelDestinationCategory' },
  { key: 'food_cuisine', category: 'FoodCuisine' },
  { key: 'food_category', category: 'FoodCuisineCategory' },
  { key: 'sport', category: 'Sport' },
  { key: 'athlete', category: 'Athlete' },
  { key: 'video_game', category: 'VideoGame' },
  { key: 'tech_gadget', category: 'TechGadget' },
  { key: 'shopping_brand', category: 'ShoppingBrand' },
  { key: 'hobby_interest', category: 'HobbyInterest' },
  { key: 'habit', category: 'Habit' }
];

function normalizeString(s: string): string {
  return s.trim().toLowerCase();
}

function toStringArrayMaybe(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [String(value)].filter(Boolean);
}

function buildAllTimeFavorites(interestsRow: any): FavoritesMap {
  const map: FavoritesMap = {};
  FAVORITE_KEYS.forEach(({ key, category }) => {
    const values = toStringArrayMaybe(interestsRow?.[key]);
    if (values.length > 0) {
      map[category] = values;
    }
  });
  return map;
}

function buildAdditionalFavorites(interestsRow: any): AdditionalFavorites {
  const additional = interestsRow?.additional_favorites;
  if (!additional || typeof additional !== 'object') return {};

  const out: AdditionalFavorites = {};
  Object.keys(additional).forEach((k) => {
    const values = toStringArrayMaybe(additional[k]);
    if (values.length > 0) out[k] = values;
  });
  return out;
}

function intersectionCount(a: string[], b: string[]): number {
  const bSet = new Set(b.map(normalizeString));
  let count = 0;
  for (const x of a) {
    if (bSet.has(normalizeString(x))) count++;
  }
  return count;
}

function computeCompatibility(current: MatchProfile, other: MatchProfile): {
  score: number;
  sharedInterests: string[];
  reason: string;
} {
  // Weighted overlap
  // - all-time favorites overlap: strong signal
  // - additional favorites overlap: weaker signal but can add breadth
  const allTimeWeight = 10;
  const additionalWeight = 4;

  let points = 0;
  const shared: string[] = [];

  // All-time favorites overlap
  Object.keys(current.allTimeFavorites).forEach((category) => {
    const a = current.allTimeFavorites[category] || [];
    const b = other.allTimeFavorites[category] || [];
    const c = intersectionCount(a, b);
    if (c > 0) {
      points += c * allTimeWeight;
      shared.push(category);
    }
  });

  // Additional favorites overlap (by key)
  Object.keys(current.additionalFavorites).forEach((key) => {
    const a = current.additionalFavorites[key] || [];
    const b = other.additionalFavorites[key] || [];
    const c = intersectionCount(a, b);
    if (c > 0) {
      points += c * additionalWeight;
      if (!shared.includes(key)) shared.push(key);
    }
  });

  // Convert points to a 0..100-ish score
  const score = Math.max(0, Math.min(100, 50 + Math.round(points / 3)));

  const reason = shared.length > 0
    ? `Shared interests in ${shared.slice(0, 3).join(', ')}`
    : 'Explore each other\'s interests and favorites';

  return { score, sharedInterests: shared, reason };
}

async function getMatchProfile(userId: string): Promise<MatchProfile | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, age, location, intent')
    .eq('id', userId)
    .single();

  if (!profile) return null;

  const { data: interests } = await supabase
    .from('user_interests')
    .select('*')
    .eq('user_id', userId)
    .single();

  const allTimeFavorites = buildAllTimeFavorites(interests);
  const additionalFavorites = buildAdditionalFavorites(interests);

  return {
    id: profile.id,
    fullName: profile.full_name || 'Unknown User',
    age: profile.age || 0,
    location: profile.location || 'Unknown Location',
    intent: profile.intent || 'both',
    allTimeFavorites,
    additionalFavorites
  };
}

async function listCandidateUserIds(currentUserId: string, limit: number): Promise<string[]> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .neq('id', currentUserId)
    .limit(Math.max(1, Math.min(50, limit * 5)));

  return (data || []).map((x: any) => x.id).filter(Boolean).slice(0, limit * 5);
}

export const matchRoutes = {
  async getMe(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { success: false, error: 'Unauthorized' });
      }

      const me = await getMatchProfile(userId);
      if (!me) {
        return sendJsonResponse(res, 404, { success: false, error: 'User not found' });
      }

      return sendJsonResponse(res, 200, { success: true, data: me });
    } catch (error) {
      console.error('Error in getMe:', error);
      return sendJsonResponse(res, 500, { success: false, error: 'Failed to fetch user profile' });
    }
  },

  async getMatches(req: any, res: any) {
    try {
      const userId = await extractUserId(req);
      if (!userId) {
        return sendJsonResponse(res, 401, { success: false, error: 'Unauthorized' });
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      const limitParam = url.searchParams.get('limit');
      const limit = Math.max(1, Math.min(20, Number(limitParam) || 5));

      const me = await getMatchProfile(userId);
      if (!me) {
        return sendJsonResponse(res, 404, { success: false, error: 'User not found' });
      }

      const candidateIds = await listCandidateUserIds(userId, limit);
      const candidates = await Promise.all(candidateIds.map(getMatchProfile));

      const scored = candidates
        .filter((c): c is MatchProfile => Boolean(c))
        .map((c) => {
          const { score, sharedInterests, reason } = computeCompatibility(me, c);
          return {
            id: c.id,
            userId: c.id,
            fullName: c.fullName,
            age: c.age,
            location: c.location,
            compatibilityScore: score,
            sharedInterests,
            matchReason: reason,
            intent: c.intent,
            // include interests payload so frontend prompts can use additional favorites
            allTimeFavorites: c.allTimeFavorites,
            additionalFavorites: c.additionalFavorites
          };
        })
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, limit);

      return sendJsonResponse(res, 200, { success: true, data: scored });
    } catch (error) {
      console.error('Error in getMatches:', error);
      return sendJsonResponse(res, 500, { success: false, error: 'Failed to fetch matches' });
    }
  }
};

export default matchRoutes;
