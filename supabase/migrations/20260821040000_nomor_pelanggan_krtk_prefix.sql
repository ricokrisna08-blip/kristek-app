-- Ganti prefix Nomor Pelanggan dari "PLG-" ke "KRTK-" -- retroaktif buat
-- semua Pelanggan yang sudah ada (angka urutnya tetap sama, cuma
-- prefix-nya), plus default kolom buat Pelanggan baru ke depannya.

update public.pelanggan
set nomor_pelanggan = 'KRTK-' || substring(nomor_pelanggan from 5)
where nomor_pelanggan like 'PLG-%';

alter table public.pelanggan
  alter column nomor_pelanggan
  set default ('KRTK-' || lpad(nextval('public.pelanggan_nomor_seq')::text, 6, '0'));
