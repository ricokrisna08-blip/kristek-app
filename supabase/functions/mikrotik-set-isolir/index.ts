// Edge Function: mikrotik-set-isolir
//
// Isolir/cabut-isolir manual satu Pelanggan lewat Mikrotik RouterOS v7 REST
// API (PATCH .../rest/ppp/secret/{id} { disabled: true|false }). Dipanggil
// langsung dari app oleh Pemilik lewat tombol Isolir/Cabut Isolir di layar
// detail Pelanggan.
//
// HARUS jadi Edge Function (bukan kode di app) karena butuh kredensial API
// Mikrotik (MIKROTIK_HOST, MIKROTIK_API_USER, MIKROTIK_API_PASSWORD), yang
// tidak boleh ada di bundle mobile.
//
// Cara deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> nama "mikrotik-set-isolir" -> paste isi file ini -> Deploy, lalu set
// secret MIKROTIK_HOST / MIKROTIK_API_USER / MIKROTIK_API_PASSWORD /
// MIKROTIK_CA_CERT lewat Edge Functions -> Secrets. Lihat DEPLOY.md di
// folder ini.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Tanpa timeout, fetch ke router yang tidak bisa dijangkau (port belum
// terbuka ke internet, firewall drop diam-diam, dll) akan menggantung
// sampai batas waktu Edge Function sendiri -- bikin tombol di app macet di
// "Memproses..." tanpa pernah dapat error yang jelas.
const MIKROTIK_TIMEOUT_MS = 10_000;

// Certificate www-ssl di RouterOS self-signed (bukan dari otoritas resmi
// seperti Let's Encrypt -- lo cuma punya IP publik, belum DDNS/domain buat
// Let's Encrypt). Tanpa ini, fetch bawaan Deno menolak koneksinya dengan
// error "UnknownIssuer". MIKROTIK_CA_CERT diisi dengan isi certificate CA
// (public, bukan private key -- lihat DEPLOY.md) supaya Deno tahu harus
// mempercayai certificate ini secara eksplisit.
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

async function setMikrotikSecretDisabled(
  mikrotikUsername: string,
  disabled: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  const host = Deno.env.get("MIKROTIK_HOST");
  const user = Deno.env.get("MIKROTIK_API_USER");
  const password = Deno.env.get("MIKROTIK_API_PASSWORD");

  if (!host || !user || !password) {
    return {
      success: false,
      error: "Kredensial Mikrotik belum diset (lihat DEPLOY.md).",
    };
  }

  const auth = "Basic " + btoa(`${user}:${password}`);
  const client = createMikrotikHttpClient();

  try {
    const lookupRes = await fetch(
      `https://${host}/rest/ppp/secret?name=${encodeURIComponent(mikrotikUsername)}`,
      {
        headers: { Authorization: auth },
        signal: AbortSignal.timeout(MIKROTIK_TIMEOUT_MS),
        client,
      }
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
      return {
        success: false,
        error: `PPP secret "${mikrotikUsername}" tidak ditemukan di Mikrotik.`,
      };
    }

    const secretId = matches[0][".id"];
    const patchRes = await fetch(`https://${host}/rest/ppp/secret/${secretId}`, {
      method: "PATCH",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: disabled ? "true" : "false" }),
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

    // Catatan: disable PPP secret cuma mencegah koneksi BARU -- sesi yang
    // sudah connect tetap jalan sampai diputus terpisah lewat tombol
    // "Putus Koneksi" (mikrotik-end-connection) atau disconnect sendiri.
    // Sengaja dipisah jadi 2 aksi berbeda, bukan digabung otomatis di sini.

    return { success: true };
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

  if (profileError || !profile || profile.role !== "pemilik") {
    return jsonResponse({ error: "Hanya Pemilik yang boleh mengubah status isolir" }, 403);
  }

  let body: { pelangganId?: string; isolir?: boolean };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body request tidak valid" }, 400);
  }

  const { pelangganId, isolir } = body;
  if (!pelangganId || typeof isolir !== "boolean") {
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

  const result = await setMikrotikSecretDisabled(pelanggan.mikrotik_username, isolir);
  if (!result.success) {
    return jsonResponse({ error: result.error }, 502);
  }

  const { error: updateError } = await adminClient
    .from("pelanggan")
    .update({ is_isolir: isolir, isolir_at: new Date().toISOString() })
    .eq("id", pelangganId);

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500);
  }

  return jsonResponse({ success: true }, 200);
});
