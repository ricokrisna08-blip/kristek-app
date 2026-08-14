// Edge Function: mikrotik-create-secret
//
// Auto-create ATAU auto-link PPP secret satu Pelanggan lewat Mikrotik
// RouterOS v7 REST API, dipanggil dari app oleh Pemilik lewat tombol
// "Simpan Username Mikrotik" di layar detail Pelanggan -- sebelumnya
// langkah ini manual (bikin secret sendiri di Winbox, baru link
// username-nya di app). Function ini cek dulu (GET .../rest/ppp/secret)
// apakah secret dengan nama itu sudah ada di router: kalau sudah (kasus
// pelanggan lama yang secret-nya dibuat manual sebelum fitur ini ada),
// tinggal di-link; kalau belum, baru dibuatkan (POST) pakai Profile dari
// paket.mikrotik_profile milik Pelanggan itu. Password PPP secret SELALU
// sama untuk semua Pelanggan baru (bukan per-pelanggan atau random --
// sesuai konvensi yang sudah dipakai KRISTEK di Mikrotik) -- tidak
// dipakai/diubah kalau secretnya cuma di-link.
//
// HARUS jadi Edge Function (bukan kode di app) karena butuh kredensial API
// Mikrotik (MIKROTIK_HOST, MIKROTIK_API_USER, MIKROTIK_API_PASSWORD,
// MIKROTIK_CA_CERT), yang tidak boleh ada di bundle mobile.
//
// Cara deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> nama "mikrotik-create-secret" -> paste isi file ini -> Deploy. Pakai
// secret Mikrotik yang sama seperti mikrotik-set-isolir (lihat DEPLOY.md di
// folder itu) -- tidak perlu diset ulang, secretnya sudah shared di
// project yang sama.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MIKROTIK_TIMEOUT_MS = 10_000;

// Password PPP secret KRISTEK selalu sama untuk semua Pelanggan (konvensi
// yang sudah dipakai manual di Mikrotik sebelum ini) -- bukan data rahasia
// per-pelanggan, jadi aman ditulis di sini.
const MIKROTIK_SECRET_PASSWORD = "123456789!@";

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

async function createOrLinkMikrotikSecret(
  mikrotikUsername: string,
  profile: string
): Promise<{ success: true; linked: boolean } | { success: false; error: string }> {
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
    // Cek dulu apakah secret dengan nama ini sudah ada di router --
    // kejadian nyata: pelanggan lama yang secret-nya sudah dibuat manual
    // di Mikrotik sebelum fitur ini ada, baru sekarang di-daftarkan ke
    // app. Kalau sudah ada, tinggal di-link (bukan dibuatkan baru --
    // POST-nya bakal ditolak Mikrotik dengan "already have such name").
    const lookupRes = await fetch(
      `https://${host}/rest/ppp/secret?name=${encodeURIComponent(mikrotikUsername)}`,
      { headers: { Authorization: auth }, signal: AbortSignal.timeout(MIKROTIK_TIMEOUT_MS), client }
    );

    if (!lookupRes.ok) {
      const detail = await lookupRes.text().catch(() => "");
      return {
        success: false,
        error: `Gagal menghubungi Mikrotik (${lookupRes.status})${detail ? `: ${detail}` : ""}.`,
      };
    }

    const matches = (await lookupRes.json()) as Array<{ ".id": string }>;
    if (matches && matches.length > 0) {
      return { success: true, linked: true };
    }

    // Mikrotik REST API pakai PUT buat "add" (item baru), bukan POST --
    // POST di path collection ini ditolak dengan error "no such command"
    // karena RouterOS nyari sub-command yang cocok, bukan bikin item baru.
    const createRes = await fetch(`https://${host}/rest/ppp/secret`, {
      method: "PUT",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: mikrotikUsername,
        password: MIKROTIK_SECRET_PASSWORD,
        service: "pppoe",
        profile,
      }),
      signal: AbortSignal.timeout(MIKROTIK_TIMEOUT_MS),
      client,
    });

    if (!createRes.ok) {
      const detail = await createRes.text().catch(() => "");
      return {
        success: false,
        error: `Gagal membuat PPP secret di Mikrotik (${createRes.status})${detail ? `: ${detail}` : ""}.`,
      };
    }

    return { success: true, linked: false };
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return {
      success: false,
      error: isTimeout
        ? `Router Mikrotik tidak merespons dalam ${MIKROTIK_TIMEOUT_MS / 1000} detik — cek apakah ${host} bisa diakses dari internet (port terbuka, firewall, dll).`
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

  if (profileError || !profile || (profile.role !== "pemilik" && profile.role !== "admin")) {
    return jsonResponse(
      { error: "Hanya Admin dan Pemilik yang boleh mengatur Username Mikrotik" },
      403
    );
  }

  let body: { pelangganId?: string; mikrotikUsername?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body request tidak valid" }, 400);
  }

  const { pelangganId, mikrotikUsername } = body;
  if (!pelangganId || !mikrotikUsername || !mikrotikUsername.trim()) {
    return jsonResponse({ error: "Input tidak valid" }, 400);
  }
  const trimmedUsername = mikrotikUsername.trim();

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: pelanggan, error: pelangganError } = await adminClient
    .from("pelanggan")
    .select("mikrotik_username, paket:paket_id ( mikrotik_profile )")
    .eq("id", pelangganId)
    .single();

  if (pelangganError || !pelanggan) {
    return jsonResponse({ error: "Pelanggan tidak ditemukan" }, 404);
  }

  // Pelanggan boleh sudah punya Username Mikrotik sebelumnya -- Admin/
  // Pemilik boleh mengubahnya (typo, koreksi, dst). Secret LAMA di Mikrotik
  // (kalau username-nya beda dari sebelumnya) sengaja TIDAK ikut
  // diubah/dihapus di sini -- cuma link pelanggan.mikrotik_username yang
  // pindah ke username baru, biar tidak ada penghapusan konfigurasi router
  // yang terjadi diam-diam dari app.
  const previousUsername = pelanggan.mikrotik_username as string | null;

  const mikrotikProfile = (pelanggan.paket as { mikrotik_profile: string | null } | null)
    ?.mikrotik_profile;
  if (!mikrotikProfile) {
    return jsonResponse(
      {
        error:
          "Paket Pelanggan ini belum ada Nama Profile Mikrotik-nya. Set dulu kolom mikrotik_profile Paket-nya.",
      },
      400
    );
  }

  const result = await createOrLinkMikrotikSecret(trimmedUsername, mikrotikProfile);
  if (!result.success) {
    return jsonResponse({ error: result.error }, 502);
  }

  const { error: updateError } = await adminClient
    .from("pelanggan")
    .update({ mikrotik_username: trimmedUsername })
    .eq("id", pelangganId);

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500);
  }

  const renamedFrom =
    previousUsername && previousUsername !== trimmedUsername ? previousUsername : null;

  return jsonResponse({ success: true, linked: result.linked, renamedFrom }, 200);
});
