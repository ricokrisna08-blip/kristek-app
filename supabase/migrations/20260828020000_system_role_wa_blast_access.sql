-- Beri akses role "system" (daemon WA Blast) ke tabel yang dia butuhkan,
-- lewat policy BARU (bukan ubah policy "pemilik" yang sudah ada) supaya
-- akses pemilik/admin existing tidak tersentuh sama sekali.
--
-- Daemon (kristek-wa-blast/daemon.ts, lib/fetchBillingFromSupabase.ts)
-- butuh: select/insert/update wa_blast_job, select semua pelanggan (buat
-- data tagihan), update pelanggan (tandai sudah_diblast_bulan_ini/
-- diblast_at setelah kirim WA).

create policy "system can read wa blast job"
  on public.wa_blast_job for select
  to authenticated
  using (public.current_user_role() = 'system');

create policy "system can insert wa blast job"
  on public.wa_blast_job for insert
  to authenticated
  with check (
    public.current_user_role() = 'system'
    and requested_by = auth.uid()
  );

create policy "system can update wa blast job"
  on public.wa_blast_job for update
  to authenticated
  using (public.current_user_role() = 'system');

create policy "system can read all pelanggan"
  on public.pelanggan for select
  to authenticated
  using (public.current_user_role() = 'system');

create policy "system can update pelanggan"
  on public.pelanggan for update
  to authenticated
  using (public.current_user_role() = 'system')
  with check (public.current_user_role() = 'system');

-- Pindahkan akun service yang sudah ada dari role "pemilik" ke "system",
-- supaya menu-nya di app cuma nampilin Blast Tagihan WA (lihat
-- canTriggerWaBlast di src/auth/permissions.ts), bukan semua menu Pemilik.
update public.users
set role = 'system'
where id = (
  select id from auth.users where email = 'system-wa-blast@internal.kristek.app'
);
