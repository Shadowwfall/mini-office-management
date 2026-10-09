import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardController.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Protect dashboard stats: Admin only
router.get('/stats', verifyToken, requireRole('admin'), dashboardController.getStats);

export default router;
