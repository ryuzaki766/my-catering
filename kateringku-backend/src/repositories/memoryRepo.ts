import crypto from 'crypto';
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
import { IRepository, BuatPesananInput, UbahPesananInput } from './interface.js';
import { hitungHpp, konversiSatuan } from '../utils/hitung.js';
import { AppError } from '../utils/response.js';

export class MemoryRepository implements IRepository {
  private users: Map<string, User> = new Map();
  private usaha: Map<string, Usaha> = new Map();
  private anggota: Map<string, Anggota> = new Map(); // key: user_id
  private bahan: Map<string, Bahan> = new Map();
  private menu: Map<string, Menu> = new Map();
  private resep: Map<string, Resep> = new Map();
  private pelanggan: Map<string, Pelanggan> = new Map();
  private pesanan: Map<string, Pesanan> = new Map();
  private itemPesanan: Map<string, ItemPesanan> = new Map();

  // Helper ID generator
  private uuid(): string {
    return crypto.randomUUID();
  }

  // Helper: HPP Menu
  private hitungHppMenu(usahaId: string, menuId: string): number {
    const resepItems = Array.from(this.resep.values()).filter(
      (r) => r.usaha_id === usahaId && r.menu_id === menuId
    );
    const items = resepItems.map((r) => {
      const b = this.bahan.get(r.bahan_id);
      return {
        takaran: r.takaran,
        harga_per_satuan: b?.usaha_id === usahaId ? b.harga_per_satuan : 0,
      };
    });
    return hitungHpp(items);
  }

  // --- Auth & Usaha ---
  async createUser(email: string, passwordHash: string): Promise<User> {
    const existing = await this.findUserByEmail(email);
    if (existing) {
      throw new AppError('Email sudah terdaftar', 400);
    }
    const user: User = {
      id: this.uuid(),
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      dibuat_pada: new Date().toISOString(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const norm = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email === norm) return { ...u };
    }
    return null;
  }

  async findUserById(id: string): Promise<User | null> {
    const u = this.users.get(id);
    return u ? { ...u } : null;
  }

  async createUsaha(nama: string, userId: string): Promise<Usaha> {
    // SEC-06: 1 user hanya boleh 1 usaha
    if (this.anggota.has(userId)) {
      throw new AppError('Pengguna sudah punya usaha', 400);
    }
    const u: Usaha = {
      id: this.uuid(),
      nama: nama.trim(),
      dibuat_pada: new Date().toISOString(),
    };
    this.usaha.set(u.id, u);
    this.anggota.set(userId, {
      user_id: userId,
      usaha_id: u.id,
      peran: 'pemilik',
    });
    return { ...u };
  }

  async getUsahaByUserId(userId: string): Promise<Usaha | null> {
    const link = this.anggota.get(userId);
    if (!link) return null;
    const u = this.usaha.get(link.usaha_id);
    return u ? { ...u } : null;
  }

  async getUsahaById(id: string): Promise<Usaha | null> {
    const u = this.usaha.get(id);
    return u ? { ...u } : null;
  }

  async updateUsaha(id: string, nama: string): Promise<Usaha> {
    const u = this.usaha.get(id);
    if (!u) throw new AppError('Usaha tidak ditemukan', 404);
    u.nama = nama.trim();
    return { ...u };
  }

  // --- Bahan (US-02) ---
  async getBahanList(usahaId: string): Promise<Bahan[]> {
    return Array.from(this.bahan.values())
      .filter((b) => b.usaha_id === usahaId)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }

  async getBahanById(usahaId: string, id: string): Promise<Bahan | null> {
    const b = this.bahan.get(id);
    return b && b.usaha_id === usahaId ? { ...b } : null;
  }

  async getBahanByNama(usahaId: string, nama: string): Promise<Bahan | null> {
    const norm = nama.trim().toLowerCase();
    for (const b of this.bahan.values()) {
      if (b.usaha_id === usahaId && b.nama.trim().toLowerCase() === norm) {
        return { ...b };
      }
    }
    return null;
  }

  async createBahan(usahaId: string, data: Omit<Bahan, 'id' | 'usaha_id'>): Promise<Bahan> {
    const existing = await this.getBahanByNama(usahaId, data.nama);
    if (existing) {
      throw new AppError(`Bahan dengan nama "${data.nama}" sudah ada`, 400);
    }
    const b: Bahan = {
      id: this.uuid(),
      usaha_id: usahaId,
      nama: data.nama.trim(),
      satuan: data.satuan,
      harga_per_satuan: data.harga_per_satuan,
    };
    this.bahan.set(b.id, b);
    return { ...b };
  }

