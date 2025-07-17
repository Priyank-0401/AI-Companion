import { Router } from 'express';
import { authenticate } from '../../../../middleware/auth.middleware.js';
import DashboardController from '../controllers/dashboard.controller.js';

const router = Router();

// Apply authentication middleware to all dashboard routes
router.use(authenticate);

// GET /api/v1/dashboard
router.get('/', DashboardController.getDashboardData);

export default router;
