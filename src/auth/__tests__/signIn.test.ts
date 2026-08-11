import type { SupabaseClient } from "@supabase/supabase-js";
import { signIn } from "../signIn";

function fakeClient(
  signInWithPassword: SupabaseClient["auth"]["signInWithPassword"]
): SupabaseClient {
  return { auth: { signInWithPassword } } as unknown as SupabaseClient;
}

test("valid credentials return a session for the derived internal email", async () => {
  const signInWithPassword = jest.fn().mockResolvedValue({
    data: { user: { id: "user-1" }, session: {} },
    error: null,
  });
  const client = fakeClient(signInWithPassword);

  const result = await signIn(client, "teknisi01", "correct-password");

  expect(signInWithPassword).toHaveBeenCalledWith({
    email: "teknisi01@internal.kristek.app",
    password: "correct-password",
  });
  expect(result).toEqual({ success: true, userId: "user-1" });
});

test("invalid credentials return a clear error instead of throwing", async () => {
  const signInWithPassword = jest.fn().mockResolvedValue({
    data: { user: null, session: null },
    error: { message: "Invalid login credentials" },
  });
  const client = fakeClient(signInWithPassword);

  const result = await signIn(client, "teknisi01", "wrong-password");

  expect(result).toEqual({
    success: false,
    error: "Username atau password salah",
  });
});
