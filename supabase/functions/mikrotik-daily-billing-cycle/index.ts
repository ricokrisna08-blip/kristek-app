// Edge Function: mikrotik-daily-billing-cycle
//
// Dijadwalkan jalan otomatis tiap hari lewat Supabase Dashboard -> Cron
// Jobs (lihat DEPLOY.md di folder ini) -- TIDAK jalan sendiri sampai lo
// setup cron itu secara manual.
//
// Siklus billing KRISTEK: jatuh tempo tanggal 3, masa tenggang sampai
// tanggal 6, isolir kalau belum bayar per tanggal 7 jam 00:00 WIB.
//
// Tanggal 7-14 (waktu Asia/Jakarta): Pelanggan yang `sudah_bayar_bulan_ini`
// masih false dan belum di-isolir, dan punya `mikrotik_username` ke-set,
// di-isolir lewat Mikrotik RouterOS v7 REST API. Jendela 7-14 (bukan cuma
// tanggal 7 doang) supaya kalau cron sempat gagal jalan tanggal 7 persis,
// masih ke-tangkep di hari-hari berikutnya sebelum reset tanggal 15
// (idempotent -- Pelanggan yang sudah is_isolir=true dilewati).
// Tanggal 15: SEBELUM reset, snapshot angka bulan yang baru saja berjalan
// (Total User, Omset, Sudah Bayar, Belum Bayar) ke tabel `laporan_bulanan`
// -- ini yang bikin Laporan Keuangan Pemilik otomatis nambah baris baru
// tiap bulan tanpa kerja manual. Baru setelah itu, reset
// `sudah_bayar_bulan_ini` ke false untuk semua Pelanggan -- bukan awal
// siklus baru, tapi mengosongkan status "Sudah Bayar" bulan ini supaya
// siap dipakai lagi buat siklus jatuh-tempo-tanggal-3 berikutnya
// (Pelanggan yang sempat dicentang lunas bulan ini tetap kelihatan lunas
// sampai tanggal 15, baru habis itu di-reset). Di titik yang sama,
// `tagihan_prorata` (tagihan bulan pertama Pelanggan baru, lihat
// computeProrata.ts) juga dikosongkan untuk semua Pelanggan yang masih
// punya nilainya -- prorata cuma berlaku 1 siklus, jadi begitu siklus itu
// lewat, Pelanggan itu balik ditagih harga normal.
//
// HARUS jadi Edge Function (bukan kode di app) karena butuh service_role
// key (baca/tulis lintas semua Pelanggan tanpa user login) dan kredensial
// API Mikrotik, dua-duanya tidak boleh ada di bundle mobile.
//
// Cara deploy: Supabase Dashboard -> Edge Functions -> Create a new function
// -> nama "mikrotik-daily-billing-cycle" -> paste isi file ini -> Deploy,
// lalu ikuti DEPLOY.md di folder ini untuk set secret Mikrotik dan
// jadwalkan cron-nya. TIDAK ada isolir yang terjadi sampai kedua langkah
// itu lo lakukan sendiri.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Lihat catatan yang sama di mikrotik-set-isolir: tanpa timeout, satu
// Pelanggan yang router-nya tidak terjangkau bisa bikin seluruh loop
// isolir macet, bukan cuma gagal buat Pelanggan itu.
const MIKROTIK_TIMEOUT_MS = 10_000;

// Sama seperti mikrotik-set-isolir: certificate www-ssl di RouterOS
// self-signed, jadi harus dipercaya eksplisit lewat MIKROTIK_CA_CERT.
function createMikrotikHttpClient(): Deno.HttpClient | undefined {
  const caCert = Deno.env.get("MIKROTIK_CA_CERT");
  if (!caCert) return undefined;
  return Deno.createHttpClient({ caCerts: [caCert] });
}

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

// Sama seperti cleanup-expired-tiket-foto: Edge Runtime sudah memverifikasi
// tanda tangan JWT sebelum kode ini jalan, jadi cukup baca klaim "role".
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

function jakartaDayOfMonth(): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
  }).formatToParts(new Date());
  const day = parts.find((p) => p.type === "day")?.value;
  return day ? parseInt(day, 10) : new Date().getDate();
}

