import { ResepDetail } from '../types/index.js';
export declare class ResepService {
    private get repo();
    getByMenuId(usahaId: string, menuId: string): Promise<ResepDetail[]>;
    setResep(usahaId: string, menuId: string, items: Array<{
        bahan_id: string;
        takaran: number;
    }>): Promise<ResepDetail[]>;
    deleteResepItem(usahaId: string, menuId: string, bahanId: string): Promise<boolean>;
}
