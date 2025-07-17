import { Router } from 'express';
import { authenticate } from '../../../../middleware/auth.middleware.js';
import MoodController from '../controllers/mood.controller.js';

const router = Router();

// Apply authentication middleware to all mood routes
router.use(authenticate);

// POST /api/v1/mood
router.post('/', MoodController.addMoodEntry);

export default router;
