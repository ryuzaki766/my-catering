import crypto from 'crypto';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  User,
  Usaha,
  Bahan,
  Menu,
  ResepDetail,
  Pelanggan,
  Pesanan,
  ItemPesanan,
  PesananDetail,
  RekapProduksiItem,
  KebutuhanBahanItem,
  MenuTanpaResepItem,
  RingkasanBeranda,
  SatuanDasar,
  StatusPesanan,
  CadanganIsi,
  CadanganData,
  CadanganHasilImpor,
} from '../types/index.js';
import { IRepository, BuatPesananInput, UbahPesananInput } from './interface.js';
import { AppError } from '../utils/response.js';
import { hitungHpp, konversiSatuan } from '../utils/hitung.js';

type RowResep = Prisma.ResepGetPayload<{ include: { bahan: true } }>;
type RowPesanan = Prisma.PesananGetPayload<{
  include: { items: { include: { menu: true } } };
}>;

/** Decimal Prisma -> number JS. */
const num = (v: Prisma.Decimal | number | null | undefined): number =>
  v === null || v === undefined ? 0 : Number(v);

/** Date (kolom @db.Date, disimpan sebagai tengah malam UTC) -> 'YYYY-MM-DD'. */
const hari = (d: Date): string => d.toISOString().slice(0, 10);

/** 'YYYY-MM-DD' -> Date UTC (agar tidak bergeser zona waktu lokal). */
const tanggalUtc = (s: string): Date => new Date(`${s}T00:00:00.000Z`);

const iso = (d: Date): string => d.toISOString();

export class PrismaRepository implements IRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient = new PrismaClient()) {
    this.prisma = prisma;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // --- Util: penerjemahan error Prisma ---
  private isCode(err: unknown, code: string): boolean {
    return (
      err instanceof Prisma.PrismaClientKnownRequestError && err.code === code
    );
  }

  private isDuplikat(err: unknown): boolean {
    return this.isCode(err, 'P2002');
  }

  private isPelanggaranForeignkey(err: unknown): boolean {
    return this.isCode(err, 'P2003');
  }

  private isTidakDitemukan(err: unknown): boolean {
    return this.isCode(err, 'P2025');
  }

  // --- Util: pemetaan row Prisma -> tipe domain ---
  private mapUser(u: {
    id: string;
    email: string;
    passwordHash: string;
    dibuatPada: Date;
  }): User {
    return {
      id: u.id,
      email: u.email,
      password_hash: u.passwordHash,
      dibuat_pada: iso(u.dibuatPada),
    };
  }

  private mapUsaha(u: { id: string; nama: string; dibuatPada: Date }): Usaha {
    return { id: u.id, nama: u.nama, dibuat_pada: iso(u.dibuatPada) };
  }

  private mapBahan(b: {
    id: string;
    usahaId: string;
    nama: string;
    satuan: SatuanDasar;
    hargaPerSatuan: Prisma.Decimal;
  }): Bahan {
    return {
      id: b.id,
      usaha_id: b.usahaId,
      nama: b.nama,
      satuan: b.satuan,
      harga_per_satuan: num(b.hargaPerSatuan),
    };
  }

  private mapMenu(m: {
    id: string;
    usahaId: string;
    nama: string;
    hargaJual: Prisma.Decimal;
    aktif: boolean;
  }): Menu {
    return {
      id: m.id,
      usaha_id: m.usahaId,
      nama: m.nama,
      harga_jual: num(m.hargaJual),
      aktif: m.aktif,
    };
  }

  private mapPelanggan(p: {
    id: string;
    usahaId: string;
    nama: string;
    kontak: string | null;
  }): Pelanggan {
    return {
      id: p.id,
      usaha_id: p.usahaId,
      nama: p.nama,
      kontak: p.kontak,
    };
  }

  private mapPesanan(p: {
    id: string;
    usahaId: string;
    pelangganId: string | null;
    namaPelanggan: string;
    tanggalKirim: Date;
    status: StatusPesanan;
    dp: Prisma.Decimal;
    catatan: string | null;
    dibuatPada: Date;
  }): Pesanan {
    return {
      id: p.id,
      usaha_id: p.usahaId,
      pelanggan_id: p.pelangganId,
      nama_pelanggan: p.namaPelanggan,
      tanggal_kirim: hari(p.tanggalKirim),
      status: p.status,
      dp: num(p.dp),
      catatan: p.catatan,
      dibuat_pada: iso(p.dibuatPada),
    };
  }

  private mapItem(
    i: {
      id: string;
      usahaId: string;
      pesananId: string;
      menuId: string;
      jumlah: number;
      hargaJualSnapshot: Prisma.Decimal;
      hppSnapshot: Prisma.Decimal;
    },
    menuNama?: string
  ): ItemPesanan {
    return {
      id: i.id,
      usaha_id: i.usahaId,
      pesanan_id: i.pesananId,
      menu_id: i.menuId,
      jumlah: i.jumlah,
      harga_jual_snapshot: num(i.hargaJualSnapshot),
      hpp_snapshot: num(i.hppSnapshot),
      menu_nama: menuNama,
    };
  }

