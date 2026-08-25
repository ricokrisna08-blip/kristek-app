import type { SupabaseClient } from "@supabase/supabase-js";
import { updatePelangganStatus } from "../updatePelangganStatus";

function fakeClient(updateResult: { error: unknown }): SupabaseClient {
  return {
    from: () => ({
      update: (payload: unknown) => {
        (fakeClient as any).lastPayload = payload;
        return {
          eq: () => Promise.resolve(updateResult),
        };
      },
    }),
  } as unknown as SupabaseClient;
}

test("valid input updates status & subsidi, and recomputes harga = Paket harga - subsidi", async () => {
  const client = fakeClient({ error: null });

  const result = await updatePelangganStatus(client, "pelanggan-1", {
    isActive: true,
    isBenefit: false,
    subsidiAktif: 100000,
    prorate: true,
    paketHarga: 165000,
  });

  expect((fakeClient as any).lastPayload).toEqual({
    is_active: true,
    is_benefit: false,
    subsidi_aktif: 100000,
    prorate: true,
    harga: 65000,
  });
  expect(result).toEqual({ success: true, harga: 65000 });
});

test("no subsidi means harga is recomputed as the full Paket harga", async () => {
  const client = fakeClient({ error: null });

  const result = await updatePelangganStatus(client, "pelanggan-1", {
    isActive: false,
    isBenefit: true,
    subsidiAktif: null,
    prorate: false,
    paketHarga: 200000,
  });

  expect((fakeClient as any).lastPayload).toMatchObject({ harga: 200000 });
  expect(result).toEqual({ success: true, harga: 200000 });
});

test("a subsidi larger than the Paket harga is clamped to 0, never negative", async () => {
  const client = fakeClient({ error: null });

  const result = await updatePelangganStatus(client, "pelanggan-1", {
    isActive: true,
    isBenefit: true,
    subsidiAktif: 500000,
    prorate: false,
    paketHarga: 165000,
  });

  expect(result).toEqual({ success: true, harga: 0 });
});

test("an unknown Paket harga leaves harga untouched in the update payload", async () => {
  const client = fakeClient({ error: null });

  const result = await updatePelangganStatus(client, "pelanggan-1", {
    isActive: true,
    isBenefit: false,
    subsidiAktif: 100000,
    prorate: false,
    paketHarga: null,
  });

  expect((fakeClient as any).lastPayload).toEqual({
    is_active: true,
    is_benefit: false,
    subsidi_aktif: 100000,
    prorate: false,
  });
  expect(result).toEqual({ success: true, harga: null });
});

test("an update failure returns a clear error instead of crashing", async () => {
  const client = fakeClient({
    error: { code: "42501", message: "permission denied" },
  });

  const result = await updatePelangganStatus(client, "pelanggan-1", {
    isActive: false,
    isBenefit: true,
    subsidiAktif: null,
    prorate: false,
    paketHarga: 165000,
  });

  expect(result).toEqual({
    success: false,
    error: "Gagal menyimpan status Pelanggan. Coba lagi.",
  });
});
