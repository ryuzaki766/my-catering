import { Pelanggan } from '../types/index.js';
export declare class PelangganService {
    private get repo();
    getAll(usahaId: string): Promise<Pelanggan[]>;
    getById(usahaId: string, id: string): Promise<Pelanggan>;
    create(usahaId: string, data: Omit<Pelanggan, 'id' | 'usaha_id'>): Promise<Pelanggan>;
    update(usahaId: string, id: string, data: Partial<Omit<Pelanggan, 'id' | 'usaha_id'>>): Promise<Pelanggan>;
    delete(usahaId: string, id: string): Promise<boolean>;
}
