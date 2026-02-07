import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Props = {
  userId: string;
  onBack: () => void;
};

// ... (rest of the code remains the same)
type ProfileRow = {
  id: string;
  email?: string | null;
  username?: string | null;
  full_name?: string | null;
  date_of_birth?: string | null;
  age?: number | null;
  gender?: string | null;
  location?: string | null;
  photo_url?: string | null;
};

type PreferencesRow = {
  user_id: string;
  spoken_languages?: string[] | null;
  preferred_age_gap?: number | null;
  gender_preference?: string | null;
  distance_preference?: number | null;
};

type PhotoRow = {
  id: string;
  user_id: string;
  photo_url: string;
  photo_order: number;
  is_main_photo: boolean;
  created_at: string;
};

type PendingPhoto = {
  temp_id: string;
  preview_url: string;
  photo_order: number;
};

const PROFILE_PHOTOS_BUCKET = 'profile-photos';

function normalizeStoragePublicUrl(url: string): string {
  // Some older rows may store non-public object URLs like:
  // .../storage/v1/object/profile-photos/<path>
  // Public buckets should be accessed via:
  // .../storage/v1/object/public/profile-photos/<path>
  if (!url) return url;
  if (url.includes('/storage/v1/object/public/')) return url;
  return url.replace('/storage/v1/object/profile-photos/', '/storage/v1/object/public/profile-photos/');
}

async function uploadSocialPostMedia(userId: string, file: File): Promise<string> {
  const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) {
    console.error('[uploadSocialPostMedia] getSession error', sessionErr);
    throw sessionErr;
  }

  if (!sessionRes.session) {
    throw new Error('Not authenticated (no active session)');
  }

  const token = sessionRes.session.access_token;
  if (!token) {
    throw new Error('Not authenticated (missing access token)');
  }

  const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-social-post-media`;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY');
  }

  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'X-User-JWT': token,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  const raw = await res.text();
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    console.error('[uploadSocialPostMedia] function http error', { status: res.status, body: json ?? raw });
    const msg = json?.error || json?.message || `Upload function failed (HTTP ${res.status})`;
    throw new Error(String(msg));
  }

  const publicUrl = json?.public_url as string | undefined;
  if (!publicUrl) {
    const msg = json?.error || 'Upload succeeded but missing public_url';
    throw new Error(String(msg));
  }

  return publicUrl;
}

function parseNumberOrNull(v: string): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function decodeJwtHeader(token: string): { alg?: string; kid?: string } | null {
  try {
    const part = token.split('.')[0];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    const obj = JSON.parse(json);
    return { alg: obj?.alg, kid: obj?.kid };
  } catch {
    return null;
  }
}

async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) {
    console.error('[uploadProfilePhoto] getSession error', sessionErr);
    throw sessionErr;
  }

  if (!sessionRes.session) {
    throw new Error('Not authenticated (no active session)');
  }

  const token = sessionRes.session.access_token;
  if (!token) {
    throw new Error('Not authenticated (missing access token)');
  }

  const header = decodeJwtHeader(token);
  console.log('[MyAccount auth debug]', {
    token_len: token.length,
    alg: header?.alg ?? null,
    kid: header?.kid ?? null,
  });

  const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-profile-photo`;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!anonKey) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY');
  }

  const res = await fetch(fnUrl, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      'X-User-JWT': token,
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  });

  console.log('[uploadProfilePhoto] response', {
    status: res.status,
    statusText: res.statusText,
    contentType: res.headers.get('content-type'),
    wwwAuthenticate: res.headers.get('www-authenticate'),
  });

  const raw = await res.text();
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    console.error('[uploadProfilePhoto] function http error', { status: res.status, body: json ?? raw });
    const msg = json?.error || json?.message || `Upload function failed (HTTP ${res.status})`;
    throw new Error(String(msg));
  }

  const publicUrl = json?.public_url as string | undefined;
  if (!publicUrl) {
    const msg = json?.error || 'Upload succeeded but missing public_url';
    throw new Error(String(msg));
  }

  return publicUrl;
}

