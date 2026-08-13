// Edge Function: mikrotik-end-connection
//
// Memutus active PPPoE connection (bukan disable secret) satu Pelanggan
// lewat Mikrotik RouterOS v7 REST API (DELETE .../rest/ppp/active/{id}).
// Dipanggil langsung dari app oleh Pemilik lewat tombol "Putus Koneksi" di
// layar detail Pelanggan -- sengaja jadi aksi TERPISAH dari Isolir
// (mikrotik-set-isolir): disable secret cuma mencegah koneksi baru, sesi
// yang sudah connect tetap jalan sampai diputus lewat function ini.
//
// HARUS jadi Edge Function (bukan kode di app) karena butuh kredensial API
// Mikrotik (MIKROTIK_HOST, MIKROTIK_API_USER, MIKROTIK_API_PASSWORD,
// MIKROTIK_CA_CERT), yang tidak boleh ada di bundle mobile.
//
// Cara deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> nama "mikrotik-end-connection" -> paste isi file ini -> Deploy. Pakai
// secret Mikrotik yang sama seperti mikrotik-set-isolir (lihat DEPLOY.md di
// folder itu) -- tidak perlu diset ulang, secretnya sudah shared di
// project yang sama.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MIKROTIK_TIMEOUT_MS = 10_000;

function createMikrotikHttpClient(): Deno.HttpClient | undefined {
  const caCert = Deno.env.get("MIKROTIK_CA_CERT");
  if (!caCert) return undefined;
  return Deno.createHttpClient({ caCerts: [caCert] });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function endMikrotikActiveConnections(
  mikrotikUsername: string
): Promise<{ success: true; endedCount: number } | { success: false; error: string }> {
  const host = Deno.env.get("MIKROTIK_HOST");
  const user = Deno.env.get("MIKROTIK_API_USER");
  const password = Deno.env.get("MIKROTIK_API_PASSWORD");

  if (!host || !user || !password) {
    return {
      success: false,
      error: "Kredensial Mikrotik belum diset (lihat DEPLOY.md di folder mikrotik-set-isolir).",
    };
  }

  const auth = "Basic " + btoa(`${user}:${password}`);
  const client = createMikrotikHttpClient();

  try {
    const activeRes = await fetch(
      `https://${host}/rest/ppp/active?name=${encodeURIComponent(mikrotikUsername)}`,
      { headers: { Authorization: auth }, signal: AbortSignal.timeout(MIKROTIK_TIMEOUT_MS), client }
    );

    if (!activeRes.ok) {
      const detail = await activeRes.text().catch(() => "");
      return {
        success: false,
        error: `Gagal menghubungi Mikrotik (${activeRes.status})${detail ? `: ${detail}` : ""}.`,
      };
    }

    const activeSessions = (await activeRes.json()) as Array<{ ".id": string }>;
    if (!activeSessions || activeSessions.length === 0) {
      return { success: true, endedCount: 0 };
    }

    let endedCount = 0;
    for (const session of activeSessions) {
      const deleteRes = await fetch(`https://${host}/rest/ppp/active/${session[".id"]}`, {
        method: "DELETE",
        headers: { Authorization: auth },
        signal: AbortSignal.timeout(MIKROTIK_TIMEOUT_MS),
        client,
      });
      if (deleteRes.ok) endedCount += 1;
    }

    return { success: true, endedCount };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return {
      success: false,
      error: isTimeout
        ? `Router Mikrotik tidak merespons dalam ${MIKROTIK_TIMEOUT_MS / 1000} detik.`
        : `Gagal konek ke Mikrotik: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing Authorization header" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ error: "Sesi tidak valid" }, 401);
  }

  const { data: profile, error: profileError } = await callerClient
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile || profile.role !== "pemilik") {
    return jsonResponse({ error: "Hanya Pemilik yang boleh memutus koneksi" }, 403);
  }

  let body: { pelangganId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body request tidak valid" }, 400);
  }

  const { pelangganId } = body;
  if (!pelangganId) {
    return jsonResponse({ error: "Input tidak valid" }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: pelanggan, error: pelangganError } = await adminClient
    .from("pelanggan")
    .select("mikrotik_username")
    .eq("id", pelangganId)
    .single();

  if (pelangganError || !pelanggan) {
    return jsonResponse({ error: "Pelanggan tidak ditemukan" }, 404);
  }

  if (!pelanggan.mikrotik_username) {
    return jsonResponse(
      { error: "Pelanggan ini belum punya Username Mikrotik yang di-set." },
      400
    );
  }

  const result = await endMikrotikActiveConnections(pelanggan.mikrotik_username);
  if (!result.success) {
    return jsonResponse({ error: result.error }, 502);
  }

  return jsonResponse({ success: true, endedCount: result.endedCount }, 200);
});
