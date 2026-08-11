export type TiketStatus =
  | "baru"
  | "ditugaskan"
  | "dikerjakan"
  | "pending"
  | "selesai"
  | "dibatalkan";

export type TiketMachineState = {
  status: TiketStatus;
};

export type TiketEvent =
  | { type: "start"; hasBeforePhoto: boolean }
  | { type: "pending"; notes: string }
  | { type: "lanjut" }
  | { type: "end"; hasAfterPhoto: boolean }
  | { type: "batalkan" };

export type ApplyEventResult =
  | { valid: true; newStatus: TiketStatus }
  | { valid: false; error: string };

export function applyTiketEvent(
  state: TiketMachineState,
  event: TiketEvent
): ApplyEventResult {
  switch (event.type) {
    case "start": {
      if (state.status !== "ditugaskan") {
        return {
          valid: false,
          error: "Tiket harus berstatus Ditugaskan untuk bisa di-Start.",
        };
      }
      if (!event.hasBeforePhoto) {
        return {
          valid: false,
          error: 'Foto "before" wajib diunggah sebelum menekan Start.',
        };
      }
      return { valid: true, newStatus: "dikerjakan" };
    }
    case "pending": {
      if (state.status !== "dikerjakan") {
        return {
          valid: false,
          error: "Tiket harus berstatus Dikerjakan untuk bisa ditandai Pending.",
        };
      }
      if (!event.notes.trim()) {
        return {
          valid: false,
          error: "Catatan wajib diisi saat menandai Tiket Pending.",
        };
      }
      return { valid: true, newStatus: "pending" };
    }
    case "lanjut": {
      if (state.status !== "pending") {
        return {
          valid: false,
          error: "Tiket harus berstatus Pending untuk bisa dilanjutkan.",
        };
      }
      return { valid: true, newStatus: "dikerjakan" };
    }
    case "end": {
      if (state.status !== "dikerjakan") {
        return {
          valid: false,
          error: "Tiket harus berstatus Dikerjakan untuk bisa di-End.",
        };
      }
      if (!event.hasAfterPhoto) {
        return {
          valid: false,
          error: 'Foto "after" wajib diunggah sebelum menekan End.',
        };
      }
      return { valid: true, newStatus: "selesai" };
    }
    case "batalkan": {
      if (state.status === "selesai" || state.status === "dibatalkan") {
        return {
          valid: false,
          error: "Tiket yang sudah Selesai atau Dibatalkan tidak bisa dibatalkan lagi.",
        };
      }
      return { valid: true, newStatus: "dibatalkan" };
    }
  }
}
