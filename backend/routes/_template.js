import express from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

const router = express.Router();

/**
 * @route   GET /api/example
 * @desc    Get all examples
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    // Your controller logic here
    res.json({ success: true, data: [] });
  })
);

/**
 * @route   GET /api/example/:id
 * @desc    Get single example by ID
 * @access  Private
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Your controller logic here
    res.json({ success: true, data: { id } });
  })
);

/**
 * @route   POST /api/example
 * @desc    Create new example
 * @access  Private
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = req.body;
    // Your controller logic here
    res.status(201).json({ success: true, data });
  })
);

/**
 * @route   PUT /api/example/:id
 * @desc    Update example
 * @access  Private
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    // Your controller logic here
    res.json({ success: true, data: { id, ...data } });
  })
);

/**
 * @route   DELETE /api/example/:id
 * @desc    Delete example
 * @access  Private
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    // Your controller logic here
    res.status(204).json({ success: true, data: null });
  })
);

export default router;
