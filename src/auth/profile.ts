import type { SupabaseClient } from "@supabase/supabase-js";
import type { Role } from "../domain/types";

export type UserProfile = {
  id: string;
  nama: string;
  role: Role;
  wilayahId: string | null;
};

export async function fetchUserProfile(
  client: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await client
    .from("users")
    .select("id, nama, role, wilayah_id")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    nama: data.nama,
    role: data.role,
    wilayahId: data.wilayah_id,
  };
}
