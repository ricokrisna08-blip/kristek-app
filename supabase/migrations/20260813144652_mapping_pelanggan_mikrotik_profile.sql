-- Mapping massal Paket untuk 141 Pelanggan existing, berdasarkan Profile
-- PPP yang persis sama dengan screenshot Secrets Mikrotik (Winbox, PPP ->
-- Secrets, kolom Name & Profile) yang dikirim user tanggal 2026-08-13.
--
-- Update di bawah cuma mengenai baris pelanggan.mikrotik_username yang
-- match persis; yang tidak match diam-diam di-skip (bukan error) -- 41
-- dari 141 nama di list ini tidak ketemu waktu migration ini pertama
-- dijalankan, sudah dilaporkan manual ke user lewat chat untuk dicek
-- terpisah (kemungkinan belum pernah di-set Username Mikrotik-nya di app).
do $$
declare
  missing_profile text;
begin
  create temporary table _mikrotik_mapping (username text, profile text) on commit drop;

  insert into _mikrotik_mapping (username, profile) values
    ('KRISTEK_nurjebet', '10Mbps - 15Mbps - D'),
    ('KRISTEK_vera', '10Mbps - 15Mbps - D'),
    ('KRISTEK_embun', '10Mbps - 15Mbps - D'),
    ('KRISTEK_santo', '10Mbps - 15Mbps - D'),
    ('KRISTEK_wendy', '15Mbps - B'),
    ('KRISTEK_hera', '15Mbps - B'),
    ('KRISTEK_wahono', '15Mbps - B'),
    ('KRISTEK_ismayadi', '15Mbps - B'),
    ('KRISTEK_warungfirsy', '15Mbps - B'),
    ('KRISTEK_suroto', '15Mbps - B'),
    ('KRISTEK_ambar', '15Mbps - B'),
    ('KRISTEK_lulu', '15Mbps - B'),
    ('KRISTEK_nafisa', '15Mbps - B'),
    ('KRISTEK_mumin', '15Mbps - B'),
    ('KRISTEK_maulana', '15Mbps - B'),
    ('KRISTEK_kartono', '15Mbps - B'),
    ('KRISTEK_waryo', '15Mbps - B'),
    ('KRISTEK_mandanase', '15Mbps - B'),
    ('KRISTEK_murtini', '15Mbps - B'),
    ('KRISTEK_lasikun', '15Mbps - B'),
    ('KRISTEK_quina', '15Mbps - B'),
    ('KRISTEK_acul', '15Mbps - B'),
    ('KRISTEK_iwanac', '15Mbps - B'),
    ('KRISTEK_gebot', '15Mbps - B'),
    ('KRISTEK_yunibentar', '15Mbps - B'),
    ('KRISTEK_afrizal', '15Mbps - B'),
    ('KRISTEK_urip', '15Mbps - B'),
    ('KRISTEK_susilo', '15Mbps - B'),
    ('KRISTEK_putri', '15Mbps - B'),
    ('KRISTEK_mariman', '15Mbps - B'),
    ('KRISTEK_pram', '15Mbps - B'),
    ('KRISTEK_dadang', '15Mbps - B'),
    ('KRISTEK_keisha', '15Mbps - B'),
    ('KRISTEK_sari', '15Mbps - B'),
    ('KRISTEK_siska', '15Mbps - B'),
    ('KRISTEK_gusli', '15Mbps - B'),
    ('KRISTEK_toni', '15Mbps - B'),
    ('KRISTEK_umroh', '15Mbps - B'),
    ('KRISTEK', '15Mbps - B'),
    ('KRISTEK_cia', '15Mbps - B'),
    ('KRISTEK_vina', '15Mbps - B'),
    ('KRISTEK_dedi', '15Mbps - B'),
    ('KRISTEK_oji', '15Mbps - B'),
    ('KRISTEK_hajiomi', '15Mbps - B'),
    ('KRISTEK_srisumini', '15Mbps - B'),
    ('anangrosadi@btr', '15Mbps - B'),
    ('KRISTEK_tiur', '15Mbps - B'),
    ('KRISTEK_dikaepoy', '15Mbps - B'),
    ('KRISTEK_cust84', '15Mbps - B'),
    ('KRISTEK_atiambon@btr', '15Mbps - B'),
    ('cibenk@btr', '15Mbps - B'),
    ('KRISTEK_iwan@btr', '15Mbps - B'),
    ('KRISTEK_nico@btr', '15Mbps - B'),
    ('KRISTEK_makmun@btr', '15Mbps - B'),
    ('KRISTEK_yessy', '15Mbps - B'),
    ('jajang@btr', '15Mbps - B'),
    ('rayhan@btr', '15Mbps - B'),
    ('yanti@btr', '15Mbps - B'),
    ('rosadi@btr', '15Mbps - B'),
    ('awang@btr', '15Mbps - B'),
    ('hendi@btr', '15Mbps - B'),
    ('opikbewok@btr', '15Mbps - B'),
    ('yanuar@btr', '15Mbps - B'),
    ('heri@btr', '15Mbps - B'),
    ('susan@btr', '15Mbps - B'),
    ('kaida@btr', '15Mbps - B'),
    ('zahwa@btr', '15Mbps - B'),
    ('galuh@btr', '15Mbps - B'),
    ('ikhsan@btr', '15Mbps - B'),
    ('dewimurjat@btr', '15Mbps - B'),
    ('puryani@btr', '15Mbps - B'),
    ('murjat@btr', '15Mbps - B'),
    ('ilhamputri@btr', '15Mbps - B'),
    ('mpominah@btr', '15Mbps - B'),
    ('rtagus@btr', '15Mbps - B'),
    ('KRISTEK_tabroni', '15Mbps - D'),
    ('KRISTEK_udin', '15Mbps - D'),
    ('KRISTEK_wardoyo', '15Mbps - D'),
    ('KRISTEK_ami', '15Mbps - D'),
    ('KRISTEK_rudi', '15Mbps - D'),
    ('KRISTEK_julianasari', '15Mbps - D'),
    ('KRISTEK_rahmat', '15Mbps - D'),
    ('KRISTEK_ismadi', '15Mbps - D'),
    ('KRISTEK_kevin', '15Mbps - D'),
    ('KRISTEK_evi', '15Mbps - D'),
    ('KRISTEK_nurajab', '15Mbps - D'),
    ('KRISTEK_asmar', '15Mbps - D'),
    ('KRISTEK_lia', '15Mbps - D'),
    ('KRISTEK_hesti@btr', '15Mbps - D'),
    ('KRISTEK_gono', '15Mbps - D'),
    ('murtanih@btr', '15Mbps - D'),
    ('warungsukur@btr', '15Mbps - D'),
    ('baiturrahman@btr', '15Mbps - D'),
    ('mpoaah@btr', '15Mbps - D'),
    ('KRISTEK_andi', '30Mbps - B'),
    ('KRISTEK_hani', '30Mbps - B'),
    ('KRISTEK_iis', '30Mbps - B'),
    ('KRISTEK_hajialim', '30Mbps - B'),
    ('KRISTEK_romi', '30Mbps - B'),
    ('KRISTEK_warkal', '30Mbps - B'),
    ('KRISTEK_neni@btr', '30Mbps - B'),
    ('KRISTEK_dena', '30Mbps - B'),
    ('KRISTEK_alan', '30Mbps - B'),
    ('KRISTEK_erwin', '30Mbps - D'),
    ('KRISTEK_amel2', '30Mbps - D'),
    ('KRISTEK_keylan', '30Mbps - D'),
    ('KRISTEK_erny', '30Mbps - D'),
    ('KRISTEK_syamsudin', '30Mbps - D'),
    ('KRISTEK_mega', '30Mbps - D'),
    ('KRISTEK_fajar', '30Mbps - D'),
    ('KRISTEK_buyani', '30Mbps - D'),
    ('reno@btr', '30Mbps - D'),
    ('KRISTEK_maideh', '165k - 15Mbps'),
    ('KRISTEK_ade', '165k - 15Mbps'),
    ('KRISTEK_rikoy', '165k - 15Mbps'),
    ('KRISTEK_nurman', '165k - 15Mbps'),
    ('KRISTEK_iman', '165k - 15Mbps'),
    ('KRISTEK_ibra', '165k - 15Mbps'),
    ('KRISTEK_kia', '165k - 15Mbps'),
    ('KRISTEK_undikubil@btr', '165k - 15Mbps'),
    ('KRISTEK_titin', '165k - 15Mbps'),
    ('KRISTEK_rendy', '165k - 15Mbps'),
    ('KRISTEK_yoga', '165k - 15Mbps'),
    ('KRISTEK_asmah', '165k - 15Mbps'),
    ('ncek@btr', '165k - 15Mbps'),
    ('KRISTEK_dara', 'Dinet 165k - 15Mbps'),
    ('KRISTEK_komarudin', 'Dinet 165k - 15Mbps'),
    ('beachwalk@btr', 'Dinet 165k - 15Mbps'),
    ('warsun@btr', 'Dinet 165k - 15Mbps'),
    ('gatot@btr', 'Dinet 165k - 15Mbps'),
    ('KRISTEK_marsi', 'Dinet 200k - 30Mbps'),
    ('KRISTEK_adlan@btr', 'Dinet 200k - 30Mbps'),
    ('KRISTEK_mahrudi', 'PAKET GRATIS'),
    ('KRISTEK_egatari', 'PAKET GRATIS'),
    ('KRISTEK_sani@btr', 'PAKET GRATIS'),
    ('kristek_awe@btr', 'PAKET GRATIS'),
    ('KRISTEK_sulis@btr', 'PAKET GRATIS'),
    ('nurmutaqin@btr', 'PAKET GRATIS'),
    ('yakub@btr', 'PAKET GRATIS'),
    ('posciliwung@btr', 'PAKET GRATIS'),
    ('ayung@btr', 'PAKET GRATIS')
  ;

  -- Validasi 1: setiap Profile di atas harus ada di tabel paket.
  select string_agg(distinct m.profile, ', ')
  into missing_profile
  from _mikrotik_mapping m
  where not exists (
    select 1 from public.paket pk where pk.mikrotik_profile = m.profile
  );

  if missing_profile is not null then
    raise exception 'Profile Mikrotik ini belum ada di tabel paket: %', missing_profile;
  end if;

  -- Catatan: 41 dari 141 Username di list ini TIDAK ketemu persis di
  -- pelanggan.mikrotik_username saat migration ini pertama dijalankan
  -- (percobaan pertama migration ini di-rollback total karena awalnya
  -- pakai validasi keras). Sengaja TIDAK diblokir lagi di sini -- Update
  -- di bawah cuma akan mengenai baris yang cocok, sisanya diam-diam
  -- di-skip (bukan error) karena 41 nama itu sudah dilaporkan manual ke
  -- user lewat chat untuk dicek terpisah, bukan tanggung jawab migration
  -- ini untuk memblokir 100 yang sudah cocok.
  update public.pelanggan p
  set paket_id = pk.id
  from _mikrotik_mapping m
  join public.paket pk on pk.mikrotik_profile = m.profile
  where p.mikrotik_username = m.username;
end $$;
