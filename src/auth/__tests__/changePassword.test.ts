import type { SupabaseClient } from "@supabase/supabase-js";
import { changePassword } from "../changePassword";

function fakeClient(updateUser: (opts: unknown) => Promise<any>): SupabaseClient {
  return { auth: { updateUser } } as unknown as SupabaseClient;
}

test("a valid matching new password updates the current user and reports success", async () => {
  const updateUser = jest.fn().mockResolvedValue({ data: {}, error: null });
  const client = fakeClient(updateUser);

  const result = await changePassword(client, "newpassword123", "newpassword123");

  expect(updateUser).toHaveBeenCalledWith({ password: "newpassword123" });
  expect(result).toEqual({ success: true });
});

test("a password shorter than 6 characters is rejected before calling Supabase", async () => {
  const updateUser = jest.fn();
  const client = fakeClient(updateUser);

  const result = await changePassword(client, "abc", "abc");

  expect(updateUser).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Password baru minimal 6 karakter.",
  });
});

test("a confirmation that doesn't match the new password is rejected before calling Supabase", async () => {
  const updateUser = jest.fn();
  const client = fakeClient(updateUser);

  const result = await changePassword(client, "newpassword123", "somethingelse");

  expect(updateUser).not.toHaveBeenCalled();
  expect(result).toEqual({
    success: false,
    error: "Konfirmasi password tidak cocok.",
  });
});

test("an error from Supabase is surfaced to the caller", async () => {
  const updateUser = jest.fn().mockResolvedValue({
    data: null,
    error: { message: "Auth session missing" },
  });
  const client = fakeClient(updateUser);

  const result = await changePassword(client, "newpassword123", "newpassword123");

  expect(result).toEqual({
    success: false,
    error: "Auth session missing",
  });
});
