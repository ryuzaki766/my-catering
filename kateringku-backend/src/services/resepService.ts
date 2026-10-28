import { getRepository } from '../repositories/index.js';
import { ResepDetail } from '../types/index.js';
import { AppError } from '../utils/response.js';

export class ResepService {
  private get repo() {
    return getRepository();
  }

  async getByMenuId(usahaId: string, menuId: string): Promise<ResepDetail[]> {
    const menu = await this.repo.getMenuById(usahaId, menuId);
    if (!menu) throw new AppError('Menu tidak ditemukan', 404);
    return this.repo.getResepByMenuId(usahaId, menuId);
  }

  async setResep(
    usahaId: string,
    menuId: string,
    items: Array<{ bahan_id: string; takaran: number }>
  ): Promise<ResepDetail[]> {
    const menu = await this.repo.getMenuById(usahaId, menuId);
    if (!menu) throw new AppError('Menu tidak ditemukan', 404);

    // Cek duplikasi bahan (TC-09)
    const seen = new Set<string>();
    for (const it of items) {
      if (seen.has(it.bahan_id)) {
        throw new AppError('Bahan yang sama tidak boleh dimasukkan dua kali dalam satu resep', 400);
      }
      seen.add(it.bahan_id);
      if (it.takaran <= 0) {
        throw new AppError('Takaran harus lebih dari 0', 400);
      }
    }

    return this.repo.setResepForMenu(usahaId, menuId, items);
  }

  async deleteResepItem(usahaId: string, menuId: string, bahanId: string): Promise<boolean> {
    return this.repo.deleteResepItem(usahaId, menuId, bahanId);
  }
}
