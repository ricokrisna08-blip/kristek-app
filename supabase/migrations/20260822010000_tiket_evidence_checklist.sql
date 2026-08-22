-- Checklist bukti (Redaman, ONT, Kabel & Jalur, Lokasi rumah pelanggan)
-- untuk Tiket Instalasi & Laporan Pelanggan (gangguan_komplain).
-- Menggantikan foto "after" generik untuk 2 jenis ini -- lihat
-- src/tiket/instalasiEvidence.ts untuk aturan lengkap-tidaknya.

alter table public.tiket_foto drop constraint if exists tiket_foto_type_check;
alter table public.tiket_foto add constraint tiket_foto_type_check
  check (type in ('before', 'after', 'redaman', 'ont', 'kabel_jalur'));

-- "Lokasi rumah pelanggan" cuma titik GPS, bukan foto -- disimpan
-- langsung di tiket, bukan tiket_foto (yang url-nya NOT NULL).
alter table public.tiket
  add column if not exists evidence_lokasi_latitude double precision,
  add column if not exists evidence_lokasi_longitude double precision,
  add column if not exists evidence_lokasi_captured_at timestamptz;
