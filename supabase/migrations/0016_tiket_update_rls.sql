-- Fix: tabel tiket enable RLS sejak 0007 tapi TIDAK PERNAH punya policy
-- UPDATE sama sekali -- artinya semua alur yang mengubah status Tiket
-- (Start di tiket 07, Pending/Lanjut di tiket 08, End di tiket 09) akan
-- ditolak Postgres begitu RLS benar-benar dievaluasi (default-deny tanpa
-- policy yang cocok).
--
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0015.

create policy "teknisi can update assigned tiket status"
  on public.tiket for update
  to authenticated
  using (public.is_teknisi_assigned_to_tiket(id))
  with check (public.is_teknisi_assigned_to_tiket(id));
