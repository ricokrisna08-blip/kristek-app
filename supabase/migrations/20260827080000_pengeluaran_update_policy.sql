-- Kelewatan waktu bikin tabel pengeluaran: cuma ada policy SELECT/
-- INSERT/DELETE, nggak ada UPDATE sama sekali -- jadi centang "Sudah
-- Dibayar" (setPengeluaranSudahDibayar.ts) diam-diam ditolak RLS (nggak
-- error, tapi 0 baris ke-update, jadi keliatan kayak "ga berfungsi").
create policy "pemilik can update pengeluaran"
  on public.pengeluaran for update
  to authenticated
  using (public.current_user_role() = 'pemilik')
  with check (public.current_user_role() = 'pemilik');
