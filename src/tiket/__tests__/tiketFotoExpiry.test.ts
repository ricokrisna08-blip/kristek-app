import { TIKET_FOTO_RETENTION_DAYS, isTiketFotoExpired } from "../tiketFotoExpiry";

test("a photo uploaded just now is not expired", () => {
  const now = new Date("2026-08-07T12:00:00.000Z");
  expect(isTiketFotoExpired("2026-08-07T12:00:00.000Z", now)).toBe(false);
});

test("a photo uploaded 6 days ago is not yet expired", () => {
  const now = new Date("2026-08-07T12:00:00.000Z");
  expect(isTiketFotoExpired("2026-08-01T13:00:00.000Z", now)).toBe(false);
});

test("a photo uploaded more than 7 days ago is expired", () => {
  const now = new Date("2026-08-07T12:00:00.000Z");
  expect(isTiketFotoExpired("2026-07-31T00:00:00.000Z", now)).toBe(true);
});

test("retention window is 7 days", () => {
  expect(TIKET_FOTO_RETENTION_DAYS).toBe(7);
});
