import type { SupabaseClient } from "@supabase/supabase-js";

export type TiketDetail = {
  id: string;
  jenis: string;
  status: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  accumulatedPendingSeconds: number;
  keluhan: string | null;
  deskripsiPekerjaan: string | null;
  pelanggan: {
    nama: string;
    alamat: string;
    noHp: string;
    nomorPelanggan: string;
    odpLabel: string | null;
    paketNama: string | null;
    tanggalInstalasi: string | null;
    tagihanProrata: number | null;
  } | null;
  odp: { label: string; lokasi: string } | null;
  evidenceLokasi: { latitude: number; longitude: number; capturedAt: string } | null;
  teknisiList: { id: string; nama: string }[];
};

export async function getTiketDetail(
  client: SupabaseClient,
  tiketId: string
): Promise<TiketDetail | null> {
  const { data, error } = await client
    .from("tiket")
    .select(
      `id, jenis, status, created_at, started_at, ended_at,
       accumulated_pending_seconds, keluhan, deskripsi_pekerjaan,
       evidence_lokasi_latitude, evidence_lokasi_longitude, evidence_lokasi_captured_at,
       pelanggan:pelanggan_id ( nama, alamat, no_hp, nomor_pelanggan,
         tanggal_instalasi, tagihan_prorata,
         odp:odp_id ( label ),
         paket:paket_id ( nama )
       ),
       odp:odp_id ( label, lokasi ),
       tiket_teknisi ( teknisi_id, teknisi_nama_snapshot )`
    )
    .eq("id", tiketId)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as any;

  return {
    id: row.id,
    jenis: row.jenis,
    status: row.status,
    createdAt: row.created_at,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    accumulatedPendingSeconds: row.accumulated_pending_seconds ?? 0,
    keluhan: row.keluhan,
    deskripsiPekerjaan: row.deskripsi_pekerjaan,
    pelanggan: row.pelanggan
      ? {
          nama: row.pelanggan.nama,
          alamat: row.pelanggan.alamat,
          noHp: row.pelanggan.no_hp,
          nomorPelanggan: row.pelanggan.nomor_pelanggan,
          odpLabel: row.pelanggan.odp?.label ?? null,
          paketNama: row.pelanggan.paket?.nama ?? null,
          tanggalInstalasi: row.pelanggan.tanggal_instalasi ?? null,
          tagihanProrata: row.pelanggan.tagihan_prorata ?? null,
        }
      : null,
    odp: row.odp ? { label: row.odp.label, lokasi: row.odp.lokasi } : null,
    evidenceLokasi:
      row.evidence_lokasi_latitude != null && row.evidence_lokasi_longitude != null
        ? {
            latitude: row.evidence_lokasi_latitude,
            longitude: row.evidence_lokasi_longitude,
            capturedAt: row.evidence_lokasi_captured_at,
          }
        : null,
    teknisiList: (row.tiket_teknisi ?? []).map((tt: any) => ({
      id: tt.teknisi_id,
      nama: tt.teknisi_nama_snapshot ?? "Teknisi tidak diketahui",
    })),
  };
}
