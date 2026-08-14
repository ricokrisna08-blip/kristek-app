import type { SupabaseClient } from "@supabase/supabase-js";

export type CreateMikrotikSecretResult =
  | { success: true; linked: boolean; renamedFrom: string | null }
  | { success: false; error: string };

// Edge Function sendiri punya timeout ke Mikrotik (lihat index.ts-nya),
// tapi ini pengaman tambahan di sisi app -- kalau panggilan ke Edge
// Function-nya sendiri yang macet (bukan Mikrotik-nya), tombol di UI tetap
// nggak boleh nyangkut selamanya.
const INVOKE_TIMEOUT_MS = 15_000;

export async function createMikrotikSecret(
  client: SupabaseClient,
  pelangganId: string,
  mikrotikUsername: string
): Promise<CreateMikrotikSecretResult> {
  const { data, error } = await withTimeout(
    client.functions.invoke("mikrotik-create-secret", {
      body: { pelangganId, mikrotikUsername },
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

  return {
    success: true,
    linked: Boolean(data?.linked),
    renamedFrom: (data?.renamedFrom as string | null) ?? null,
  };
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

// Supabase JS membungkus response non-2xx dari Edge Function jadi
// FunctionsHttpError, dengan body asli (termasuk pesan error kita) cuma
// bisa diakses lewat error.context (objek Response), bukan lewat `data`.
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