  async updateBahan(
    usahaId: string,
    id: string,
    data: Partial<Omit<Bahan, 'id' | 'usaha_id'>>
  ): Promise<Bahan> {
    const b = await this.getBahanById(usahaId, id);
    if (!b) throw new AppError('Bahan tidak ditemukan', 404);

    if (data.nama && data.nama.trim().toLowerCase() !== b.nama.toLowerCase()) {
      const dup = await this.getBahanByNama(usahaId, data.nama);
      if (dup && dup.id !== id) {
        throw new AppError(`Bahan dengan nama "${data.nama}" sudah ada`, 400);
      }
      b.nama = data.nama.trim();
    }
    if (data.satuan) b.satuan = data.satuan;
    if (data.harga_per_satuan !== undefined) {
      if (data.harga_per_satuan < 0) throw new AppError('Harga tidak boleh negatif', 400);
      b.harga_per_satuan = data.harga_per_satuan;
    }

    this.bahan.set(id, b);
    return { ...b };
  }

  async deleteBahan(usahaId: string, id: string): Promise<boolean> {
    const b = await this.getBahanById(usahaId, id);
    if (!b) return false;

    // TC-10: Cek apakah dipakai di resep
    const isUsed = await this.isBahanUsedInResep(usahaId, id);
    if (isUsed) {
      throw new AppError('Bahan tidak bisa dihapus karena masih digunakan dalam resep menu', 400);
    }
    return this.bahan.delete(id);
  }

  async isBahanUsedInResep(usahaId: string, bahanId: string): Promise<boolean> {
    for (const r of this.resep.values()) {
      if (r.usaha_id === usahaId && r.bahan_id === bahanId) {
        return true;
      }
    }
    return false;
  }

  // --- Menu (US-03) ---
  async getMenuList(usahaId: string): Promise<Menu[]> {
    return Array.from(this.menu.values())
      .filter((m) => m.usaha_id === usahaId)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }

  async getMenuById(usahaId: string, id: string): Promise<Menu | null> {
    const m = this.menu.get(id);
    return m && m.usaha_id === usahaId ? { ...m } : null;
  }

  async getMenuByNama(usahaId: string, nama: string): Promise<Menu | null> {
    const norm = nama.trim().toLowerCase();
    for (const m of this.menu.values()) {
      if (m.usaha_id === usahaId && m.nama.trim().toLowerCase() === norm) {
        return { ...m };
      }
    }
    return null;
  }

  async createMenu(usahaId: string, data: Omit<Menu, 'id' | 'usaha_id'>): Promise<Menu> {
    const existing = await this.getMenuByNama(usahaId, data.nama);
    if (existing) {
      throw new AppError(`Menu dengan nama "${data.nama}" sudah ada`, 400);
    }
    const m: Menu = {
      id: this.uuid(),
      usaha_id: usahaId,
      nama: data.nama.trim(),
      harga_jual: data.harga_jual,
      aktif: data.aktif ?? true,
    };
    this.menu.set(m.id, m);
    return { ...m };
  }

  async updateMenu(
    usahaId: string,
    id: string,
    data: Partial<Omit<Menu, 'id' | 'usaha_id'>>
  ): Promise<Menu> {
    const m = await this.getMenuById(usahaId, id);
    if (!m) throw new AppError('Menu tidak ditemukan', 404);

    if (data.nama && data.nama.trim().toLowerCase() !== m.nama.toLowerCase()) {
      const dup = await this.getMenuByNama(usahaId, data.nama);
      if (dup && dup.id !== id) {
        throw new AppError(`Menu dengan nama "${data.nama}" sudah ada`, 400);
      }
      m.nama = data.nama.trim();
    }
    if (data.harga_jual !== undefined) {
      if (data.harga_jual < 0) throw new AppError('Harga jual tidak boleh negatif', 400);
      m.harga_jual = data.harga_jual;
    }
    if (data.aktif !== undefined) {
      m.aktif = data.aktif;
    }

    this.menu.set(id, m);
    return { ...m };
  }

  async deleteMenu(usahaId: string, id: string): Promise<boolean> {
    const m = await this.getMenuById(usahaId, id);
    if (!m) return false;

    // Hapus juga resep terkait secara cascade
    for (const [rId, r] of this.resep.entries()) {
      if (r.usaha_id === usahaId && r.menu_id === id) {
        this.resep.delete(rId);
      }
    }
    return this.menu.delete(id);
  }

  // --- Resep (US-03) ---
  async getResepByMenuId(usahaId: string, menuId: string): Promise<ResepDetail[]> {
    const list: ResepDetail[] = [];
    for (const r of this.resep.values()) {
      if (r.usaha_id === usahaId && r.menu_id === menuId) {
        const b = this.bahan.get(r.bahan_id);
        const subtotal = (b?.harga_per_satuan || 0) * r.takaran;
        list.push({
          ...r,
          bahan_nama: b?.nama,
          satuan: b?.satuan,
          harga_per_satuan: b?.harga_per_satuan,
          subtotal_hpp: subtotal,
        });
      }
    }
    return list;
  }

