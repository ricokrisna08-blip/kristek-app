// Edge Function: mikrotik-delete-secret
//
// Hapus PPP secret satu Pelanggan di Mikrotik RouterOS v7 REST API (DELETE
// .../rest/ppp/secret/{id}), dipanggil dari app oleh Pemilik SEBELUM baris
// Pelanggan-nya sendiri dihapus dari database (lihat deletePelanggan.ts) --
// supaya "Hapus Pelanggan" di app juga ke-reflect ke Mikrotik, bukan cuma
// hilang dari app sementara koneksi PPPoE-nya masih aktif selamanya di
// router.
//
// Kalau Pelanggan ini belum pernah punya Username Mikrotik, function ini
// no-op (sukses, tidak ada yang perlu dihapus) -- bukan error.
//
// HARUS jadi Edge Function (bukan kode di app) karena butuh kredensial API
// Mikrotik (MIKROTIK_HOST, MIKROTIK_API_USER, MIKROTIK_API_PASSWORD,
// MIKROTIK_CA_CERT), yang tidak boleh ada di bundle mobile.
//
// Cara deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> nama "mikrotik-delete-secret" -> paste isi file ini -> Deploy. Pakai
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

async function deleteMikrotikSecret(
  mikrotikUsername: string
): Promise<{ success: true } | { success: false; error: string }> {
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
      // Sudah tidak ada di router (mungkin sudah dihapus manual duluan) --
      // tidak masalah, tujuan akhirnya (secret tidak ada) sudah tercapai.
      return { success: true };
    }

    const secretId = matches[0][".id"];
    const deleteRes = await fetch(`https://${host}/rest/ppp/secret/${secretId}`, {
      method: "DELETE",
      headers: { Authorization: auth },
      signal: AbortSignal.timeout(MIKROTIK_TIMEOUT_MS),
      client,
    });

    if (!deleteRes.ok) {
      const detail = await deleteRes.text().catch(() => "");
      return {
        success: false,
        error: `Gagal menghapus PPP secret di Mikrotik (${deleteRes.status})${detail ? `: ${detail}` : ""}.`,
      };
    }

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
    return jsonResponse({ error: "Hanya Pemilik yang boleh menghapus Pelanggan" }, 403);
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
    return jsonResponse({ success: true, deleted: false }, 200);
  }

  const result = await deleteMikrotikSecret(pelanggan.mikrotik_username);
  if (!result.success) {
    return jsonResponse({ error: result.error }, 502);
  }

  return jsonResponse({ success: true, deleted: true }, 200);
});
