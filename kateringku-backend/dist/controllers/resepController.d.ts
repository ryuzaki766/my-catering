import { Request, Response, NextFunction } from 'express';
export declare class ResepController {
    static getByMenuId(req: Request, res: Response, next: NextFunction): Promise<void>;
    static setResep(req: Request, res: Response, next: NextFunction): Promise<void>;
    static deleteResepItem(req: Request, res: Response, next: NextFunction): Promise<void>;
}
