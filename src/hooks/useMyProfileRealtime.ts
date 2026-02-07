import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

function normalizeStoragePublicUrl(url: string): string {
  if (!url) return url;
  if (url.includes('/storage/v1/object/public/')) return url;
  return url.replace('/storage/v1/object/profile-photos/', '/storage/v1/object/public/profile-photos/');
}

export type MyProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  photo_urls: string[];
};

export interface UseMyProfileRealtimeState {
  loading: boolean;
  error: string | null;
  profile: MyProfile | null;
  refresh: () => Promise<void>;
}

export function useMyProfileRealtime(userId: string): UseMyProfileRealtimeState {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);

  const channelsRef = useRef<RealtimeChannel[]>([]);

  const loadSnapshot = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }

    const [profileRes, photosRes, authRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').eq('id', userId).maybeSingle(),
      supabase
        .from('user_photos')
        .select('photo_url, is_main_photo, photo_order')
        .eq('user_id', userId)
        .order('photo_order', { ascending: true }),
      supabase.auth.getUser(),
    ]);

    if (profileRes.error) throw profileRes.error;
    if (photosRes.error) throw photosRes.error;
    if (authRes.error) throw authRes.error;

    const photos = (photosRes.data as any[]) || [];
    const mainPhoto = photos.find((p) => p.is_main_photo) || null;

    const orderedUrls = photos
      .slice()
      .sort((a, b) => (a.photo_order ?? 999) - (b.photo_order ?? 999))
      .map((p) => p.photo_url)
      .filter(Boolean);

    const urlsRaw = mainPhoto?.photo_url
      ? [mainPhoto.photo_url, ...orderedUrls.filter((u) => u !== mainPhoto.photo_url)]
      : orderedUrls;
    const urls = urlsRaw.map((u) => normalizeStoragePublicUrl(String(u)));

    setProfile({
      id: userId,
      full_name: profileRes.data?.full_name ?? null,
      email: (profileRes.data?.email ?? authRes.data.user?.email ?? null) as string | null,
      photo_urls: urls,
    });
  }, [userId]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      await loadSnapshot();
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh profile');
    }
  }, [loadSnapshot]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        await loadSnapshot();

        channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
        channelsRef.current = [];

        const profileCh = supabase
          .channel(`my_profile_${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => {
            loadSnapshot().catch(() => undefined);
          })
          .subscribe();

        const photosCh = supabase
          .channel(`my_photos_${userId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'user_photos', filter: `user_id=eq.${userId}` }, () => {
            loadSnapshot().catch(() => undefined);
          })
          .subscribe();

        channelsRef.current = [profileCh, photosCh];
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Failed to load profile');
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [userId, loadSnapshot]);

  return useMemo(
    () => ({
      loading,
      error,
      profile,
      refresh,
    }),
    [error, loading, profile, refresh]
  );
}
