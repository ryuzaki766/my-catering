import { Response } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    details?: any;
    constructor(message: string, statusCode?: number, details?: any);
}
export declare function apiSuccess<T>(res: Response, data: T, message?: string, statusCode?: number): Response;
export declare function apiError(res: Response, message?: string, statusCode?: number, details?: any): Response;
