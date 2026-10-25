import { statusTransitionErrorMessage } from "../statusTransitionError";

test("passes through the message from the status transition trigger", () => {
  expect(
    statusTransitionErrorMessage(
      { message: 'Foto "before" wajib diunggah sebelum menekan Start.', hint: "tiket_status_transition" },
      "Gagal mengubah status Tiket. Coba lagi."
    )
  ).toBe('Foto "before" wajib diunggah sebelum menekan Start.');
});

test("falls back for other database errors", () => {
  expect(
    statusTransitionErrorMessage(
      { message: 'new row violates row-level security policy for table "tiket"', hint: null },
      "Gagal mengubah status Tiket. Coba lagi."
    )
  ).toBe("Gagal mengubah status Tiket. Coba lagi.");
});

test("falls back when there is no error object", () => {
  expect(statusTransitionErrorMessage(null, "Gagal membuat Tiket. Coba lagi.")).toBe(
    "Gagal membuat Tiket. Coba lagi."
  );
});
