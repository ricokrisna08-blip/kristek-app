# 06 — Reminder notifikasi awal periode

**What to build:** Scheduled job (Supabase scheduled function / pg_cron) yang berjalan tiap tanggal 1, dan menyisipkan satu baris ke tabel `notifikasi` yang sudah ada (dipakai untuk notifikasi Tiket) dengan `type` baru: `tagihan_reminder`, dikirim ke Admin dan Pemilik. Job ini **hanya** membuat notifikasi pengingat — tidak memicu generate Tagihan itu sendiri (itu tetap aksi manual dari tiket 03).

**Blocked by:** 03 — Trigger "Generate Tagihan" dari UI + daftar Tagihan periode berjalan

**Status:** ready-for-agent

- [ ] Scheduled job berjalan otomatis tiap tanggal 1 tiap bulan
- [ ] Job membuat baris `notifikasi` baru dengan `type: tagihan_reminder` untuk setiap user berrole Admin dan Pemilik
- [ ] Notifikasi ini muncul di ikon lonceng yang sudah ada (infrastruktur notifikasi in-app dari app teknisi, dipakai ulang — bukan dibangun baru)
- [ ] Menekan notifikasi ini mengarahkan user ke layar billing (tiket 03)
- [ ] Job tidak membuat baris `tagihan` apa pun — murni notifikasi
