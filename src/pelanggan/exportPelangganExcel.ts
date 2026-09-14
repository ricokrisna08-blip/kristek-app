import { Platform } from "react-native";
import * as XLSX from "xlsx";
import type { PelangganExportRow } from "./listPelangganForExport";
import { buildPelangganSheetRows } from "./buildPelangganSheetRows";

export type ExportPelangganExcelResult = { success: true } | { success: false; error: string };

const SHEET_COLUMN_WIDTHS = [
  { wch: 24 }, // Nama
  { wch: 32 }, // Alamat
  { wch: 18 }, // Paket
  { wch: 12 }, // Harga
  { wch: 16 }, // Nomor Telepon
  { wch: 10 }, // Status
];

const XLSX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function buildFileName(): string {
  const today = new Date().toISOString().slice(0, 10);
  return `Data Pelanggan KRISTEK ${today}.xlsx`;
}

function buildWorkbook(rows: PelangganExportRow[]): XLSX.WorkBook {
  const worksheet = XLSX.utils.json_to_sheet(buildPelangganSheetRows(rows));
  worksheet["!cols"] = SHEET_COLUMN_WIDTHS;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pelanggan");
  return workbook;
}

// Web: bikin Blob lalu trigger download lewat elemen <a> sementara --
// pola standar buat "download file" di browser, expo-file-system/
// expo-sharing tidak berlaku di web. Native: tulis ke cache directory
// dulu (expo-file-system nggak bisa langsung "download" ke folder publik
// tanpa permission tambahan), baru serahkan ke share sheet OS
// (expo-sharing) supaya Pemilik bisa pilih sendiri mau disimpan ke mana
// (Files, WhatsApp, Drive, dst).
export async function exportPelangganExcel(
  rows: PelangganExportRow[]
): Promise<ExportPelangganExcelResult> {
  if (rows.length === 0) {
    return { success: false, error: "Tidak ada data Pelanggan untuk diekspor." };
  }

  try {
    const workbook = buildWorkbook(rows);
    const fileName = buildFileName();

    if (Platform.OS === "web") {
      const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as Uint8Array;
      const blob = new Blob([bytes as BlobPart], { type: XLSX_MIME_TYPE });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true };
    }

    // expo-file-system tidak punya implementasi web sama sekali -- import
    // statis di top-level bikin seluruh app crash saat dibuka lewat
    // browser (lihat catatan yang sama di persistCapturedPhoto.ts).
    const { File, Paths } = await import("expo-file-system");
    const Sharing = await import("expo-sharing");

    const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as Uint8Array;
    const file = new File(Paths.cache, fileName);
    file.create({ overwrite: true });
    file.write(bytes);

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      return { success: false, error: "Fitur share tidak tersedia di perangkat ini." };
    }

    await Sharing.shareAsync(file.uri, {
      mimeType: XLSX_MIME_TYPE,
      dialogTitle: "Simpan Data Pelanggan",
      UTI: "org.openxmlformats.spreadsheetml.sheet",
    });

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal membuat file Excel. Coba lagi.",
    };
  }
}
