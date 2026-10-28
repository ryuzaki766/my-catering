import { Bahan } from '../types/index.js';
export declare class BahanService {
    private get repo();
    getAll(usahaId: string): Promise<Bahan[]>;
    getById(usahaId: string, id: string): Promise<Bahan>;
    create(usahaId: string, data: Omit<Bahan, 'id' | 'usaha_id'>): Promise<Bahan>;
    update(usahaId: string, id: string, data: Partial<Omit<Bahan, 'id' | 'usaha_id'>>): Promise<Bahan>;
    delete(usahaId: string, id: string): Promise<boolean>;
}
