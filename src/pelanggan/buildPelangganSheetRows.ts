import type { PelangganExportRow } from "./listPelangganForExport";

export type PelangganSheetRow = {
  Nama: string;
  Alamat: string;
  Paket: string;
  Harga: number;
  "Nomor Telepon": string;
  Status: string;
};

// Baris polos siap-tulis buat sheet Excel -- dipisah dari
// exportPelangganExcel.ts (yang butuh xlsx/expo-file-system/expo-sharing)
// supaya bagian pemetaan datanya bisa dites tanpa nyangkut dependency
// platform.
export function buildPelangganSheetRows(rows: PelangganExportRow[]): PelangganSheetRow[] {
  return rows.map((row) => ({
    Nama: row.nama,
    Alamat: row.alamat,
    Paket: row.paketNama ?? "-",
    Harga: row.harga ?? 0,
    "Nomor Telepon": row.noHp,
    Status: row.status,
  }));
}
