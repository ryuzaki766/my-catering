import { Request, Response, NextFunction } from 'express';
export declare class AuthController {
    static register(req: Request, res: Response, next: NextFunction): Promise<void>;
    static login(req: Request, res: Response, next: NextFunction): Promise<void>;
    static me(req: Request, res: Response, next: NextFunction): Promise<void>;
    static createUsaha(req: Request, res: Response, next: NextFunction): Promise<void>;
    static logout(req: Request, res: Response): Promise<void>;
}
