import { getRepository } from '../repositories/index.js';
import { Menu, MenuDetail } from '../types/index.js';
import { hitungHpp, hitungLabaKotor, hitungMarginPersen } from '../utils/hitung.js';
import { AppError } from '../utils/response.js';

export class MenuService {
  private get repo() {
    return getRepository();
  }

  async getAll(usahaId: string): Promise<MenuDetail[]> {
    const menus = await this.repo.getMenuList(usahaId);
    const result: MenuDetail[] = [];

    for (const m of menus) {
      const resepList = await this.repo.getResepByMenuId(usahaId, m.id);
      const hpp = hitungHpp(
        resepList.map((r) => ({
          takaran: r.takaran,
          harga_per_satuan: r.harga_per_satuan || 0,
        }))
      );
      const laba = hitungLabaKotor(m.harga_jual, hpp);
      const margin = hitungMarginPersen(m.harga_jual, hpp);

      result.push({
        ...m,
        hpp,
        laba_kotor: laba,
        margin_persen: margin,
        // Resep ikut dikirim pada daftar menu: data ini sudah diambil untuk
        // menghitung HPP, dan tanpa menyertakannya tampilan kehilangan seluruh
        // resep setiap kali halaman dimuat ulang (hanya `getById` yang punya).
        resep: resepList,
      });
    }

    return result;
  }

  async getById(usahaId: string, id: string): Promise<MenuDetail> {
    const menu = await this.repo.getMenuById(usahaId, id);
    if (!menu) throw new AppError('Menu tidak ditemukan', 404);

    const resepList = await this.repo.getResepByMenuId(usahaId, id);
    const hpp = hitungHpp(
      resepList.map((r) => ({
        takaran: r.takaran,
        harga_per_satuan: r.harga_per_satuan || 0,
      }))
    );
    const laba = hitungLabaKotor(menu.harga_jual, hpp);
    const margin = hitungMarginPersen(menu.harga_jual, hpp);

    return {
      ...menu,
      hpp,
      laba_kotor: laba,
      margin_persen: margin,
      resep: resepList,
    };
  }

  async create(usahaId: string, data: Omit<Menu, 'id' | 'usaha_id'>): Promise<Menu> {
    if (data.harga_jual < 0) {
      throw new AppError('Harga jual tidak boleh negatif', 400);
    }
    return this.repo.createMenu(usahaId, data);
  }

  async update(usahaId: string, id: string, data: Partial<Omit<Menu, 'id' | 'usaha_id'>>): Promise<Menu> {
    if (data.harga_jual !== undefined && data.harga_jual < 0) {
      throw new AppError('Harga jual tidak boleh negatif', 400);
    }
    return this.repo.updateMenu(usahaId, id, data);
  }

  async delete(usahaId: string, id: string): Promise<boolean> {
    const deleted = await this.repo.deleteMenu(usahaId, id);
    if (!deleted) throw new AppError('Menu tidak ditemukan', 404);
    return true;
  }
}
