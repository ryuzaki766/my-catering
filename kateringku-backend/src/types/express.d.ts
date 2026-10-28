import { User, Usaha } from './index.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
      usaha?: Usaha;
      usahaId?: string;
    }
  }
}

export {};