  private mapResepDetail(r: RowResep): ResepDetail {
    const takaran = num(r.takaran);
    const harga = num(r.bahan.hargaPerSatuan);
    return {
      id: r.id,
      usaha_id: r.usahaId,
      menu_id: r.menuId,
      bahan_id: r.bahanId,
      takaran,
      bahan_nama: r.bahan.nama,
      satuan: r.bahan.satuan,
      harga_per_satuan: harga,
      subtotal_hpp: takaran * harga,
    };
  }

  private buildPesananDetail(p: RowPesanan): PesananDetail {
    const pesanan = this.mapPesanan(p);
    const items: ItemPesanan[] = p.items.map((i) =>
      this.mapItem(i, i.menu?.nama || 'Menu Tidak Diketahui')
    );

    const totalHarga = items.reduce((acc, i) => acc + i.jumlah * i.harga_jual_snapshot, 0);
    const totalHpp = items.reduce((acc, i) => acc + i.jumlah * i.hpp_snapshot, 0);

    return {
      ...pesanan,
      items,
      total_harga: totalHarga,
      total_hpp: totalHpp,
      laba_kotor: totalHarga - totalHpp,
      sisa_bayar: Math.max(0, totalHarga - pesanan.dp),
    };
  }

  /** Filter rentang tanggal_kirim (status bukan 'batal'). */
  private filterRentang(mulai: string, akhir: string) {
    return {
      tanggalKirim: { gte: tanggalUtc(mulai), lte: tanggalUtc(akhir) },
      status: { not: 'batal' as const },
    };
  }

