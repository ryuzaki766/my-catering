import { getRepository } from '../repositories/index.js';
import { RingkasanBeranda } from '../types/index.js';

export interface DashboardResponse extends RingkasanBeranda {
  margin_bulan_ini_persen: number;
}

export class DashboardService {
  private get repo() {
    return getRepository();
  }

  async getDashboard(usahaId: string, tanggal?: string): Promise<DashboardResponse> {
    const data = await this.repo.ringkasanBeranda(usahaId, tanggal);
    const margin = data.omzet_bulan_ini > 0
      ? Math.round((data.laba_kotor_bulan_ini / data.omzet_bulan_ini) * 1000) / 10
      : 0;

    return {
      ...data,
      margin_bulan_ini_persen: margin,
    };
  }
}
