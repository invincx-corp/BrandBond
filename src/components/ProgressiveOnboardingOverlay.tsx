import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

type PromptType = 'single_select' | 'multi_select' | 'text' | 'photo';

type PromptDefinition = {
  id: string;
  title: string;
  body?: string;
  type: PromptType;
  options?: string[];
  targetTable: 'user_interests' | 'user_preferences' | 'profiles';
  targetColumn: string;
  valueType?: 'string' | 'number';
};

type PhotoValue = {
  dataUrl: string;
};

type Props = {
  userId: string;
};

const SESSION_SHOWN_KEY = 'brandbond_progressive_onboarding_prompt_shown_v1';
const LAST_SHOWN_AT_KEY = 'brandbond_progressive_onboarding_prompt_last_shown_at_v1';

const TEN_MINUTES_MS = 10 * 60 * 1000;

const DEFAULT_PROMPTS: PromptDefinition[] = [
  // user_interests: all single-value fields from onboarding
  { id: 'music_category', title: 'Music', body: 'What kind of music do you like?', type: 'text', targetTable: 'user_interests', targetColumn: 'music_category' },
  { id: 'favorite_song', title: 'Music', body: 'What’s a favorite song?', type: 'text', targetTable: 'user_interests', targetColumn: 'favorite_song' },
  { id: 'favorite_singer', title: 'Music', body: 'Who’s your favorite singer?', type: 'text', targetTable: 'user_interests', targetColumn: 'favorite_singer' },
  { id: 'singer_groups', title: 'Music', body: 'Any favorite singer groups?', type: 'text', targetTable: 'user_interests', targetColumn: 'singer_groups' },
  { id: 'singer_idols', title: 'Music', body: 'Any singer idols you love?', type: 'text', targetTable: 'user_interests', targetColumn: 'singer_idols' },
  { id: 'music_bands', title: 'Music', body: 'Any favorite bands?', type: 'text', targetTable: 'user_interests', targetColumn: 'music_bands' },

  { id: 'favorite_movie', title: 'Movies', body: 'What’s a favorite movie?', type: 'text', targetTable: 'user_interests', targetColumn: 'favorite_movie' },
  { id: 'movie_category', title: 'Movies', body: 'What movie genre do you enjoy most?', type: 'text', targetTable: 'user_interests', targetColumn: 'movie_category' },
  { id: 'tv_series', title: 'TV', body: 'What’s a favorite TV series?', type: 'text', targetTable: 'user_interests', targetColumn: 'tv_series' },
  { id: 'tv_series_category', title: 'TV', body: 'What TV series genre do you like?', type: 'text', targetTable: 'user_interests', targetColumn: 'tv_series_category' },

  { id: 'favorite_book', title: 'Books', body: 'What’s a favorite book?', type: 'text', targetTable: 'user_interests', targetColumn: 'favorite_book' },
  { id: 'book_category', title: 'Books', body: 'What book genre do you like?', type: 'text', targetTable: 'user_interests', targetColumn: 'book_category' },
  { id: 'cartoon', title: 'Cartoons', body: 'Any favorite cartoon?', type: 'text', targetTable: 'user_interests', targetColumn: 'cartoon' },

  { id: 'travel_destination', title: 'Travel', body: 'Your dream travel destination?', type: 'text', targetTable: 'user_interests', targetColumn: 'travel_destination' },
  { id: 'travel_category', title: 'Travel', body: 'What kind of travel do you enjoy? (beach/mountains/city/etc.)', type: 'text', targetTable: 'user_interests', targetColumn: 'travel_category' },

  { id: 'food_cuisine', title: 'Food', body: 'What cuisine do you love?', type: 'text', targetTable: 'user_interests', targetColumn: 'food_cuisine' },
  { id: 'food_category', title: 'Food', body: 'What kind of food are you into? (street/healthy/desserts/etc.)', type: 'text', targetTable: 'user_interests', targetColumn: 'food_category' },

  { id: 'sport', title: 'Sports', body: 'Any sport you enjoy?', type: 'text', targetTable: 'user_interests', targetColumn: 'sport' },
  { id: 'athlete', title: 'Sports', body: 'Favorite athlete?', type: 'text', targetTable: 'user_interests', targetColumn: 'athlete' },

  { id: 'video_game', title: 'Games', body: 'Any favorite video game?', type: 'text', targetTable: 'user_interests', targetColumn: 'video_game' },
  { id: 'tech_gadget', title: 'Tech', body: 'A tech gadget you love?', type: 'text', targetTable: 'user_interests', targetColumn: 'tech_gadget' },
  { id: 'shopping_brand', title: 'Shopping', body: 'A shopping brand you like?', type: 'text', targetTable: 'user_interests', targetColumn: 'shopping_brand' },
  { id: 'hobby_interest', title: 'Hobbies', body: 'A hobby you’re into?', type: 'text', targetTable: 'user_interests', targetColumn: 'hobby_interest' },
  { id: 'habit', title: 'Lifestyle', body: 'Any habit you’d like to share?', type: 'text', targetTable: 'user_interests', targetColumn: 'habit' },

  // user_preferences: key fields from onboarding
  { id: 'gender_preference', title: 'Preferences', body: 'Who are you open to meeting?', type: 'text', targetTable: 'user_preferences', targetColumn: 'gender_preference' },
  { id: 'preferred_age_gap', title: 'Preferences', body: 'Preferred age gap?', type: 'single_select', options: ['2', '5', '8', '10'], targetTable: 'user_preferences', targetColumn: 'preferred_age_gap', valueType: 'number' },
  { id: 'distance_preference', title: 'Preferences', body: 'Distance preference (km)?', type: 'single_select', options: ['5', '10', '25', '50'], targetTable: 'user_preferences', targetColumn: 'distance_preference', valueType: 'number' },

  // spoken_languages is an array in onboarding; we capture a small set via multi-select
  { id: 'spoken_languages', title: 'Languages', body: 'Which languages do you speak?', type: 'multi_select', options: ['en', 'hi', 'ur', 'bn', 'ta', 'te'], targetTable: 'user_preferences', targetColumn: 'spoken_languages' },

  // additional favorites (multi-value arrays). We map to existing additional_* columns.
  { id: 'additional_music_category', title: 'More favorites', body: 'Pick more music categories you like', type: 'multi_select', options: ['Pop', 'Hip-hop', 'Rock', 'Indie', 'Classical'], targetTable: 'user_interests', targetColumn: 'additional_music_category' },
  { id: 'additional_song', title: 'More favorites', body: 'Pick more songs you like', type: 'multi_select', options: ['Yellow', 'Blinding Lights', 'Perfect', 'Shape of You', 'Tum Hi Ho', 'Despacito'], targetTable: 'user_interests', targetColumn: 'additional_song' },
  { id: 'additional_singer', title: 'More favorites', body: 'Pick more singers you like', type: 'multi_select', options: ['Arijit Singh', 'Taylor Swift', 'The Weeknd', 'Adele', 'Drake', 'BTS'], targetTable: 'user_interests', targetColumn: 'additional_singer' },
  { id: 'additional_singer_groups', title: 'More favorites', body: 'Pick more singer groups you like', type: 'multi_select', options: ['BTS', 'BLACKPINK', 'One Direction', 'Maroon 5'], targetTable: 'user_interests', targetColumn: 'additional_singer_groups' },
  { id: 'additional_singer_idols', title: 'More favorites', body: 'Pick more singer idols you like', type: 'multi_select', options: ['Adele', 'Ed Sheeran', 'A. R. Rahman', 'Billie Eilish'], targetTable: 'user_interests', targetColumn: 'additional_singer_idols' },
  { id: 'additional_music_bands', title: 'More favorites', body: 'Pick more bands you like', type: 'multi_select', options: ['Coldplay', 'Imagine Dragons', 'Linkin Park', 'The Beatles'], targetTable: 'user_interests', targetColumn: 'additional_music_bands' },

  { id: 'additional_movie', title: 'More favorites', body: 'Pick more movies you like', type: 'multi_select', options: ['Inception', 'Interstellar', 'Titanic', '3 Idiots', 'Dangal'], targetTable: 'user_interests', targetColumn: 'additional_movie' },
  { id: 'additional_movie_category', title: 'More favorites', body: 'Pick more movie genres you like', type: 'multi_select', options: ['Romance', 'Comedy', 'Action', 'Thriller', 'Drama'], targetTable: 'user_interests', targetColumn: 'additional_movie_category' },
  { id: 'additional_tv_series', title: 'More favorites', body: 'Pick more TV series you like', type: 'multi_select', options: ['Friends', 'Breaking Bad', 'Stranger Things', 'Money Heist'], targetTable: 'user_interests', targetColumn: 'additional_tv_series' },
  { id: 'additional_tv_series_category', title: 'More favorites', body: 'Pick more TV genres you like', type: 'multi_select', options: ['Drama', 'Comedy', 'Sci-Fi', 'Thriller'], targetTable: 'user_interests', targetColumn: 'additional_tv_series_category' },

  { id: 'additional_book', title: 'More favorites', body: 'Pick more books you like', type: 'multi_select', options: ['Harry Potter', 'Atomic Habits', 'The Alchemist', 'Rich Dad Poor Dad'], targetTable: 'user_interests', targetColumn: 'additional_book' },
  { id: 'additional_book_category', title: 'More favorites', body: 'Pick more book genres you like', type: 'multi_select', options: ['Fiction', 'Non-fiction', 'Self-help', 'Fantasy', 'Mystery'], targetTable: 'user_interests', targetColumn: 'additional_book_category' },
  { id: 'additional_cartoon', title: 'More favorites', body: 'Pick more cartoons you like', type: 'multi_select', options: ['Tom & Jerry', 'Doraemon', 'Ben 10', 'Pokémon'], targetTable: 'user_interests', targetColumn: 'additional_cartoon' },

  { id: 'additional_travel_destination', title: 'More favorites', body: 'Pick more travel destinations you like', type: 'multi_select', options: ['Goa', 'Dubai', 'Paris', 'Bali', 'Tokyo'], targetTable: 'user_interests', targetColumn: 'additional_travel_destination' },
  { id: 'additional_travel_category', title: 'More favorites', body: 'Pick more travel styles you like', type: 'multi_select', options: ['Beach', 'Mountains', 'City', 'Road trips', 'Nature'], targetTable: 'user_interests', targetColumn: 'additional_travel_category' },

  { id: 'additional_food_cuisine', title: 'More favorites', body: 'Pick more cuisines you like', type: 'multi_select', options: ['Desi', 'Italian', 'Chinese', 'Japanese', 'Mexican'], targetTable: 'user_interests', targetColumn: 'additional_food_cuisine' },
  { id: 'additional_food_category', title: 'More favorites', body: 'Pick more food types you like', type: 'multi_select', options: ['Street food', 'Healthy', 'Desserts', 'Fast food'], targetTable: 'user_interests', targetColumn: 'additional_food_category' },

  { id: 'additional_sport', title: 'More favorites', body: 'Pick more sports you like', type: 'multi_select', options: ['Cricket', 'Football', 'Badminton', 'Basketball', 'Tennis'], targetTable: 'user_interests', targetColumn: 'additional_sport' },
  { id: 'additional_athlete', title: 'More favorites', body: 'Pick more athletes you like', type: 'multi_select', options: ['Virat Kohli', 'Messi', 'Ronaldo', 'Serena Williams'], targetTable: 'user_interests', targetColumn: 'additional_athlete' },

  { id: 'additional_video_game', title: 'More favorites', body: 'Pick more games you like', type: 'multi_select', options: ['FIFA', 'PUBG', 'Minecraft', 'Valorant'], targetTable: 'user_interests', targetColumn: 'additional_video_game' },
  { id: 'additional_tech_gadget', title: 'More favorites', body: 'Pick more gadgets you like', type: 'multi_select', options: ['iPhone', 'Android', 'Smartwatch', 'AirPods', 'Laptop'], targetTable: 'user_interests', targetColumn: 'additional_tech_gadget' },
  { id: 'additional_shopping_brand', title: 'More favorites', body: 'Pick more shopping brands you like', type: 'multi_select', options: ['Nike', 'Adidas', 'Zara', 'H&M', 'Uniqlo'], targetTable: 'user_interests', targetColumn: 'additional_shopping_brand' },
  { id: 'additional_hobby_interest', title: 'More favorites', body: 'Pick more hobbies you like', type: 'multi_select', options: ['Gym', 'Reading', 'Gaming', 'Cooking', 'Travel', 'Art'], targetTable: 'user_interests', targetColumn: 'additional_hobby_interest' },

  // Photos: stored in user_photos table (handled specially)
  { id: 'user_photos', title: 'Add a photo', body: 'Upload at least one photo to complete your profile.', type: 'photo', targetTable: 'profiles', targetColumn: 'id' },
];