  async setResepForMenu(
    usahaId: string,
    menuId: string,
    items: Array<{ bahan_id: string; takaran: number }>
  ): Promise<ResepDetail[]> {
    const m = await this.getMenuById(usahaId, menuId);
    if (!m) throw new AppError('Menu tidak ditemukan', 404);

    // Cek duplikasi bahan di dalam list item (TC-09)
    const seenBahan = new Set<string>();
    for (const item of items) {
      if (seenBahan.has(item.bahan_id)) {
        throw new AppError('Bahan yang sama tidak boleh dimasukkan dua kali dalam satu resep', 400);
      }
      seenBahan.add(item.bahan_id);

      const b = await this.getBahanById(usahaId, item.bahan_id);
      if (!b) {
        throw new AppError(`Bahan dengan ID ${item.bahan_id} tidak ditemukan`, 404);
      }
      if (item.takaran <= 0) {
        throw new AppError('Takaran harus lebih dari 0', 400);
      }
    }

    // Hapus resep lama menu ini
    for (const [rId, r] of this.resep.entries()) {
      if (r.usaha_id === usahaId && r.menu_id === menuId) {
        this.resep.delete(rId);
      }
    }

    // Masukkan resep baru
    for (const item of items) {
      const r: Resep = {
        id: this.uuid(),
        usaha_id: usahaId,
        menu_id: menuId,
        bahan_id: item.bahan_id,
        takaran: item.takaran,
      };
      this.resep.set(r.id, r);
    }

    return this.getResepByMenuId(usahaId, menuId);
  }

  async deleteResepItem(usahaId: string, menuId: string, bahanId: string): Promise<boolean> {
    for (const [rId, r] of this.resep.entries()) {
      if (r.usaha_id === usahaId && r.menu_id === menuId && r.bahan_id === bahanId) {
        return this.resep.delete(rId);
      }
    }
    return false;
  }

  // --- Pelanggan ---
  async getPelangganList(usahaId: string): Promise<Pelanggan[]> {
    return Array.from(this.pelanggan.values())
      .filter((p) => p.usaha_id === usahaId)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }

  async getPelangganById(usahaId: string, id: string): Promise<Pelanggan | null> {
    const p = this.pelanggan.get(id);
    return p && p.usaha_id === usahaId ? { ...p } : null;
  }

  async createPelanggan(usahaId: string, data: Omit<Pelanggan, 'id' | 'usaha_id'>): Promise<Pelanggan> {
    const p: Pelanggan = {
      id: this.uuid(),
      usaha_id: usahaId,
      nama: data.nama.trim(),
      kontak: data.kontak || null,
    };
    this.pelanggan.set(p.id, p);
    return { ...p };
  }

  async updatePelanggan(
    usahaId: string,
    id: string,
    data: Partial<Omit<Pelanggan, 'id' | 'usaha_id'>>
  ): Promise<Pelanggan> {
    const p = await this.getPelangganById(usahaId, id);
    if (!p) throw new AppError('Pelanggan tidak ditemukan', 404);
    if (data.nama) p.nama = data.nama.trim();
    if (data.kontak !== undefined) p.kontak = data.kontak;
    this.pelanggan.set(id, p);
    return { ...p };
  }

  async deletePelanggan(usahaId: string, id: string): Promise<boolean> {
    const p = await this.getPelangganById(usahaId, id);
    if (!p) return false;
    return this.pelanggan.delete(id);
  }

  // --- Pesanan (US-04, US-08) ---
  private buildPesananDetail(p: Pesanan): PesananDetail {
    const items = Array.from(this.itemPesanan.values())
      .filter((ip) => ip.pesanan_id === p.id && ip.usaha_id === p.usaha_id)
      .map((ip) => {
        const m = this.menu.get(ip.menu_id);
        return {
          ...ip,
          menu_nama: m?.nama || 'Menu Tidak Diketahui',
        };
      });

    const totalHarga = items.reduce((acc, i) => acc + i.jumlah * i.harga_jual_snapshot, 0);
    const totalHpp = items.reduce((acc, i) => acc + i.jumlah * i.hpp_snapshot, 0);
    const labaKotor = totalHarga - totalHpp;
    const sisaBayar = Math.max(0, totalHarga - p.dp);

    return {
      ...p,
      items,
      total_harga: totalHarga,
      total_hpp: totalHpp,
      laba_kotor: labaKotor,
      sisa_bayar: sisaBayar,
    };
  }

  async getPesananList(
    usahaId: string,
    filters?: {
      tanggal?: string;
      mulai?: string;
      akhir?: string;
      status?: StatusPesanan;
    }
  ): Promise<PesananDetail[]> {
    let list = Array.from(this.pesanan.values()).filter((p) => p.usaha_id === usahaId);

    if (filters?.tanggal) {
      list = list.filter((p) => p.tanggal_kirim === filters.tanggal);
    }
    if (filters?.mulai && filters?.akhir) {
      list = list.filter(
        (p) => p.tanggal_kirim >= filters.mulai! && p.tanggal_kirim <= filters.akhir!
      );
    }
    if (filters?.status) {
      list = list.filter((p) => p.status === filters.status);
    }

    // Urutkan berdasarkan tanggal_kirim menaik
    list.sort((a, b) => a.tanggal_kirim.localeCompare(b.tanggal_kirim));

    return list.map((p) => this.buildPesananDetail(p));
  }

