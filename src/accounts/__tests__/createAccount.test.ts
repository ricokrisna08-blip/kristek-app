import type { SupabaseClient } from "@supabase/supabase-js";
import { createAccount } from "../createAccount";

function fakeSignUpClient(
  signUp: SupabaseClient["auth"]["signUp"]
): SupabaseClient {
  return { auth: { signUp } } as unknown as SupabaseClient;
}

function fakeProfileClient(
  insert: (payload: unknown) => Promise<{ error: unknown }>
): SupabaseClient {
  return { from: () => ({ insert }) } as unknown as SupabaseClient;
}

test("valid input signs up on the throwaway client and inserts the profile on the caller's own (authorized) client", async () => {
  const signUp = jest
    .fn()
    .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  const insert = jest.fn().mockResolvedValue({ error: null });
  const signUpClient = fakeSignUpClient(signUp);
  const profileClient = fakeProfileClient(insert);

  const result = await createAccount(signUpClient, profileClient, {
    nama: "Budi",
    alamat: "Jl. Melati 1",
    noTelp: "081234567890",
    username: "budi01",
    password: "password123",
    role: "teknisi",
    wilayahId: "wilayah-1",
  });

  expect(signUp).toHaveBeenCalledWith({
    email: "budi01@internal.kristek.app",
    password: "password123",
  });
  expect(insert).toHaveBeenCalledWith({
    id: "user-1",
    nama: "Budi",
    alamat: "Jl. Melati 1",
    no_telp: "081234567890",
    username: "budi01",
    role: "teknisi",
    wilayah_id: "wilayah-1",
  });
  expect(result).toEqual({ success: true, userId: "user-1" });
});

test("a duplicate username surfaces a clear error instead of a raw DB error", async () => {
  const signUp = jest
    .fn()
    .mockResolvedValue({ data: { user: { id: "user-2" } }, error: null });
  const insert = jest.fn().mockResolvedValue({
    error: {
      code: "23505",
      message: "duplicate key value violates unique constraint",
    },
  });
  const signUpClient = fakeSignUpClient(signUp);
  const profileClient = fakeProfileClient(insert);

  const result = await createAccount(signUpClient, profileClient, {
    nama: "Budi Kedua",
    alamat: "Jl. Melati 2",
    noTelp: "081234567891",
    username: "budi01",
    password: "password123",
    role: "teknisi",
    wilayahId: "wilayah-1",
  });

  expect(result).toEqual({ success: false, error: "Username sudah dipakai" });
});

test("a signUp failure returns a clear error instead of crashing, without ever touching the profile client", async () => {
  const signUp = jest.fn().mockResolvedValue({
    data: { user: null },
    error: { message: "User already registered" },
  });
  const insert = jest.fn();
  const signUpClient = fakeSignUpClient(signUp);
  const profileClient = fakeProfileClient(insert);

  const result = await createAccount(signUpClient, profileClient, {
    nama: "Budi Ketiga",
    alamat: "Jl. Melati 3",
    noTelp: "081234567892",
    username: "budi01",
    password: "password123",
    role: "teknisi",
    wilayahId: "wilayah-1",
  });

  expect(insert).not.toHaveBeenCalled();
  expect(result).toEqual({ success: false, error: "Username sudah dipakai" });
});

test("the profile insert uses the caller's own client, not the throwaway signUp client", async () => {
  const signUp = jest
    .fn()
    .mockResolvedValue({ data: { user: { id: "user-3" } }, error: null });
  const signUpClientInsert = jest.fn();
  const profileClientInsert = jest.fn().mockResolvedValue({ error: null });

  const signUpClient = {
    auth: { signUp },
    from: () => ({ insert: signUpClientInsert }),
  } as unknown as SupabaseClient;
  const profileClient = fakeProfileClient(profileClientInsert);

  await createAccount(signUpClient, profileClient, {
    nama: "Budi Keempat",
    alamat: "Jl. Melati 4",
    noTelp: "081234567893",
    username: "budi04",
    password: "password123",
    role: "admin",
    wilayahId: "wilayah-1",
  });

  expect(signUpClientInsert).not.toHaveBeenCalled();
  expect(profileClientInsert).toHaveBeenCalledTimes(1);
});
