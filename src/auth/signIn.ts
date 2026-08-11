import type { SupabaseClient } from "@supabase/supabase-js";
import { usernameToEmail } from "./email";

export type SignInResult =
  | { success: true; userId: string }
  | { success: false; error: string };

export async function signIn(
  client: SupabaseClient,
  username: string,
  password: string
): Promise<SignInResult> {
  const email = usernameToEmail(username);
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { success: false, error: "Username atau password salah" };
  }

  return { success: true, userId: data.user.id };
}
