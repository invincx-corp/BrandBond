import { supabase } from './supabase';

interface AuthFetchOptions extends RequestInit {
  onUnauthorized?: () => void | Promise<void>;
}

const defaultOnUnauthorized = async () => {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }

  try {
    localStorage.removeItem('brandbond_registration_progress_v1');
    localStorage.removeItem('brandbond_last_route_v1');
  } catch {
    // ignore
  }

  window.location.href = '/';
};

export async function authFetch(input: RequestInfo | URL, init: AuthFetchOptions = {}) {
  const { onUnauthorized, headers, ...rest } = init;

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  const mergedHeaders = new Headers(headers || {});
  if (token) {
    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...rest,
    headers: mergedHeaders,
  });

  if (response.status === 401 || response.status === 403) {
    await (onUnauthorized ? onUnauthorized() : defaultOnUnauthorized());
  }

  return response;
}