  async getPesananById(usahaId: string, id: string): Promise<PesananDetail | null> {
    const p = this.pesanan.get(id);
    if (!p || p.usaha_id !== usahaId) return null;
    return this.buildPesananDetail(p);
  }

  /**
   * Pembuatan pesanan atomik (US-04 & TC-11..14)
   */
  async buatPesananAtomik(input: BuatPesananInput): Promise<PesananDetail> {
    const { usaha_id, nama_pelanggan, tanggal_kirim, pelanggan_id, dp = 0, catatan, items } = input;

    // Validasi dasar
    if (!nama_pelanggan || !nama_pelanggan.trim()) {
      throw new AppError('Nama pelanggan wajib diisi', 400);
    }
    if (!tanggal_kirim) {
      throw new AppError('Tanggal kirim wajib diisi', 400);
    }
    if (!items || items.length === 0) {
      throw new AppError('Isi minimal satu menu', 400);
    }
    if (dp < 0) {
      throw new AppError('DP tidak boleh negatif', 400);
    }

    let calculatedTotal = 0;
    const resolvedItems: Array<{
      menu: Menu;
      jumlah: number;
      hppSnapshot: number;
    }> = [];

    for (const item of items) {
      if (!item.jumlah || item.jumlah <= 0) {
        throw new AppError('Jumlah tiap menu harus lebih dari 0', 400);
      }
      const m = await this.getMenuById(usaha_id, item.menu_id);
      if (!m || !m.aktif) {
        throw new AppError('Ada menu yang tidak ditemukan atau tidak aktif', 400);
      }
      calculatedTotal += item.jumlah * m.harga_jual;
      const hppSnap = this.hitungHppMenu(usaha_id, m.id);
      resolvedItems.push({
        menu: m,
        jumlah: item.jumlah,
        hppSnapshot: hppSnap,
      });
    }

    // DP tidak boleh melebihi total pesanan (TC-13)
    if (dp > calculatedTotal) {
      throw new AppError('DP melebihi total pesanan', 400);
    }

    // Simpan pesanan secara atomik
    const pesananId = this.uuid();
    const p: Pesanan = {
      id: pesananId,
      usaha_id,
      pelanggan_id: pelanggan_id || null,
      nama_pelanggan: nama_pelanggan.trim(),
      tanggal_kirim,
      status: 'baru',
      dp,
      catatan: catatan || null,
      dibuat_pada: new Date().toISOString(),
    };
    this.pesanan.set(p.id, p);

    // Simpan item pesanan dengan snapshot harga jual dan HPP (TC-23)
    for (const rItem of resolvedItems) {
      const ip: ItemPesanan = {
        id: this.uuid(),
        usaha_id,
        pesanan_id: pesananId,
        menu_id: rItem.menu.id,
        jumlah: rItem.jumlah,
        harga_jual_snapshot: rItem.menu.harga_jual,
        hpp_snapshot: rItem.hppSnapshot,
      };
      this.itemPesanan.set(ip.id, ip);
    }

    return this.buildPesananDetail(p);
  }

