// Supabase Edge Function: recompute-recommendations
// Processes recommendation_recompute_queue and upserts match_recommendations.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Json = Record<string, any>;

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function withTimeout<T>(label: string, ms: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(`${label}_timeout_${ms}ms`), ms);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(t);
  }
}

function normalizeText(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

function toStringArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [String(value)].filter(Boolean);
}

function intersectCount(a: string[], b: string[]): number {
  const bSet = new Set(b.map(normalizeText));
  let c = 0;
  for (const x of a) {
    if (bSet.has(normalizeText(x))) c++;
  }
  return c;
}

// Pulls all interest-related keys from a user_interests row.
// Returns category keys (labels) that overlap.
function computeCommonInterestCategories(a: any, b: any): { common: string[]; overlap: number; considered: number } {
  const singleKeys: Array<{ col: string; label: string }> = [
    { col: "music_category", label: "MusicCategory" },
    { col: "favorite_song", label: "Song" },
    { col: "favorite_singer", label: "Singer" },
    { col: "singer_groups", label: "SingerGroups" },
    { col: "singer_idols", label: "SingerIdols" },
    { col: "music_bands", label: "MusicBands" },
    { col: "favorite_movie", label: "Movie" },
    { col: "movie_category", label: "MovieCategory" },
    { col: "tv_series", label: "TVSeries" },
    { col: "tv_series_category", label: "TVSeriesCategory" },
    { col: "favorite_book", label: "Book" },
    { col: "book_category", label: "BookCategory" },
    { col: "cartoon", label: "Cartoon" },
    { col: "travel_destination", label: "TravelDestination" },
    { col: "travel_category", label: "TravelDestinationCategory" },
    { col: "food_cuisine", label: "FoodCuisine" },
    { col: "food_category", label: "FoodCuisineCategory" },
    { col: "sport", label: "Sport" },
    { col: "athlete", label: "Athlete" },
    { col: "video_game", label: "VideoGame" },
    { col: "tech_gadget", label: "TechGadget" },
    { col: "shopping_brand", label: "ShoppingBrand" },
    { col: "hobby_interest", label: "HobbyInterest" },
    { col: "habit", label: "Habit" },
  ];

  const arrayKeys: Array<{ col: string; label: string }> = [
    { col: "additional_music_category", label: "MusicCategory" },
    { col: "additional_song", label: "Song" },
    { col: "additional_singer", label: "Singer" },
    { col: "additional_singer_groups", label: "SingerGroups" },
    { col: "additional_singer_idols", label: "SingerIdols" },
    { col: "additional_music_bands", label: "MusicBands" },
    { col: "additional_movie", label: "Movie" },
    { col: "additional_movie_category", label: "MovieCategory" },
    { col: "additional_tv_series", label: "TVSeries" },
    { col: "additional_tv_series_category", label: "TVSeriesCategory" },
    { col: "additional_book", label: "Book" },
    { col: "additional_book_category", label: "BookCategory" },
    { col: "additional_cartoon", label: "Cartoon" },
    { col: "additional_travel_destination", label: "TravelDestination" },
    { col: "additional_travel_category", label: "TravelDestinationCategory" },
    { col: "additional_food_cuisine", label: "FoodCuisine" },
    { col: "additional_food_category", label: "FoodCuisineCategory" },
    { col: "additional_sport", label: "Sport" },
    { col: "additional_athlete", label: "Athlete" },
    { col: "additional_video_game", label: "VideoGame" },
    { col: "additional_tech_gadget", label: "TechGadget" },
    { col: "additional_shopping_brand", label: "ShoppingBrand" },
    { col: "additional_hobby_interest", label: "HobbyInterest" },
  ];

  const commonSet = new Set<string>();
  let overlap = 0;
  let considered = 0;

  for (const k of singleKeys) {
    considered += 1;
    const av = normalizeText(a?.[k.col]);
    const bv = normalizeText(b?.[k.col]);
    if (av && bv && av === bv) {
      overlap += 1;
      commonSet.add(k.label);
    }
  }

  for (const k of arrayKeys) {
    considered += 1;
    const av = toStringArray(a?.[k.col]);
    const bv = toStringArray(b?.[k.col]);
    if (intersectCount(av, bv) > 0) {
      overlap += 1;
      commonSet.add(k.label);
    }
  }

  return { common: Array.from(commonSet), overlap, considered };
}

function computeBaseMatchPct(overlap: number, considered: number): number {
  if (!considered) return 0;
  // baseline so it's not flat zero when interests exist
  const pct = 0.2 + (overlap / considered) * 0.8;
  return Math.max(0, Math.min(1, pct));
}

