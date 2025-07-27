import { Router } from 'express';
import { router as chatRoutes } from './chat';
import { router as avatarCallRoutes } from './avatar-call';
import { router as dashboardRoutes } from './dashboard';
import { moodRoutes } from './mood';
import journalRoutes from './journal/routes/journal.routes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/chat', chatRoutes);
router.use('/avatar-call', avatarCallRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/mood', moodRoutes);
router.use('/journal', journalRoutes);

export default router;
