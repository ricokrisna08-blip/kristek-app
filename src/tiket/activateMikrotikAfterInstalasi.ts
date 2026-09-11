import type { SupabaseClient } from "@supabase/supabase-js";

export type ActivateMikrotikResult = { success: true } | { success: false; error: string };

const INVOKE_TIMEOUT_MS = 15_000;

// Dipanggil dari endTiketWithEvidence.ts setelah Tiket Instalasi berhasil
// di-set status "selesai" -- menyalakan PPP secret Pelanggan itu di
// Mikrotik (dibuat nonaktif dari awal, lihat createTiketWithAssignment.ts).
// Sengaja fire-with-warning (bukan fire-and-forget total): kalau gagal,
// Tiket-nya sendiri TETAP selesai (pekerjaan fisiknya memang sudah kelar),
// tapi pemanggil perlu tahu supaya bisa follow-up manual (mis. nyalain
// lewat toggle isolir di detail Pelanggan begitu Mikrotik-nya bisa
// dihubungi lagi).
export async function activateMikrotikAfterInstalasi(
  client: SupabaseClient,
  tiketId: string
): Promise<ActivateMikrotikResult> {
  const { data, error } = await withTimeout(
    client.functions.invoke("mikrotik-activate-instalasi", {
      body: { tiketId },
    }),
    INVOKE_TIMEOUT_MS
  ).catch((err: Error) => ({
    data: null,
    error: err.name === "TimeoutError" ? { timedOut: true } : err,
  }));

  if ((error as { timedOut?: boolean } | null)?.timedOut) {
    return {
      success: false,
      error: "Tidak ada respons dari server. Cek koneksi internet dan coba lagi.",
    };
  }

  if (error) {
    const detail = await readFunctionErrorMessage(error);
    return {
      success: false,
      error: detail ?? "Gagal menghubungi Mikrotik. Coba lagi.",
    };
  }

  if (data?.error) {
    return { success: false, error: data.error as string };
  }

  return { success: true };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new Error(`Timed out after ${ms}ms`);
      err.name = "TimeoutError";
      reject(err);
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function readFunctionErrorMessage(error: unknown): Promise<string | null> {
  const context = (error as { context?: Response } | null)?.context;
  if (!context || typeof context.json !== "function") return null;

  try {
    const body = await context.json();
    return typeof body?.error === "string" ? body.error : null;
  } catch {
    return null;
  }
}
