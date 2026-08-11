# Aplikasi Teknisi Internet Kristek

Aplikasi mobile internal untuk Kristek (penyedia layanan internet) yang mengelola pekerjaan teknisi lapangan — instalasi, perbaikan gangguan, dan maintenance — beserta dokumentasi foto dan laporan performa.

## Language

### Peran (Roles)

**Pemilik**:
Peran dengan akses super admin — kontrol penuh atas sistem, satu-satunya yang bisa menambah dan mengelola akun pengguna (Admin maupun Teknisi), punya visibilitas lintas Wilayah, dan mengakses Laporan Performa.
_Avoid_: Owner, Super Admin (gunakan "Pemilik" sebagai istilah baku)

**Admin**:
Peran operasional harian, dibatasi ke Wilayah yang ditugaskan — membuat Tiket, menugaskan Teknisi, dan bisa membatalkan Tiket. Tidak bisa menambah pengguna baru.
_Avoid_: Dispatcher, Operator

**Teknisi**:
Peran lapangan, dibatasi ke Wilayah yang ditugaskan — mengerjakan Tiket yang ditugaskan kepadanya, mencatat progres lewat tombol Start/End, dan mengunggah Bukti Foto.
_Avoid_: Field worker, Petugas

### Entitas Inti

**Tiket**:
Satu unit pekerjaan teknisi dengan `Jenis`: Instalasi, Gangguan-Komplain, atau Maintenance. Dibuat manual oleh Admin, ditugaskan ke satu atau lebih Teknisi, dan berjalan lewat alur Status sampai Selesai atau Dibatalkan. Field yang wajib diisi berbeda per Jenis:
- **Instalasi**: tidak memilih Pelanggan yang sudah ada — Admin langsung mengisi data Pelanggan baru (Nama, Alamat, No. HP, ODP, Paket) di form yang sama, dan sistem membuat baris Pelanggan + Tiket sekaligus.
- **Gangguan-Komplain**: memilih Pelanggan yang sudah ada (cari by nama/Nomor Pelanggan), plus `Keluhan` (teks bebas, wajib) — deskripsi masalah yang dilaporkan pelanggan.
- **Maintenance**: tidak terikat ke Pelanggan sama sekali — Admin memilih ODP yang sedang dikerjakan, plus `Deskripsi Pekerjaan` (teks bebas, wajib) — misal "migrasi kabel ke ODC baru".
_Avoid_: Task, Order, Job

**Pelanggan**:
Orang atau alamat yang menerima layanan Kristek, disimpan sebagai entitas tersendiri (Nama, Alamat, No. HP, Nomor Pelanggan, ODP asal, Paket) supaya bisa dipakai ulang di beberapa Tiket sepanjang riwayat servisnya.
_Avoid_: Customer, Client

**Paket**:
Produk kecepatan internet yang dilanggan seorang Pelanggan (misal "15 Mbps", "30 Mbps", "50 Mbps"). Satu katalog yang sama untuk seluruh Kristek — tidak terikat Wilayah, beda dari ODP. Hanya Pemilik yang bisa menambah Paket baru; Admin cuma memilih dari Paket yang sudah ada saat membuat Pelanggan.
_Avoid_: Plan, Langganan

**ODP**:
Titik distribusi fiber di lapangan (Optical Distribution Point) tempat sambungan seorang Pelanggan berasal, diidentifikasi dengan `Label` unik (Lokasi/alamat singkat, Wilayah). Dibuat oleh Admin (dibatasi ke Wilayah sendiri) atau Pemilik (bebas pilih Wilayah mana pun, sesuai visibilitas lintas Wilayah-nya); hapus ODP hanya bisa oleh Pemilik. Satu Pelanggan menunjuk ke satu ODP asal — Tiket tidak punya ODP sendiri, tapi mewarisi ODP lewat Pelanggan yang terkait. Tujuannya supaya Teknisi cepat tahu dari titik distribusi mana sambungan pelanggan itu berasal saat bekerja di lapangan.
_Avoid_: Distribution Point, Titik Distribusi

**Wilayah**:
Area operasional Kristek (saat ini satu kelurahan). Menentukan cakupan akses Admin dan Teknisi, serta dipilih manual oleh Admin saat membuat Tiket/Pelanggan/ODP — bukan dideteksi otomatis dari alamat.
_Avoid_: Region, Area, Cabang

**Bukti Foto**:
Dokumentasi wajib pada sebuah Tiket: foto "before" saat tombol Start ditekan, dan foto "after" saat tombol End ditekan. Berlaku sama untuk semua Jenis Tiket.
_Avoid_: Attachment, Lampiran

### Status Tiket

**Baru**:
Tiket baru dibuat Admin, belum ditugaskan ke Teknisi manapun.

**Ditugaskan**:
Satu atau lebih Teknisi sudah dipilih Admin untuk Tiket ini. Memicu notifikasi ke Teknisi yang ditugaskan.

**Dikerjakan**:
Teknisi sudah menekan tombol Start (satu tombol bersama untuk seluruh tim yang ditugaskan di Tiket ini). Jam kerja berjalan, terhitung sebagai durasi aktual.

**Pending**:
Pekerjaan berhenti sementara karena kendala di lapangan (misal menunggu material). Wajib disertai catatan (notes). Memicu notifikasi ke Admin dan Pemilik. Kembali ke Dikerjakan lewat tombol "Lanjut", dan jam kerja lanjut berjalan (tidak dihitung selama Pending).

**Selesai**:
Teknisi menekan tombol End setelah mengunggah Bukti Foto "after". Memicu notifikasi ke Admin dan Pemilik. Semua Teknisi yang ditugaskan di Tiket ini mendapat kredit performa yang sama.

**Dibatalkan**:
Tiket dihentikan sebelum selesai, hanya bisa diset oleh Admin atau Pemilik (misal salah input atau Pelanggan batal).

### Pengukuran & Pelaporan

**Durasi Kerja**:
Waktu aktual dari tombol Start sampai End (tidak termasuk waktu selama status Pending), dicatat per Tiket tanpa target/ambang baku — murni untuk pelaporan, bukan pembanding SLA formal.
_Avoid_: SLA (istilah ini dipakai longgar di awal proyek, tapi sebenarnya tidak ada target baku — jadi dihindari supaya tidak menyiratkan ada threshold)

**Laporan Performa**:
Ringkasan per Teknisi yang hanya diakses Pemilik: jumlah Tiket selesai, rata-rata Durasi Kerja, dan jumlah kali status Pending.

### Notifikasi

Semua notifikasi bersifat in-app (ikon lonceng) — tidak ada notifikasi email. Tiga pemicu: Tiket **Ditugaskan** (ke Teknisi terkait), Tiket **Pending** (ke Admin & Pemilik), dan Tiket **Selesai** (ke Admin & Pemilik).