function computeSoftBoosts(params: {
  me: any;
  other: any;
  myPrefs: any;
  otherPrefs: any;
}): { boost: number; breakdown: Json } {
  const { me, other, myPrefs } = params;
  let boost = 0;
  const breakdown: Json = {};

  // Gender preference soft boost
  const prefGender = String(myPrefs?.gender_preference ?? "Both");
  const otherGender = String(other?.gender ?? "");
  if (prefGender && prefGender.toLowerCase() !== "both" && otherGender) {
    const match = normalizeText(prefGender) === normalizeText(otherGender);
    breakdown.gender_match = match;
    if (match) boost += 3;
  }

  // Age gap soft boost
  const gap = Number(myPrefs?.preferred_age_gap);
  const myAge = Number(me?.age);
  const otherAge = Number(other?.age);
  if (!Number.isNaN(gap) && gap > 0 && !Number.isNaN(myAge) && !Number.isNaN(otherAge)) {
    const within = Math.abs(myAge - otherAge) <= gap;
    breakdown.age_within_gap = within;
    breakdown.preferred_age_gap = gap;
    breakdown.age_diff = Math.abs(myAge - otherAge);
    if (within) boost += 3;
  }

  // Spoken languages overlap boost
  const myLangs = toStringArray(myPrefs?.spoken_languages);
  const otherLangs = toStringArray(params.otherPrefs?.spoken_languages);
  if (myLangs.length && otherLangs.length) {
    const c = intersectCount(myLangs, otherLangs);
    breakdown.shared_languages = c;
    if (c > 0) boost += Math.min(5, 2 + c); // 3..5
  }

  // Distance preference proxy (no geo): boost if same location string
  const myLoc = normalizeText(me?.location);
  const otherLoc = normalizeText(other?.location);
  const distPref = Number(myPrefs?.distance_preference);
  if (!Number.isNaN(distPref) && distPref > 0 && myLoc && otherLoc) {
    const same = myLoc === otherLoc;
    breakdown.same_location = same;
    breakdown.distance_preference = distPref;
    if (same) boost += 3;
  }

  return { boost, breakdown };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startedAt = Date.now();
  console.log("recompute-recommendations: start", { url: req.url, method: req.method });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.log("recompute-recommendations: missing env");
    return jsonResponse({ error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    global: {
      headers: {
        // Make the intent explicit in case runtime behaves differently.
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    },
  });

  const url = new URL(req.url);
  const batchSize = Math.max(1, Math.min(50, Number(url.searchParams.get("batch")) || 10));
  const candidatesCap = Math.max(20, Math.min(500, Number(url.searchParams.get("candidates")) || 200));

  // 1) Claim a batch of unprocessed queue rows (best-effort lock)
  const nowIso = new Date().toISOString();
  const lockId = crypto.randomUUID();

  const callTimeoutMs = Math.max(2_000, Math.min(15_000, Number(url.searchParams.get("timeoutMs")) || 10_000));

  console.log("recompute-recommendations: selecting queue", { batchSize });
  const { data: rows, error: selectErr } = await withTimeout("select_queue", callTimeoutMs, (signal) =>
    supabase
      .from("recommendation_recompute_queue")
      .select("id,user_id,attempts")
      .is("processed_at", null)
      .is("locked_at", null)
      .order("created_at", { ascending: true })
      .limit(batchSize)
      .abortSignal(signal)
  );

  if (selectErr) {
    console.log("recompute-recommendations: select queue error", { error: selectErr.message });
    return jsonResponse({ error: selectErr.message, step: "select_queue" }, 500);
  }

  const queue = rows || [];
  if (!queue.length) {
    console.log("recompute-recommendations: no jobs");
    return jsonResponse({ ok: true, processed: 0, elapsedMs: Date.now() - startedAt });
  }

  // Lock rows
  const ids = queue.map((r) => r.id);
  console.log("recompute-recommendations: locking jobs", { count: ids.length, lockId });
  const { error: lockErr } = await withTimeout("lock_jobs", callTimeoutMs, (signal) =>
    supabase
      .from("recommendation_recompute_queue")
      .update({ locked_at: nowIso, locked_by: lockId })
      .in("id", ids)
      .abortSignal(signal)
  );

  if (lockErr) {
    console.log("recompute-recommendations: lock error", { error: lockErr.message });
    return jsonResponse({ error: lockErr.message, step: "lock_jobs" }, 500);
  }

  let processedCount = 0;

  for (const item of queue) {
    const userId = item.user_id as string;

    try {
      console.log("recompute-recommendations: processing user", { userId });
      // Load me
      const [meRes, myInterestsRes, myPrefsRes] = await Promise.all([
        withTimeout("load_me", callTimeoutMs, (signal) =>
          supabase.from("profiles").select("id,age,gender,location,intent").eq("id", userId).maybeSingle().abortSignal(signal)
        ),
        withTimeout("load_my_interests", callTimeoutMs, (signal) =>
          supabase.from("user_interests").select("*").eq("user_id", userId).maybeSingle().abortSignal(signal)
        ),
        withTimeout("load_my_prefs", callTimeoutMs, (signal) =>
          supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle().abortSignal(signal)
        ),
      ]);

      if (meRes.error) throw meRes.error;
      if (myInterestsRes.error) throw myInterestsRes.error;
      if (myPrefsRes.error) throw myPrefsRes.error;

      const me = meRes.data;
      const myInterests = myInterestsRes.data;
      const myPrefs = myPrefsRes.data;

      if (!me || !myInterests || !myPrefs) {
        // Not ready yet -> mark processed so it doesn't loop forever; triggers will re-enqueue on completion.
        await withTimeout("mark_not_ready", callTimeoutMs, (signal) =>
          supabase
            .from("recommendation_recompute_queue")
            .update({ processed_at: new Date().toISOString(), locked_at: null, locked_by: null, last_error: null })
            .eq("id", item.id)
            .abortSignal(signal)
        );
        processedCount++;
        continue;
      }

      // Candidate pool: profiles excluding me
      const { data: candidates, error: candErr } = await withTimeout("load_candidates", callTimeoutMs, (signal) =>
        supabase
          .from("profiles")
          .select("id,age,gender,location,intent")
          .neq("id", userId)
          .limit(candidatesCap)
          .abortSignal(signal)
      );
      if (candErr) throw candErr;

      const candidateIds = (candidates || []).map((c) => c.id).filter(Boolean);

      // Load candidates interests + preferences in bulk
      const [candInterestsRes, candPrefsRes] = await Promise.all([
        candidateIds.length
          ? withTimeout("load_candidate_interests", callTimeoutMs, (signal) =>
              supabase.from("user_interests").select("*").in("user_id", candidateIds).abortSignal(signal)
            )
          : Promise.resolve({ data: [], error: null } as any),
        candidateIds.length
          ? withTimeout("load_candidate_prefs", callTimeoutMs, (signal) =>
              supabase.from("user_preferences").select("*").in("user_id", candidateIds).abortSignal(signal)
            )
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (candInterestsRes.error) throw candInterestsRes.error;
      if (candPrefsRes.error) throw candPrefsRes.error;

      const interestsByUser = new Map<string, any>((candInterestsRes.data || []).map((r: any) => [r.user_id, r]));
      const prefsByUser = new Map<string, any>((candPrefsRes.data || []).map((r: any) => [r.user_id, r]));
      const profileById = new Map<string, any>((candidates || []).map((p: any) => [p.id, p]));

      const scored = candidateIds
        .map((cid) => {
          const other = profileById.get(cid);
          const otherInterests = interestsByUser.get(cid);
          const otherPrefs = prefsByUser.get(cid);
          if (!other || !otherInterests) return null;

          const { common, overlap, considered } = computeCommonInterestCategories(myInterests, otherInterests);
          const matchPct = computeBaseMatchPct(overlap, considered);
          const baseScore = Math.round(matchPct * 100);

          const { boost, breakdown } = computeSoftBoosts({ me, other, myPrefs, otherPrefs });
          const finalScore = Math.max(0, Math.min(100, baseScore + boost));

          return {
            user_id: userId,
            recommended_user_id: cid,
            score: finalScore,
            reasons: {
              version: "v2_interests_plus_soft_prefs",
              match_percentage: matchPct,
              base_score: baseScore,
              boost,
              boost_breakdown: breakdown,
              common_interests: common,
            },
            status: "active",
          };
        })
        .filter(Boolean) as any[];

      // Keep only top 50 by score
      scored.sort((a, b) => (b.score || 0) - (a.score || 0));
      const top = scored.slice(0, 50);

      if (top.length) {
        const { error: upsertErr } = await withTimeout("upsert_recommendations", callTimeoutMs, (signal) =>
          supabase
            .from("match_recommendations")
            .upsert(top, { onConflict: "user_id,recommended_user_id" })
            .abortSignal(signal)
        );
        if (upsertErr) throw upsertErr;
      }

      // Mark processed
      await withTimeout("mark_processed", callTimeoutMs, (signal) =>
        supabase
          .from("recommendation_recompute_queue")
          .update({ processed_at: new Date().toISOString(), locked_at: null, locked_by: null, last_error: null })
          .eq("id", item.id)
          .abortSignal(signal)
      );

      processedCount++;
    } catch (e: any) {
      const msg = e?.message ? String(e.message) : String(e);
      console.log("recompute-recommendations: user error", { userId, error: msg });
      // Increment attempts; unlock for retry
      await withTimeout("mark_failed", callTimeoutMs, (signal) =>
        supabase
          .from("recommendation_recompute_queue")
          .update({
            attempts: (item.attempts || 0) + 1,
            locked_at: null,
            locked_by: null,
            last_error: msg,
          })
          .eq("id", item.id)
          .abortSignal(signal)
      );
    }
  }

  console.log("recompute-recommendations: done", { processed: processedCount, elapsedMs: Date.now() - startedAt });
  return jsonResponse({ ok: true, processed: processedCount, lockId, elapsedMs: Date.now() - startedAt });
});
