// Supabase Edge Function: kala-api
// Secrets required: KALA_PIN, KALA_SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const enc = new TextEncoder();
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(value))));
}
async function validToken(token: string, secret: string) {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  let raw = "";
  try { raw = atob(payload.replace(/-/g, "+").replace(/_/g, "/")); } catch { return false; }
  const expected = await sign(payload, secret);
  if (expected.length !== signature.length) return false;
  let diff = 0; for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  if (diff !== 0) return false;
  try { const data = JSON.parse(raw); return Number(data.exp) > Date.now(); } catch { return false; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const pin = Deno.env.get("KALA_PIN");
  const sessionSecret = Deno.env.get("KALA_SESSION_SECRET");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!pin || !sessionSecret || !url || !serviceKey) return json({ error: "Server configuration incomplete" }, 500);

  let body: Record<string, unknown> = {};
  if (req.method !== "GET") { try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); } }
  const path = new URL(req.url).searchParams.get("action") || String(body.action || "");
  if (path === "login" && req.method === "POST") {
    if (String(body.pin || "") !== pin) return json({ error: "Incorrect PIN" }, 401);
    const payload = b64(enc.encode(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 })));
    return json({ token: payload + "." + await sign(payload, sessionSecret), expiresIn: 28800 });
  }

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!(await validToken(token, sessionSecret))) return json({ error: "Session expired or invalid" }, 401);

  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  if (path === "list" && req.method === "GET") {
    const { data, error } = await db.from("kala_registrations").select("*").order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ records: data || [] });
  }
  if (path === "create" && req.method === "POST") {
    const r = body.record as Record<string, unknown> | undefined;
    if (!r || !r.id || !r.category || !r.participant_names || !r.block || !r.school || !r.official) return json({ error: "Missing required registration fields" }, 400);
    const row = {
      id: String(r.id), category_index: Number(r.category_index), category: String(r.category),
      event_date: String(r.event_date), entry_type: String(r.entry_type), participant_names: String(r.participant_names),
      block: String(r.block), school: String(r.school), udise: String(r.udise || ""),
      remarks: String(r.remarks || ""), official: String(r.official), created_by: "00000000-0000-0000-0000-000000000000"
    };
    // API is the only intended writer. The SQL table's created_by FK is Auth-specific,
    // so remove that column before insert in the PIN-gated service-role flow.
    delete (row as Record<string, unknown>).created_by;
    const { data, error } = await db.from("kala_registrations").insert(row).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ record: data }, 201);
  }
  if (path === "delete" && req.method === "POST") {
    const id = String(body.id || "");
    if (!id) return json({ error: "Missing registration ID" }, 400);
    const { error } = await db.from("kala_registrations").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true });
  }
  return json({ error: "Unknown action" }, 404);
});
