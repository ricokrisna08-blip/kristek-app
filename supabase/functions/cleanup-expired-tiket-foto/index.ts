// Edge Function: cleanup-expired-tiket-foto
//
// Menghapus foto Tiket (before/after) yang sudah lebih dari 7 hari -- baik
// file di Storage maupun baris tiket_foto-nya. Dijadwalkan berjalan
// otomatis tiap hari lewat Supabase Dashboard -> Cron Jobs (lihat DEPLOY.md
// di folder ini).
//
// HARUS jadi Edge Function (bukan kode di app) karena hapus permanen di
// Storage lintas SEMUA Tiket butuh service_role key, dan harus jalan
// otomatis lewat jadwal tanpa ada user yang login.
//
// Cara deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> nama "cleanup-expired-tiket-foto" -> paste isi file ini -> Deploy.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RETENTION_DAYS = 7;
const PHOTO_BUCKET = "tiket-foto";

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  return atob(padded);
}

// Supabase's Edge Runtime sudah memverifikasi tanda tangan JWT di header
// Authorization SEBELUM kode ini dijalankan (verify_jwt default-nya
// aktif) -- jadi begitu kita sampai di sini, token-nya sudah pasti asli
// terbitan Supabase untuk project ini. Kita cuma perlu baca klaim
// "role"-nya, bukan bandingin string mentah ke env var (itu yang bikin
// gampang meleset gara-gara karakter tak kasat mata saat copy-paste).
function isServiceRoleJwt(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length).trim();
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    return payload.role === "service_role";
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  // Cuma boleh dipanggil pakai service_role key sebagai Authorization
  // header -- lihat DEPLOY.md.
  const authHeader = req.headers.get("Authorization");
  if (!isServiceRoleJwt(authHeader)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const cutoff = new Date(
    Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  // Cuma before/after (referensi kerja sementara) yang kena retensi ini.
  // Checklist bukti Instalasi/Laporan Pelanggan (redaman/ont/kabel_jalur)
  // itu arsip permanen -- jangan ikut kehapus.
  const { data: expired, error: fetchError } = await adminClient
    .from("tiket_foto")
    .select("id, path")
    .lt("uploaded_at", cutoff)
    .in("type", ["before", "after"]);

  if (fetchError) {
    return jsonResponse({ error: fetchError.message }, 500);
  }

  if (!expired || expired.length === 0) {
    return jsonResponse({ deleted: 0 }, 200);
  }

  const paths = expired
    .filter((foto): foto is { id: string; path: string } => Boolean(foto.path))
    .map((foto) => foto.path);

  if (paths.length > 0) {
    await adminClient.storage.from(PHOTO_BUCKET).remove(paths);
  }

  const { error: deleteError } = await adminClient
    .from("tiket_foto")
    .delete()
    .in(
      "id",
      expired.map((foto) => foto.id)
    );

  if (deleteError) {
    return jsonResponse({ error: deleteError.message }, 500);
  }

  return jsonResponse({ deleted: expired.length }, 200);
});
