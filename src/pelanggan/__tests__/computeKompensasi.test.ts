import { computeKompensasi } from "../computeKompensasi";

test("computes compensation as a fraction of the current billing cycle", () => {
  // Hari ini 25 Agustus 2026 -> siklus berjalan 3 Agustus - 3 September
  // (31 hari). 3 hari gangguan -> 3/31 x harga.
  const today = new Date(2026, 7, 25);
  expect(computeKompensasi(3, 165000, today)).toBe(15968);
});

test("uses the previous month's cutoff when today is before the 3rd", () => {
  // Hari ini 1 Agustus 2026 -> siklus berjalan 3 Juli - 3 Agustus (31 hari).
  const today = new Date(2026, 7, 1);
  expect(computeKompensasi(5, 200000, today)).toBe(32258);
});

test("clamps the compensation so it never exceeds the current harga", () => {
  const today = new Date(2026, 7, 25);
  expect(computeKompensasi(40, 100000, today)).toBe(100000);
});

test("returns 0 when there are no outage days or no harga", () => {
  const today = new Date(2026, 7, 25);
  expect(computeKompensasi(0, 165000, today)).toBe(0);
  expect(computeKompensasi(3, 0, today)).toBe(0);
});
