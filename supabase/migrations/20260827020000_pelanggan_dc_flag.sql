-- DC menandai "sudah bayar ke saya" di lapangan -- ini BUKAN langsung
-- `sudah_bayar_bulan_ini = true`, cuma flag "menunggu approval Pemilik"
-- (lihat dc_flag_pelanggan_lunas di bawah). Approve/Tolak beneran
-- dilakukan Pemilik dari layar terpisah (approveSetoranDc.ts/
-- rejectSetoranDc.ts di app), bukan di sini.
alter table public.pelanggan
  add column if not exists dc_flagged_lunas boolean not null default false,
  add column if not exists dc_flagged_by uuid references public.users (id),
  add column if not exists dc_flagged_at timestamptz;

-- DC lintas Wilayah (sesuai keputusan -- beda dari pola Admin/Teknisi yang
-- di-scope per Wilayah), konsisten dengan cara Pemilik baca semua
-- Pelanggan.
create policy "dc can read all pelanggan"
  on public.pelanggan for select
  to authenticated
  using (public.current_user_role() = 'dc');

-- DC TIDAK dikasih akses UPDATE biasa ke tabel pelanggan sama sekali --
-- role ini paling rendah-trust yang ada sejauh ini (akun lapangan), jadi
-- sengaja lewat RPC security-definer yang cuma bisa menyentuh 3 kolom
-- dc_flagged_* dan tidak pernah kolom lain (terutama harga -- lihat
-- insiden Harga Langganan sebelumnya, JANGAN pernah kasih jalur yang bisa
-- menyentuh itu tanpa sengaja).
create or replace function public.dc_flag_pelanggan_lunas(
  p_pelanggan_id uuid,
  p_flagged boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'dc' then
    raise exception 'Hanya DC yang boleh melakukan aksi ini';
  end if;

  if p_flagged and exists (
    select 1 from public.pelanggan
    where id = p_pelanggan_id and sudah_bayar_bulan_ini = true
  ) then
    raise exception 'Pelanggan ini sudah lunas bulan ini';
  end if;

  update public.pelanggan
  set
    dc_flagged_lunas = p_flagged,
    dc_flagged_by = case when p_flagged then auth.uid() else null end,
    dc_flagged_at = case when p_flagged then now() else null end
  where id = p_pelanggan_id;
end;
$$;

grant execute on function public.dc_flag_pelanggan_lunas(uuid, boolean) to authenticated;
