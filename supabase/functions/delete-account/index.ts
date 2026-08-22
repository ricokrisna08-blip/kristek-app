// Edge Function: delete-account
//
// Hanya Pemilik yang boleh menghapus akun Admin/Teknisi. Ini HARUS jadi
// Edge Function (bukan kode di app) karena aksi ini butuh service_role key
// untuk benar-benar menghapus akun Auth-nya (bukan cuma baris profil),
// supaya username/password lama itu benar-benar tidak bisa dipakai login
// lagi.
//
// Sebelum menghapus, function ini cek dulu apakah akun itu masih punya
// Tiket yang BELUM final (bukan "selesai"/"dibatalkan") -- baik sebagai
// pembuat maupun sebagai Teknisi yang ditugaskan. Kalau semua Tiket-nya
// sudah final, akun boleh dihapus -- histori Tiket lama tetap aman
// karena FK ke users sudah dilepas & nama Teknisi di-snapshot terpisah
// (lihat migration 20260822000000_relax_user_fk_for_account_deletion.sql
// dan kolom tiket_teknisi.teknisi_nama_snapshot /
// pengajuan_cuti.teknisi_nama_snapshot).
//
// Cara deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> nama "delete-account" -> paste isi file ini -> Deploy.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  const { data: callerProfile, error: callerProfileError } = await callerClient
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (callerProfileError || !callerProfile || callerProfile.role !== "pemilik") {
    return jsonResponse({ error: "Hanya Pemilik yang boleh menghapus akun" }, 403);
  }

  let body: { targetUserId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Body request tidak valid" }, 400);
  }

  const { targetUserId } = body;
  if (!targetUserId) {
    return jsonResponse({ error: "Input tidak valid" }, 400);
  }

  // adminClient bypass RLS -- dipakai untuk cek riwayat & hapus akun,
  // service_role HANYA dipakai di sini, tidak pernah dikirim ke app.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: targetProfile } = await adminClient
    .from("users")
    .select("role")
    .eq("id", targetUserId)
    .single();

  if (!targetProfile) {
    return jsonResponse({ error: "Akun tidak ditemukan" }, 404);
  }
  if (targetProfile.role === "pemilik") {
    return jsonResponse({ error: "Akun Pemilik tidak bisa dihapus lewat sini" }, 400);
  }

  const FINAL_STATUSES = ["selesai", "dibatalkan"];

  const [tiketDibuat, tiketDitugaskan] = await Promise.all([
    adminClient.from("tiket").select("id, status").eq("created_by", targetUserId),
    adminClient
      .from("tiket_teknisi")
      .select("tiket:tiket_id ( status )")
      .eq("teknisi_id", targetUserId),
  ]);

  const hasActiveTiketDibuat = (tiketDibuat.data ?? []).some(
    (row: { status: string }) => !FINAL_STATUSES.includes(row.status)
  );
  const hasActiveTiketDitugaskan = (tiketDitugaskan.data ?? []).some(
    (row: { tiket: { status: string } | null }) =>
      row.tiket && !FINAL_STATUSES.includes(row.tiket.status)
  );

  if (hasActiveTiketDibuat || hasActiveTiketDitugaskan) {
    return jsonResponse(
      {
        error:
          "Akun ini masih punya Tiket yang belum selesai (ditugaskan/dikerjakan/pending), tidak bisa dihapus.",
      },
      400
    );
  }

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);
  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500);
  }

  return jsonResponse({ success: true }, 200);
});
