import { Request, Response, NextFunction } from 'express';
export declare class CadanganController {
    static ekspor(req: Request, res: Response, next: NextFunction): Promise<void>;
    static impor(req: Request, res: Response, next: NextFunction): Promise<void>;
}
