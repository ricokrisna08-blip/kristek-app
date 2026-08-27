import type { SupabaseClient } from "@supabase/supabase-js";
import { flagLunasByDc } from "../flagLunasByDc";

function fakeClient(options: {
  rpcError?: { message: string } | null;
  pemilikRows?: Array<{ id: string }>;
}) {
  const rpcCalls: unknown[] = [];
  const notifikasiInserts: unknown[] = [];

  const client = {
    rpc: (name: string, args: unknown) => {
      rpcCalls.push({ name, args });
      return Promise.resolve({ error: options.rpcError ?? null });
    },
    from: (table: string) => {
      if (table === "users") {
        return {
          select: () => ({
            eq: () => Promise.resolve({ data: options.pemilikRows ?? [], error: null }),
          }),
        };
      }
      if (table === "notifikasi") {
        return {
          insert: (rows: unknown) => {
            notifikasiInserts.push(rows);
            return Promise.resolve({ error: null });
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
    functions: { invoke: jest.fn().mockResolvedValue({ data: null, error: null }) },
  } as unknown as SupabaseClient;

  return { client, rpcCalls, notifikasiInserts };
}

test("flagging lunas calls the RPC and notifies every pemilik", async () => {
  const { client, rpcCalls, notifikasiInserts } = fakeClient({
    pemilikRows: [{ id: "pemilik-1" }],
  });

  const result = await flagLunasByDc(client, "pelanggan-1", true);

  expect(result).toEqual({ success: true });
  expect(rpcCalls).toEqual([
    { name: "dc_flag_pelanggan_lunas", args: { p_pelanggan_id: "pelanggan-1", p_flagged: true } },
  ]);
  expect(notifikasiInserts).toEqual([
    [{ id: expect.any(String), user_id: "pemilik-1", pelanggan_id: "pelanggan-1", type: "setoran_dc" }],
  ]);
});

test("un-flagging does not create a notification", async () => {
  const { client, notifikasiInserts } = fakeClient({});

  const result = await flagLunasByDc(client, "pelanggan-1", false);

  expect(result).toEqual({ success: true });
  expect(notifikasiInserts).toEqual([]);
});

test("an RPC failure (e.g. already lunas) surfaces its message", async () => {
  const { client } = fakeClient({ rpcError: { message: "Pelanggan ini sudah lunas bulan ini" } });

  const result = await flagLunasByDc(client, "pelanggan-1", true);

  expect(result).toEqual({ success: false, error: "Pelanggan ini sudah lunas bulan ini" });
});
