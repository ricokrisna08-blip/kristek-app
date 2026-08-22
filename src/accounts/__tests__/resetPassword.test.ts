import type { SupabaseClient } from "@supabase/supabase-js";
import { resetPassword } from "../resetPassword";

function fakeClient(invoke: (name: string, opts: unknown) => Promise<any>): SupabaseClient {
  return { functions: { invoke } } as unknown as SupabaseClient;
}

test("a valid new password calls the reset-password function and reports success", async () => {
  const invoke = jest.fn().mockResolvedValue({ data: { success: true }, error: null });
  const client = fakeClient(invoke);

  const result = await resetPassword(client, "user-1", "newpassword123");

  expect(invoke).toHaveBeenCalledWith("reset-password", {
    body: { targetUserId: "user-1", newPassword: "newpassword123" },
  });
  expect(result).toEqual({ success: true });
});

test("a password shorter than 6 characters is rejected before calling the function", async () => {
  const invoke = jest.fn();
  const client = fakeClient(invoke);

  const result = await resetPassword(client, "user-1", "abc");

  expect(invoke).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Password minimal 6 karakter",
  });
});

test("a non-2xx Edge Function response (e.g. caller isn't Pemilik) surfaces the real message from the response body", async () => {
  // Ini bagaimana Supabase JS BENERAN membungkus response non-2xx --
  // `error` diisi (FunctionsHttpError), `data` null, dan body asli si
  // Edge Function cuma bisa diambil lewat error.context.json().
  const invoke = jest.fn().mockResolvedValue({
    data: null,
    error: {
      context: {
        json: async () => ({ error: "Hanya Pemilik yang boleh reset password" }),
      },
    },
  });
  const client = fakeClient(invoke);

  const result = await resetPassword(client, "user-1", "newpassword123");

  expect(result).toEqual({
    success: false,
    error: "Hanya Pemilik yang boleh reset password",
  });
});

test("a network/invoke-level error with no readable body returns a clear generic message", async () => {
  const invoke = jest.fn().mockResolvedValue({
    data: null,
    error: { message: "network error" },
  });
  const client = fakeClient(invoke);

  const result = await resetPassword(client, "user-1", "newpassword123");

  expect(result).toEqual({
    success: false,
    error: "Gagal reset password. Coba lagi.",
  });
});