  async ubahPesananAtomik(usahaId: string, id: string, input: UbahPesananInput): Promise<PesananDetail> {
    const { nama_pelanggan, tanggal_kirim, pelanggan_id, dp, catatan, items } = input;

    const lama = this.pesanan.get(id);
    if (!lama || lama.usaha_id !== usahaId) {
      throw new AppError('Pesanan tidak ditemukan', 404);
    }
    if (nama_pelanggan !== undefined && !nama_pelanggan.trim()) {
      throw new AppError('Nama pelanggan wajib diisi', 400);
    }
    if (tanggal_kirim !== undefined && !tanggal_kirim) {
      throw new AppError('Tanggal kirim wajib diisi', 400);
    }

    const itemsLama = Array.from(this.itemPesanan.values()).filter((ip) => ip.pesanan_id === id);

    // Snapshot lama: harga jual & HPP saat pesanan dibuat tetap dipakai
    // untuk menu yang sudah ada, agar riwayat laba tidak berubah retroaktif (TC-23)
    const snapshotLama = new Map(
      itemsLama.map((i) => [i.menu_id, { hargaJual: i.harga_jual_snapshot, hpp: i.hpp_snapshot }])
    );

    // Item hasil edit; jika tidak dikirim, item lama dipertahankan
    const itemsFinal = items ?? itemsLama.map((i) => ({ menu_id: i.menu_id, jumlah: i.jumlah }));
    if (itemsFinal.length === 0) {
      throw new AppError('Isi minimal satu menu', 400);
    }

    let totalBaru = 0;
    const resolvedItems: Array<{
      menuId: string;
      jumlah: number;
      hargaJual: number;
      hppSnapshot: number;
    }> = [];

    for (const item of itemsFinal) {
      if (!item.jumlah || item.jumlah <= 0) {
        throw new AppError('Jumlah tiap menu harus lebih dari 0', 400);
      }

      const snap = snapshotLama.get(item.menu_id);
      if (snap) {
        totalBaru += item.jumlah * snap.hargaJual;
        resolvedItems.push({
          menuId: item.menu_id,
          jumlah: item.jumlah,
          hargaJual: snap.hargaJual,
          hppSnapshot: snap.hpp,
        });
        continue;
      }

      const m = await this.getMenuById(usahaId, item.menu_id);
      if (!m || !m.aktif) {
        throw new AppError('Ada menu yang tidak ditemukan atau tidak aktif', 400);
      }
      const hppSnap = this.hitungHppMenu(usahaId, m.id);
      totalBaru += item.jumlah * m.harga_jual;
      resolvedItems.push({
        menuId: m.id,
        jumlah: item.jumlah,
        hargaJual: m.harga_jual,
        hppSnapshot: hppSnap,
      });
    }

    const dpFinal = dp ?? lama.dp;
    if (dpFinal > totalBaru) {
      throw new AppError('DP melebihi total pesanan', 400);
    }

    lama.pelanggan_id = pelanggan_id !== undefined ? pelanggan_id : lama.pelanggan_id;
    lama.nama_pelanggan = nama_pelanggan !== undefined ? nama_pelanggan.trim() : lama.nama_pelanggan;
    lama.tanggal_kirim = tanggal_kirim !== undefined ? tanggal_kirim : lama.tanggal_kirim;
    lama.dp = dpFinal;
    lama.catatan = catatan !== undefined ? catatan || null : lama.catatan;
    this.pesanan.set(id, lama);

    for (const [ipId, ip] of this.itemPesanan.entries()) {
      if (ip.pesanan_id === id) {
        this.itemPesanan.delete(ipId);
      }
    }
    for (const r of resolvedItems) {
      const ip: ItemPesanan = {
        id: this.uuid(),
        usaha_id: usahaId,
        pesanan_id: id,
        menu_id: r.menuId,
        jumlah: r.jumlah,
        harga_jual_snapshot: r.hargaJual,
        hpp_snapshot: r.hppSnapshot,
      };
      this.itemPesanan.set(ip.id, ip);
    }

    return this.buildPesananDetail(lama);
  }

  async updateStatusPesanan(usahaId: string, id: string, status: StatusPesanan): Promise<PesananDetail> {
    const p = this.pesanan.get(id);
    if (!p || p.usaha_id !== usahaId) {
      throw new AppError('Pesanan tidak ditemukan', 404);
    }
    p.status = status;
    this.pesanan.set(id, p);
    return this.buildPesananDetail(p);
  }

  async deletePesanan(usahaId: string, id: string): Promise<boolean> {
    const p = this.pesanan.get(id);
    if (!p || p.usaha_id !== usahaId) return false;

    // Hapus items
    for (const [ipId, ip] of this.itemPesanan.entries()) {
      if (ip.pesanan_id === id && ip.usaha_id === usahaId) {
        this.itemPesanan.delete(ipId);
      }
    }
    return this.pesanan.delete(id);
  }

  // --- Rekap Produksi (US-05, TC-15..17) ---
  async rekapProduksi(usahaId: string, mulai: string, akhir: string): Promise<RekapProduksiItem[]> {
    // Ambil pesanan dalam rentang tanggal dan status bukan 'batal' (TC-16)
    const activeOrders = Array.from(this.pesanan.values()).filter(
      (p) => p.usaha_id === usahaId && p.tanggal_kirim >= mulai && p.tanggal_kirim <= akhir && p.status !== 'batal'
    );

    const menuMap = new Map<string, { totalPorsi: number; pesananTerkait: any[] }>();

    for (const ord of activeOrders) {
      const items = Array.from(this.itemPesanan.values()).filter(
        (ip) => ip.pesanan_id === ord.id && ip.usaha_id === usahaId
      );
      for (const it of items) {
        if (!menuMap.has(it.menu_id)) {
          menuMap.set(it.menu_id, { totalPorsi: 0, pesananTerkait: [] });
        }
        const data = menuMap.get(it.menu_id)!;
        data.totalPorsi += it.jumlah;
        data.pesananTerkait.push({
          pesanan_id: ord.id,
          nama_pelanggan: ord.nama_pelanggan,
          jumlah: it.jumlah,
          status: ord.status,
        });
      }
    }

    const result: RekapProduksiItem[] = [];
    for (const [menuId, data] of menuMap.entries()) {
      const m = this.menu.get(menuId);
      result.push({
        menu_id: menuId,
        nama: m?.nama || 'Menu Tidak Diketahui',
        total_porsi: data.totalPorsi,
        pesanan_terkait: data.pesananTerkait,
      });
    }

    result.sort((a, b) => a.nama.localeCompare(b.nama));
    return result;
  }

