// Edge Function: mark-sudah-bayar
//
// Set status "Sudah Bayar Bulan Ini" (true/false) untuk satu Pelanggan.
// Dipanggil dari layar detail Pelanggan oleh Admin atau Pemilik lewat
// checkbox "Sudah Bayar Bulan Ini".
//
// Kenapa harus Edge Function (bukan update tabel langsung dari app): kalau
// sudahBayar di-set true DAN Pelanggan itu sedang berstatus is_isolir,
// function ini otomatis mencabut isolir-nya juga lewat Mikrotik RouterOS
// REST API -- itu butuh kredensial Mikrotik yang tidak boleh ada di bundle
// mobile. Mengecek/uncheck status bayar TANPA kondisi isolir tetap cuma
// update kolom biasa, tapi tetap lewat sini biar satu jalur kode.
//
// Cara deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> nama "mark-sudah-bayar" -> paste isi file ini -> Deploy. Pakai secret
// Mikrotik yang sama seperti mikrotik-set-isolir (MIKROTIK_HOST,
// MIKROTIK_API_USER, MIKROTIK_API_PASSWORD, MIKROTIK_CA_CERT) -- kalau itu
// sudah di-set di project ini, tidak perlu diset ulang.

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

async function enableMikrotikSecret(
  mikrotikUsername: string
): Promise<{ success: true } | { success: false; error: string }> {
  const host = Deno.env.get("MIKROTIK_HOST");
  const user = Deno.env.get("MIKROTIK_API_USER");
  const password = Deno.env.get("MIKROTIK_API_PASSWORD");

  if (!host || !user || !password) {
    return { success: false, error: "Kredensial Mikrotik belum diset." };
  }

  const auth = "Basic " + btoa(`${user}:${password}`);
  const client = createMikrotikHttpClient();

  try {
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
    if (!matches || matches.length === 0) {
      return { success: false, error: `PPP secret "${mikrotikUsername}" tidak ditemukan.` };
    }

    const patchRes = await fetch(`https://${host}/rest/ppp/secret/${matches[0][".id"]}`, {
      method: "PATCH",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: "false" }),
      signal: AbortSignal.timeout(MIKROTIK_TIMEOUT_MS),
      client,
    });

    if (!patchRes.ok) {
      const detail = await patchRes.text().catch(() => "");
      return {
        success: false,
        error: `Gagal update Mikrotik (${patchRes.status})${detail ? `: ${detail}` : ""}.`,
      };
    }

    return { success: true };
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

  if (
    profileError ||
    !profile ||
    (profile.role !== "admin" && profile.role !== "pemilik")
  ) {
    return jsonResponse(
      { error: "Hanya Admin atau Pemilik yang boleh mengubah status bayar" },
      403
    );
  }

  let body: { pelangganId?: string; sudahBayar?: boolean };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body request tidak valid" }, 400);
  }

  const { pelangganId, sudahBayar } = body;
  if (!pelangganId || typeof sudahBayar !== "boolean") {
    return jsonResponse({ error: "Input tidak valid" }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: pelanggan, error: pelangganError } = await adminClient
    .from("pelanggan")
    .select("mikrotik_username, is_isolir")
    .eq("id", pelangganId)
    .single();

  if (pelangganError || !pelanggan) {
    return jsonResponse({ error: "Pelanggan tidak ditemukan" }, 404);
  }

  let isolirCleared = false;

  // Auto-cabut-isolir cuma kalau lagi ditandai Sudah Bayar DAN sebelumnya
  // memang berstatus isolir. Uncheck (sudahBayar=false) tidak pernah
  // memicu isolir otomatis di sini -- itu tetap urusan cron
  // mikrotik-daily-billing-cycle atau tombol Isolir manual.
  if (sudahBayar && pelanggan.is_isolir) {
    if (!pelanggan.mikrotik_username) {
      return jsonResponse(
        {
          error:
            "Pelanggan ini sedang terisolir tapi belum punya Username Mikrotik -- tidak bisa dicabut isolir otomatis. Set Username Mikrotik dulu atau cabut isolir manual.",
        },
        400
      );
    }

    const result = await enableMikrotikSecret(pelanggan.mikrotik_username);
    if (!result.success) {
      return jsonResponse({ error: result.error }, 502);
    }
    isolirCleared = true;
  }

  const { error: updateError } = await adminClient
    .from("pelanggan")
    .update({
      sudah_bayar_bulan_ini: sudahBayar,
      ...(isolirCleared ? { is_isolir: false, isolir_at: new Date().toISOString() } : {}),
    })
    .eq("id", pelangganId);

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500);
  }

  return jsonResponse({ success: true, isolirCleared }, 200);
});
