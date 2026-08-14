-- Lanjutan 20260813144652: 24 dari 41 Username yang sebelumnya tidak
-- ketemu ternyata cuma beda format (ada/tidak ada suffix "@btr", beda
-- kapitalisasi, atau typo kecil) antara nama di Mikrotik dan yang
-- tersimpan di pelanggan.mikrotik_username -- dikonfirmasi lewat query
-- diagnostic manual, bukan tebakan. Mapping di bawah pakai ejaan PERSIS
-- seperti yang ada di pelanggan.mikrotik_username (kolom kiri = Profile
-- Mikrotik yang benar, kolom kanan = ejaan yang ada di app).
--
-- Dibungkus validasi keras sama seperti migration sebelumnya: kalau ada
-- satu aja yang tidak ketemu persis, seluruh migration gagal total
-- (rollback), tidak ada yang ke-update sebagian.
do $$
declare
  missing_username text;
begin
  create temporary table _mikrotik_mapping_fix (username text, profile text) on commit drop;

  insert into _mikrotik_mapping_fix (username, profile) values
    ('kristek_adlan@btr', 'Dinet 200k - 30Mbps'),
    ('KRISRTEK_andi', '30Mbps - B'),
    ('KRISTEK_asmah@btr', '165k - 15Mbps'),
    ('KRISTEK_asmar@btr', '15Mbps - D'),
    ('KRISTEK_atiambon', '15Mbps - B'),
    ('KRISTEK_evi@btr', '15Mbps - D'),
    ('gono@btr', '15Mbps - D'),
    ('iwanac@btr', '15Mbps - B'),
    ('kia@btr', '165k - 15Mbps'),
    ('komarudin@btr', 'Dinet 165k - 15Mbps'),
    ('lasikun@btr', '15Mbps - B'),
    ('KRISTEK_mandanesa', '15Mbps - B'),
    ('KRISTEK_Mariman', '15Mbps - B'),
    ('maulana@btr', '15Mbps - B'),
    ('murtini@btr', '15Mbps - B'),
    ('nurajab@btr', '15Mbps - D'),
    ('kristek_rendy@btr', '165k - 15Mbps'),
    ('KRISTEK_romy', '30Mbps - B'),
    ('susilo@btr', '15Mbps - B'),
    ('KRSITEK_vina', '15Mbps - B'),
    ('KRISTEK_warkal@btr', '30Mbps - B'),
    ('warungfirsy@btr', '15Mbps - B'),
    ('KRISTEK_yessy@btr', '15Mbps - B'),
    ('KRISTEK_yoga@btr', '165k - 15Mbps')
  ;

  select string_agg(m.username, ', ')
  into missing_username
  from _mikrotik_mapping_fix m
  where not exists (
    select 1 from public.pelanggan p where p.mikrotik_username = m.username
  );

  if missing_username is not null then
    raise exception 'Username ini masih tidak ketemu persis: %', missing_username;
  end if;

  update public.pelanggan p
  set paket_id = pk.id
  from _mikrotik_mapping_fix m
  join public.paket pk on pk.mikrotik_profile = m.profile
  where p.mikrotik_username = m.username;
end $$;
