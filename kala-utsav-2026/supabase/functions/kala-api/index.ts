// Supabase Edge Function: kala-api
// Secrets: KALA_PIN, KALA_SESSION_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
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
  const pin = Deno.env.get("KALA_PIN"), adminPin = Deno.env.get("KALA_ADMIN_PIN"), judgePinsRaw = Deno.env.get("KALA_JUDGE_PINS"), sessionSecret = Deno.env.get("KALA_SESSION_SECRET");
  const url = Deno.env.get("SUPABASE_URL"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!pin || !sessionSecret || !url || !serviceKey) return json({ error: "Server configuration incomplete" }, 500);
  let body: Record<string, unknown> = {};
  if (req.method !== "GET") { try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); } }
  const path = new URL(req.url).searchParams.get("action") || String(body.action || "");
  if ((path === "login" || path === "admin-login" || path === "judge-login") && req.method === "POST") {
    const isAdminLogin = path === "admin-login", isJudgeLogin = path === "judge-login";
    let judgeName = "";
    if (isJudgeLogin) {
      judgeName = String(body.judge_name || "");
      let judgePins: Record<string,string> = {};
      try { judgePins = JSON.parse(judgePinsRaw || "{}"); } catch { return json({ error: "Judge PIN configuration is invalid JSON" }, 500); }
      if (!judgeName || !/^\d{6}$/.test(String(body.pin || "")) || judgePins[judgeName] !== String(body.pin || ""))
        return json({ error: "Incorrect judge name or individual PIN" }, 401);
    } else if (isAdminLogin ? (!adminPin || String(body.pin || "") !== adminPin) : String(body.pin || "") !== pin) {
      return json({ error: isAdminLogin ? "Incorrect Admin PIN or Admin PIN is not configured" : "Incorrect PIN" }, 401);
    }
    const payload = b64(enc.encode(JSON.stringify({ role: isAdminLogin ? "admin" : isJudgeLogin ? "judge" : "user", ...(isJudgeLogin ? { judge_name: judgeName } : {}), exp: Date.now() + 8 * 60 * 60 * 1000 })));
    return json({ token: payload + "." + await sign(payload, sessionSecret), expiresIn: 28800, ...(isJudgeLogin ? { judge_name: judgeName } : {}) });
  }
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!(await validToken(token, sessionSecret))) return json({ error: "Session expired or invalid" }, 401);
  const payloadPart = token.split(".")[0] || "";
  let sessionRole = "user", sessionJudgeName = "";
  try { const decoded = atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")); const sessionData = JSON.parse(decoded); sessionRole = sessionData.role || "user"; sessionJudgeName = String(sessionData.judge_name || ""); } catch { return json({ error: "Invalid session" }, 401); }
  const db = createClient(url, serviceKey, { auth: { persistSession: false } });
  if (sessionRole === "judge" && !["evaluation-list","evaluation-save"].includes(path)) return json({ error: "Judge access is limited to evaluation" }, 403);
  if (sessionRole === "admin" && path !== "audit-list") return json({ error: "Admin access is limited to audit log" }, 403);
  if (path === "audit-list" && req.method === "GET") {
    if (sessionRole !== "admin") return json({ error: "Admin access required" }, 403);
    const { data, error } = await db.from("kala_evaluation_audit").select("*").order("changed_at", { ascending: false }).limit(2000);
    if (error) return json({ error: error.message }, 500);
    return json({ audit: data || [] });
  }


  const judgeDiscipline = (category: string) => category.includes("संगीत गायन") ? "संगीत गायन" :
    category.includes("संगीत वादन") ? "संगीत वादन" : category.includes("नृत्य") ? "नृत्य" :
    category.includes("नाटक") ? "नाटक" : category.includes("दृश्य कला") ? "दृश्य कला" : "पारंपरिक कहानी वाचन";
  const judgeAssignments: Record<string,string> = {
    "श्री विश्वजीत कुमार":"संगीत गायन","श्रीमती पूजा कुमारी":"संगीत गायन",
    "श्री तारा कांत सिंह":"संगीत वादन","श्री राहुल कुमार":"संगीत वादन",
    "श्रीमती सोनी कुमारी":"नृत्य","श्रीमती उर्मिला मिश्रा":"नृत्य",
    "श्री उमेश कुमार प्रसाद सिंह":"नाटक","श्री संजीव कुमार शर्मा":"नाटक",
    "श्रीमती ललिता भारती":"दृश्य कला","श्रीमती अर्चना कुमारी":"दृश्य कला",
    "श्री अमरेश कुमार":"पारंपरिक कहानी वाचन","श्री सुधाकर कांत चक्रवर्ती":"पारंपरिक कहानी वाचन"
  };
  if (path === "evaluation-list" && req.method === "GET") {
    const judge = new URL(req.url).searchParams.get("judge") || "";
    if (sessionRole !== "judge" || judge !== sessionJudgeName) return json({ error: "Judge identity mismatch" }, 403);
    if (!judgeAssignments[judge]) return json({ error: "Unknown judge" }, 400);
    const { data, error } = await db.from("kala_evaluations").select("*").eq("judge_name", judge);
    if (error) return json({ error: error.message }, 500);
    return json({ evaluations: data || [] });
  }
  if (path === "evaluation-save" && req.method === "POST") {
    const judge = String(body.judge_name || ""), registrationId = String(body.registration_id || "");
    if (sessionRole !== "judge" || judge !== sessionJudgeName) return json({ error: "Judge identity mismatch" }, 403);
    const category = String(body.category || ""), discipline = String(body.discipline || "");
    const scores = body.scores, remarks = String(body.remarks || "");
    if (!judgeAssignments[judge] || !registrationId || !Array.isArray(scores))
      return json({ error: "Missing or invalid evaluation fields" }, 400);
    if (judgeAssignments[judge] !== judgeDiscipline(category) || discipline !== judgeAssignments[judge])
      return json({ error: "This judge is not assigned to this art form" }, 403);
    const limits: Record<string,number[]> = {
      "संगीत गायन":[20,20,20,20,20],"संगीत वादन":[20,20,20,20,20],
      "नृत्य":[20,20,10,20,10,20],"नाटक":[10,20,15,15,20,20],
      "दृश्य कला":[20,20,20,20,20],"पारंपरिक कहानी वाचन":[20,20,10,10,20,20]
    };
    const maxes = limits[discipline];
    if (scores.length !== maxes.length || scores.some((v: unknown,i: number) => !Number.isInteger(v) || Number(v)<0 || Number(v)>maxes[i]))
      return json({ error: "Scores do not match the official rubric" }, 400);
    const total = scores.reduce((a: number,b: number) => a + Number(b), 0);
    const { data: registration, error: regError } = await db.from("kala_registrations").select("id,category").eq("id", registrationId).maybeSingle();
    if (regError) return json({ error: regError.message }, 500);
    if (!registration || registration.category !== category) return json({ error: "Registration not found or category mismatch" }, 404);
    const { data: previous } = await db.from("kala_evaluations").select("*").eq("registration_id", registrationId).eq("judge_name", judge).maybeSingle();
    const { data, error } = await db.from("kala_evaluations").upsert({
      registration_id: registrationId, judge_name: judge, category, discipline, scores, total, remarks, updated_at: new Date().toISOString()
    }, { onConflict: "registration_id,judge_name" }).select().single();
    if (error) return json({ error: error.message }, 500);
    const { error: auditError } = await db.from("kala_evaluation_audit").insert({
      registration_id: registrationId, judge_name: judge, category, discipline,
      old_scores: previous?.scores ?? null, new_scores: scores,
      old_total: previous?.total ?? null, new_total: total,
      old_remarks: previous?.remarks ?? null, new_remarks: remarks,
      action: previous ? "EDIT" : "CREATE"
    });
    if (auditError) return json({ error: "Score saved but audit logging failed: " + auditError.message }, 500);
    return json({ evaluation: data });
  }

  if (path === "list" && req.method === "GET") {
    const { data, error } = await db.from("kala_registrations").select("*").order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);
    return json({ records: data || [] });
  }
  if (path === "schools" && req.method === "GET") {
    const { data, error } = await db.from("kala_school_suggestions").select("block,school,udise,source,verification_status").order("school");
    if (error) return json({ error: error.message }, 500);
    return json({ schools: data || [] });
  }
  if (path === "school-add" && req.method === "POST") {
    const block = String(body.block || "").trim(), school = String(body.school || "").trim();
    const udise = String(body.udise || "").trim();
    if (!block || !school) return json({ error: "Block and school are required" }, 400);
    if (udise && !/^\d{11}$/.test(udise)) return json({ error: "UDISE must contain exactly 11 digits" }, 400);
    const existing = await db.from("kala_school_suggestions").select("block,school,udise,source,verification_status")
      .ilike("block", block).ilike("school", school).eq("udise", udise).maybeSingle();
    if (existing.error) return json({ error: existing.error.message }, 500);
    if (existing.data) return json({ school: existing.data });
    const { data, error } = await db.from("kala_school_suggestions")
      .insert({ block, school, udise, source: "manual", verification_status: "Pending Verification" })
      .select("block,school,udise,source,verification_status").single();
    if (error) return json({ error: error.message }, 500);
    return json({ school: data });
  }
  if (path === "create" && req.method === "POST") {
    const r = body.record as Record<string, unknown> | undefined;
    if (!r || !r.id || !r.category || !r.participant_names || !r.block || !r.school || !r.official)
      return json({ error: "Missing required registration fields" }, 400);
    const details = Array.isArray(r.participant_details) ? r.participant_details : [];
    const row = {
      id: String(r.id), category_index: Number(r.category_index), category: String(r.category),
      event_date: String(r.event_date), entry_type: String(r.entry_type), participant_names: String(r.participant_names),
      participant_details: details, school_verified: Boolean(r.school_verified),
      school_source: String(r.school_source || "manual"),
      block: String(r.block), school: String(r.school), udise: String(r.udise || ""),
      remarks: String(r.remarks || ""), official: String(r.official)
    };
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
