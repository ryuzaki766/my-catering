import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { swaggerDocument } from './docs/swagger.js';

export function createApp(): Application {
  const app = express();

  // API dinamis tidak memakai ETag → server tidak pernah membalas 304
  app.set('etag', false);

  // Security headers & CORS
  app.use(helmet({
    contentSecurityPolicy: false, // Memungkinkan Swagger UI berjalan dengan lancar
  }));
  app.use(cors({
    origin: config.corsOrigin,
    credentials: true,
  }));

  // Logger & Parsers
  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Respons API tidak boleh di-cache browser/proxy → cegah 304 & data basi.
  // (kecuali /api/docs & /api/docs.json — dokumentasi Swagger tetap boleh cache)
  app.use('/api', (req: Request, res: Response, next) => {
    if (!req.path.startsWith('/docs')) {
      res.set('Cache-Control', 'no-store');
    }
    next();
  });

  // Swagger Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  app.get('/api/docs.json', (req: Request, res: Response) => {
    res.json(swaggerDocument);
  });

  // Root Welcome & redirect to docs
  app.get('/', (req: Request, res: Response) => {
    res.json({
      nama: 'KateringKu Backend API',
      versi: '1.0.0',
      dokumentasi: '/api/docs',
      status: 'berjalan',
      db_mode: config.dbMode,
    });
  });

  // Mount API router
  app.use('/api', apiRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      sukses: false,
      pesan: `Rute ${req.method} ${req.originalUrl} tidak ditemukan`,
    });
  });

  // Centralized Error handler
  app.use(errorHandler);

  return app;
}

export default createApp();
