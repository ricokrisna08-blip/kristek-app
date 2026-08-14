-- Paket sekarang perlu tau nama Profile PPP yang persis sama dengan yang
-- ada di Mikrotik, supaya create/simpan Username Mikrotik Pelanggan bisa
-- langsung auto-create PPP secret di router lewat Edge Function
-- "mikrotik-create-secret" (bukan manual bikin secret di Winbox lagi).
alter table public.paket
  add column if not exists mikrotik_profile text;

-- Data Paket lama masih dummy (belum sinkron ke Profile PPP asli). Diganti
-- total dengan daftar Profile PPP nyata dari router (dikirim user via
-- screenshot Winbox). Profile bawaan/testing router (default,
-- default-encryption, 30Mbps - TEST, Testing) sengaja di-skip karena
-- bukan Paket pelanggan asli.
update public.pelanggan set paket_id = null;
delete from public.paket;

insert into public.paket (nama, mikrotik_profile) values
  ('10Mbps - 15Mbps - D', '10Mbps - 15Mbps - D'),
  ('15Mbps - B', '15Mbps - B'),
  ('15Mbps - D', '15Mbps - D'),
  ('30Mbps - B', '30Mbps - B'),
  ('30Mbps - D', '30Mbps - D'),
  ('165k - 15Mbps', '165k - 15Mbps'),
  ('200k - 30Mbps', '200k - 30Mbps'),
  ('Dinet 165k - 15Mbps', 'Dinet 165k - 15Mbps'),
  ('Dinet 200k - 30Mbps', 'Dinet 200k - 30Mbps'),
  ('PAKET GRATIS', 'PAKET GRATIS');
