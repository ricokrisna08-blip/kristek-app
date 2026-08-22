-- Izinkan hapus akun Teknisi/Admin walau punya riwayat Tiket, selama
-- semua Tiket terkait sudah selesai/dibatalkan. Aturan "boleh/tidak"-nya
-- dicek di Edge Function delete-account; migration ini cuma melepas
-- FK RESTRICT yang selama ini bikin auth.admin.deleteUser() gagal di
-- level Postgres begitu public.users row-nya kena cascade-delete dari
-- auth.users, walau Tiket-nya sudah selesai sekalipun.

-- Snapshot nama, ditulis sekali di write-time (assignment/submit), bukan
-- di delete-time -- supaya laporan tetap utuh per-teknisi walau akunnya
-- sudah dihapus, tanpa perlu logic tambahan di Edge Function.
alter table public.tiket_teknisi add column if not exists teknisi_nama_snapshot text;
alter table public.pengajuan_cuti add column if not exists teknisi_nama_snapshot text;

-- Backfill data lama selagi akun-akunnya masih ada.
update public.tiket_teknisi tt
set teknisi_nama_snapshot = u.nama
from public.users u
where tt.teknisi_id = u.id and tt.teknisi_nama_snapshot is null;

update public.pengajuan_cuti pc
set teknisi_nama_snapshot = u.nama
from public.users u
where pc.teknisi_id = u.id and pc.teknisi_nama_snapshot is null;

-- Lepas FK RESTRICT-nya (nama constraint default Postgres:
-- <table>_<column>_fkey karena dibuat tanpa nama eksplisit di migration
-- awal) -- kolom id-nya TETAP ada & tetap bisa di-group per-teknisi,
-- cuma integritas referensialnya nggak dipaksa lagi, supaya baris
-- histori lama tidak nge-block penghapusan akun.
alter table public.tiket drop constraint if exists tiket_created_by_fkey;
alter table public.tiket drop constraint if exists tiket_dibatalkan_by_fkey;
alter table public.tiket_teknisi drop constraint if exists tiket_teknisi_teknisi_id_fkey;
alter table public.notifikasi drop constraint if exists notifikasi_user_id_fkey;
alter table public.pengajuan_cuti drop constraint if exists pengajuan_cuti_teknisi_id_fkey;
alter table public.tiket_status_log drop constraint if exists tiket_status_log_changed_by_fkey;
