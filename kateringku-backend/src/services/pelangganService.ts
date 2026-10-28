import { getRepository } from '../repositories/index.js';
import { Pelanggan } from '../types/index.js';
import { AppError } from '../utils/response.js';

export class PelangganService {
  private get repo() {
    return getRepository();
  }

  async getAll(usahaId: string): Promise<Pelanggan[]> {
    return this.repo.getPelangganList(usahaId);
  }

  async getById(usahaId: string, id: string): Promise<Pelanggan> {
    const p = await this.repo.getPelangganById(usahaId, id);
    if (!p) throw new AppError('Pelanggan tidak ditemukan', 404);
    return p;
  }

  async create(usahaId: string, data: Omit<Pelanggan, 'id' | 'usaha_id'>): Promise<Pelanggan> {
    return this.repo.createPelanggan(usahaId, data);
  }

  async update(usahaId: string, id: string, data: Partial<Omit<Pelanggan, 'id' | 'usaha_id'>>): Promise<Pelanggan> {
    return this.repo.updatePelanggan(usahaId, id, data);
  }

  async delete(usahaId: string, id: string): Promise<boolean> {
    const deleted = await this.repo.deletePelanggan(usahaId, id);
    if (!deleted) throw new AppError('Pelanggan tidak ditemukan', 404);
    return true;
  }
}
