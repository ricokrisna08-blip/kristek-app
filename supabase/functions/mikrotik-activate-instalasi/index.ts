// Edge Function: mikrotik-activate-instalasi
//
// Aktifkan (enable) PPP secret Pelanggan di Mikrotik begitu Tiket Instalasi
// mereka selesai dikerjakan Teknisi -- dipanggil otomatis dari
// endTiketWithEvidence.ts setelah Tiket berhasil di-set status "selesai".
// Sebelum ini, secret Pelanggan baru dibuat NONAKTIF dari awal (lihat
// mikrotik-create-secret, dipanggil dengan disabled: true khusus dari alur
// Tiket Instalasi baru di createTiketWithAssignment.ts) -- supaya Pelanggan
// tidak bisa konek sebelum instalasi fisiknya beneran dikonfirmasi kelar.
//
// Otorisasi: caller cukup authenticated (session valid), tidak dibatasi
// role tertentu -- yang benar-benar jadi gerbang keamanan di sini adalah
// syarat tiket.status === 'selesai' DAN tiket.jenis === 'instalasi' (dicek
// dari DB pakai service_role, bukan dipercaya dari input). Status "selesai"
// itu sendiri cuma bisa dicapai lewat jalur endTiketWithEvidence.ts yang
// sudah dijaga RLS/state machine Tiket -- jadi function ini tidak bisa
// dipakai buat mengaktifkan Pelanggan mana pun di luar itu, dan cuma pernah
// nge-PATCH disabled:false (enable), tidak pernah men-disable.
//
// Sengaja TIDAK menyentuh kolom is_isolir/isolir_at -- itu konsep terpisah
// (isolir karena belum bayar), bukan "belum dikonfirmasi instalasi".
//
// HARUS jadi Edge Function (bukan kode di app) karena butuh kredensial API
// Mikrotik (MIKROTIK_HOST, MIKROTIK_API_USER, MIKROTIK_API_PASSWORD,
// MIKROTIK_CA_CERT), yang tidak boleh ada di bundle mobile.
//
// Cara deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> nama "mikrotik-activate-instalasi" -> paste isi file ini -> Deploy.
// Pakai secret Mikrotik yang sama seperti mikrotik-set-isolir (lihat
// DEPLOY.md di folder itu) -- tidak perlu diset ulang.

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
    return { success: false, error: "Kredensial Mikrotik belum diset (lihat DEPLOY.md)." };
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
      return {
        success: false,
        error: `PPP secret "${mikrotikUsername}" tidak ditemukan di Mikrotik.`,
      };
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

  let body: { tiketId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body request tidak valid" }, 400);
  }

  const { tiketId } = body;
  if (!tiketId) {
    return jsonResponse({ error: "Input tidak valid" }, 400);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: tiket, error: tiketError } = await adminClient
    .from("tiket")
    .select("status, jenis, pelanggan_id")
    .eq("id", tiketId)
    .single();

  if (tiketError || !tiket) {
    return jsonResponse({ error: "Tiket tidak ditemukan" }, 404);
  }

  if (tiket.jenis !== "instalasi" || tiket.status !== "selesai") {
    return jsonResponse(
      { error: "Tiket ini bukan Instalasi yang sudah selesai." },
      400
    );
  }

  const { data: pelanggan, error: pelangganError } = await adminClient
    .from("pelanggan")
    .select("mikrotik_username")
    .eq("id", tiket.pelanggan_id)
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

  const result = await enableMikrotikSecret(pelanggan.mikrotik_username);
  if (!result.success) {
    return jsonResponse({ error: result.error }, 502);
  }

  return jsonResponse({ success: true }, 200);
});
