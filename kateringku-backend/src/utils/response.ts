import { Response } from 'express';

export class AppError extends Error {
  public statusCode: number;
  public details?: any;

  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function apiSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Sukses',
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    sukses: true,
    pesan: message,
    data,
  });
}

export function apiError(
  res: Response,
  message: string = 'Terjadi kesalahan',
  statusCode: number = 500,
  details?: any
): Response {
  return res.status(statusCode).json({
    sukses: false,
    pesan: message,
    rincian: details,
  });
}
