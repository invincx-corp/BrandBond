// Disable Supabase Functions gateway JWT enforcement.
// We verify the user's ES256 JWT ourselves via JWKS (from X-User-JWT).
export const config = {
  verify_jwt: false,
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createRemoteJWKSet, jwtVerify } from "https://esm.sh/jose@5";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-jwt, x-supabase-auth, x-supabase-api-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "content-type",
};

function jsonResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: "Missing Supabase env vars" }, 500);
    }

    const userJwt = req.headers.get("x-user-jwt") || "";
    if (!userJwt) {
      return jsonResponse({ error: "Missing x-user-jwt header" }, 401);
    }

    const jwksUrl = new URL("/auth/v1/.well-known/jwks.json", supabaseUrl);
    const jwks = createRemoteJWKSet(jwksUrl);
    const { payload } = await jwtVerify(userJwt, jwks, {
      issuer: new URL("/auth/v1", supabaseUrl).toString(),
      audience: "authenticated",
    });

    const userId = typeof payload.sub === "string" ? payload.sub : null;
    if (!userId) {
      return jsonResponse({ error: "JWT missing sub" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const contentType = req.headers.get("content-type") || "application/octet-stream";
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (!bytes.length) {
      return jsonResponse({ error: "Empty body" }, 400);
    }

    const ext = (() => {
      const fromMime = (contentType || "").split("/")[1] || "jpg";
      return fromMime.replace(/[^a-z0-9]+/gi, "").slice(0, 8) || "jpg";
    })();

    const hash = (await sha256Hex(bytes)).slice(0, 16);
    const filePath = `${userId}/${Date.now()}_${hash}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from("social-posts")
      .upload(filePath, bytes, { contentType, upsert: true });

    if (uploadError) {
      return jsonResponse({ error: uploadError.message }, 400);
    }

    const publicUrl = admin.storage.from("social-posts").getPublicUrl(filePath).data.publicUrl;

    return jsonResponse({
      user_id: userId,
      path: filePath,
      public_url: publicUrl,
    });
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});
