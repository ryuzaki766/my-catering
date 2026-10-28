import { getRepository } from '../repositories/index.js';
import { RekapProduksiItem } from '../types/index.js';
import { resolveRentangTanggal } from '../utils/dateHelper.js';

export interface RekapProduksiResponse {
  rentang: {
    mulai: string;
    akhir: string;
  };
  total_seluruh_porsi: number;
  rekap: RekapProduksiItem[];
}

export class ProduksiService {
  private get repo() {
    return getRepository();
  }

  async getRekap(
    usahaId: string,
    preset?: 'hari_ini' | 'besok' | 'lusa' | 'semua',
    mulai?: string,
    akhir?: string
  ): Promise<RekapProduksiResponse> {
    const rentang = resolveRentangTanggal(preset, mulai, akhir);
    const rekap = await this.repo.rekapProduksi(usahaId, rentang.mulai, rentang.akhir);
    const totalSeluruhPorsi = rekap.reduce((acc, r) => acc + r.total_porsi, 0);

    return {
      rentang,
      total_seluruh_porsi: totalSeluruhPorsi,
      rekap,
    };
  }
}
