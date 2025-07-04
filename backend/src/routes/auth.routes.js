import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes - no authentication required
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protected routes - require authentication
router.get('/me', protect, authController.getMe);
router.patch('/update-me', protect, authController.updateMe);
router.delete('/delete-me', protect, authController.deleteMe);
router.get('/logout', protect, authController.logout);

export default router;