  // --- Kebutuhan Bahan (US-06, TC-18..19) ---
  async kebutuhanBahan(usahaId: string, mulai: string, akhir: string): Promise<KebutuhanBahanItem[]> {
    const activeOrders = Array.from(this.pesanan.values()).filter(
      (p) => p.usaha_id === usahaId && p.tanggal_kirim >= mulai && p.tanggal_kirim <= akhir && p.status !== 'batal'
    );

    // Kumpulkan kebutuhan per bahan: totalDasar = sum(jumlah * takaran)
    const bahanKebutuhan = new Map<string, number>();

    for (const ord of activeOrders) {
      const items = Array.from(this.itemPesanan.values()).filter(
        (ip) => ip.pesanan_id === ord.id && ip.usaha_id === usahaId
      );
      for (const it of items) {
        // Ambil resep menu
        const resepList = Array.from(this.resep.values()).filter(
          (r) => r.usaha_id === usahaId && r.menu_id === it.menu_id
        );
        for (const r of resepList) {
          const butuh = it.jumlah * r.takaran;
          const curr = bahanKebutuhan.get(r.bahan_id) || 0;
          bahanKebutuhan.set(r.bahan_id, curr + butuh);
        }
      }
    }

    const result: KebutuhanBahanItem[] = [];
    for (const [bId, totalDasar] of bahanKebutuhan.entries()) {
      const b = this.bahan.get(bId);
      if (!b || b.usaha_id !== usahaId) continue;

      const konv = konversiSatuan(totalDasar, b.satuan);
      const biaya = Math.round(totalDasar * b.harga_per_satuan);

      result.push({
        bahan_id: b.id,
        nama: b.nama,
        satuan_dasar: b.satuan,
        total_dasar: totalDasar,
        satuan_tampilan: konv.satuan_tampilan,
        total_tampilan: konv.total_tampilan,
        tampilan_ramah: konv.tampilan_ramah,
        biaya,
      });
    }

    result.sort((a, b) => a.nama.localeCompare(b.nama));
    return result;
  }

  // --- Menu Tanpa Resep (TC-20) ---
  async menuTanpaResep(usahaId: string, mulai: string, akhir: string): Promise<MenuTanpaResepItem[]> {
    const activeOrders = Array.from(this.pesanan.values()).filter(
      (p) => p.usaha_id === usahaId && p.tanggal_kirim >= mulai && p.tanggal_kirim <= akhir && p.status !== 'batal'
    );

    const orderedMenuIds = new Set<string>();
    for (const ord of activeOrders) {
      const items = Array.from(this.itemPesanan.values()).filter(
        (ip) => ip.pesanan_id === ord.id && ip.usaha_id === usahaId
      );
      for (const it of items) {
        orderedMenuIds.add(it.menu_id);
      }
    }

    const result: MenuTanpaResepItem[] = [];
    for (const menuId of orderedMenuIds) {
      const hasResep = Array.from(this.resep.values()).some(
        (r) => r.usaha_id === usahaId && r.menu_id === menuId
      );
      if (!hasResep) {
        const m = this.menu.get(menuId);
        if (m && m.usaha_id === usahaId) {
          result.push({
            menu_id: m.id,
            nama: m.nama,
          });
        }
      }
    }

    result.sort((a, b) => a.nama.localeCompare(b.nama));
    return result;
  }

  // --- Ringkasan Beranda (US-10, TC-26) ---
  async ringkasanBeranda(usahaId: string, tanggalStr?: string): Promise<RingkasanBeranda> {
    const tgl = tanggalStr || new Date().toISOString().split('T')[0];
    const bulan = tgl.substring(0, 7); // YYYY-MM

    const orders = Array.from(this.pesanan.values()).filter(
      (p) => p.usaha_id === usahaId && p.status !== 'batal'
    );

    let pesananHariIni = 0;
    let porsiHariIni = 0;
    let omzetBulanIni = 0;
    let labaKotorBulanIni = 0;

    for (const ord of orders) {
      const items = Array.from(this.itemPesanan.values()).filter(
        (ip) => ip.pesanan_id === ord.id && ip.usaha_id === usahaId
      );

      const isToday = ord.tanggal_kirim === tgl;
      const isMonth = ord.tanggal_kirim.startsWith(bulan);

      if (isToday) {
        pesananHariIni += 1;
      }

      for (const it of items) {
        if (isToday) {
          porsiHariIni += it.jumlah;
        }
        if (isMonth) {
          omzetBulanIni += it.jumlah * it.harga_jual_snapshot;
          labaKotorBulanIni += it.jumlah * (it.harga_jual_snapshot - it.hpp_snapshot);
        }
      }
    }

    // Pesanan terdekat: pesanan yang belum lunas/batal urut tanggal_kirim terdekat
    const upcoming = orders
      .filter((p) => p.status !== 'lunas' && p.status !== 'batal' && p.tanggal_kirim >= tgl)
      .sort((a, b) => a.tanggal_kirim.localeCompare(b.tanggal_kirim))
      .slice(0, 5)
      .map((p) => this.buildPesananDetail(p));

    return {
      pesanan_hari_ini: pesananHariIni,
      porsi_hari_ini: porsiHariIni,
      omzet_bulan_ini: Math.round(omzetBulanIni),
      laba_kotor_bulan_ini: Math.round(labaKotorBulanIni),
      pesanan_terdekat: upcoming,
    };
  }