  // --- Auth & Usaha ---
  async createUser(email: string, passwordHash: string): Promise<User> {
    const norm = email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email: norm } });
    if (existing) throw new AppError('Email sudah terdaftar', 400);

    try {
      const u = await this.prisma.user.create({
        data: { email: norm, passwordHash },
      });
      return this.mapUser(u);
    } catch (err) {
      if (this.isDuplikat(err)) throw new AppError('Email sudah terdaftar', 400);
      throw err;
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const u = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    return u ? this.mapUser(u) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    const u = await this.prisma.user.findUnique({ where: { id } });
    return u ? this.mapUser(u) : null;
  }

  async createUsaha(nama: string, userId: string): Promise<Usaha> {
    const sudahAda = await this.prisma.anggota.findUnique({ where: { userId } });
    if (sudahAda) throw new AppError('Pengguna sudah punya usaha', 400);

    try {
      const usaha = await this.prisma.$transaction(async (tx) => {
        const baru = await tx.usaha.create({ data: { nama: nama.trim() } });
        await tx.anggota.create({
          data: { userId, usahaId: baru.id, peran: 'pemilik' },
        });
        return baru;
      });
      return this.mapUsaha(usaha);
    } catch (err) {
      if (this.isDuplikat(err)) throw new AppError('Pengguna sudah punya usaha', 400);
      throw err;
    }
  }

  async getUsahaByUserId(userId: string): Promise<Usaha | null> {
    const a = await this.prisma.anggota.findUnique({
      where: { userId },
      include: { usaha: true },
    });
    return a ? this.mapUsaha(a.usaha) : null;
  }

  async getUsahaById(id: string): Promise<Usaha | null> {
    const u = await this.prisma.usaha.findUnique({ where: { id } });
    return u ? this.mapUsaha(u) : null;
  }

  async updateUsaha(id: string, nama: string): Promise<Usaha> {
    try {
      const u = await this.prisma.usaha.update({
        where: { id },
        data: { nama: nama.trim() },
      });
      return this.mapUsaha(u);
    } catch (err) {
      if (this.isTidakDitemukan(err)) throw new AppError('Usaha tidak ditemukan', 404);
      throw err;
    }
  }

  // --- Bahan (US-02) ---
  async getBahanList(usahaId: string): Promise<Bahan[]> {
    const rows = await this.prisma.bahan.findMany({
      where: { usahaId },
      orderBy: { nama: 'asc' },
    });
    return rows.map((b) => this.mapBahan(b));
  }

  async getBahanById(usahaId: string, id: string): Promise<Bahan | null> {
    const b = await this.prisma.bahan.findFirst({ where: { usahaId, id } });
    return b ? this.mapBahan(b) : null;
  }

  async getBahanByNama(usahaId: string, nama: string): Promise<Bahan | null> {
    const b = await this.prisma.bahan.findFirst({
      where: { usahaId, nama: { equals: nama.trim(), mode: 'insensitive' } },
    });
    return b ? this.mapBahan(b) : null;
  }

  async createBahan(usahaId: string, data: Omit<Bahan, 'id' | 'usaha_id'>): Promise<Bahan> {
    try {
      const b = await this.prisma.bahan.create({
        data: {
          usahaId,
          nama: data.nama.trim(),
          satuan: data.satuan,
          hargaPerSatuan: data.harga_per_satuan,
        },
      });
      return this.mapBahan(b);
    } catch (err) {
      if (this.isDuplikat(err)) {
        throw new AppError(`Bahan dengan nama "${data.nama}" sudah ada`, 400);
      }
      throw err;
    }
  }

  async updateBahan(
    usahaId: string,
    id: string,
    data: Partial<Omit<Bahan, 'id' | 'usaha_id'>>
  ): Promise<Bahan> {
    const current = await this.getBahanById(usahaId, id);
    if (!current) throw new AppError('Bahan tidak ditemukan', 404);

    const nama = data.nama !== undefined ? data.nama.trim() : current.nama;
    const satuan = data.satuan !== undefined ? data.satuan : current.satuan;
    const harga =
      data.harga_per_satuan !== undefined ? data.harga_per_satuan : current.harga_per_satuan;

    try {
      const b = await this.prisma.bahan.update({
        where: { id },
        data: { nama, satuan, hargaPerSatuan: harga },
      });
      return this.mapBahan(b);
    } catch (err) {
      if (this.isDuplikat(err)) {
        throw new AppError(`Bahan dengan nama "${nama}" sudah ada`, 400);
      }
      throw err;
    }
  }

  async deleteBahan(usahaId: string, id: string): Promise<boolean> {
    const current = await this.getBahanById(usahaId, id);
    if (!current) return false;

    if (await this.isBahanUsedInResep(usahaId, id)) {
      throw new AppError(
        'Bahan tidak bisa dihapus karena masih digunakan dalam resep menu',
        400
      );
    }

    try {
      const res = await this.prisma.bahan.delete({ where: { id } });
      return !!res;
    } catch (err) {
      if (this.isPelanggaranForeignkey(err)) {
        throw new AppError(
          'Bahan tidak bisa dihapus karena masih digunakan dalam resep menu',
          400
        );
      }
      if (this.isTidakDitemukan(err)) return false;
      throw err;
    }
  }

  async isBahanUsedInResep(usahaId: string, bahanId: string): Promise<boolean> {
    const count = await this.prisma.resep.count({ where: { usahaId, bahanId } });
    return count > 0;
  }

  // --- Menu (US-03) ---
  async getMenuList(usahaId: string): Promise<Menu[]> {
    const rows = await this.prisma.menu.findMany({
      where: { usahaId },
      orderBy: { nama: 'asc' },
    });
    return rows.map((m) => this.mapMenu(m));
  }

  async getMenuById(usahaId: string, id: string): Promise<Menu | null> {
    const m = await this.prisma.menu.findFirst({ where: { usahaId, id } });
    return m ? this.mapMenu(m) : null;
  }

  async getMenuByNama(usahaId: string, nama: string): Promise<Menu | null> {
    const m = await this.prisma.menu.findFirst({
      where: { usahaId, nama: { equals: nama.trim(), mode: 'insensitive' } },
    });
    return m ? this.mapMenu(m) : null;
  }

  async createMenu(usahaId: string, data: Omit<Menu, 'id' | 'usaha_id'>): Promise<Menu> {
    try {
      const m = await this.prisma.menu.create({
        data: {
          usahaId,
          nama: data.nama.trim(),
          hargaJual: data.harga_jual,
          aktif: data.aktif ?? true,
        },
      });
      return this.mapMenu(m);
    } catch (err) {
      if (this.isDuplikat(err)) {
        throw new AppError(`Menu dengan nama "${data.nama}" sudah ada`, 400);
      }
      throw err;
    }
  }

  async updateMenu(
    usahaId: string,
    id: string,
    data: Partial<Omit<Menu, 'id' | 'usaha_id'>>
  ): Promise<Menu> {
    const current = await this.getMenuById(usahaId, id);
    if (!current) throw new AppError('Menu tidak ditemukan', 404);

    const nama = data.nama !== undefined ? data.nama.trim() : current.nama;
    const hargaJual = data.harga_jual !== undefined ? data.harga_jual : current.harga_jual;
    const aktif = data.aktif !== undefined ? data.aktif : current.aktif;

    try {
      const m = await this.prisma.menu.update({
        where: { id },
        data: { nama, hargaJual, aktif },
      });
      return this.mapMenu(m);
    } catch (err) {
      if (this.isDuplikat(err)) {
        throw new AppError(`Menu dengan nama "${nama}" sudah ada`, 400);
      }
      throw err;
    }
  }

  async deleteMenu(usahaId: string, id: string): Promise<boolean> {
    const current = await this.getMenuById(usahaId, id);
    if (!current) return false;

    try {
      await this.prisma.menu.delete({ where: { id } });
      return true;
    } catch (err) {
      if (this.isTidakDitemukan(err)) return false;
      throw err;
    }
  }

  // --- Resep (US-03) ---
  async getResepByMenuId(usahaId: string, menuId: string): Promise<ResepDetail[]> {
    const rows = await this.prisma.resep.findMany({
      where: { usahaId, menuId },
      include: { bahan: true },
      orderBy: { bahan: { nama: 'asc' } },
    });
    return rows.map((r) => this.mapResepDetail(r));
  }

  async setResepForMenu(
    usahaId: string,
    menuId: string,
    items: Array<{ bahan_id: string; takaran: number }>
  ): Promise<ResepDetail[]> {
    const menu = await this.getMenuById(usahaId, menuId);
    if (!menu) throw new AppError('Menu tidak ditemukan', 404);

    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.bahan_id)) {
        throw new AppError(
          'Bahan yang sama tidak boleh dimasukkan dua kali dalam satu resep',
          400
        );
      }
      seen.add(item.bahan_id);

      const bahan = await this.getBahanById(usahaId, item.bahan_id);
      if (!bahan) {
        throw new AppError(`Bahan dengan ID ${item.bahan_id} tidak ditemukan`, 404);
      }
      if (item.takaran <= 0) {
        throw new AppError('Takaran harus lebih dari 0', 400);
      }
    }

    await this.prisma.$transaction([
      this.prisma.resep.deleteMany({ where: { usahaId, menuId } }),
      this.prisma.resep.createMany({
        data: items.map((item) => ({
          usahaId,
          menuId,
          bahanId: item.bahan_id,
          takaran: item.takaran,
        })),
      }),
    ]);

    return this.getResepByMenuId(usahaId, menuId);
  }

  async deleteResepItem(usahaId: string, menuId: string, bahanId: string): Promise<boolean> {
    const res = await this.prisma.resep.deleteMany({
      where: { usahaId, menuId, bahanId },
    });
    return res.count > 0;
  }

  // --- Pelanggan ---
  async getPelangganList(usahaId: string): Promise<Pelanggan[]> {
    const rows = await this.prisma.pelanggan.findMany({
      where: { usahaId },
      orderBy: { nama: 'asc' },
    });
    return rows.map((p) => this.mapPelanggan(p));
  }

  async getPelangganById(usahaId: string, id: string): Promise<Pelanggan | null> {
    const p = await this.prisma.pelanggan.findFirst({ where: { usahaId, id } });
    return p ? this.mapPelanggan(p) : null;
  }

  async createPelanggan(usahaId: string, data: Omit<Pelanggan, 'id' | 'usaha_id'>): Promise<Pelanggan> {
    const p = await this.prisma.pelanggan.create({
      data: {
        usahaId,
        nama: data.nama.trim(),
        kontak: data.kontak || null,
      },
    });
    return this.mapPelanggan(p);
  }

  async updatePelanggan(
    usahaId: string,
    id: string,
    data: Partial<Omit<Pelanggan, 'id' | 'usaha_id'>>
  ): Promise<Pelanggan> {
    const current = await this.getPelangganById(usahaId, id);
    if (!current) throw new AppError('Pelanggan tidak ditemukan', 404);

    const nama = data.nama !== undefined ? data.nama.trim() : current.nama;
    const kontak = data.kontak !== undefined ? data.kontak : current.kontak;

    const p = await this.prisma.pelanggan.update({
      where: { id },
      data: { nama, kontak },
    });
    return this.mapPelanggan(p);
  }

  async deletePelanggan(usahaId: string, id: string): Promise<boolean> {
    const current = await this.getPelangganById(usahaId, id);
    if (!current) return false;

    try {
      await this.prisma.pelanggan.delete({ where: { id } });
      return true;
    } catch (err) {
      if (this.isTidakDitemukan(err)) return false;
      throw err;
    }
  }

  // --- Pesanan (US-04, US-08) ---
  async getPesananList(
    usahaId: string,
    filters?: {
      tanggal?: string;
      mulai?: string;
      akhir?: string;
      status?: StatusPesanan;
    }
  ): Promise<PesananDetail[]> {
    const where: Prisma.PesananWhereInput = { usahaId };

    if (filters?.tanggal) {
      where.tanggalKirim = tanggalUtc(filters.tanggal);
    }
    if (filters?.mulai && filters?.akhir) {
      where.tanggalKirim = {
        gte: tanggalUtc(filters.mulai),
        lte: tanggalUtc(filters.akhir),
      };
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    const rows = await this.prisma.pesanan.findMany({
      where,
      orderBy: [{ tanggalKirim: 'asc' }, { dibuatPada: 'desc' }],
      include: { items: { include: { menu: true } } },
    });

    return rows.map((p) => this.buildPesananDetail(p));
  }

  async getPesananById(usahaId: string, id: string): Promise<PesananDetail | null> {
    const p = await this.prisma.pesanan.findFirst({
      where: { usahaId, id },
      include: { items: { include: { menu: true } } },
    });
    return p ? this.buildPesananDetail(p) : null;
  }

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

    // Ambil menu beserta resep & bahannya sekaligus (untuk hitung HPP)
    const menuIds = items.map((i) => i.menu_id);
    const menus = await this.prisma.menu.findMany({
      where: { usahaId: usaha_id, id: { in: menuIds } },
      include: { resep: { include: { bahan: true } } },
    });
    const menuMap = new Map(menus.map((m) => [m.id, m]));

    let calculatedTotal = 0;
    const resolvedItems: Array<{
      menuId: string;
      jumlah: number;
      hargaJual: number;
      hppSnapshot: number;
    }> = [];

    for (const item of items) {
      if (!item.jumlah || item.jumlah <= 0) {
        throw new AppError('Jumlah tiap menu harus lebih dari 0', 400);
      }

      const m = menuMap.get(item.menu_id);
      if (!m || !m.aktif) {
        throw new AppError('Ada menu yang tidak ditemukan atau tidak aktif', 400);
      }

      const hargaJual = num(m.hargaJual);
      calculatedTotal += item.jumlah * hargaJual;

      const hppSnapshot = hitungHpp(
        m.resep.map((r) => ({
          takaran: num(r.takaran),
          harga_per_satuan: num(r.bahan.hargaPerSatuan),
        }))
      );

      resolvedItems.push({
        menuId: m.id,
        jumlah: item.jumlah,
        hargaJual,
        hppSnapshot,
      });
    }

    if (dp > calculatedTotal) {
      throw new AppError('DP melebihi total pesanan', 400);
    }

    const pesanan = await this.prisma.$transaction(async (tx) => {
      const p = await tx.pesanan.create({
        data: {
          usahaId: usaha_id,
          pelangganId: pelanggan_id || null,
          namaPelanggan: nama_pelanggan.trim(),
          tanggalKirim: tanggalUtc(tanggal_kirim),
          status: 'baru',
          dp,
          catatan: catatan || null,
        },
      });

      await tx.itemPesanan.createMany({
        data: resolvedItems.map((r) => ({
          usahaId: usaha_id,
          pesananId: p.id,
          menuId: r.menuId,
          jumlah: r.jumlah,
          hargaJualSnapshot: r.hargaJual,
          hppSnapshot: r.hppSnapshot,
        })),
      });

      return p;
    });

    const hasil = await this.getPesananById(usaha_id, pesanan.id);
    return hasil!;
  }

  async ubahPesananAtomik(usahaId: string, id: string, input: UbahPesananInput): Promise<PesananDetail> {
    const { nama_pelanggan, tanggal_kirim, pelanggan_id, dp, catatan, items } = input;

    const lama = await this.prisma.pesanan.findFirst({
      where: { usahaId, id },
      include: { items: true },
    });
    if (!lama) throw new AppError('Pesanan tidak ditemukan', 404);

    if (nama_pelanggan !== undefined && !nama_pelanggan.trim()) {
      throw new AppError('Nama pelanggan wajib diisi', 400);
    }
    if (tanggal_kirim !== undefined && !tanggal_kirim) {
      throw new AppError('Tanggal kirim wajib diisi', 400);
    }

    // Item hasil edit; jika tidak dikirim, item lama dipertahankan
    const itemsFinal = items ?? lama.items.map((i) => ({ menu_id: i.menuId, jumlah: i.jumlah }));
    if (itemsFinal.length === 0) {
      throw new AppError('Isi minimal satu menu', 400);
    }

    // Snapshot lama: harga jual & HPP saat pesanan dibuat tetap dipakai
    // untuk menu yang sudah ada, agar riwayat laba tidak berubah retroaktif (TC-23)
    const snapshotLama = new Map(
      lama.items.map((i) => [i.menuId, { hargaJual: num(i.hargaJualSnapshot), hpp: num(i.hppSnapshot) }])
    );

    // Menu baru (belum pernah ada di pesanan) memakai harga & resep saat ini
    const menuBaruIds = [...new Set(itemsFinal.map((i) => i.menu_id))].filter((mId) => !snapshotLama.has(mId));
    const menus = await this.prisma.menu.findMany({
      where: { usahaId, id: { in: menuBaruIds } },
      include: { resep: { include: { bahan: true } } },
    });
    const menuMap = new Map(menus.map((m) => [m.id, m]));

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

      const m = menuMap.get(item.menu_id);
      if (!m || !m.aktif) {
        throw new AppError('Ada menu yang tidak ditemukan atau tidak aktif', 400);
      }

      const hargaJual = num(m.hargaJual);
      totalBaru += item.jumlah * hargaJual;
      resolvedItems.push({
        menuId: m.id,
        jumlah: item.jumlah,
        hargaJual,
        hppSnapshot: hitungHpp(
          m.resep.map((r) => ({
            takaran: num(r.takaran),
            harga_per_satuan: num(r.bahan.hargaPerSatuan),
          }))
        ),
      });
    }

    const dpFinal = dp ?? num(lama.dp);
    if (dpFinal > totalBaru) {
      throw new AppError('DP melebihi total pesanan', 400);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.pesanan.update({
        where: { id },
        data: {
          pelangganId: pelanggan_id !== undefined ? pelanggan_id : lama.pelangganId,
          namaPelanggan: nama_pelanggan !== undefined ? nama_pelanggan.trim() : lama.namaPelanggan,
          tanggalKirim: tanggal_kirim !== undefined ? tanggalUtc(tanggal_kirim) : lama.tanggalKirim,
          dp: dpFinal,
          catatan: catatan !== undefined ? catatan || null : lama.catatan,
        },
      });

      await tx.itemPesanan.deleteMany({ where: { pesananId: id } });
      await tx.itemPesanan.createMany({
        data: resolvedItems.map((r) => ({
          usahaId,
          pesananId: id,
          menuId: r.menuId,
          jumlah: r.jumlah,
          hargaJualSnapshot: r.hargaJual,
          hppSnapshot: r.hppSnapshot,
        })),
      });
    });

    const hasil = await this.getPesananById(usahaId, id);
    return hasil!;
  }

  async updateStatusPesanan(
    usahaId: string,
    id: string,
    status: StatusPesanan
  ): Promise<PesananDetail> {
    const exists = await this.prisma.pesanan.findFirst({ where: { usahaId, id } });
    if (!exists) throw new AppError('Pesanan tidak ditemukan', 404);

    await this.prisma.pesanan.update({ where: { id }, data: { status } });

    const updated = await this.getPesananById(usahaId, id);
    return updated!;
  }

  async deletePesanan(usahaId: string, id: string): Promise<boolean> {
    const res = await this.prisma.pesanan.deleteMany({ where: { usahaId, id } });
    return res.count > 0;
  }

  // --- Rekap Produksi (US-05) ---
  async rekapProduksi(usahaId: string, mulai: string, akhir: string): Promise<RekapProduksiItem[]> {
    const rows = await this.prisma.itemPesanan.findMany({
      where: {
        usahaId,
        pesanan: { ...this.filterRentang(mulai, akhir) },
      },
      include: { pesanan: true, menu: true },
    });

    const peta = new Map<
      string,
      { nama: string; totalPorsi: number; pesananTerkait: RekapProduksiItem['pesanan_terkait'] }
    >();

    for (const it of rows) {
      let data = peta.get(it.menuId);
      if (!data) {
        data = {
          nama: it.menu?.nama || 'Menu Tidak Diketahui',
          totalPorsi: 0,
          pesananTerkait: [],
        };
        peta.set(it.menuId, data);
      }
      data.totalPorsi += it.jumlah;
      data.pesananTerkait!.push({
        pesanan_id: it.pesananId,
        nama_pelanggan: it.pesanan.namaPelanggan,
        jumlah: it.jumlah,
        status: it.pesanan.status,
      });
    }

    return Array.from(peta.entries())
      .map(([menuId, data]) => ({
        menu_id: menuId,
        nama: data.nama,
        total_porsi: data.totalPorsi,
        pesanan_terkait: data.pesananTerkait,
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }

  // --- Kebutuhan Bahan (US-06) ---
  async kebutuhanBahan(usahaId: string, mulai: string, akhir: string): Promise<KebutuhanBahanItem[]> {
    const rows = await this.prisma.itemPesanan.findMany({
      where: {
        usahaId,
        pesanan: { ...this.filterRentang(mulai, akhir) },
      },
      include: { menu: { include: { resep: { include: { bahan: true } } } } },
    });

    const peta = new Map<
      string,
      { nama: string; satuan: SatuanDasar; harga: number; total: number }
    >();

    for (const it of rows) {
      for (const r of it.menu.resep) {
        if (r.bahan.usahaId !== usahaId) continue;
        let data = peta.get(r.bahanId);
        if (!data) {
          data = {
            nama: r.bahan.nama,
            satuan: r.bahan.satuan,
            harga: num(r.bahan.hargaPerSatuan),
            total: 0,
          };
          peta.set(r.bahanId, data);
        }
        data.total += it.jumlah * num(r.takaran);
      }
    }

    return Array.from(peta.entries())
      .map(([bahanId, data]) => {
        const konv = konversiSatuan(data.total, data.satuan);
        return {
          bahan_id: bahanId,
          nama: data.nama,
          satuan_dasar: data.satuan,
          total_dasar: data.total,
          satuan_tampilan: konv.satuan_tampilan,
          total_tampilan: konv.total_tampilan,
          tampilan_ramah: konv.tampilan_ramah,
          biaya: Math.round(data.total * data.harga),
        };
      })
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }

  // --- Menu Tanpa Resep ---
  async menuTanpaResep(usahaId: string, mulai: string, akhir: string): Promise<MenuTanpaResepItem[]> {
    const dipesan = await this.prisma.itemPesanan.findMany({
      where: {
        usahaId,
        pesanan: { ...this.filterRentang(mulai, akhir) },
      },
      select: { menuId: true },
      distinct: ['menuId'],
    });

    if (dipesan.length === 0) return [];

    const menus = await this.prisma.menu.findMany({
      where: {
        usahaId,
        id: { in: dipesan.map((d) => d.menuId) },
        resep: { none: {} },
      },
      orderBy: { nama: 'asc' },
    });

    return menus.map((m) => ({ menu_id: m.id, nama: m.nama }));
  }

  // --- Ringkasan Beranda (US-10) ---
  async ringkasanBeranda(usahaId: string, tanggalStr?: string): Promise<RingkasanBeranda> {
    const tgl = tanggalStr || new Date().toISOString().split('T')[0];
    const [tahun, bulan] = tgl.split('-').map((v) => parseInt(v, 10));

    const awalBulan = new Date(Date.UTC(tahun, bulan - 1, 1));
    const awalBulanBerikut = new Date(Date.UTC(tahun, bulan, 1));

    const orders = await this.prisma.pesanan.findMany({
      where: {
        usahaId,
        status: { not: 'batal' },
        tanggalKirim: { gte: awalBulan, lt: awalBulanBerikut },
      },
      include: { items: true },
    });

    let pesananHariIni = 0;
    let porsiHariIni = 0;
    let omzetBulanIni = 0;
    let labaKotorBulanIni = 0;

    for (const ord of orders) {
      const hariIni = hari(ord.tanggalKirim) === tgl;
      if (hariIni) pesananHariIni += 1;

      for (const it of ord.items) {
        if (hariIni) porsiHariIni += it.jumlah;
        omzetBulanIni += it.jumlah * num(it.hargaJualSnapshot);
        labaKotorBulanIni += it.jumlah * (num(it.hargaJualSnapshot) - num(it.hppSnapshot));
      }
    }

    const terdekat = await this.prisma.pesanan.findMany({
      where: {
        usahaId,
        status: { notIn: ['lunas', 'batal'] },
        tanggalKirim: { gte: tanggalUtc(tgl) },
      },
      orderBy: [{ tanggalKirim: 'asc' }, { dibuatPada: 'desc' }],
      take: 5,
      include: { items: { include: { menu: true } } },
    });

    return {
      pesanan_hari_ini: pesananHariIni,
      porsi_hari_ini: porsiHariIni,
      omzet_bulan_ini: Math.round(omzetBulanIni),
      laba_kotor_bulan_ini: Math.round(labaKotorBulanIni),
      pesanan_terdekat: terdekat.map((p) => this.buildPesananDetail(p)),
    };
  }

  // --- Onboarding / Contoh Data ---
  async isiContohData(usahaId: string): Promise<void> {
    const [bahanCount, menuCount] = await Promise.all([
      this.prisma.bahan.count({ where: { usahaId } }),
      this.prisma.menu.count({ where: { usahaId } }),
    ]);
    if (bahanCount > 0 || menuCount > 0) {
      throw new AppError('Data sudah ada, contoh tidak ditambahkan', 400);
    }

    const bahanData: Array<{ nama: string; satuan: SatuanDasar; harga: number }> = [
      { nama: 'Beras', satuan: 'g', harga: 14 },
      { nama: 'Ayam', satuan: 'g', harga: 38 },
      { nama: 'Telur', satuan: 'butir', harga: 2200 },
      { nama: 'Sayuran', satuan: 'g', harga: 12 },
      { nama: 'Minyak goreng', satuan: 'ml', harga: 18 },
      { nama: 'Bumbu', satuan: 'g', harga: 40 },
    ];

    const menuData = [
      { nama: 'Nasi Box Ayam Goreng', harga: 25000 },
      { nama: 'Nasi Box Telur Balado', harga: 20000 },
      { nama: 'Nasi Kuning Komplit', harga: 22000 },
    ];

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

    await this.prisma.$transaction(async (tx) => {
      const bahanRows = await tx.bahan.createMany({
        data: bahanData.map((b) => ({
          usahaId,
          nama: b.nama,
          satuan: b.satuan,
          hargaPerSatuan: b.harga,
        })),
      });
      if (bahanRows.count === 0) return;

      const daftarBahan = await tx.bahan.findMany({ where: { usahaId } });
      const bMap = new Map(daftarBahan.map((b) => [b.nama, b.id]));

      await tx.menu.createMany({
        data: menuData.map((m) => ({
          usahaId,
          nama: m.nama,
          hargaJual: m.harga,
          aktif: true,
        })),
      });

      const daftarMenu = await tx.menu.findMany({ where: { usahaId } });
      const mMap = new Map(daftarMenu.map((m) => [m.nama, m.id]));

      const resepRows: Array<{ menuId: string; bahanId: string; takaran: number }> = [];
      for (const [menuNama, aturan] of Object.entries(resepRules)) {
        const menuId = mMap.get(menuNama);
        if (!menuId) continue;
        for (const aturanItem of aturan) {
          const bahanId = bMap.get(aturanItem.bahan);
          if (!bahanId) continue;
          resepRows.push({ menuId, bahanId, takaran: aturanItem.takaran });
        }
      }

      if (resepRows.length > 0) {
        await tx.resep.createMany({
          data: resepRows.map((r) => ({ usahaId, ...r })),
        });
      }
    });
  }

  // ===== Cadangan & Pemulihan Data =====
  async eksporCadangan(usahaId: string): Promise<CadanganIsi> {
    const [usaha, bahanRows, menuRows, resepRows, pelangganRows, pesananRows] = await Promise.all([
      this.prisma.usaha.findUnique({ where: { id: usahaId } }),
      this.prisma.bahan.findMany({ where: { usahaId }, orderBy: { nama: 'asc' } }),
      this.prisma.menu.findMany({ where: { usahaId }, orderBy: { nama: 'asc' } }),
      this.prisma.resep.findMany({ where: { usahaId }, include: { bahan: true } }),
      this.prisma.pelanggan.findMany({ where: { usahaId }, orderBy: { nama: 'asc' } }),
      this.prisma.pesanan.findMany({
        where: { usahaId },
        orderBy: [{ tanggalKirim: 'asc' }, { dibuatPada: 'desc' }],
        include: { items: { include: { menu: true } } },
      }),
    ]);

    return {
      usaha: usaha ? { nama: usaha.nama } : null,
      bahan: bahanRows.map((b) => this.mapBahan(b)),
      menu: menuRows.map((m) => this.mapMenu(m)),
      resep: resepRows.map((r) => this.mapResepDetail(r)),
      pelanggan: pelangganRows.map((p) => this.mapPelanggan(p)),
      pesanan: pesananRows.map((p) => this.buildPesananDetail(p)),
    };
  }

  async imporCadangan(usahaId: string, data: CadanganData): Promise<CadanganHasilImpor> {
    // ID di-cadangan selalu diganti baru supaya satu berkas boleh dipulihkan ke
    // banyak usaha/akun tanpa bentrok dengan data yang sudah ada di database.
    const idBahan = new Map(data.bahan.map((b) => [b.id, crypto.randomUUID()]));
    const idMenu = new Map(data.menu.map((m) => [m.id, crypto.randomUUID()]));
    const idPelanggan = new Map(data.pelanggan.map((p) => [p.id, crypto.randomUUID()]));
    const idPesanan = new Map(data.pesanan.map((p) => [p.id, crypto.randomUUID()]));

    // Query dikemas dengan createMany (jumlahnya konstan, bukan per baris) dan
    // transaksi diberi jeda waktu longgar — pemulihan bisa menyangkut ratusan
    // baris di atas koneksi database berjarak jauh.
    await this.prisma.$transaction(
      async (tx) => {
        // Ganti seluruh data usaha dengan isi cadangan.
        // Urutan menyesuaikan batasan FK: item→pesanan, resep→menu, resep→bahan.
        await tx.pesanan.deleteMany({ where: { usahaId } });
        await tx.menu.deleteMany({ where: { usahaId } });
        await tx.bahan.deleteMany({ where: { usahaId } });
        await tx.pelanggan.deleteMany({ where: { usahaId } });

        if (data.usaha?.nama) {
          await tx.usaha.update({ where: { id: usahaId }, data: { nama: data.usaha.nama.trim() } });
        }

        if (data.bahan.length > 0) {
          await tx.bahan.createMany({
            data: data.bahan.map((b) => ({
              id: idBahan.get(b.id)!,
              usahaId,
              nama: b.nama,
              satuan: b.satuan,
              hargaPerSatuan: b.harga_per_satuan,
            })),
          });
        }
        if (data.menu.length > 0) {
          await tx.menu.createMany({
            data: data.menu.map((m) => ({
              id: idMenu.get(m.id)!,
              usahaId,
              nama: m.nama,
              hargaJual: m.harga_jual,
              aktif: m.aktif,
            })),
          });
        }
        if (data.resep.length > 0) {
          await tx.resep.createMany({
            data: data.resep.map((r) => ({
              usahaId,
              menuId: idMenu.get(r.menu_id)!,
              bahanId: idBahan.get(r.bahan_id)!,
              takaran: r.takaran,
            })),
          });
        }
        if (data.pelanggan.length > 0) {
          await tx.pelanggan.createMany({
            data: data.pelanggan.map((p) => ({
              id: idPelanggan.get(p.id)!,
              usahaId,
              nama: p.nama,
              kontak: p.kontak ?? null,
            })),
          });
        }

        if (data.pesanan.length > 0) {
          await tx.pesanan.createMany({
            data: data.pesanan.map((p) => {
              const dibuat = p.dibuat_pada ? new Date(p.dibuat_pada) : new Date();
              return {
                id: idPesanan.get(p.id)!,
                usahaId,
                pelangganId: p.pelanggan_id ? idPelanggan.get(p.pelanggan_id)! : null,
                namaPelanggan: p.nama_pelanggan,
                tanggalKirim: tanggalUtc(p.tanggal_kirim),
                status: p.status,
                dp: p.dp,
                catatan: p.catatan ?? null,
                dibuatPada: Number.isNaN(dibuat.getTime()) ? new Date() : dibuat,
              };
            }),
          });

          const barisItem = data.pesanan.flatMap((p) =>
            p.items.map((it) => ({
              usahaId,
              pesananId: idPesanan.get(p.id)!,
              menuId: idMenu.get(it.menu_id)!,
              jumlah: it.jumlah,
              hargaJualSnapshot: it.harga_jual_snapshot,
              hppSnapshot: it.hpp_snapshot,
            }))
          );
          if (barisItem.length > 0) {
            await tx.itemPesanan.createMany({ data: barisItem });
          }
        }
      },
      { maxWait: 10_000, timeout: 30_000 }
    );

    return {
      bahan: data.bahan.length,
      menu: data.menu.length,
      resep: data.resep.length,
      pelanggan: data.pelanggan.length,
      pesanan: data.pesanan.length,
    };
  }
}
