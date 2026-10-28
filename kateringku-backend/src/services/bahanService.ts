import { getRepository } from '../repositories/index.js';
import { Bahan } from '../types/index.js';
import { AppError } from '../utils/response.js';

export class BahanService {
  private get repo() {
    return getRepository();
  }

  async getAll(usahaId: string): Promise<Bahan[]> {
    return this.repo.getBahanList(usahaId);
  }

  async getById(usahaId: string, id: string): Promise<Bahan> {
    const bahan = await this.repo.getBahanById(usahaId, id);
    if (!bahan) throw new AppError('Bahan tidak ditemukan', 404);
    return bahan;
  }

  async create(usahaId: string, data: Omit<Bahan, 'id' | 'usaha_id'>): Promise<Bahan> {
    if (data.harga_per_satuan < 0) {
      throw new AppError('Harga per satuan tidak boleh negatif', 400);
    }
    return this.repo.createBahan(usahaId, data);
  }

  async update(usahaId: string, id: string, data: Partial<Omit<Bahan, 'id' | 'usaha_id'>>): Promise<Bahan> {
    if (data.harga_per_satuan !== undefined && data.harga_per_satuan < 0) {
      throw new AppError('Harga per satuan tidak boleh negatif', 400);
    }
    return this.repo.updateBahan(usahaId, id, data);
  }

  async delete(usahaId: string, id: string): Promise<boolean> {
    const isUsed = await this.repo.isBahanUsedInResep(usahaId, id);
    if (isUsed) {
      throw new AppError('Bahan tidak bisa dihapus karena masih digunakan dalam resep menu. Disarankan untuk memperbarui harga atau menghapusnya dari resep terlebih dahulu.', 400);
    }
    const deleted = await this.repo.deleteBahan(usahaId, id);
    if (!deleted) throw new AppError('Bahan tidak ditemukan', 404);
    return true;
  }
}
