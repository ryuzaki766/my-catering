import { AuthSession, Usaha } from '../types/index.js';
export declare class AuthService {
    private get repo();
    private generateToken;
    register(data: {
        email: string;
        password: string;
        nama_usaha: string;
    }): Promise<AuthSession>;
    login(data: {
        email: string;
        password: string;
    }): Promise<AuthSession>;
    getMe(userId: string): Promise<{
        user: {
            id: string;
            email: string;
        };
        usaha: Usaha | null;
    }>;
    createUsaha(userId: string, namaUsaha: string): Promise<Usaha>;
}
