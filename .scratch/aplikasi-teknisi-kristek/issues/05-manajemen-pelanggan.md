# 05 — Manajemen Pelanggan

**What to build:** Layar untuk Admin membuat Pelanggan baru (Nama, Alamat, No. HP, Wilayah, ODP asal, dengan Nomor Pelanggan auto-generate), mencari Pelanggan yang sudah ada (by nama atau Nomor Pelanggan), dan melihat riwayat Tiket seorang Pelanggan (kosong dulu sampai tiket 06 ada).

**Blocked by:** 01 — App scaffold, Supabase auth, dan login; 04 — Manajemen ODP (Admin)

**Status:** ready-for-agent

- [ ] Skema `pelanggan` (id, nama, alamat, no_hp, nomor_pelanggan unik auto-generate, wilayah_id, odp_id) dibuat
- [ ] Admin bisa membuat Pelanggan baru, memilih Wilayah dan ODP dari data yang sudah ada (dropdown ODP discope ke Wilayah yang dipilih)
- [ ] Nomor Pelanggan ter-generate otomatis dan unik, tidak diisi manual
- [ ] Admin bisa mencari Pelanggan berdasarkan Nama atau Nomor Pelanggan
- [ ] Admin dan Pemilik bisa membuka detail Pelanggan dan melihat daftar riwayat Tiket-nya (boleh tampil kosong untuk tiket ini, karena Tiket belum dibangun)
- [ ] Detail Pelanggan menampilkan Label ODP asalnya
