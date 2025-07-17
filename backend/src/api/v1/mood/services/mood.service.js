import { getDb } from '../../../../config/firebase.js';
import { logger } from '../../../../utils/logger.js';

class MoodService {
  constructor() {
    // Don't initialize db in constructor to avoid module initialization issues
    this._db = null;
  }

  // Lazy getter for db
  get db() {
    if (!this._db) {
      this._db = getDb();
    }
    return this._db;
  }

  // Getter for the mood entries collection
  get moodEntriesCollection() {
    return this.db.collection('moodEntries');
  }

  /**
   * Adds a new mood entry for a user.
   * @param {string} userId - The ID of the user.
   * @param {number} mood - The mood rating (e.g., 1-5).
   * @param {string} [notes] - Optional notes for the entry.
   * @returns {Promise<string>} The ID of the newly created mood entry.
   */
  async addMoodEntry(userId, mood, notes = '') {
    try {
      const timestamp = new Date();
      const docRef = await this.moodEntriesCollection.add({
        userId,
        mood,
        notes,
        timestamp,
      });
      logger.info(`Mood entry created for user ${userId} with id ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      logger.error('Error adding mood entry to Firestore:', error);
      throw new Error('Failed to save mood entry.');
    }
  }
}

export default new MoodService();
