import { formatRelativeTanggal } from "../formatRelativeTanggal";

const NOW = new Date("2026-08-22T14:00:00.000+07:00");

test("formats a timestamp from today as 'Hari ini, HH.MM'", () => {
  expect(formatRelativeTanggal("2026-08-22T09:40:00.000+07:00", NOW)).toBe("Hari ini, 09.40");
});

test("formats a timestamp from yesterday as 'Kemarin, HH.MM'", () => {
  expect(formatRelativeTanggal("2026-08-21T15:10:00.000+07:00", NOW)).toBe("Kemarin, 15.10");
});

test("formats a timestamp from 2-6 days ago as 'N hari lalu'", () => {
  expect(formatRelativeTanggal("2026-08-20T11:25:00.000+07:00", NOW)).toBe("2 hari lalu");
  expect(formatRelativeTanggal("2026-08-16T11:25:00.000+07:00", NOW)).toBe("6 hari lalu");
});

test("falls back to the full date once it's more than a week old", () => {
  expect(formatRelativeTanggal("2026-08-01T11:25:00.000+07:00", NOW)).toBe("1 Agustus 2026");
});
