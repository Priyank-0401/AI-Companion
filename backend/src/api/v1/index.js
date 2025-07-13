import { Router } from 'express';
import { router as chatRoutes } from './chat';
import { router as avatarCallRoutes } from './avatar-call';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
router.use('/chat', chatRoutes);
router.use('/avatar-call', avatarCallRoutes);

export default router;
