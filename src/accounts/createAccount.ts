import type { SupabaseClient } from "@supabase/supabase-js";
import { usernameToEmail } from "../auth/email";
import type { Role } from "../domain/types";

export type NewAccountInput = {
  nama: string;
  alamat: string;
  noTelp: string;
  username: string;
  password: string;
  role: Extract<Role, "admin" | "teknisi" | "dc">;
  wilayahId: string;
};

export type CreateAccountResult =
  | { success: true; userId: string }
  | { success: false; error: string };

export async function createAccount(
  signUpClient: SupabaseClient,
  profileClient: SupabaseClient,
  input: NewAccountInput
): Promise<CreateAccountResult> {
  const email = usernameToEmail(input.username);

  const { data, error: signUpError } = await signUpClient.auth.signUp({
    email,
    password: input.password,
  });

  if (signUpError || !data.user) {
    const isDuplicateEmail = signUpError?.message
      ?.toLowerCase()
      .includes("already registered");
    return {
      success: false,
      error: isDuplicateEmail
        ? "Username sudah dipakai"
        : "Gagal membuat akun. Coba lagi.",
    };
  }

  const userId = data.user.id;

  const { error: profileError } = await profileClient.from("users").insert({
    id: userId,
    nama: input.nama,
    alamat: input.alamat,
    no_telp: input.noTelp,
    username: input.username,
    role: input.role,
    wilayah_id: input.wilayahId,
  });

  if (profileError) {
    const isDuplicateUsername =
      (profileError as { code?: string }).code === "23505";
    return {
      success: false,
      error: isDuplicateUsername
        ? "Username sudah dipakai"
        : "Gagal menyimpan profil akun. Coba lagi.",
    };
  }

  return { success: true, userId };
}
