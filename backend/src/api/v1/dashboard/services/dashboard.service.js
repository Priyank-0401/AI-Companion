import { getDb } from '../../../../config/firebase.js';
import { logger } from '../../../../utils/logger.js';
import { Timestamp } from 'firebase-admin/firestore';

class DashboardService {
  constructor() {
    this.db = null;
    this.moodEntriesCollection = null;
    this.conversationsCollection = null;
    this.journalEntriesCollection = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      this.db = getDb();
      this.moodEntriesCollection = this.db.collection('moodEntries');
      this.conversationsCollection = this.db.collection('conversations');
      this.journalEntriesCollection = this.db.collection('journalEntries');
      this.initialized = true;
      logger.info('DashboardService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize DashboardService:', error);
      throw error;
    }
  }

  async getDashboardData(userId, timeRangeDays) {
    logger.info(`Fetching dashboard data for user ${userId} with time range ${timeRangeDays} days`);

    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - timeRangeDays);

    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const firestoreStartDate = Timestamp.fromDate(startDate);
    const firestoreStartOfWeek = Timestamp.fromDate(startOfWeek);

    // Fetch all data in parallel
    const [moodEntries, journalStats, chatStats] = await Promise.all([
      this.getMoodData(userId, firestoreStartDate),
      this.getJournalStats(userId, firestoreStartOfWeek).catch(err => {
        logger.warn('Could not fetch journal stats, returning default. Error:', err.message);
        return { total: 0, weekly: 0 };
      }),
      this.getChatStats(userId, firestoreStartOfWeek)
    ]);

    return { ...moodEntries, journalStats, chatStats };
  }

  async getMoodData(userId, startDate) {
    const snapshot = await this.moodEntriesCollection
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate)
      .orderBy('timestamp', 'desc')
      .get();

    const moodEntries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().timestamp.toDate()
    }));

    const currentMood = moodEntries[0]?.mood || 0;
    const previousMood = moodEntries[1]?.mood || 0;
    const trend = moodEntries.length > 1 ? currentMood - previousMood : 0;

    return {
      moodEntries,
      moodStats: { current: currentMood, trend }
    };
  }

  async getJournalStats(userId, startOfWeek) {
    try {
      // Get all journal entries for the user
      const journalSnapshot = await this.journalEntriesCollection
        .where('userId', '==', userId)
        .get();

      // Count weekly entries in memory
      const weeklyCount = journalSnapshot.docs
        .filter(doc => doc.data().createdAt >= startOfWeek)
        .length;

      return {
        total: journalSnapshot.size,
        weekly: weeklyCount
      };
    } catch (error) {
      logger.error('Error fetching journal stats:', error);
      return { total: 0, weekly: 0 };
    }
  }

  async getChatStats(userId, startOfWeek) {
    try {
      // Get all conversations for the user
      const conversationsSnapshot = await this.conversationsCollection
        .where('userId', '==', userId)
        .get();

      // Count weekly conversations in memory
      const weeklyCount = conversationsSnapshot.docs
        .filter(doc => doc.data().updatedAt >= startOfWeek)
        .length;

      return {
        total: conversationsSnapshot.size,
        weekly: weeklyCount
      };
    } catch (error) {
      logger.error('Error fetching chat stats:', error);
      return { total: 0, weekly: 0 };
    }
  }
}

// Singleton instance
let dashboardServiceInstance = null;

// Lazy initialization function
export const getDashboardService = async () => {
  if (!dashboardServiceInstance) {
    dashboardServiceInstance = new DashboardService();
    await dashboardServiceInstance.initialize();
  }
  return dashboardServiceInstance;
};

// For backward compatibility
export default {
  getDashboardService
};
