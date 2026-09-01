-- Pemilik bisa manual nandain Pelanggan mana yang harus didahulukan DC
-- pas keliling menagih. Tidak butuh policy RLS baru: update dipakai lewat
-- policy "pemilik can update any pelanggan" yang sudah ada, baca dipakai
-- lewat policy "dc can read all pelanggan" yang sudah ada juga.
alter table public.pelanggan add column prioritas_dc boolean not null default false;
