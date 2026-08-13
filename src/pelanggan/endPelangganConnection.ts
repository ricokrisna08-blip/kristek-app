import type { SupabaseClient } from "@supabase/supabase-js";

export type EndPelangganConnectionResult =
  | { success: true; endedCount: number }
  | { success: false; error: string };

const INVOKE_TIMEOUT_MS = 15_000;

export async function endPelangganConnection(
  client: SupabaseClient,
  pelangganId: string
): Promise<EndPelangganConnectionResult> {
  const { data, error } = await withTimeout(
    client.functions.invoke("mikrotik-end-connection", {
      body: { pelangganId },
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

  return { success: true, endedCount: (data?.endedCount as number) ?? 0 };
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
