import type { SupabaseClient } from "@supabase/supabase-js";
import { computeEvidenceStatus, countEvidenceComplete, EVIDENCE_ITEM_COUNT } from "./instalasiEvidence";

export type InstalasiEvidenceItem = {
  id: string;
  pelangganNama: string;
  nomorPelanggan: string;
  evidenceCount: number;
  updatedAt: string;
};

export { EVIDENCE_ITEM_COUNT as REQUIRED_EVIDENCE_COUNT };

// RLS pada tiket sudah membatasi Teknisi cuma bisa baca Tiket yang
// ditugaskan ke mereka sendiri (lihat migration 0006), jadi query ini
// otomatis cuma balikin Tiket milik Teknisi yang login. Instalasi &
// Laporan Pelanggan sama-sama pakai checklist bukti 4-item (lihat
// instalasiEvidence.ts) -- worklist ini gabungan keduanya.
export async function listInstalasiEvidence(
  client: SupabaseClient
): Promise<InstalasiEvidenceItem[]> {
  const { data: tikets, error } = await client
    .from("tiket")
    .select(
      `id, created_at, started_at, ended_at, evidence_lokasi_latitude,
       pelanggan:pelanggan_id ( nama, nomor_pelanggan )`
    )
    .in("jenis", ["instalasi", "gangguan_komplain"])
    .order("created_at", { ascending: false });

  if (error || !tikets || tikets.length === 0) {
    return [];
  }

  const tiketIds = tikets.map((row: any) => row.id);
  const { data: fotos } = await client
    .from("tiket_foto")
    .select("tiket_id, type")
    .in("tiket_id", tiketIds)
    .in("type", ["redaman", "ont", "kabel_jalur"]);

  const fotoTypesByTiket = new Map<string, string[]>();
  for (const foto of (fotos ?? []) as { tiket_id: string; type: string }[]) {
    const list = fotoTypesByTiket.get(foto.tiket_id) ?? [];
    list.push(foto.type);
    fotoTypesByTiket.set(foto.tiket_id, list);
  }

  return tikets.map((row: any) => {
    const status = computeEvidenceStatus({
      fotoTypes: fotoTypesByTiket.get(row.id) ?? [],
      hasLokasi: row.evidence_lokasi_latitude != null,
    });

    return {
      id: row.id,
      pelangganNama: row.pelanggan?.nama ?? "Pelanggan tidak diketahui",
      nomorPelanggan: row.pelanggan?.nomor_pelanggan ?? "-",
      evidenceCount: countEvidenceComplete(status),
      updatedAt: row.ended_at ?? row.started_at ?? row.created_at,
    };
  });
}
