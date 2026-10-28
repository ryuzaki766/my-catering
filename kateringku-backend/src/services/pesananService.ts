import { getRepository } from '../repositories/index.js';
import { PesananDetail, StatusPesanan } from '../types/index.js';
import { AppError } from '../utils/response.js';

const STATUS_FLOW: StatusPesanan[] = ['baru', 'diproses', 'terkirim', 'lunas'];

export class PesananService {
  private get repo() {
    return getRepository();
  }

  async getAll(
    usahaId: string,
    filters?: {
      tanggal?: string;
      mulai?: string;
      akhir?: string;
      status?: StatusPesanan;
    }
  ): Promise<PesananDetail[]> {
    return this.repo.getPesananList(usahaId, filters);
  }

  async getById(usahaId: string, id: string): Promise<PesananDetail> {
    const pesanan = await this.repo.getPesananById(usahaId, id);
    if (!pesanan) throw new AppError('Pesanan tidak ditemukan', 404);
    return pesanan;
  }

  async create(
    usahaId: string,
    data: {
      nama_pelanggan: string;
      tanggal_kirim: string;
      pelanggan_id?: string | null;
      dp?: number;
      catatan?: string | null;
      items: Array<{ menu_id: string; jumlah: number }>;
    }
  ): Promise<PesananDetail> {
    return this.repo.buatPesananAtomik({
      usaha_id: usahaId,
      ...data,
    });
  }

  async update(
    usahaId: string,
    id: string,
    data: {
      nama_pelanggan?: string;
      tanggal_kirim?: string;
      pelanggan_id?: string | null;
      dp?: number;
      catatan?: string | null;
      items?: Array<{ menu_id: string; jumlah: number }>;
    }
  ): Promise<PesananDetail> {
    return this.repo.ubahPesananAtomik(usahaId, id, data);
  }

  async updateStatus(usahaId: string, id: string, status: StatusPesanan): Promise<PesananDetail> {
    return this.repo.updateStatusPesanan(usahaId, id, status);
  }

  /**
   * Menaikkan status ke tahap berikutnya: baru -> diproses -> terkirim -> lunas (TC-24)
   */
  async advanceStatus(usahaId: string, id: string): Promise<PesananDetail> {
    const cur = await this.getById(usahaId, id);
    if (cur.status === 'batal') {
      throw new AppError('Pesanan yang sudah dibatalkan tidak bisa diubah statusnya secara otomatis', 400);
    }
    const idx = STATUS_FLOW.indexOf(cur.status);
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) {
      return cur; // Sudah mencapai status akhir ('lunas')
    }
    const nextStatus = STATUS_FLOW[idx + 1];
    return this.repo.updateStatusPesanan(usahaId, id, nextStatus);
  }

  async cancel(usahaId: string, id: string): Promise<PesananDetail> {
    return this.repo.updateStatusPesanan(usahaId, id, 'batal');
  }

  async delete(usahaId: string, id: string): Promise<boolean> {
    const deleted = await this.repo.deletePesanan(usahaId, id);
    if (!deleted) throw new AppError('Pesanan tidak ditemukan', 404);
    return true;
  }
}
