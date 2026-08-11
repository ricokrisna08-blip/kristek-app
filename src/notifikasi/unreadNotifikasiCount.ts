import type { Notifikasi } from "./listNotifikasi";

export function unreadNotifikasiCount(notifikasi: Notifikasi[]): number {
  return notifikasi.filter((n) => n.readAt === null).length;
}
