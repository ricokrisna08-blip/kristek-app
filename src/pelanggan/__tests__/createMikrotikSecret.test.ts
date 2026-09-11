import type { SupabaseClient } from "@supabase/supabase-js";
import { createMikrotikSecret } from "../createMikrotikSecret";

function fakeClient(
  invokeResult: { data: unknown; error: unknown },
  onInvoke?: (body: unknown) => void
): SupabaseClient {
  return {
    functions: {
      invoke: (_name: string, opts: { body: unknown }) => {
        onInvoke?.(opts.body);
        return Promise.resolve(invokeResult);
      },
    },
  } as unknown as SupabaseClient;
}

test("succeeds and reports a newly-created secret", async () => {
  const client = fakeClient({
    data: { success: true, linked: false, renamedFrom: null },
    error: null,
  });

  const result = await createMikrotikSecret(client, "pelanggan-1", "budi123");

  expect(result).toEqual({ success: true, linked: false, renamedFrom: null });
});

test("succeeds and reports linking to a pre-existing Mikrotik secret", async () => {
  const client = fakeClient({
    data: { success: true, linked: true, renamedFrom: "budi_old" },
    error: null,
  });

  const result = await createMikrotikSecret(client, "pelanggan-1", "budi123");

  expect(result).toEqual({ success: true, linked: true, renamedFrom: "budi_old" });
});

test("a network/invoke failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({ data: null, error: { message: "network error" } });

  const result = await createMikrotikSecret(client, "pelanggan-1", "budi123");

  expect(result).toEqual({
    success: false,
    error: "Gagal menghubungi Mikrotik. Coba lagi.",
  });
});

test("a business error from the function (e.g. missing profile) surfaces its message", async () => {
  const client = fakeClient({
    data: { error: "Paket Pelanggan ini belum ada Nama Profile Mikrotik-nya." },
    error: null,
  });

  const result = await createMikrotikSecret(client, "pelanggan-1", "budi123");

  expect(result).toEqual({
    success: false,
    error: "Paket Pelanggan ini belum ada Nama Profile Mikrotik-nya.",
  });
});

test("passes disabled: false by default, and disabled: true when requested (new instalasi flow)", async () => {
  const bodies: unknown[] = [];
  const client = fakeClient(
    { data: { success: true, linked: false, renamedFrom: null }, error: null },
    (body) => bodies.push(body)
  );

  await createMikrotikSecret(client, "pelanggan-1", "budi123");
  await createMikrotikSecret(client, "pelanggan-1", "budi123", { disabled: true });

  expect(bodies).toEqual([
    { pelangganId: "pelanggan-1", mikrotikUsername: "budi123", disabled: false },
    { pelangganId: "pelanggan-1", mikrotikUsername: "budi123", disabled: true },
  ]);
});

test("a non-2xx response (FunctionsHttpError) surfaces the real error message from its body", async () => {
  const client = fakeClient({
    data: null,
    error: {
      message: "Edge Function returned a non-2xx status code",
      context: {
        json: () =>
          Promise.resolve({ error: 'Username Mikrotik "budi123" sudah dipakai di router.' }),
      },
    },
  });

  const result = await createMikrotikSecret(client, "pelanggan-1", "budi123");

  expect(result).toEqual({
    success: false,
    error: 'Username Mikrotik "budi123" sudah dipakai di router.',
  });
});
