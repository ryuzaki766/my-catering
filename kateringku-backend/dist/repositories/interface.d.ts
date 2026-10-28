import { User, Usaha, Bahan, Menu, ResepDetail, Pelanggan, PesananDetail, RekapProduksiItem, KebutuhanBahanItem, MenuTanpaResepItem, RingkasanBeranda, StatusPesanan, CadanganIsi, CadanganData, CadanganHasilImpor } from '../types/index.js';
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
    createUser(email: string, passwordHash: string): Promise<User>;
    findUserByEmail(email: string): Promise<User | null>;
    findUserById(id: string): Promise<User | null>;
    createUsaha(nama: string, userId: string): Promise<Usaha>;
    getUsahaByUserId(userId: string): Promise<Usaha | null>;
    getUsahaById(id: string): Promise<Usaha | null>;
    updateUsaha(id: string, nama: string): Promise<Usaha>;
    getBahanList(usahaId: string): Promise<Bahan[]>;
    getBahanById(usahaId: string, id: string): Promise<Bahan | null>;
    getBahanByNama(usahaId: string, nama: string): Promise<Bahan | null>;
    createBahan(usahaId: string, data: Omit<Bahan, 'id' | 'usaha_id'>): Promise<Bahan>;
    updateBahan(usahaId: string, id: string, data: Partial<Omit<Bahan, 'id' | 'usaha_id'>>): Promise<Bahan>;
    deleteBahan(usahaId: string, id: string): Promise<boolean>;
    isBahanUsedInResep(usahaId: string, bahanId: string): Promise<boolean>;
    getMenuList(usahaId: string): Promise<Menu[]>;
    getMenuById(usahaId: string, id: string): Promise<Menu | null>;
    getMenuByNama(usahaId: string, nama: string): Promise<Menu | null>;
    createMenu(usahaId: string, data: Omit<Menu, 'id' | 'usaha_id'>): Promise<Menu>;
    updateMenu(usahaId: string, id: string, data: Partial<Omit<Menu, 'id' | 'usaha_id'>>): Promise<Menu>;
    deleteMenu(usahaId: string, id: string): Promise<boolean>;
    getResepByMenuId(usahaId: string, menuId: string): Promise<ResepDetail[]>;
    setResepForMenu(usahaId: string, menuId: string, items: Array<{
        bahan_id: string;
        takaran: number;
    }>): Promise<ResepDetail[]>;
    deleteResepItem(usahaId: string, menuId: string, bahanId: string): Promise<boolean>;
    getPelangganList(usahaId: string): Promise<Pelanggan[]>;
    getPelangganById(usahaId: string, id: string): Promise<Pelanggan | null>;
    createPelanggan(usahaId: string, data: Omit<Pelanggan, 'id' | 'usaha_id'>): Promise<Pelanggan>;
    updatePelanggan(usahaId: string, id: string, data: Partial<Omit<Pelanggan, 'id' | 'usaha_id'>>): Promise<Pelanggan>;
    deletePelanggan(usahaId: string, id: string): Promise<boolean>;
    getPesananList(usahaId: string, filters?: {
        tanggal?: string;
        mulai?: string;
        akhir?: string;
        status?: StatusPesanan;
    }): Promise<PesananDetail[]>;
    getPesananById(usahaId: string, id: string): Promise<PesananDetail | null>;
    buatPesananAtomik(input: BuatPesananInput): Promise<PesananDetail>;
    ubahPesananAtomik(usahaId: string, id: string, input: UbahPesananInput): Promise<PesananDetail>;
    updateStatusPesanan(usahaId: string, id: string, status: StatusPesanan): Promise<PesananDetail>;
    deletePesanan(usahaId: string, id: string): Promise<boolean>;
    rekapProduksi(usahaId: string, mulai: string, akhir: string): Promise<RekapProduksiItem[]>;
    kebutuhanBahan(usahaId: string, mulai: string, akhir: string): Promise<KebutuhanBahanItem[]>;
    menuTanpaResep(usahaId: string, mulai: string, akhir: string): Promise<MenuTanpaResepItem[]>;
    ringkasanBeranda(usahaId: string, tanggal?: string): Promise<RingkasanBeranda>;
    isiContohData(usahaId: string): Promise<void>;
    eksporCadangan(usahaId: string): Promise<CadanganIsi>;
    imporCadangan(usahaId: string, data: CadanganData): Promise<CadanganHasilImpor>;
}
