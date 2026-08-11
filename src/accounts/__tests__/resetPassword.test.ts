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

test("a function-level error (e.g. caller isn't Pemilik) surfaces that message", async () => {
  const invoke = jest.fn().mockResolvedValue({
    data: { error: "Hanya Pemilik yang boleh reset password" },
    error: null,
  });
  const client = fakeClient(invoke);

  const result = await resetPassword(client, "user-1", "newpassword123");

  expect(result).toEqual({
    success: false,
    error: "Hanya Pemilik yang boleh reset password",
  });
});

test("a network/invoke-level error returns a clear generic message", async () => {
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
