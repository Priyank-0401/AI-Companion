import { validationResult } from 'express-validator';
import FirestoreService from '../services/firestore.service.js';
import { logger } from '../../../../utils/logger.js';

/**
 * @class JournalController
 * @description Controller for handling journal entry operations
 */
class JournalController {
  /**
   * Create a new journal entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async createEntry(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const entryData = req.body;
      const userId = req.user.uid;

      // Add userId to entry data
      entryData.userId = userId;

      // Create journal entry
      const entry = await FirestoreService.createEntry(entryData);

      res.status(201).json({
        success: true,
        data: entry
      });
    } catch (error) {
      logger.error('Error creating journal entry:', error);
      next(error);
    }
  }

  /**
   * Get a specific journal entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getEntry(req, res, next) {
    try {
      const { entryId } = req.params;
      const userId = req.user.uid;

      // Get entry with decryption (pass userId for automatic decryption)
      const entry = await FirestoreService.getEntry(entryId, userId);

      if (!entry) {
        return res.status(404).json({
          success: false,
          error: 'Journal entry not found'
        });
      }

      // Verify the entry belongs to the user
      if (entry.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to access this journal entry'
        });
      }

      res.json({
        success: true,
        data: entry
      });
    } catch (error) {
      logger.error('Error getting journal entry:', error);
      next(error);
    }
  }

  /**
   * Get user's journal entries
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getEntries(req, res, next) {
    try {
      const { limit = 50, startAfter } = req.query;
      const userId = req.user.uid;

      // Get and decrypt entries for display
      const { entries, lastVisible } = await FirestoreService.getEntriesForDisplay(
        userId,
        parseInt(limit, 10),
        startAfter
      );

      res.json({
        success: true,
        data: {
          entries,
        },
        pagination: {
          hasMore: entries.length === parseInt(limit, 10),
          nextCursor: lastVisible,
        }
      });
    } catch (error) {
      logger.error('Error getting journal entries:', error);
      next(error);
    }
  }

  /**
   * Update a journal entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async updateEntry(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { entryId } = req.params;
      const updateData = req.body;
      const userId = req.user.uid;

      // Verify the entry exists and belongs to the user
      const existingEntry = await FirestoreService.getEntry(entryId);
      if (!existingEntry) {
        return res.status(404).json({
          success: false,
          error: 'Journal entry not found'
        });
      }

      if (existingEntry.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to update this journal entry'
        });
      }

      // Add userId to update data for encryption
      updateData.userId = userId;

      // Update journal entry
      const updatedEntry = await FirestoreService.updateEntry(entryId, updateData);

      if (!updatedEntry) {
        return res.status(404).json({
          success: false,
          error: 'Journal entry not found after update'
        });
      }

      res.json({
        success: true,
        data: updatedEntry
      });
    } catch (error) {
      logger.error('Error updating journal entry:', error);
      next(error);
    }
  }

  /**
   * Delete a journal entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async deleteEntry(req, res, next) {
    try {
      const { entryId } = req.params;
      const userId = req.user.uid;

      // Verify the entry exists and belongs to the user
      const existingEntry = await FirestoreService.getEntry(entryId);
      if (!existingEntry) {
        return res.status(404).json({
          success: false,
          error: 'Journal entry not found'
        });
      }

      if (existingEntry.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to delete this journal entry'
        });
      }

      // Delete journal entry
      await FirestoreService.deleteEntry(entryId);

      res.json({
        success: true,
        message: 'Journal entry deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting journal entry:', error);
      next(error);
    }
  }

  /**
   * Get journal entries by mood
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async getEntriesByMood(req, res, next) {
    try {
      const { mood } = req.params;
      const { limit = 20 } = req.query;
      const userId = req.user.uid;

      // Get entries by mood (already decrypted)
      const entries = await FirestoreService.getEntriesByMood(
        userId,
        mood,
        parseInt(limit, 10)
      );

      res.json({
        success: true,
        data: {
          entries,
          mood
        }
      });
    } catch (error) {
      logger.error('Error getting journal entries by mood:', error);
      next(error);
    }
  }

  /**
   * Search journal entries
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Next middleware function
   */
  async searchEntries(req, res, next) {
    try {
      const { searchTerm } = req.query;
      const { limit = 20 } = req.query;
      const userId = req.user.uid;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          error: 'Search term is required'
        });
      }

      // Search entries (already decrypted)
      const entries = await FirestoreService.searchEntries(
        userId,
        searchTerm,
        parseInt(limit, 10)
      );

      res.json({
        success: true,
        data: {
          entries,
          searchTerm
        }
      });
    } catch (error) {
      logger.error('Error searching journal entries:', error);
      next(error);
    }
  }
}

export default new JournalController();