  // --- Seed Data Contoh (T-28, isi_contoh_data) ---
  async isiContohData(usahaId: string): Promise<void> {
    const bahanCount = Array.from(this.bahan.values()).filter((b) => b.usaha_id === usahaId).length;
    const menuCount = Array.from(this.menu.values()).filter((m) => m.usaha_id === usahaId).length;
    if (bahanCount > 0 || menuCount > 0) {
      throw new AppError('Data sudah ada, contoh tidak ditambahkan', 400);
    }

    // 1. Bahan contoh
    const bahanData: Array<{ nama: string; satuan: any; harga: number }> = [
      { nama: 'Beras', satuan: 'g', harga: 14 },
      { nama: 'Ayam', satuan: 'g', harga: 38 },
      { nama: 'Telur', satuan: 'butir', harga: 2200 },
      { nama: 'Sayuran', satuan: 'g', harga: 12 },
      { nama: 'Minyak goreng', satuan: 'ml', harga: 18 },
      { nama: 'Bumbu', satuan: 'g', harga: 40 },
    ];

    const bahanMap = new Map<string, Bahan>();
    for (const b of bahanData) {
      const created = await this.createBahan(usahaId, {
        nama: b.nama,
        satuan: b.satuan,
        harga_per_satuan: b.harga,
      });
      bahanMap.set(b.nama, created);
    }

    // 2. Menu contoh
    const menuData = [
      { nama: 'Nasi Box Ayam Goreng', harga: 25000 },
      { nama: 'Nasi Box Telur Balado', harga: 20000 },
      { nama: 'Nasi Kuning Komplit', harga: 22000 },
    ];

    const menuMap = new Map<string, Menu>();
    for (const m of menuData) {
      const created = await this.createMenu(usahaId, {
        nama: m.nama,
        harga_jual: m.harga,
        aktif: true,
      });
      menuMap.set(m.nama, created);
    }

    // 3. Resep contoh
    const resepRules: Record<string, Array<{ bahan: string; takaran: number }>> = {
      'Nasi Box Ayam Goreng': [
        { bahan: 'Beras', takaran: 150 },
        { bahan: 'Ayam', takaran: 120 },
        { bahan: 'Sayuran', takaran: 60 },
        { bahan: 'Minyak goreng', takaran: 15 },
        { bahan: 'Bumbu', takaran: 10 },
      ],
      'Nasi Box Telur Balado': [
        { bahan: 'Beras', takaran: 150 },
        { bahan: 'Telur', takaran: 1 },
        { bahan: 'Sayuran', takaran: 60 },
        { bahan: 'Minyak goreng', takaran: 15 },
        { bahan: 'Bumbu', takaran: 15 },
      ],
      'Nasi Kuning Komplit': [
        { bahan: 'Beras', takaran: 150 },
        { bahan: 'Ayam', takaran: 80 },
        { bahan: 'Telur', takaran: 1 },
        { bahan: 'Sayuran', takaran: 40 },
        { bahan: 'Minyak goreng', takaran: 10 },
        { bahan: 'Bumbu', takaran: 10 },
      ],
    };

    for (const [menuNama, items] of Object.entries(resepRules)) {
      const menu = menuMap.get(menuNama);
      if (!menu) continue;
      const resepItems = items.map((it) => {
        const b = bahanMap.get(it.bahan);
        return {
          bahan_id: b!.id,
          takaran: it.takaran,
        };
      });
      await this.setResepForMenu(usahaId, menu.id, resepItems);
    }
  }

