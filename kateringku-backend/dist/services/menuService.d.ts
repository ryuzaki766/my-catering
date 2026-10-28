import { Menu, MenuDetail } from '../types/index.js';
export declare class MenuService {
    private get repo();
    getAll(usahaId: string): Promise<MenuDetail[]>;
    getById(usahaId: string, id: string): Promise<MenuDetail>;
    create(usahaId: string, data: Omit<Menu, 'id' | 'usaha_id'>): Promise<Menu>;
    update(usahaId: string, id: string, data: Partial<Omit<Menu, 'id' | 'usaha_id'>>): Promise<Menu>;
    delete(usahaId: string, id: string): Promise<boolean>;
}
