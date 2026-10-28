# Backlog KateringKu

Backlog ini disusun dari implementasi yang tersedia di repository saat ini, bukan dari PRD terpisah. Tanda centang berarti fitur sudah ditemukan pada kode dan sudah diverifikasi; tanda silang berarti pekerjaan tersebut belum ditemukan dan masih menjadi backlog.

- ✅ Selesai
- ❌ Belum dikerjakan

Terakhir diperbarui: 27 Oktober 2026. Verifikasi yang mendasarinya: `npm run lint` 0 error, `npm run build` lulus, 89 test frontend lulus, 55 test backend lulus, dan seluruh halaman beserta alur ubah pesanan, cadangan data (unduh & pulihkan), pemilih tanggal produksi, serta tab Menu & Bahan dicek pada aplikasi berjalan.

## Selesai

### Ringkasan & pesanan

- ✅ Menampilkan ringkasan dashboard, termasuk pesanan hari ini, jumlah porsi, omzet dan laba bulanan, grafik omzet tujuh hari, serta menu terlaris.
- ✅ Mencatat pesanan dengan pelanggan, tanggal kirim, beberapa menu dan jumlah porsi, uang muka (DP), serta catatan.
- ✅ Menghitung tagihan, laba, sisa pembayaran, dan menyimpan snapshot harga jual serta HPP pada saat pesanan dibuat.
- ✅ Memantau pesanan dengan filter status, alur status baru → diproses → terkirim → lunas, dan aksi pembatalan atau penghapusan yang tersedia.
- ✅ Mengubah pesanan tersimpan (item menu, tanggal kirim, catatan, dan DP) lewat tombol Ubah pada kartu pesanan; edit parsial diperbolehkan, snapshot harga lama tetap dipakai, menu baru memakai harga berlaku, dan DP yang lebih besar dari total baru ditolak.

### Menu, bahan & produksi

- ✅ Mengelola menu dan resep, mengaktifkan atau menonaktifkan menu, serta menghitung HPP dan margin dari harga bahan.
- ✅ Menggabungkan pengelolaan bahan ke halaman Menu sebagai tab **Menu | Bahan** — resep dan bahan dikelola dalam satu tempat, halaman Bahan tersendiri dihapus, dan tautan lama `#bahan` otomatis dialihkan ke `#menu`.
- ✅ Menambah bahan baru langsung dari form menu (opsi "＋ Bahan baru" pada pilihan bahan): isi nama, satuan, dan harga, lalu bahan langsung terpilih pada baris resep tanpa berpindah halaman.
- ✅ Mengelola dan mencari bahan baku, termasuk satuan (kg, liter, butir) dan harga bahan; harga per kg/liter dikonversi ke satuan dasar dengan presisi 4 desimal sehingga HPP tidak meleset. Satuan pada baris resep ditampilkan mengikuti satuan bahan (kg/liter/butir) tanpa mengubah angka takaran maupun perhitungan HPP.
- ✅ Menghitung rekap produksi per tanggal dan jumlah porsi per menu, dengan pemilih tanggal bebas (`input type="date"`) sehingga tanggal mana pun bisa dipilih — lampau maupun akan datang — ditambah tombol hari sebelumnya/berikutnya dan "Hari ini".
- ✅ Menghitung daftar belanja dari pesanan dan resep dalam rentang tanggal, termasuk estimasi biaya dan peringatan menu tanpa resep.
- ✅ Menandai bahan yang sudah dibeli, menyalin daftar belanja untuk WhatsApp, dan mencetak daftar belanja.

### Pelanggan & autentikasi

- ✅ Mengelola data pelanggan secara mandiri: menambah, mengubah, menghapus, mencari, dan menyimpan nomor kontak.
- ✅ Autentikasi pengguna (register & login JWT), penjaga halaman login, dan sesi yang pulih otomatis dari penyimpanan perangkat saat panggilan server sementara gagal.

### Data, kualitas & pengujian

- ✅ Menyimpan data di backend (PostgreSQL/Neon) lewat REST API sehingga data terpusat dan dapat dipakai lintas perangkat; browser hanya menyimpan token sesi dan profil cadangan.
- ✅ Pencadangan dan pemulihan data lewat modal Cadangan Data di bilah samping: mengunduh seluruh data usaha (bahan, menu, resep, pelanggan, pesanan beserta snapshot harga) sebagai berkas JSON, dan memulihkannya kembali — pemulihan mengganti seluruh data usaha dengan isi berkas dalam satu transaksi, ID baru dibuat otomatis sehingga satu berkas aman dipulihkan berulang atau ke akun lain.
- ✅ Menyediakan navigasi halaman yang responsif untuk dashboard, pesanan, pelanggan, produksi, belanja, dan menu (bahan menjadi tab di dalam Menu).
- ✅ Validasi menyeluruh untuk input jumlah, harga (harus rupiah bulat tanpa desimal), takaran resep, dan DP agar nilai yang tidak valid tidak tersimpan; berkas cadangan juga divalidasi struktur dan keterhubungan datanya sebelum dipulihkan.
- ✅ Pengujian otomatis: 55 test backend (unit + integrasi API, termasuk alur ubah pesanan, cadangan, dan kelengkapan resep pada daftar menu) dan 89 test frontend (parser angka format Indonesia, konversi satuan, label satuan tampilan, HPP, daftar belanja, format rupiah, animasi angka, pemeriksaan berkas cadangan, serta format tanggal panjang untuk pemilih tanggal produksi).

## Belum dikerjakan

Tidak ada — seluruh butir backlog pada tinjauan ini sudah selesai dan diverifikasi per 27 Oktober 2026, termasuk ubah pesanan tersimpan, pencadangan dan pemulihan data, pemilih tanggal bebas pada halaman Produksi, serta penggabungan bahan ke halaman Menu (tab Menu & Bahan).

## Catatan

Daftar ini menggambarkan kondisi kode yang ditinjau, bukan klaim bahwa pekerjaan belum pernah dilakukan di luar repository. Perbarui tanda silang menjadi centang setelah implementasi terkait tersedia dan diverifikasi.
