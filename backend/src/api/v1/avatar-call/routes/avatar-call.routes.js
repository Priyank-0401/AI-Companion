import { Router } from 'express';
import { processVoiceMessage } from '../controllers/avatar-call.controller.js';
import { validateAvatarCallRequest } from '../middleware/validate-request.js';
import { rateLimiter } from '../../../../middleware/rate-limiter.js';

export const router = Router();

/**
 * @swagger
 * /api/v1/avatar-call/process:
 *   post:
 *     summary: Process a voice message and get a response
 *     tags: [Avatar Call]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: The voice message to process
 *               model:
 *                 type: string
 *                 default: llama3-8b-8192
 *                 description: The model to use for generating the response
 *               style:
 *                 type: string
 *                 default: empathetic
 *                 description: The style of the response
 *     responses:
 *       200:
 *         description: Successfully processed the voice message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     content:
 *                       type: string
 *                     emotion:
 *                       type: string
 *                       enum: [happy, sad, angry, surprised, neutral]
 *                     timestamp:
 *                       type: string
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Server error
 */
// Apply rate limiter with proper configuration
const avatarCallRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  keyGenerator: (req) => `avatar-call:${req.ip}`,
  message: 'Too many requests, please try again later.'
});

/**
 * @route POST /api/v1/avatar-call/process
 * @desc Process a voice message and get a response
 * @access Public
 */
router.post('/process', 
  avatarCallRateLimiter,
  validateAvatarCallRequest,
  processVoiceMessage
);

export default router;