  // ===== Cadangan & Pemulihan Data =====
  async eksporCadangan(usahaId: string): Promise<CadanganIsi> {
    const usaha = this.usaha.get(usahaId);
    const milik = (v: { usaha_id: string }) => v.usaha_id === usahaId;

    const bahan = Array.from(this.bahan.values())
      .filter(milik)
      .sort((a, b) => a.nama.localeCompare(b.nama));
    const menu = Array.from(this.menu.values())
      .filter(milik)
      .sort((a, b) => a.nama.localeCompare(b.nama));
    const pelanggan = Array.from(this.pelanggan.values())
      .filter(milik)
      .sort((a, b) => a.nama.localeCompare(b.nama));

    const resep: ResepDetail[] = [];
    for (const r of this.resep.values()) {
      if (r.usaha_id !== usahaId) continue;
      const b = this.bahan.get(r.bahan_id);
      resep.push({
        ...r,
        bahan_nama: b?.nama,
        satuan: b?.satuan,
        harga_per_satuan: b?.harga_per_satuan,
        subtotal_hpp: (b?.harga_per_satuan || 0) * r.takaran,
      });
    }

    const pesanan: PesananDetail[] = [];
    for (const p of this.pesanan.values()) {
      if (p.usaha_id !== usahaId) continue;
      pesanan.push(this.buildPesananDetail(p));
    }
    pesanan.sort((a, b) => a.tanggal_kirim.localeCompare(b.tanggal_kirim));

    return {
      usaha: usaha ? { nama: usaha.nama } : null,
      bahan,
      menu,
      resep,
      pelanggan,
      pesanan,
    };
  }

  async imporCadangan(usahaId: string, data: CadanganData): Promise<CadanganHasilImpor> {
    // ID di-cadangan diganti baru supaya satu berkas bisa dipulihkan ke banyak
    // usaha tanpa menimpa/menabrak data milik akun lain (penyimpanan memakai ID global).
    const idBahan = new Map(data.bahan.map((b) => [b.id, this.uuid()]));
    const idMenu = new Map(data.menu.map((m) => [m.id, this.uuid()]));
    const idPelanggan = new Map(data.pelanggan.map((p) => [p.id, this.uuid()]));
    const idPesanan = new Map(data.pesanan.map((p) => [p.id, this.uuid()]));

    // Ganti seluruh data usaha dengan isi cadangan
    for (const [id, v] of this.pesanan.entries()) if (v.usaha_id === usahaId) this.pesanan.delete(id);
    for (const [id, v] of this.itemPesanan.entries()) if (v.usaha_id === usahaId) this.itemPesanan.delete(id);
    for (const [id, v] of this.resep.entries()) if (v.usaha_id === usahaId) this.resep.delete(id);
    for (const [id, v] of this.menu.entries()) if (v.usaha_id === usahaId) this.menu.delete(id);
    for (const [id, v] of this.bahan.entries()) if (v.usaha_id === usahaId) this.bahan.delete(id);
    for (const [id, v] of this.pelanggan.entries()) if (v.usaha_id === usahaId) this.pelanggan.delete(id);

    const u = this.usaha.get(usahaId);
    if (u && data.usaha?.nama) {
      u.nama = data.usaha.nama.trim();
      this.usaha.set(usahaId, u);
    }

    for (const b of data.bahan) {
      const baru = idBahan.get(b.id)!;
      this.bahan.set(baru, {
        id: baru,
        usaha_id: usahaId,
        nama: b.nama,
        satuan: b.satuan,
        harga_per_satuan: b.harga_per_satuan,
      });
    }
    for (const m of data.menu) {
      const baru = idMenu.get(m.id)!;
      this.menu.set(baru, {
        id: baru,
        usaha_id: usahaId,
        nama: m.nama,
        harga_jual: m.harga_jual,
        aktif: m.aktif,
      });
    }
    for (const r of data.resep) {
      const baru = this.uuid();
      this.resep.set(baru, {
        id: baru,
        usaha_id: usahaId,
        menu_id: idMenu.get(r.menu_id)!,
        bahan_id: idBahan.get(r.bahan_id)!,
        takaran: r.takaran,
      });
    }
    for (const p of data.pelanggan) {
      const baru = idPelanggan.get(p.id)!;
      this.pelanggan.set(baru, {
        id: baru,
        usaha_id: usahaId,
        nama: p.nama,
        kontak: p.kontak ?? null,
      });
    }
    for (const p of data.pesanan) {
      const baru = idPesanan.get(p.id)!;
      this.pesanan.set(baru, {
        id: baru,
        usaha_id: usahaId,
        pelanggan_id: p.pelanggan_id ? idPelanggan.get(p.pelanggan_id)! : null,
        nama_pelanggan: p.nama_pelanggan,
        tanggal_kirim: p.tanggal_kirim,
        status: p.status,
        dp: p.dp,
        catatan: p.catatan ?? null,
        dibuat_pada: p.dibuat_pada || new Date().toISOString(),
      });
      for (const it of p.items) {
        const itemId = this.uuid();
        this.itemPesanan.set(itemId, {
          id: itemId,
          usaha_id: usahaId,
          pesanan_id: baru,
          menu_id: idMenu.get(it.menu_id)!,
          jumlah: it.jumlah,
          harga_jual_snapshot: it.harga_jual_snapshot,
          hpp_snapshot: it.hpp_snapshot,
        });
      }
    }

    return {
      bahan: data.bahan.length,
      menu: data.menu.length,
      resep: data.resep.length,
      pelanggan: data.pelanggan.length,
      pesanan: data.pesanan.length,
    };
  }
}
