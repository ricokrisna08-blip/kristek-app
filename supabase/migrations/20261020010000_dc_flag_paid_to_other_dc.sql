-- DC di lapangan kadang nemu Pelanggan yang ternyata udah bayar ke DC LAIN
-- (DC beda yang sempat lewat duluan) -- sebelum ini, dc_flag_pelanggan_lunas
-- SELALU nyatet dc_flagged_by = DC yang nyentang (auth.uid()), jadi DC yang
-- nemu belakangan kepaksa seolah-olah DIA yang pegang uangnya, padahal
-- uangnya ada di DC lain. Pemilik jadi salah nagih ke orang yang salah.
--
-- p_paid_to_dc_id (opsional) biarin DC yang nyentang milih DC LAIN yang
-- beneran pegang uangnya -- dc_flagged_by jadi "siapa yang pegang uang",
-- bukan lagi selalu "siapa yang nyentang". Null/tidak diisi = default ke
-- diri sendiri (perilaku lama, tidak berubah).
create or replace function public.dc_flag_pelanggan_lunas(
  p_pelanggan_id uuid,
  p_flagged boolean,
  p_paid_to_dc_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dc_id uuid;
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

  v_dc_id := auth.uid();

  if p_flagged and p_paid_to_dc_id is not null then
    if not exists (
      select 1 from public.users where id = p_paid_to_dc_id and role = 'dc'
    ) then
      raise exception 'DC tujuan tidak valid';
    end if;
    v_dc_id := p_paid_to_dc_id;
  end if;

  update public.pelanggan
  set
    dc_flagged_lunas = p_flagged,
    dc_flagged_by = case when p_flagged then v_dc_id else null end,
    dc_flagged_at = case when p_flagged then now() else null end
  where id = p_pelanggan_id;
end;
$$;

grant execute on function public.dc_flag_pelanggan_lunas(uuid, boolean, uuid) to authenticated;

-- Tabel users sendiri nggak kebuka buat role DC (lihat trust model di
-- 20260827020000_pelanggan_dc_flag.sql -- DC paling rendah-trust, cuma bisa
-- nyentuh 3 kolom dc_flagged_* lewat RPC, bukan select bebas ke users).
-- RPC scoped ini cuma balikin id+nama akun DC lain, buat ngisi dropdown
-- "Dibayar ke" di atas -- bukan baris users penuh (role/email/dll).
create or replace function public.list_dc_users()
returns table (id uuid, nama text)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if public.current_user_role() not in ('dc', 'pemilik', 'admin') then
    raise exception 'Tidak diizinkan';
  end if;

  return query select u.id, u.nama from public.users u where u.role = 'dc';
end;
$$;

grant execute on function public.list_dc_users() to authenticated;
