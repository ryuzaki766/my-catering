import { Request, Response, NextFunction } from 'express';
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Middleware untuk memastikan pengguna sudah memiliki usaha terdaftar
 */
export declare function requireUsahaMiddleware(req: Request, res: Response, next: NextFunction): void;
