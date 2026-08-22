-- Izinkan Pemilik menghapus SEMUA baris Tiket atau SEMUA Notifikasi
-- sekaligus (dipakai buat bersih-bersih data test sebelum go-live, atau
-- reset data kapan pun dibutuhkan) -- lewat layar "Reset Data" baru.
-- Sebelum ini, tabel `tiket` dan `notifikasi` sama sekali tidak punya
-- RLS policy DELETE.
--
-- Hapus `tiket` otomatis cascade ke tiket_teknisi, tiket_foto, dan
-- tiket_status_log (semua sudah "on delete cascade" ke tiket sejak awal),
-- plus notifikasi yang tiket_id-nya terkait (juga "on delete cascade").
-- File foto di Storage TIDAK ikut kehapus otomatis (butuh Storage
-- cleanup manual/terpisah, di luar scope ini).

create policy "pemilik can delete all tiket"
  on public.tiket for delete
  to authenticated
  using (public.current_user_role() = 'pemilik');

create policy "pemilik can delete all notifikasi"
  on public.notifikasi for delete
  to authenticated
  using (public.current_user_role() = 'pemilik');
