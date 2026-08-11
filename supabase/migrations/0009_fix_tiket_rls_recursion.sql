-- Fix: kebijakan RLS "teknisi can read assigned tiket" (di public.tiket) dan
-- "select tiket_teknisi if tiket is readable" (di public.tiket_teknisi)
-- saling query satu sama lain -> Postgres error "infinite recursion
-- detected in policy for relation tiket" (kode 42P17).
--
-- Perbaikan: pakai fungsi security-definer (pola sama seperti
-- current_user_role()/current_user_wilayah()) untuk mengecek assignment
-- Teknisi, supaya query di dalamnya bypass RLS tiket_teknisi dan rantainya
-- berhenti, bukan muter lagi ke tiket.
--
-- Jalankan file ini di Supabase Dashboard -> SQL Editor -> New query -> Run,
-- SETELAH 0001-0008.

create or replace function public.is_teknisi_assigned_to_tiket(p_tiket_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.tiket_teknisi tt
    where tt.tiket_id = p_tiket_id and tt.teknisi_id = auth.uid()
  );
$$;

drop policy if exists "teknisi can read assigned tiket" on public.tiket;

create policy "teknisi can read assigned tiket"
  on public.tiket for select
  to authenticated
  using (public.is_teknisi_assigned_to_tiket(tiket.id));
