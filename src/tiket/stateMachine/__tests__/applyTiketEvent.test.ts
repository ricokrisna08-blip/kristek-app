import { applyTiketEvent } from "../applyTiketEvent";

test("Start with a before-photo moves Ditugaskan to Dikerjakan", () => {
  const result = applyTiketEvent(
    { status: "ditugaskan" },
    { type: "start", hasBeforePhoto: true }
  );

  expect(result).toEqual({ valid: true, newStatus: "dikerjakan" });
});

test("Start without a before-photo is rejected", () => {
  const result = applyTiketEvent(
    { status: "ditugaskan" },
    { type: "start", hasBeforePhoto: false }
  );

  expect(result).toEqual({
    valid: false,
    error: 'Foto "before" wajib diunggah sebelum menekan Start.',
  });
});

test("Start from a status other than Ditugaskan is rejected", () => {
  const result = applyTiketEvent(
    { status: "dikerjakan" },
    { type: "start", hasBeforePhoto: true }
  );

  expect(result).toEqual({
    valid: false,
    error: "Tiket harus berstatus Ditugaskan untuk bisa di-Start.",
  });
});

test("Pending with notes moves Dikerjakan to Pending", () => {
  const result = applyTiketEvent(
    { status: "dikerjakan" },
    { type: "pending", notes: "Menunggu material dari gudang" }
  );

  expect(result).toEqual({ valid: true, newStatus: "pending" });
});

test("Pending without notes is rejected", () => {
  const result = applyTiketEvent(
    { status: "dikerjakan" },
    { type: "pending", notes: "   " }
  );

  expect(result).toEqual({
    valid: false,
    error: "Catatan wajib diisi saat menandai Tiket Pending.",
  });
});

test("Pending from a status other than Dikerjakan is rejected", () => {
  const result = applyTiketEvent(
    { status: "ditugaskan" },
    { type: "pending", notes: "Menunggu material" }
  );

  expect(result).toEqual({
    valid: false,
    error: "Tiket harus berstatus Dikerjakan untuk bisa ditandai Pending.",
  });
});

test("Lanjut moves Pending back to Dikerjakan", () => {
  const result = applyTiketEvent({ status: "pending" }, { type: "lanjut" });

  expect(result).toEqual({ valid: true, newStatus: "dikerjakan" });
});

test("Lanjut from a status other than Pending is rejected", () => {
  const result = applyTiketEvent({ status: "dikerjakan" }, { type: "lanjut" });

  expect(result).toEqual({
    valid: false,
    error: "Tiket harus berstatus Pending untuk bisa dilanjutkan.",
  });
});

test("End with an after-photo moves Dikerjakan to Selesai", () => {
  const result = applyTiketEvent(
    { status: "dikerjakan" },
    { type: "end", hasAfterPhoto: true }
  );

  expect(result).toEqual({ valid: true, newStatus: "selesai" });
});

test("End without an after-photo is rejected", () => {
  const result = applyTiketEvent(
    { status: "dikerjakan" },
    { type: "end", hasAfterPhoto: false }
  );

  expect(result).toEqual({
    valid: false,
    error: 'Foto "after" wajib diunggah sebelum menekan End.',
  });
});

test("End from a status other than Dikerjakan is rejected", () => {
  const result = applyTiketEvent(
    { status: "pending" },
    { type: "end", hasAfterPhoto: true }
  );

  expect(result).toEqual({
    valid: false,
    error: "Tiket harus berstatus Dikerjakan untuk bisa di-End.",
  });
});

test.each(["baru", "ditugaskan", "dikerjakan", "pending"] as const)(
  "Batalkan moves %s to Dibatalkan",
  (status) => {
    const result = applyTiketEvent({ status }, { type: "batalkan" });

    expect(result).toEqual({ valid: true, newStatus: "dibatalkan" });
  }
);

test("Batalkan from Selesai is rejected", () => {
  const result = applyTiketEvent({ status: "selesai" }, { type: "batalkan" });

  expect(result).toEqual({
    valid: false,
    error: "Tiket yang sudah Selesai atau Dibatalkan tidak bisa dibatalkan lagi.",
  });
});

test("Batalkan from Dibatalkan is rejected", () => {
  const result = applyTiketEvent({ status: "dibatalkan" }, { type: "batalkan" });

  expect(result).toEqual({
    valid: false,
    error: "Tiket yang sudah Selesai atau Dibatalkan tidak bisa dibatalkan lagi.",
  });
});
