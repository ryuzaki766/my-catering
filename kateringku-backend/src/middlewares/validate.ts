import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/response.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of error.errors) {
          const key = issue.path.join('.') || 'root';
          if (!fieldErrors[key]) fieldErrors[key] = [];
          fieldErrors[key].push(issue.message);
        }
        const pesan = error.errors.map((e) => e.message).join(', ');
        return next(new AppError(pesan, 400, { fieldErrors, issues: error.errors }));
      }
      next(error);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string[]> = {};
        for (const issue of error.errors) {
          const key = issue.path.join('.') || 'root';
          if (!fieldErrors[key]) fieldErrors[key] = [];
          fieldErrors[key].push(issue.message);
        }
        const pesan = error.errors.map((e) => e.message).join(', ');
        return next(new AppError(pesan, 400, { fieldErrors, issues: error.errors }));
      }
      next(error);
    }
  };
}
