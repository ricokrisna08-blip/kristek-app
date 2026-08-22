import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadTiketEvidenceFoto } from "../uploadTiketEvidenceFoto";

function fakeClient(opts: { upload: jest.Mock; insertFoto: jest.Mock }): SupabaseClient {
  return {
    from: (table: string) => {
      if (table === "tiket_foto") {
        return { insert: opts.insertFoto };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
    storage: {
      from: () => ({
        upload: opts.upload,
        getPublicUrl: () => ({ data: { publicUrl: "https://example.test/redaman.jpg" } }),
      }),
    },
  } as unknown as SupabaseClient;
}

test("uploads the photo and records a tiket_foto row without touching Tiket status", async () => {
  const upload = jest.fn().mockResolvedValue({ error: null });
  const insertFoto = jest.fn().mockResolvedValue({ error: null });
  const client = fakeClient({ upload, insertFoto });

  const result = await uploadTiketEvidenceFoto(client, {
    tiketId: "tiket-1",
    uploadedBy: "teknisi-1",
    type: "redaman",
    photoBlob: new Blob(["fake"]),
    latitude: -6.2,
    longitude: 106.8,
  });

  expect(upload).toHaveBeenCalled();
  expect(insertFoto).toHaveBeenCalledWith({
    tiket_id: "tiket-1",
    type: "redaman",
    url: "https://example.test/redaman.jpg",
    path: expect.any(String),
    uploaded_by: "teknisi-1",
    latitude: -6.2,
    longitude: 106.8,
  });
  expect(result).toEqual({ success: true });
});

test("a Storage upload failure returns a clear error and skips the DB insert", async () => {
  const upload = jest.fn().mockResolvedValue({ error: { message: "storage error" } });
  const insertFoto = jest.fn();
  const client = fakeClient({ upload, insertFoto });

  const result = await uploadTiketEvidenceFoto(client, {
    tiketId: "tiket-1",
    uploadedBy: "teknisi-1",
    type: "ont",
    photoBlob: new Blob(["fake"]),
  });

  expect(insertFoto).not.toHaveBeenCalled();
  expect(result).toEqual({ success: false, error: "Gagal mengunggah foto. Coba lagi." });
});
