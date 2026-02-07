// Supabase Edge Function: persist-compatibility
// Upserts user_compatibility scores for (caller, other_user_id) pairs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("ANON_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SERVICE_ROLE_KEY" }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
  if (!token) {
    return jsonResponse({ error: "Missing bearer token" }, 401);
  }

  // Verify the caller JWT using anon key (never with service role).
  const authClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        apikey: anonKey,
        Authorization: authHeader,
      },
    },
  });

  const {
    data: { user },
    error: userErr,
  } = await authClient.auth.getUser(token);

  if (userErr || !user?.id) {
    return jsonResponse(
      {
        error: "Unauthorized",
        details: userErr?.message ?? null,
        token_prefix: token.slice(0, 10),
        token_len: token.length,
      },
      401
    );
  }

  // Service role client for DB writes (bypasses RLS). No Authorization header.
  const admin = createClient(supabaseUrl, serviceRoleKey);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) {
    return jsonResponse({ ok: true, upserted: 0 });
  }

  const low = (a: string, b: string) => (a < b ? a : b);
  const high = (a: string, b: string) => (a < b ? b : a);

  const rows = items
    .map((it: any) => {
      const otherUserId = String(it?.other_user_id ?? "");
      if (!otherUserId) return null;
      if (otherUserId === user.id) return null;
      const score = clampScore(Number(it?.score));
      if (score <= 0) return null;

      const user_low = low(user.id, otherUserId);
      const user_high = high(user.id, otherUserId);

      return {
        user_low,
        user_high,
        score,
        updated_at: new Date().toISOString(),
      };
    })
    .filter(Boolean) as Array<{ user_low: string; user_high: string; score: number; updated_at: string }>;

  if (!rows.length) {
    return jsonResponse({ ok: true, upserted: 0 });
  }

  const { error: upsertErr } = await admin
    .from("user_compatibility")
    .upsert(rows, { onConflict: "user_low,user_high" });

  if (upsertErr) {
    return jsonResponse({ error: upsertErr.message }, 500);
  }

  return jsonResponse({ ok: true, upserted: rows.length });
});
