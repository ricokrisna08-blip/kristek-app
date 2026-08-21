// UUID v4 generator murni JS (bukan crypto-secure) -- dipakai buat
// generate id row notifikasi di CLIENT sebelum insert, supaya tidak perlu
// select-balik baris yang baru diinsert (RLS notifikasi cuma izinin user
// baca notifikasinya sendiri, sementara baris yang diinsert seringkali
// punya user_id ORANG LAIN -- mis. Admin assign Tiket ke Teknisi -- jadi
// select-balik itu bakal diblokir RLS). Cukup acak, tidak perlu
// cryptographically secure untuk kebutuhan primary key ini, jadi aman
// dipakai di RN (Hermes) maupun Web tanpa polyfill tambahan.
export function generateUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