const MyAccount: React.FC<Props> = ({ userId, onBack }) => {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const isFriendsDashboard = routerLocation.pathname.startsWith('/friends-dashboard');
  const isLoveDashboard = routerLocation.pathname.startsWith('/love-dashboard');

  const returnTo = (routerLocation.state as any)?.returnTo as string | undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [prefs, setPrefs] = useState<PreferencesRow | null>(null);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [postToSocial, setPostToSocial] = useState(false);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [locationText, setLocationText] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');

  const [spokenLanguages, setSpokenLanguages] = useState('');
  const [preferredAgeGap, setPreferredAgeGap] = useState('');
  const [genderPreference, setGenderPreference] = useState('');
  const [distancePreference, setDistancePreference] = useState('');

  const [newPassword, setNewPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const mountedRef = useRef(true);

  useEffect(() => {
    if (!error && !success) return;

    const type: 'success' | 'error' = error ? 'error' : 'success';
    const message = (error ?? success) as string;

    setToast({ type, message });

    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [error, success]);

  const refreshAll = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    const [profileRes, prefsRes, photosRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,email,username,full_name,date_of_birth,age,gender,location,photo_url')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('user_preferences')
        .select('user_id,spoken_languages,preferred_age_gap,gender_preference,distance_preference')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_photos')
        .select('id,user_id,photo_url,photo_order,is_main_photo,created_at')
        .eq('user_id', userId)
        .order('is_main_photo', { ascending: false })
        .order('photo_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

    if (profileRes.error) {
      setError(profileRes.error.message);
      setLoading(false);
      return;
    }

    const p = (profileRes.data as any) as ProfileRow | null;
    const pr = (prefsRes.data as any) as PreferencesRow | null;
    const ph = (Array.isArray(photosRes.data) ? (photosRes.data as any[]) : []) as PhotoRow[];

    setProfile(p);
    setPrefs(pr);
    setPhotos(ph);

    setFullName(p?.full_name ?? '');
    setUsername(p?.username ?? '');
    setGender(p?.gender ?? '');
    setLocationText(p?.location ?? '');
    setDob(p?.date_of_birth ?? '');
    setAge(typeof p?.age === 'number' ? String(p?.age) : '');

    setSpokenLanguages((pr?.spoken_languages ?? []).join(', '));
    setPreferredAgeGap(pr?.preferred_age_gap != null ? String(pr.preferred_age_gap) : '');
    setGenderPreference(pr?.gender_preference ?? '');
    setDistancePreference(pr?.distance_preference != null ? String(pr.distance_preference) : '');

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    mountedRef.current = true;
    void refreshAll();

    const channel = supabase
      .channel(`my-account-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        () => {
          if (!mountedRef.current) return;
          void refreshAll();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_preferences', filter: `user_id=eq.${userId}` },
        () => {
          if (!mountedRef.current) return;
          void refreshAll();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_photos', filter: `user_id=eq.${userId}` },
        () => {
          if (!mountedRef.current) return;
          void refreshAll();
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      void supabase.removeChannel(channel);
    };
  }, [refreshAll, userId]);

  const canSave = useMemo(() => {
    return Boolean(userId) && !loading && !saving;
  }, [loading, saving, userId]);

  const saveProfileAndPrefs = useCallback(async () => {
    if (!canSave) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const profileUpdate: any = {
        id: userId,
        full_name: fullName.trim() || null,
        username: username.trim() || null,
        gender: gender.trim() || null,
        location: locationText.trim() || null,
        date_of_birth: dob ? dob : null,
        age: age ? parseNumberOrNull(age) : null,
      };

      const prefsUpdate: any = {
        user_id: userId,
        spoken_languages: spokenLanguages
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        preferred_age_gap: preferredAgeGap ? parseNumberOrNull(preferredAgeGap) : null,
        gender_preference: genderPreference.trim() || null,
        distance_preference: distancePreference ? parseNumberOrNull(distancePreference) : null,
      };

      const [pRes, prefRes] = await Promise.all([
        supabase.from('profiles').upsert(profileUpdate, { onConflict: 'id' }),
        supabase.from('user_preferences').upsert(prefsUpdate, { onConflict: 'user_id' }),
      ]);

      if (pRes.error) throw pRes.error;
      if (prefRes.error) throw prefRes.error;

      setSuccess('Saved successfully');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [age, canSave, distancePreference, dob, fullName, gender, genderPreference, locationText, preferredAgeGap, spokenLanguages, userId, username]);

  const changePassword = useCallback(async () => {
    if (!newPassword.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword.trim() });
      if (pwError) throw pwError;
      setNewPassword('');
      setSuccess('Password updated');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  }, [newPassword]);

  const addPhoto = useCallback(
    async (file: File, alsoPostToSocial: boolean) => {
      setError(null);
      setSuccess(null);

      let tempId = '';

      try {
        const nextOrder = photos.reduce((max, row) => Math.max(max, row.photo_order ?? -1), -1) + 1;
        const previewUrl = URL.createObjectURL(file);
        tempId = `pending_${Date.now()}_${Math.random().toString(16).slice(2)}`;

        setPendingPhotos((curr) => [...curr, { temp_id: tempId, preview_url: previewUrl, photo_order: nextOrder }]);

        const photoUrl = await uploadProfilePhoto(userId, file);

        const hasMain = photos.some((p) => p.is_main_photo);

        const { error: insertErr } = await supabase.from('user_photos').insert([
          {
            user_id: userId,
            photo_url: photoUrl,
            photo_order: nextOrder,
            is_main_photo: !hasMain,
          },
        ]);
        if (insertErr) throw insertErr;

        if (alsoPostToSocial) {
          const socialUrl = await uploadSocialPostMedia(userId, file);
          const { error: socialErr } = await supabase.from('social_posts').insert([
            {
              user_id: userId,
              caption: null,
              media_url: socialUrl,
              media_type: 'image',
            },
          ]);
          if (socialErr) throw socialErr;
        }

        setSuccess('Photo added');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to upload photo');
      } finally {
        setPendingPhotos((curr) => {
          const match = curr.find((p) => p.temp_id === tempId);
          if (match) {
            try {
              URL.revokeObjectURL(match.preview_url);
            } catch {
              // ignore
            }
          }
          return curr.filter((p) => p.temp_id !== tempId);
        });
        setSaving(false);
      }
    },
    [photos, userId]
  );

  const addPhotos = useCallback(
    async (files: File[], alsoPostToSocial: boolean) => {
      for (const file of files) {
        // Keep UX predictable: upload one at a time, but show each preview immediately.
        // This avoids race conditions around photo_order and main photo selection.
        await addPhoto(file, alsoPostToSocial);
      }
    },
    [addPhoto]
  );

  const setMainPhoto = useCallback(
    async (photoId: string) => {
      setSaving(true);
      setError(null);
      setSuccess(null);

      try {
        const updates = photos.map((p) => ({ id: p.id, is_main_photo: p.id === photoId }));

        for (const u of updates) {
          const { error: updErr } = await supabase.from('user_photos').update({ is_main_photo: u.is_main_photo }).eq('id', u.id);
          if (updErr) throw updErr;
        }

        setSuccess('Main photo updated');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update main photo');
      } finally {
        setSaving(false);
      }
    },
    [photos]
  );

  const deletePhoto = useCallback(async (photoId: string) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: delErr } = await supabase.from('user_photos').delete().eq('id', photoId);
      if (delErr) throw delErr;
      setSuccess('Photo removed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete photo');
    } finally {
      setSaving(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div className="text-gray-700 font-semibold">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold">My Account</h1>
            <p className="text-indigo-100 text-sm">Manage your profile and settings</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (returnTo) {
                navigate(returnTo, { replace: true });
                return;
              }

              if (isFriendsDashboard) {
                navigate('/friends-dashboard/social-overview', { replace: true });
                return;
              }

              if (isLoveDashboard) {
                navigate('/love-dashboard/love-overview', { replace: true });
                return;
              }

              onBack();
            }}
            className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-sm font-semibold"
          >
            Back
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {toast && (
            <div
              role="status"
              aria-live="polite"
              className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-96"
            >
              <div
                className={`rounded-2xl shadow-xl border px-4 py-3 flex items-start justify-between gap-3 ${
                  toast.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="text-sm font-semibold">{toast.message}</div>
                <button
                  type="button"
                  onClick={() => setToast(null)}
                  className="text-xs font-semibold opacity-80 hover:opacity-100"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Gender</label>
              <input value={gender} onChange={(e) => setGender(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Location</label>
              <input value={locationText} onChange={(e) => setLocationText(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Date of birth</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Age</label>
              <input value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Languages (comma separated)</label>
              <input value={spokenLanguages} onChange={(e) => setSpokenLanguages(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Preferred age gap</label>
              <input value={preferredAgeGap} onChange={(e) => setPreferredAgeGap(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Gender preference</label>
              <input value={genderPreference} onChange={(e) => setGenderPreference(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700">Distance preference</label>
              <input value={distancePreference} onChange={(e) => setDistancePreference(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={!canSave}
              onClick={saveProfileAndPrefs}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>

          {!isFriendsDashboard && (
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-base font-bold text-gray-900">Photos</h2>
              <p className="text-sm text-gray-600 mt-1">Upload, set main photo, or remove photos.</p>

              <div className="mt-4 flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={postToSocial}
                    onChange={(e) => setPostToSocial(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Post it on your social media side?
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const list = e.target.files;
                    const files = list ? Array.from(list) : [];
                    if (files.length) void addPhotos(files, postToSocial);
                    e.currentTarget.value = '';
                  }}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                {pendingPhotos
                  .slice()
                  .sort((a, b) => (a.photo_order ?? 0) - (b.photo_order ?? 0))
                  .map((p) => (
                    <div key={p.temp_id} className="w-28 sm:w-32 md:w-36 border border-gray-200 rounded-xl overflow-hidden opacity-80">
                      <div className="w-full aspect-[3/4] bg-gray-100">
                        <img src={p.preview_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="p-2 flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-gray-500">Uploading…</div>
                      </div>
                    </div>
                  ))}
                {photos.map((p) => (
                  <div key={p.id} className="w-28 sm:w-32 md:w-36 border border-gray-200 rounded-xl overflow-hidden">
                    <div className="w-full aspect-[3/4] bg-gray-100">
                      <img src={normalizeStoragePublicUrl(p.photo_url)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => void setMainPhoto(p.id)}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        {p.is_main_photo ? 'Main' : 'Set main'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deletePhoto(p.id)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {photos.length === 0 && <div className="mt-3 text-sm text-gray-600">No photos yet. Upload one to show on your profile.</div>}
            </div>
          )}

          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-base font-bold text-gray-900">Security</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => void changePassword()}
                  disabled={!newPassword.trim() || saving}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Update password
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => navigate('/friends-dashboard/edit-interests')}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 font-semibold text-gray-800 hover:bg-gray-50"
            >
              Edit Interests
            </button>
          </div>

          <div className="border-t border-gray-100 pt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">Signed in as: {profile?.email ?? '—'}</div>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/');
              }}
              className="px-4 py-2 rounded-xl border border-red-200 text-red-700 font-semibold hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAccount;
