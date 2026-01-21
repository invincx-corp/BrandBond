# recompute-recommendations (Supabase Edge Function)

This function processes `public.recommendation_recompute_queue` and upserts `public.match_recommendations`.

## Required env vars

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Suggested schedule

Run every **1 minute** for near-realtime:

- `GET /functions/v1/recompute-recommendations?batch=10&candidates=200`

## Notes

- This uses service role to bypass RLS (required to compute cross-user recommendations).
- Score is primarily interest match percentage, with small soft boosts from preferences.