function isMissingValue(v: any): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function safeGetBool(key: string): boolean {
  try {
    return window.sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function safeSetBool(key: string, value: boolean) {
  try {
    window.sessionStorage.setItem(key, value ? '1' : '0');
  } catch {
    // ignore
  }
}

function safeGetNumber(key: string): number | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function safeSetNumber(key: string, value: number) {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

function pickRandom<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)] ?? null;
}

const PromptCard = ({
  prompt,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  prompt: PromptDefinition;
  onSubmit: (value: string | string[] | PhotoValue) => void;
  onClose: () => void;
  isSubmitting: boolean;
}) => {
  const [value, setValue] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [photo, setPhoto] = useState<PhotoValue | null>(null);

  useEffect(() => {
    setValue('');
    setSelected([]);
    setPhoto(null);
  }, [prompt.id]);

  const onPhotoFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      setPhoto({ dataUrl });
    };
    reader.readAsDataURL(file);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white p-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold leading-tight">{prompt.title}</h3>
            {prompt.body && <p className="text-indigo-100 text-sm mt-1">{prompt.body}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors duration-75"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {prompt.type === 'single_select' && (
            <div className="grid grid-cols-2 gap-2">
              {(prompt.options || []).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setValue(opt)}
                  className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-150 text-left ${
                    value === opt
                      ? 'border-purple-400 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {prompt.type === 'multi_select' && (
            <div className="grid grid-cols-2 gap-2">
              {(prompt.options || []).map((opt) => {
                const isOn = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSelected((prev) => (isOn ? prev.filter((x) => x !== opt) : [...prev, opt]));
                    }}
                    className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-150 text-left ${
                      isOn
                        ? 'border-purple-400 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {prompt.type === 'text' && (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              rows={3}
              placeholder="Type here..."
            />
          )}

          {prompt.type === 'photo' && (
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={onPhotoFileChange}
                className="block w-full text-sm"
              />
              {photo?.dataUrl && (
                <img src={photo.dataUrl} alt="" className="w-full h-56 object-cover rounded-xl border border-gray-200" />
              )}
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors duration-75 text-sm"
              disabled={isSubmitting}
            >
              Not now
            </button>
            <button
              type="button"
              onClick={() => {
                if (prompt.type === 'multi_select') return onSubmit(selected);
                if (prompt.type === 'photo') return photo ? onSubmit(photo) : undefined;
                return onSubmit(value);
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium hover:shadow-lg transition-all duration-150 text-sm disabled:opacity-60"
              disabled={
                isSubmitting ||
                (prompt.type === 'multi_select'
                  ? selected.length === 0
                  : prompt.type === 'photo'
                    ? !photo?.dataUrl
                    : !value.trim())
              }
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProgressiveOnboardingOverlay: React.FC<Props> = ({ userId }) => {
  const [isEligible, setIsEligible] = useState(false);
  const [prompt, setPrompt] = useState<PromptDefinition | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const promptPool = useMemo(() => DEFAULT_PROMPTS, []);

  const shouldShowNow = useCallback(() => {
    const alreadyShownThisSession = safeGetBool(SESSION_SHOWN_KEY);
    if (alreadyShownThisSession) return false;

    const lastShownAt = safeGetNumber(LAST_SHOWN_AT_KEY);
    if (typeof lastShownAt === 'number') {
      const since = Date.now() - lastShownAt;
      if (since < TEN_MINUTES_MS) return false;
    }

    return true;
  }, []);

  const markShown = useCallback(() => {
    safeSetBool(SESSION_SHOWN_KEY, true);
    safeSetNumber(LAST_SHOWN_AT_KEY, Date.now());
  }, []);

  const computeEligibility = useCallback(async () => {
    if (!userId) return false;

    try {
      const [profileRes, interestsRes, prefsRes] = await Promise.all([
        supabase.from('profiles').select('id, onboarding_skipped').eq('id', userId).maybeSingle(),
        supabase.from('user_interests').select('user_id').eq('user_id', userId).maybeSingle(),
        supabase.from('user_preferences').select('user_id').eq('user_id', userId).maybeSingle(),
      ]);

      if (profileRes.error) throw profileRes.error;

      const skipped = Boolean((profileRes.data as any)?.onboarding_skipped);
      const complete = Boolean(interestsRes.data) && Boolean(prefsRes.data);

      return skipped || !complete;
    } catch {
      // If we can't read, be conservative and do not show prompts.
      return false;
    }
  }, [userId]);

  const computeMissingKeys = useCallback(async () => {
    if (!userId) return [] as PromptDefinition[];

    try {
      const [interestsRes, prefsRes, profileRes, photosRes] = await Promise.all([
        supabase
          .from('user_interests')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('id, location')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('user_photos')
          .select('id')
          .eq('user_id', userId)
          .limit(1),
      ]);

      const interests = interestsRes.data as any;
      const prefs = prefsRes.data as any;
      const profile = profileRes.data as any;
      const hasPhotos = Array.isArray(photosRes.data) && photosRes.data.length > 0;

      const missing = promptPool.filter((p) => {
        if (p.type === 'photo') {
          return !hasPhotos;
        }
        const row = p.targetTable === 'user_interests' ? interests : p.targetTable === 'user_preferences' ? prefs : profile;
        const v = row?.[p.targetColumn];
        return isMissingValue(v);
      });

      return missing.length ? missing : promptPool;
    } catch {
      return promptPool;
    }
  }, [promptPool, userId]);

  const maybeShow = useCallback(async () => {
    if (!userId) return;
    if (!shouldShowNow()) return;

    const eligible = await computeEligibility();
    if (!mountedRef.current) return;
    setIsEligible(eligible);

    if (!eligible) return;

    const missingPool = await computeMissingKeys();
    if (!mountedRef.current) return;

    const picked = pickRandom(missingPool);
    if (!picked) return;

    // Add a small random delay so it feels natural
    const delay = 1500 + Math.floor(Math.random() * 4000);
    window.setTimeout(() => {
      if (!mountedRef.current) return;
      if (!shouldShowNow()) return;
      setPrompt(picked);
      markShown();
    }, delay);
  }, [computeEligibility, computeMissingKeys, markShown, shouldShowNow, userId]);

  useEffect(() => {
    void maybeShow();
  }, [maybeShow]);

  const close = useCallback(() => {
    setPrompt(null);
  }, []);

  const submit = useCallback(
    async (value: string | string[] | PhotoValue) => {
      if (!prompt) return;
      if (!userId) return;

      setIsSubmitting(true);
      try {
        if (prompt.type === 'photo') {
          const v = value as PhotoValue;
          if (!v?.dataUrl) throw new Error('Missing photo');

          // Append photo with next order. Keep an existing main photo if present.
          const { data: existing } = await supabase
            .from('user_photos')
            .select('photo_order, is_main_photo')
            .eq('user_id', userId);

          const existingRows = Array.isArray(existing) ? existing : [];
          const maxOrder = existingRows.reduce((max: number, row: any) => {
            const n = typeof row?.photo_order === 'number' ? row.photo_order : -1;
            return Math.max(max, n);
          }, -1);

          const nextOrder = maxOrder + 1;
          const hasMain = existingRows.some((row: any) => row?.is_main_photo === true);
          const isMain = !hasMain;

          const { error } = await supabase.from('user_photos').insert([
            {
              user_id: userId,
              photo_url: v.dataUrl,
              photo_order: nextOrder,
              is_main_photo: isMain,
            },
          ]);
          if (error) throw error;

          if (mountedRef.current) setPrompt(null);
          return;
        }

        if (prompt.targetTable === 'user_interests' || prompt.targetTable === 'user_preferences') {
          // Multi-select fields are stored as arrays
          if (prompt.type === 'multi_select') {
            const payload: any = {
              user_id: userId,
              [prompt.targetColumn]: value,
            };

            // For array columns in user_interests (additional_*) and user_preferences (spoken_languages)
            const { error } = await supabase.from(prompt.targetTable).upsert(payload, { onConflict: 'user_id' });
            if (error) throw error;

            if (mountedRef.current) setPrompt(null);
            return;
          }

          const coercedValue =
            prompt.valueType === 'number'
              ? (() => {
                  const n = Number(value);
                  return Number.isFinite(n) ? n : null;
                })()
              : value;

          if (prompt.valueType === 'number' && coercedValue === null) {
            throw new Error('Invalid numeric value');
          }

          const payload: any = {
            user_id: userId,
            [prompt.targetColumn]: coercedValue,
          };

          // If onboarding created the row already, this updates it; otherwise it creates it.
          const { error } = await supabase.from(prompt.targetTable).upsert(payload, { onConflict: 'user_id' });
          if (error) throw error;
        } else {
          const payload: any = {
            [prompt.targetColumn]: value,
          };

          const { error } = await supabase.from('profiles').update(payload).eq('id', userId);
          if (error) throw error;
        }

        if (mountedRef.current) setPrompt(null);
      } catch (e) {
        console.error('[ProgressiveOnboardingOverlay] submit failed', e);
        if (mountedRef.current) setPrompt(null);
      } finally {
        if (mountedRef.current) setIsSubmitting(false);
      }
    },
    [prompt, userId]
  );

  // If user isn't eligible, do nothing.
  if (!isEligible) return null;
  if (!prompt) return null;

  return <PromptCard prompt={prompt} onSubmit={submit} onClose={close} isSubmitting={isSubmitting} />;
};

export default ProgressiveOnboardingOverlay;
