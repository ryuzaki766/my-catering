import { RingkasanBeranda } from '../types/index.js';
export interface DashboardResponse extends RingkasanBeranda {
    margin_bulan_ini_persen: number;
}
export declare class DashboardService {
    private get repo();
    getDashboard(usahaId: string, tanggal?: string): Promise<DashboardResponse>;
}
