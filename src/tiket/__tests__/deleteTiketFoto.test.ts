import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteTiketFoto } from "../deleteTiketFoto";

function fakeClient(opts: {
  path: string;
  remove: jest.Mock;
  deleteRow: jest.Mock;
}): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "tiket_foto") {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({ data: { path: opts.path }, error: null }),
            }),
          }),
          delete: () => ({
            eq: (...args: unknown[]) => opts.deleteRow(...args),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
    storage: {
      from: () => ({
        remove: opts.remove,
      }),
    },
  } as unknown as SupabaseClient;
}

test("removes the Storage object and the tiket_foto row", async () => {
  const remove = jest.fn().mockResolvedValue({ error: null });
  const deleteRow = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({ path: "tiket-1/before-1.jpg", remove, deleteRow });

  const result = await deleteTiketFoto(client, "foto-1");

  expect(remove).toHaveBeenCalledWith(["tiket-1/before-1.jpg"]);
  expect(deleteRow).toHaveBeenCalledWith("id", "foto-1");
  expect(result).toEqual({ success: true });
});

test("returns a friendly error when Storage removal fails", async () => {
  const remove = jest.fn().mockResolvedValue({ error: { message: "boom" } });
  const deleteRow = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({ path: "tiket-1/before-1.jpg", remove, deleteRow });

  const result = await deleteTiketFoto(client, "foto-1");

  expect(deleteRow).not.toHaveBeenCalled();
  expect(result).toEqual({ success: false, error: "Gagal menghapus foto. Coba lagi." });
});
