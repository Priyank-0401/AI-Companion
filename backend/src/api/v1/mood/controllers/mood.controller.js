import MoodService from '../services/mood.service.js';
import { logger } from '../../../../utils/logger.js';

class MoodController {
  /**
   * Handles adding a new mood entry.
   */
  async addMoodEntry(req, res, next) {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'User not authenticated' });
      }

      const { mood, notes } = req.body;

      // Basic validation
      if (typeof mood !== 'number' || mood < 1 || mood > 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed: mood must be a number between 1 and 5.' 
        });
      }

      const newEntryId = await MoodService.addMoodEntry(userId, mood, notes);

      res.status(201).json({ success: true, data: { id: newEntryId } });
    } catch (error) {
      logger.error('Error in addMoodEntry controller:', error);
      next(error);
    }
  }
}

export default new MoodController();
