import {
  User,
  Usaha,
  Anggota,
  Bahan,
  Menu,
  Resep,
  ResepDetail,
  Pelanggan,
  Pesanan,
  ItemPesanan,
  PesananDetail,
  RekapProduksiItem,
  KebutuhanBahanItem,
  MenuTanpaResepItem,
  RingkasanBeranda,
  StatusPesanan,
  CadanganIsi,
  CadanganData,
  CadanganHasilImpor,
} from '../types/index.js';

export interface BuatPesananInput {
  usaha_id: string;
  nama_pelanggan: string;
  tanggal_kirim: string;
  pelanggan_id?: string | null;
  dp?: number;
  catatan?: string | null;
  items: Array<{
    menu_id: string;
    jumlah: number;
  }>;
}

// Field yang tidak dikirim dipertahankan apa adanya (edit parsial)
export interface UbahPesananInput {
  nama_pelanggan?: string;
  tanggal_kirim?: string;
  pelanggan_id?: string | null;
  dp?: number;
  catatan?: string | null;
  items?: Array<{
    menu_id: string;
    jumlah: number;
  }>;
}

export interface IRepository {
  // Auth & Usaha
  createUser(email: string, passwordHash: string): Promise<User>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUsaha(nama: string, userId: string): Promise<Usaha>;
  getUsahaByUserId(userId: string): Promise<Usaha | null>;
  getUsahaById(id: string): Promise<Usaha | null>;
  updateUsaha(id: string, nama: string): Promise<Usaha>;

  // Bahan (US-02)
  getBahanList(usahaId: string): Promise<Bahan[]>;
  getBahanById(usahaId: string, id: string): Promise<Bahan | null>;
  getBahanByNama(usahaId: string, nama: string): Promise<Bahan | null>;
  createBahan(usahaId: string, data: Omit<Bahan, 'id' | 'usaha_id'>): Promise<Bahan>;
  updateBahan(usahaId: string, id: string, data: Partial<Omit<Bahan, 'id' | 'usaha_id'>>): Promise<Bahan>;
  deleteBahan(usahaId: string, id: string): Promise<boolean>;
  isBahanUsedInResep(usahaId: string, bahanId: string): Promise<boolean>;

  // Menu (US-03)
  getMenuList(usahaId: string): Promise<Menu[]>;
  getMenuById(usahaId: string, id: string): Promise<Menu | null>;
  getMenuByNama(usahaId: string, nama: string): Promise<Menu | null>;
  createMenu(usahaId: string, data: Omit<Menu, 'id' | 'usaha_id'>): Promise<Menu>;
  updateMenu(usahaId: string, id: string, data: Partial<Omit<Menu, 'id' | 'usaha_id'>>): Promise<Menu>;
  deleteMenu(usahaId: string, id: string): Promise<boolean>;

  // Resep (US-03)
  getResepByMenuId(usahaId: string, menuId: string): Promise<ResepDetail[]>;
  setResepForMenu(usahaId: string, menuId: string, items: Array<{ bahan_id: string; takaran: number }>): Promise<ResepDetail[]>;
  deleteResepItem(usahaId: string, menuId: string, bahanId: string): Promise<boolean>;

  // Pelanggan
  getPelangganList(usahaId: string): Promise<Pelanggan[]>;
  getPelangganById(usahaId: string, id: string): Promise<Pelanggan | null>;
  createPelanggan(usahaId: string, data: Omit<Pelanggan, 'id' | 'usaha_id'>): Promise<Pelanggan>;
  updatePelanggan(usahaId: string, id: string, data: Partial<Omit<Pelanggan, 'id' | 'usaha_id'>>): Promise<Pelanggan>;
  deletePelanggan(usahaId: string, id: string): Promise<boolean>;

  // Pesanan (US-04, US-08)
  getPesananList(
    usahaId: string,
    filters?: {
      tanggal?: string;
      mulai?: string;
      akhir?: string;
      status?: StatusPesanan;
    }
  ): Promise<PesananDetail[]>;
  getPesananById(usahaId: string, id: string): Promise<PesananDetail | null>;
  buatPesananAtomik(input: BuatPesananInput): Promise<PesananDetail>;
  ubahPesananAtomik(usahaId: string, id: string, input: UbahPesananInput): Promise<PesananDetail>;
  updateStatusPesanan(usahaId: string, id: string, status: StatusPesanan): Promise<PesananDetail>;
  deletePesanan(usahaId: string, id: string): Promise<boolean>;

  // Rekap Produksi & Kebutuhan Bahan (US-05, US-06)
  rekapProduksi(usahaId: string, mulai: string, akhir: string): Promise<RekapProduksiItem[]>;
  kebutuhanBahan(usahaId: string, mulai: string, akhir: string): Promise<KebutuhanBahanItem[]>;
  menuTanpaResep(usahaId: string, mulai: string, akhir: string): Promise<MenuTanpaResepItem[]>;

  // Beranda / Dashboard (US-10)
  ringkasanBeranda(usahaId: string, tanggal?: string): Promise<RingkasanBeranda>;

  // Onboarding (isi_contoh_data)
  isiContohData(usahaId: string): Promise<void>;

  // Cadangan & Pemulihan Data
  eksporCadangan(usahaId: string): Promise<CadanganIsi>;
  imporCadangan(usahaId: string, data: CadanganData): Promise<CadanganHasilImpor>;
}