// Tanggal 1 dari bulan berjalan (waktu Asia/Jakarta), format "YYYY-MM-01"
// -- dipakai sebagai kunci `periode` di laporan_bulanan.
function jakartaCurrentPeriode(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}-01`;
}

async function setMikrotikSecretDisabled(
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
      {
        headers: { Authorization: auth },
        signal: AbortSignal.timeout(MIKROTIK_TIMEOUT_MS),
        client,
      }
    );
    if (!lookupRes.ok) {
      return { success: false, error: `Gagal menghubungi Mikrotik (${lookupRes.status}).` };
    }

    const matches = (await lookupRes.json()) as Array<{ ".id": string }>;
    if (!matches || matches.length === 0) {
      return { success: false, error: `PPP secret "${mikrotikUsername}" tidak ditemukan.` };
    }

    const patchRes = await fetch(`https://${host}/rest/ppp/secret/${matches[0][".id"]}`, {
      method: "PATCH",
      headers: { Authorization: auth, "Content-Type": "application/json" },
      body: JSON.stringify({ disabled: "true" }),
      signal: AbortSignal.timeout(MIKROTIK_TIMEOUT_MS),
      client,
    });

    if (!patchRes.ok) {
      return { success: false, error: `Gagal update Mikrotik (${patchRes.status}).` };
    }

    // Sama seperti mikrotik-set-isolir: disable secret cuma mencegah
    // koneksi baru, sesi yang sudah aktif harus diputus terpisah biar
    // isolir beneran langsung berlaku, bukan nunggu pelanggan disconnect
    // sendiri.
    const activeRes = await fetch(
      `https://${host}/rest/ppp/active?name=${encodeURIComponent(mikrotikUsername)}`,
      { headers: { Authorization: auth }, signal: AbortSignal.timeout(MIKROTIK_TIMEOUT_MS), client }
    );

    if (activeRes.ok) {
      const activeSessions = (await activeRes.json()) as Array<{ ".id": string }>;
      for (const session of activeSessions) {
        await fetch(`https://${host}/rest/ppp/active/${session[".id"]}`, {
          method: "DELETE",
          headers: { Authorization: auth },
          signal: AbortSignal.timeout(MIKROTIK_TIMEOUT_MS),
          client,
        }).catch(() => {
          // Secret sudah ke-disable (yang utama) -- gagal mutus sesi aktif
          // bukan alasan menganggap isolir Pelanggan ini gagal total.
        });
      }
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
  const authHeader = req.headers.get("Authorization");
  if (!isServiceRoleJwt(authHeader)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const dayOfMonth = jakartaDayOfMonth();

  if (dayOfMonth === 15) {
    const { data: semuaPelanggan, error: snapshotFetchError } = await adminClient
      .from("pelanggan")
      .select("harga, sudah_bayar_bulan_ini");

    if (snapshotFetchError) {
      return jsonResponse({ error: snapshotFetchError.message }, 500);
    }

    const totalUser = semuaPelanggan?.length ?? 0;
    let omset = 0;
    let sudahBayar = 0;
    let belumBayar = 0;
    for (const p of semuaPelanggan ?? []) {
      const harga = p.harga ?? 0;
      omset += harga;
      if (p.sudah_bayar_bulan_ini) {
        sudahBayar += harga;
      } else {
        belumBayar += harga;
      }
    }

    // upsert (bukan insert biasa) -- kalau cron ini kebetulan jalan lebih
    // dari sekali di tanggal 15 (retry, dsb.), snapshot bulan ini cuma
    // ke-update ulang, bukan bikin baris duplikat.
    const { error: snapshotError } = await adminClient
      .from("laporan_bulanan")
      .upsert(
        {
          periode: jakartaCurrentPeriode(),
          total_user: totalUser,
          omset,
          sudah_bayar: sudahBayar,
          belum_bayar: belumBayar,
        },
        { onConflict: "periode" }
      );

    if (snapshotError) {
      return jsonResponse({ error: snapshotError.message }, 500);
    }

    const { error: resetError, count } = await adminClient
      .from("pelanggan")
      .update({ sudah_bayar_bulan_ini: false }, { count: "exact" })
      .eq("sudah_bayar_bulan_ini", true);

    if (resetError) {
      return jsonResponse({ error: resetError.message }, 500);
    }

    // Tagihan bulan pertama (prorata) cuma berlaku buat SATU siklus --
    // begitu siklus itu lewat (tanggal 15 ini nandain akhir siklus
    // berjalan), Pelanggan baru masuk siklus normal jadi tagihan_prorata
    // dikosongkan supaya blast WA bulan depan pakai harga normal, bukan
    // prorata lagi (lihat computeProrata.ts).
    const { error: prorataResetError } = await adminClient
      .from("pelanggan")
      .update({ tagihan_prorata: null })
      .not("tagihan_prorata", "is", null);

    if (prorataResetError) {
      return jsonResponse({ error: prorataResetError.message }, 500);
    }

    return jsonResponse(
      { action: "reset", resetCount: count ?? 0, snapshot: { totalUser, omset, sudahBayar, belumBayar } },
      200
    );
  }

  if (dayOfMonth < 7 || dayOfMonth > 14) {
    return jsonResponse({ action: "none", reason: "outside jendela isolir (7-14)" }, 200);
  }

  const { data: belumBayar, error: fetchError } = await adminClient
    .from("pelanggan")
    .select("id, mikrotik_username")
    .eq("sudah_bayar_bulan_ini", false)
    .eq("is_isolir", false)
    .not("mikrotik_username", "is", null);

  if (fetchError) {
    return jsonResponse({ error: fetchError.message }, 500);
  }

  if (!belumBayar || belumBayar.length === 0) {
    return jsonResponse({ action: "isolir", isolirCount: 0, failed: [] }, 200);
  }

  const failed: Array<{ pelangganId: string; error: string }> = [];
  let isolirCount = 0;

  for (const pelanggan of belumBayar) {
    const result = await setMikrotikSecretDisabled(pelanggan.mikrotik_username as string);
    if (!result.success) {
      failed.push({ pelangganId: pelanggan.id, error: result.error });
      continue;
    }

    const { error: updateError } = await adminClient
      .from("pelanggan")
      .update({ is_isolir: true, isolir_at: new Date().toISOString() })
      .eq("id", pelanggan.id);

    if (updateError) {
      failed.push({ pelangganId: pelanggan.id, error: updateError.message });
      continue;
    }

    isolirCount += 1;
  }

  return jsonResponse({ action: "isolir", isolirCount, failed }, 200);
});
