import { computeProrata } from "../computeProrata";

test("installing mid-cycle (after the 3rd) prorates against the next month's cutoff", () => {
  // Instalasi 20 Agustus -> jatuh tempo berikutnya 3 September (siklus
  // 3 Agustus - 3 September = 31 hari, sisa dari 20 Agustus = 14 hari).
  expect(computeProrata("2026-08-20", 165000)).toBe(74516);
});

test("installing before the cutoff (day 1 or 2) prorates against this month's cutoff", () => {
  // Instalasi 1 Agustus -> jatuh tempo 3 Agustus (siklus 3 Juli - 3
  // Agustus = 31 hari, sisa dari 1 Agustus = 2 hari).
  expect(computeProrata("2026-08-01", 165000)).toBe(10645);
});

test("installing exactly on the cutoff day gets a full cycle (full price)", () => {
  expect(computeProrata("2026-08-03", 165000)).toBe(165000);
});

test("works across a shorter month (February)", () => {
  // Instalasi 1 Februari -> jatuh tempo 3 Februari (siklus 3 Januari -
  // 3 Februari = 31 hari, sisa dari 1 Februari = 2 hari).
  expect(computeProrata("2026-02-01", 100000)).toBe(6452);
});
