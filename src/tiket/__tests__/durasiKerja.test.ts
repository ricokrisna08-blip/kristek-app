import { computeDurasiKerjaSeconds, formatDurasiKerja } from "../durasiKerja";

test("computeDurasiKerjaSeconds excludes accumulated Pending time from the Start-End span", () => {
  const seconds = computeDurasiKerjaSeconds(
    "2026-08-06T10:00:00.000Z",
    "2026-08-06T12:00:00.000Z",
    600
  );

  expect(seconds).toBe(2 * 60 * 60 - 600);
});

test("computeDurasiKerjaSeconds never goes below zero", () => {
  const seconds = computeDurasiKerjaSeconds(
    "2026-08-06T10:00:00.000Z",
    "2026-08-06T10:05:00.000Z",
    999999
  );

  expect(seconds).toBe(0);
});

test("formatDurasiKerja shows hours and minutes", () => {
  expect(formatDurasiKerja(6600)).toBe("1 jam 50 menit");
});

test("formatDurasiKerja omits hours when under an hour", () => {
  expect(formatDurasiKerja(1800)).toBe("30 menit");
});
