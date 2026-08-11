# 08 — Migrasi data Pelanggan aktif + status periode berjalan

**What to build:** Migrasi satu kali (one-off script, bukan fitur UI permanen) yang mengisi `pelanggan.harga` untuk seluruh Pelanggan aktif dari data spreadsheet ("Customer dan tagihan KRISTEK"), lalu membuat baris `tagihan` untuk periode berjalan yang mencerminkan status Sudah/Belum Bayar mereka saat ini di spreadsheet. Histori periode-periode sebelumnya (Okt-25 dst.) **tidak** dimigrasi — tetap jadi arsip di spreadsheet.

**Blocked by:** 01 — Harga langganan per Pelanggan (Admin); 04 — Update status bayar (Sudah/Belum Bayar)

**Status:** ready-for-agent

- [ ] Script migrasi (dijalankan sekali, manual) membaca data Pelanggan aktif dari spreadsheet/CSV ekspor dan mengisi `pelanggan.harga` masing-masing
- [ ] Script membuat baris `tagihan` untuk periode berjalan per Pelanggan aktif, dengan `status_bayar` sesuai kondisi terakhir di spreadsheet saat migrasi dijalankan
- [ ] Pelanggan yang sudah tidak aktif di spreadsheet tidak dimigrasi
- [ ] Histori periode sebelum periode berjalan tidak dibuat di `tagihan` — hanya periode saat migrasi dijalankan
- [ ] Setelah migrasi, jumlah Pelanggan dan total omset di app dicocokkan manual terhadap angka Summary di spreadsheet sebelum lanjut ke tiket 09
