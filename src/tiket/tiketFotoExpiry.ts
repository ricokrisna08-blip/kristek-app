export const TIKET_FOTO_RETENTION_DAYS = 7;

export function isTiketFotoExpired(uploadedAt: string, now: Date = new Date()): boolean {
  const ageMs = now.getTime() - new Date(uploadedAt).getTime();
  return ageMs > TIKET_FOTO_RETENTION_DAYS * 24 * 60 * 60 * 1000;
}
