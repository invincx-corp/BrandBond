import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Props = {
  userId: string;
  onBack: () => void;
};

type InterestsRow = Record<string, any> & { user_id: string };

function toArrayValue(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === 'string');
  return [];
}

const EditInterests: React.FC<Props> = ({ userId, onBack }) => {
  const navigate = useNavigate();
  const mountedRef = useRef(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [row, setRow] = useState<InterestsRow | null>(null);

  const [musicCategory, setMusicCategory] = useState('');
  const [favoriteSong, setFavoriteSong] = useState('');
  const [favoriteSinger, setFavoriteSinger] = useState('');
  const [singerGroups, setSingerGroups] = useState('');
  const [singerIdols, setSingerIdols] = useState('');
  const [musicBands, setMusicBands] = useState('');

  const [favoriteMovie, setFavoriteMovie] = useState('');
  const [movieCategory, setMovieCategory] = useState('');
  const [tvSeries, setTvSeries] = useState('');
  const [tvSeriesCategory, setTvSeriesCategory] = useState('');
  const [favoriteBook, setFavoriteBook] = useState('');
  const [bookCategory, setBookCategory] = useState('');

  const [cartoon, setCartoon] = useState('');
  const [travelDestination, setTravelDestination] = useState('');
  const [travelCategory, setTravelCategory] = useState('');
  const [foodCuisine, setFoodCuisine] = useState('');
  const [foodCategory, setFoodCategory] = useState('');
  const [sport, setSport] = useState('');
  const [athlete, setAthlete] = useState('');
  const [videoGame, setVideoGame] = useState('');
  const [techGadget, setTechGadget] = useState('');
  const [shoppingBrand, setShoppingBrand] = useState('');
  const [hobbyInterest, setHobbyInterest] = useState('');

  const [additionalMusicCategory, setAdditionalMusicCategory] = useState<string[]>([]);
  const [additionalSong, setAdditionalSong] = useState<string[]>([]);
  const [additionalSinger, setAdditionalSinger] = useState<string[]>([]);
  const [additionalSingerGroups, setAdditionalSingerGroups] = useState<string[]>([]);
  const [additionalSingerIdols, setAdditionalSingerIdols] = useState<string[]>([]);
  const [additionalMusicBands, setAdditionalMusicBands] = useState<string[]>([]);
  const [additionalMovie, setAdditionalMovie] = useState<string[]>([]);
  const [additionalMovieCategory, setAdditionalMovieCategory] = useState<string[]>([]);
  const [additionalTvSeries, setAdditionalTvSeries] = useState<string[]>([]);
  const [additionalTvSeriesCategory, setAdditionalTvSeriesCategory] = useState<string[]>([]);
  const [additionalBook, setAdditionalBook] = useState<string[]>([]);
  const [additionalBookCategory, setAdditionalBookCategory] = useState<string[]>([]);
  const [additionalCartoon, setAdditionalCartoon] = useState<string[]>([]);
  const [additionalTravelDestination, setAdditionalTravelDestination] = useState<string[]>([]);
  const [additionalTravelCategory, setAdditionalTravelCategory] = useState<string[]>([]);
  const [additionalFoodCuisine, setAdditionalFoodCuisine] = useState<string[]>([]);
  const [additionalFoodCategory, setAdditionalFoodCategory] = useState<string[]>([]);
  const [additionalSport, setAdditionalSport] = useState<string[]>([]);
  const [additionalAthlete, setAdditionalAthlete] = useState<string[]>([]);
  const [additionalVideoGame, setAdditionalVideoGame] = useState<string[]>([]);
  const [additionalTechGadget, setAdditionalTechGadget] = useState<string[]>([]);
  const [additionalShoppingBrand, setAdditionalShoppingBrand] = useState<string[]>([]);
  const [additionalHobbyInterest, setAdditionalHobbyInterest] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await supabase.from('user_interests').select('*').eq('user_id', userId).maybeSingle();
    if (res.error) {
      setError(res.error.message);
      setLoading(false);
      return;
    }

    const d = (res.data as any) as InterestsRow | null;
    setRow(d);

    setMusicCategory(d?.music_category ?? '');
    setFavoriteSong(d?.favorite_song ?? '');
    setFavoriteSinger(d?.favorite_singer ?? '');
    setSingerGroups(d?.singer_groups ?? '');
    setSingerIdols(d?.singer_idols ?? '');
    setMusicBands(d?.music_bands ?? '');

    setFavoriteMovie(d?.favorite_movie ?? '');
    setMovieCategory(d?.movie_category ?? '');
    setTvSeries(d?.tv_series ?? '');
    setTvSeriesCategory(d?.tv_series_category ?? '');
    setFavoriteBook(d?.favorite_book ?? '');
    setBookCategory(d?.book_category ?? '');

    setCartoon(d?.cartoon ?? '');
    setTravelDestination(d?.travel_destination ?? '');
    setTravelCategory(d?.travel_category ?? '');
    setFoodCuisine(d?.food_cuisine ?? '');
    setFoodCategory(d?.food_category ?? '');
    setSport(d?.sport ?? '');
    setAthlete(d?.athlete ?? '');
    setVideoGame(d?.video_game ?? '');
    setTechGadget(d?.tech_gadget ?? '');
    setShoppingBrand(d?.shopping_brand ?? '');
    setHobbyInterest(d?.hobby_interest ?? '');

    setAdditionalMusicCategory(toArrayValue(d?.additional_music_category));
    setAdditionalSong(toArrayValue(d?.additional_song));
    setAdditionalSinger(toArrayValue(d?.additional_singer));
    setAdditionalSingerGroups(toArrayValue(d?.additional_singer_groups));
    setAdditionalSingerIdols(toArrayValue(d?.additional_singer_idols));
    setAdditionalMusicBands(toArrayValue(d?.additional_music_bands));
    setAdditionalMovie(toArrayValue(d?.additional_movie));
    setAdditionalMovieCategory(toArrayValue(d?.additional_movie_category));
    setAdditionalTvSeries(toArrayValue(d?.additional_tv_series));
    setAdditionalTvSeriesCategory(toArrayValue(d?.additional_tv_series_category));
    setAdditionalBook(toArrayValue(d?.additional_book));
    setAdditionalBookCategory(toArrayValue(d?.additional_book_category));
    setAdditionalCartoon(toArrayValue(d?.additional_cartoon));
    setAdditionalTravelDestination(toArrayValue(d?.additional_travel_destination));
    setAdditionalTravelCategory(toArrayValue(d?.additional_travel_category));
    setAdditionalFoodCuisine(toArrayValue(d?.additional_food_cuisine));
    setAdditionalFoodCategory(toArrayValue(d?.additional_food_category));
    setAdditionalSport(toArrayValue(d?.additional_sport));
    setAdditionalAthlete(toArrayValue(d?.additional_athlete));
    setAdditionalVideoGame(toArrayValue(d?.additional_video_game));
    setAdditionalTechGadget(toArrayValue(d?.additional_tech_gadget));
    setAdditionalShoppingBrand(toArrayValue(d?.additional_shopping_brand));
    setAdditionalHobbyInterest(toArrayValue(d?.additional_hobby_interest));

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh();

    const channel = supabase
      .channel(`edit-interests-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_interests', filter: `user_id=eq.${userId}` },
        () => {
          if (!mountedRef.current) return;
          void refresh();
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      void supabase.removeChannel(channel);
    };
  }, [refresh, userId]);

  const canSave = useMemo(() => !loading && !saving, [loading, saving]);

  const save = useCallback(async () => {
    if (!canSave) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: any = {
        user_id: userId,
        music_category: musicCategory || null,
        favorite_song: favoriteSong || null,
        favorite_singer: favoriteSinger || null,
        singer_groups: singerGroups || null,
        singer_idols: singerIdols || null,
        music_bands: musicBands || null,

        favorite_movie: favoriteMovie || null,
        movie_category: movieCategory || null,
        tv_series: tvSeries || null,
        tv_series_category: tvSeriesCategory || null,
        favorite_book: favoriteBook || null,
        book_category: bookCategory || null,

        cartoon: cartoon || null,
        travel_destination: travelDestination || null,
        travel_category: travelCategory || null,
        food_cuisine: foodCuisine || null,
        food_category: foodCategory || null,
        sport: sport || null,
        athlete: athlete || null,
        video_game: videoGame || null,
        tech_gadget: techGadget || null,
        shopping_brand: shoppingBrand || null,
        hobby_interest: hobbyInterest || null,

        additional_music_category: additionalMusicCategory,
        additional_song: additionalSong,
        additional_singer: additionalSinger,
        additional_singer_groups: additionalSingerGroups,
        additional_singer_idols: additionalSingerIdols,
        additional_music_bands: additionalMusicBands,
        additional_movie: additionalMovie,
        additional_movie_category: additionalMovieCategory,
        additional_tv_series: additionalTvSeries,
        additional_tv_series_category: additionalTvSeriesCategory,
        additional_book: additionalBook,
        additional_book_category: additionalBookCategory,
        additional_cartoon: additionalCartoon,
        additional_travel_destination: additionalTravelDestination,
        additional_travel_category: additionalTravelCategory,
        additional_food_cuisine: additionalFoodCuisine,
        additional_food_category: additionalFoodCategory,
        additional_sport: additionalSport,
        additional_athlete: additionalAthlete,
        additional_video_game: additionalVideoGame,
        additional_tech_gadget: additionalTechGadget,
        additional_shopping_brand: additionalShoppingBrand,
        additional_hobby_interest: additionalHobbyInterest,
      };

      const res = await supabase.from('user_interests').upsert(payload, { onConflict: 'user_id' });
      if (res.error) throw res.error;

      setSuccess('Saved successfully');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [
    additionalAthlete,
    additionalBook,
    additionalBookCategory,
    additionalCartoon,
    additionalFoodCategory,
    additionalFoodCuisine,
    additionalHobbyInterest,
    additionalMovie,
    additionalMovieCategory,
    additionalMusicBands,
    additionalMusicCategory,
    additionalShoppingBrand,
    additionalSinger,
    additionalSingerGroups,
    additionalSingerIdols,
    additionalSong,
    additionalSport,
    additionalTechGadget,
    additionalTravelCategory,
    additionalTravelDestination,
    additionalTvSeries,
    additionalTvSeriesCategory,
    additionalVideoGame,
    athlete,
    bookCategory,
    canSave,
    cartoon,
    favoriteBook,
    favoriteMovie,
    favoriteSinger,
    favoriteSong,
    foodCategory,
    foodCuisine,
    hobbyInterest,
    movieCategory,
    musicBands,
    musicCategory,
    singerGroups,
    singerIdols,
    shoppingBrand,
    sport,
    techGadget,
    travelCategory,
    travelDestination,
    tvSeries,
    tvSeriesCategory,
    userId,
    videoGame,
  ]);

  const ChipEditor = useCallback(
    ({ label, values, onChange }: { label: string; values: string[]; onChange: (v: string[]) => void }) => {
      const [input, setInput] = useState('');
      return (
        <div className="border border-gray-200 rounded-xl p-3">
          <div className="text-sm font-semibold text-gray-800">{label}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {values.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700 hover:bg-gray-200"
              >
                {v} ×
              </button>
            ))}
            {values.length === 0 && <span className="text-sm text-gray-500">No items</span>}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2"
              placeholder="Add item"
            />
            <button
              type="button"
              onClick={() => {
                const val = input.trim();
                if (!val) return;
                if (values.includes(val)) return;
                onChange([...values, val]);
                setInput('');
              }}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white font-semibold"
            >
              Add
            </button>
          </div>
        </div>
      );
    },
    []
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="text-gray-700 font-semibold">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 text-white flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">Edit Interests</h1>
            <p className="text-blue-100 text-sm">All-time favorites and additional favorites</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onBack();
              navigate(-1);
            }}
            className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-sm font-semibold"
          >
            Back
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>}
          {success && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl p-3">{success}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Music category</label>
              <input value={musicCategory} onChange={(e) => setMusicCategory(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Favorite song</label>
              <input value={favoriteSong} onChange={(e) => setFavoriteSong(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Favorite singer</label>
              <input value={favoriteSinger} onChange={(e) => setFavoriteSinger(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Singer groups</label>
              <input value={singerGroups} onChange={(e) => setSingerGroups(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Singer idols</label>
              <input value={singerIdols} onChange={(e) => setSingerIdols(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Music bands</label>
              <input value={musicBands} onChange={(e) => setMusicBands(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Favorite movie</label>
              <input value={favoriteMovie} onChange={(e) => setFavoriteMovie(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Movie category</label>
              <input value={movieCategory} onChange={(e) => setMovieCategory(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">TV series</label>
              <input value={tvSeries} onChange={(e) => setTvSeries(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">TV series category</label>
              <input value={tvSeriesCategory} onChange={(e) => setTvSeriesCategory(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Favorite book</label>
              <input value={favoriteBook} onChange={(e) => setFavoriteBook(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Book category</label>
              <input value={bookCategory} onChange={(e) => setBookCategory(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Cartoon</label>
              <input value={cartoon} onChange={(e) => setCartoon(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Travel destination</label>
              <input value={travelDestination} onChange={(e) => setTravelDestination(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Travel category</label>
              <input value={travelCategory} onChange={(e) => setTravelCategory(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Food cuisine</label>
              <input value={foodCuisine} onChange={(e) => setFoodCuisine(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Food category</label>
              <input value={foodCategory} onChange={(e) => setFoodCategory(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Sport</label>
              <input value={sport} onChange={(e) => setSport(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Athlete</label>
              <input value={athlete} onChange={(e) => setAthlete(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Video game</label>
              <input value={videoGame} onChange={(e) => setVideoGame(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Tech gadget</label>
              <input value={techGadget} onChange={(e) => setTechGadget(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Shopping brand</label>
              <input value={shoppingBrand} onChange={(e) => setShoppingBrand(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Hobby interest</label>
              <input value={hobbyInterest} onChange={(e) => setHobbyInterest(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-900">Additional favorites</h2>
            <p className="text-sm text-gray-600 mt-1">Add multiple favorites for each category.</p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ChipEditor label="Additional music categories" values={additionalMusicCategory} onChange={setAdditionalMusicCategory} />
              <ChipEditor label="Additional songs" values={additionalSong} onChange={setAdditionalSong} />
              <ChipEditor label="Additional singers" values={additionalSinger} onChange={setAdditionalSinger} />
              <ChipEditor label="Additional singer groups" values={additionalSingerGroups} onChange={setAdditionalSingerGroups} />
              <ChipEditor label="Additional singer idols" values={additionalSingerIdols} onChange={setAdditionalSingerIdols} />
              <ChipEditor label="Additional music bands" values={additionalMusicBands} onChange={setAdditionalMusicBands} />

              <ChipEditor label="Additional movies" values={additionalMovie} onChange={setAdditionalMovie} />
              <ChipEditor label="Additional movie categories" values={additionalMovieCategory} onChange={setAdditionalMovieCategory} />
              <ChipEditor label="Additional TV series" values={additionalTvSeries} onChange={setAdditionalTvSeries} />
              <ChipEditor label="Additional TV series categories" values={additionalTvSeriesCategory} onChange={setAdditionalTvSeriesCategory} />
              <ChipEditor label="Additional books" values={additionalBook} onChange={setAdditionalBook} />
              <ChipEditor label="Additional book categories" values={additionalBookCategory} onChange={setAdditionalBookCategory} />

              <ChipEditor label="Additional cartoons" values={additionalCartoon} onChange={setAdditionalCartoon} />
              <ChipEditor label="Additional travel destinations" values={additionalTravelDestination} onChange={setAdditionalTravelDestination} />
              <ChipEditor label="Additional travel categories" values={additionalTravelCategory} onChange={setAdditionalTravelCategory} />
              <ChipEditor label="Additional food cuisines" values={additionalFoodCuisine} onChange={setAdditionalFoodCuisine} />
              <ChipEditor label="Additional food categories" values={additionalFoodCategory} onChange={setAdditionalFoodCategory} />

              <ChipEditor label="Additional sports" values={additionalSport} onChange={setAdditionalSport} />
              <ChipEditor label="Additional athletes" values={additionalAthlete} onChange={setAdditionalAthlete} />
              <ChipEditor label="Additional video games" values={additionalVideoGame} onChange={setAdditionalVideoGame} />
              <ChipEditor label="Additional tech gadgets" values={additionalTechGadget} onChange={setAdditionalTechGadget} />
              <ChipEditor label="Additional shopping brands" values={additionalShoppingBrand} onChange={setAdditionalShoppingBrand} />
              <ChipEditor label="Additional hobby interests" values={additionalHobbyInterest} onChange={setAdditionalHobbyInterest} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={!canSave}
              onClick={() => void save()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-600 text-white font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => navigate('/friends-dashboard/my-account')}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 font-semibold text-gray-800 hover:bg-gray-50"
            >
              Back to My Account
            </button>
          </div>

          <div className="text-xs text-gray-500">user_interests row: {row?.user_id ?? '—'}</div>
        </div>
      </div>
    </div>
  );
};

export default EditInterests;
