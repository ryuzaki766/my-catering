export type SatuanDasar = 'g' | 'ml' | 'butir';

export type StatusPesanan = 'baru' | 'diproses' | 'terkirim' | 'lunas' | 'batal';

export type PeranAnggota = 'pemilik' | 'staf';

export interface Usaha {
  id: string;
  nama: string;
  dibuat_pada: string;
}

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  dibuat_pada?: string;
}

export interface Anggota {
  user_id: string;
  usaha_id: string;
  peran: PeranAnggota;
}

export interface Bahan {
  id: string;
  usaha_id: string;
  nama: string;
  satuan: SatuanDasar;
  harga_per_satuan: number;
}

export interface Menu {
  id: string;
  usaha_id: string;
  nama: string;
  harga_jual: number;
  aktif: boolean;
}

export interface Resep {
  id: string;
  usaha_id: string;
  menu_id: string;
  bahan_id: string;
  takaran: number;
}

export interface ResepDetail extends Resep {
  bahan_nama?: string;
  satuan?: SatuanDasar;
  harga_per_satuan?: number;
  subtotal_hpp?: number;
}

export interface MenuDetail extends Menu {
  hpp: number;
  laba_kotor: number;
  margin_persen: number;
  resep?: ResepDetail[];
}

export interface Pelanggan {
  id: string;
  usaha_id: string;
  nama: string;
  kontak?: string | null;
}

export interface Pesanan {
  id: string;
  usaha_id: string;
  pelanggan_id?: string | null;
  nama_pelanggan: string;
  tanggal_kirim: string; // YYYY-MM-DD
  status: StatusPesanan;
  dp: number;
  catatan?: string | null;
  dibuat_pada: string;
}

export interface ItemPesanan {
  id: string;
  usaha_id: string;
  pesanan_id: string;
  menu_id: string;
  jumlah: number;
  harga_jual_snapshot: number;
  hpp_snapshot: number;
  menu_nama?: string;
}

export interface PesananDetail extends Pesanan {
  items: ItemPesanan[];
  total_harga: number;
  total_hpp: number;
  laba_kotor: number;
  sisa_bayar: number;
}

export interface RekapProduksiItem {
  menu_id: string;
  nama: string;
  total_porsi: number;
  pesanan_terkait?: Array<{
    pesanan_id: string;
    nama_pelanggan: string;
    jumlah: number;
    status: StatusPesanan;
  }>;
}

export interface KebutuhanBahanItem {
  bahan_id: string;
  nama: string;
  satuan_dasar: SatuanDasar;
  total_dasar: number;
  satuan_tampilan: string;
  total_tampilan: number;
  tampilan_ramah: string; // contoh: "25,5 kg" atau "50 butir"
  biaya: number;
}

export interface MenuTanpaResepItem {
  menu_id: string;
  nama: string;
}

export interface RingkasanBeranda {
  pesanan_hari_ini: number;
  porsi_hari_ini: number;
  omzet_bulan_ini: number;
  laba_kotor_bulan_ini: number;
  pesanan_terdekat: PesananDetail[];
}

export interface DaftarBelanjaResponse {
  rentang: {
    mulai: string;
    akhir: string;
  };
  kebutuhan: KebutuhanBahanItem[];
  total_biaya: number;
  menu_tanpa_resep: MenuTanpaResepItem[];
  teks_whatsapp: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
  };
  usaha: Usaha;
  token: string;
}

// ===== Cadangan & Pemulihan Data (ekspor/impor) =====
// Versi skema berkas cadangan; naikkan bila struktur berubah secara tak kompatibel
export const CADANGAN_VERSI = 1;

/** Isi mentah cadangan (koleksi data milik satu usaha) */
export interface CadanganIsi {
  usaha: { nama: string } | null;
  bahan: Bahan[];
  menu: Menu[];
  resep: ResepDetail[];
  pelanggan: Pelanggan[];
  pesanan: PesananDetail[];
}

/** Berkas cadangan lengkap yang diunduh/diunggah */
export interface CadanganData extends CadanganIsi {
  versi: number;
  diekspor_pada: string;
}

/** Ringkasan hasil pemulihan data */
export interface CadanganHasilImpor {
  bahan: number;
  menu: number;
  resep: number;
  pelanggan: number;
  pesanan: number;
}
