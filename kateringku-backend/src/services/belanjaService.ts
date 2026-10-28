import { getRepository } from '../repositories/index.js';
import { DaftarBelanjaResponse } from '../types/index.js';
import { resolveRentangTanggal } from '../utils/dateHelper.js';
import { formatTeksWhatsApp } from '../utils/format.js';

export class BelanjaService {
  private get repo() {
    return getRepository();
  }

  async getDaftarBelanja(
    usahaId: string,
    preset?: 'hari_ini' | 'besok' | 'lusa' | 'semua',
    mulai?: string,
    akhir?: string
  ): Promise<DaftarBelanjaResponse> {
    const rentang = resolveRentangTanggal(preset, mulai, akhir);
    const kebutuhan = await this.repo.kebutuhanBahan(usahaId, rentang.mulai, rentang.akhir);
    const menuTanpaResep = await this.repo.menuTanpaResep(usahaId, rentang.mulai, rentang.akhir);
    const totalBiaya = kebutuhan.reduce((acc, k) => acc + k.biaya, 0);

    const usaha = await this.repo.getUsahaById(usahaId);
    const namaUsaha = usaha?.nama || 'KateringKu';

    const teksWhatsApp = formatTeksWhatsApp(
      namaUsaha,
      rentang.mulai,
      rentang.akhir,
      kebutuhan,
      totalBiaya,
      menuTanpaResep
    );

    return {
      rentang,
      kebutuhan,
      total_biaya: totalBiaya,
      menu_tanpa_resep: menuTanpaResep,
      teks_whatsapp: teksWhatsApp,
    };
  }
}
