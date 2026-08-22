import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteAccount } from "../deleteAccount";

function fakeClient(invoke: (name: string, opts: unknown) => Promise<any>): SupabaseClient {
  return { functions: { invoke } } as unknown as SupabaseClient;
}

test("calls the delete-account function with the target id and reports success", async () => {
  const invoke = jest.fn().mockResolvedValue({ data: { success: true }, error: null });
  const client = fakeClient(invoke);

  const result = await deleteAccount(client, "user-1");

  expect(invoke).toHaveBeenCalledWith("delete-account", {
    body: { targetUserId: "user-1" },
  });
  expect(result).toEqual({ success: true });
});

test("a non-2xx Edge Function response (e.g. account has Tiket history) surfaces the real message from the response body", async () => {
  // Ini bagaimana Supabase JS BENERAN membungkus response non-2xx --
  // `error` diisi (FunctionsHttpError), `data` null, dan body asli si
  // Edge Function cuma bisa diambil lewat error.context.json().
  const invoke = jest.fn().mockResolvedValue({
    data: null,
    error: {
      context: {
        json: async () => ({
          error: "Akun ini masih punya riwayat Tiket, tidak bisa dihapus.",
        }),
      },
    },
  });
  const client = fakeClient(invoke);

  const result = await deleteAccount(client, "user-1");

  expect(result).toEqual({
    success: false,
    error: "Akun ini masih punya riwayat Tiket, tidak bisa dihapus.",
  });
});

test("a network/invoke-level error with no readable body returns a clear generic message", async () => {
  const invoke = jest.fn().mockResolvedValue({
    data: null,
    error: { message: "network error" },
  });
  const client = fakeClient(invoke);

  const result = await deleteAccount(client, "user-1");

  expect(result).toEqual({
    success: false,
    error: "Gagal menghapus akun. Coba lagi.",
  });
});
