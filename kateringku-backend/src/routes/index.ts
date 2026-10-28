import { Router } from 'express';
import authRoutes from './authRoutes.js';
import bahanRoutes from './bahanRoutes.js';
import menuRoutes from './menuRoutes.js';
import pesananRoutes from './pesananRoutes.js';
import pelangganRoutes from './pelangganRoutes.js';
import produksiRoutes from './produksiRoutes.js';
import belanjaRoutes from './belanjaRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import onboardingRoutes from './onboardingRoutes.js';
import cadanganRoutes from './cadanganRoutes.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'KateringKu Backend API',
    waktu: new Date().toISOString(),
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/bahan', bahanRoutes);
router.use('/menu', menuRoutes);
router.use('/pesanan', pesananRoutes);
router.use('/pelanggan', pelangganRoutes);
router.use('/produksi', produksiRoutes);
router.use('/belanja', belanjaRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/cadangan', cadanganRoutes);

export default router;
