const { parseRequestBody, sendJsonResponse, sendErrorResponse, readJsonFile, writeJsonFile } = require('../utils/helpers');
const path = require('path');
const url = require('url');

const WELLNESS_DATA_FILE = path.join(__dirname, '../data/wellness.json');

/**
 * Initialize wellness data file if it doesn't exist
 */
async function initializeWellnessData() {
  try {
    const data = await readJsonFile(WELLNESS_DATA_FILE);
    return data;
  } catch (error) {
    // File doesn't exist, create it with default structure
    const defaultData = {
      moodEntries: [],
      breathingSessionsCompleted: 0,
      meditationMinutes: 0,
      weeklyGoal: 150, // minutes
      streakDays: 0,
      lastActivityDate: null
    };
    await writeJsonFile(WELLNESS_DATA_FILE, defaultData);
    return defaultData;
  }
}

/**
 * Handle wellness-related requests
 */
async function wellnessHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    // GET /api/wellness/stats - Get wellness statistics
    if (pathname === '/api/wellness/stats' && method === 'GET') {
      const data = await initializeWellnessData();
      
      const stats = {
        breathingSessionsCompleted: data.breathingSessionsCompleted,
        meditationMinutes: data.meditationMinutes,
        weeklyGoal: data.weeklyGoal,
        streakDays: data.streakDays,
        weeklyProgress: Math.min((data.meditationMinutes / data.weeklyGoal) * 100, 100),
        recentMoods: data.moodEntries.slice(-7) // Last 7 mood entries
      };
      
      return sendJsonResponse(res, 200, stats);
    }

    // POST /api/wellness/mood - Log mood entry
    if (pathname === '/api/wellness/mood' && method === 'POST') {
      const body = await parseRequestBody(req);
      const { mood, energy, notes } = body;
      
      if (!mood || !energy) {
        return sendErrorResponse(res, 400, 'Mood and energy level are required');
      }

      const data = await initializeWellnessData();
      
      const moodEntry = {
        id: Date.now().toString(),
        mood: parseInt(mood),
        energy: parseInt(energy),
        notes: notes || '',
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
      };

      data.moodEntries.push(moodEntry);
      
      // Keep only last 100 entries to prevent file from growing too large
      if (data.moodEntries.length > 100) {
        data.moodEntries = data.moodEntries.slice(-100);
      }
      
      await writeJsonFile(WELLNESS_DATA_FILE, data);
      
      return sendJsonResponse(res, 201, {
        message: 'Mood logged successfully',
        entry: moodEntry
      });
    }

    // GET /api/wellness/moods - Get mood history
    if (pathname === '/api/wellness/moods' && method === 'GET') {
      const data = await initializeWellnessData();
      
      // Get last 30 days of mood entries
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentMoods = data.moodEntries.filter(entry => 
        new Date(entry.timestamp) >= thirtyDaysAgo
      );
      
      return sendJsonResponse(res, 200, recentMoods);
    }

    // POST /api/wellness/breathing/complete - Complete breathing session
    if (pathname === '/api/wellness/breathing/complete' && method === 'POST') {
      const body = await parseRequestBody(req);
      const { duration = 5 } = body; // Default 5 minutes
      
      const data = await initializeWellnessData();
      
      data.breathingSessionsCompleted++;
      data.meditationMinutes += duration;
      
      // Update streak
      const today = new Date().toISOString().split('T')[0];
      if (data.lastActivityDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (data.lastActivityDate === yesterdayStr) {
          data.streakDays++;
        } else if (data.lastActivityDate !== today) {
          data.streakDays = 1;
        }
        data.lastActivityDate = today;
      }
      
      await writeJsonFile(WELLNESS_DATA_FILE, data);
      
      return sendJsonResponse(res, 200, {
        message: 'Breathing session completed',
        stats: {
          breathingSessionsCompleted: data.breathingSessionsCompleted,
          meditationMinutes: data.meditationMinutes,
          streakDays: data.streakDays
        }
      });
    }

    // PUT /api/wellness/goal - Update weekly goal
    if (pathname === '/api/wellness/goal' && method === 'PUT') {
      const body = await parseRequestBody(req);
      const { weeklyGoal } = body;
      
      if (!weeklyGoal || weeklyGoal < 1) {
        return sendErrorResponse(res, 400, 'Valid weekly goal is required');
      }

      const data = await initializeWellnessData();
      data.weeklyGoal = parseInt(weeklyGoal);
      
      await writeJsonFile(WELLNESS_DATA_FILE, data);
      
      return sendJsonResponse(res, 200, {
        message: 'Weekly goal updated successfully',
        weeklyGoal: data.weeklyGoal
      });
    }

    // GET /api/wellness/insights - Get wellness insights
    if (pathname === '/api/wellness/insights' && method === 'GET') {
      const data = await initializeWellnessData();
      
      // Calculate insights
      const recentMoods = data.moodEntries.slice(-14); // Last 2 weeks
      const avgMood = recentMoods.length > 0 
        ? recentMoods.reduce((sum, entry) => sum + entry.mood, 0) / recentMoods.length 
        : 0;
      
      const avgEnergy = recentMoods.length > 0 
        ? recentMoods.reduce((sum, entry) => sum + entry.energy, 0) / recentMoods.length 
        : 0;
      
      const weeklyProgress = (data.meditationMinutes / data.weeklyGoal) * 100;
      
      const insights = {
        averageMood: Math.round(avgMood * 10) / 10,
        averageEnergy: Math.round(avgEnergy * 10) / 10,
        weeklyProgress: Math.min(weeklyProgress, 100),
        streakDays: data.streakDays,
        recommendation: generateRecommendation(avgMood, avgEnergy, data.streakDays)
      };
      
      return sendJsonResponse(res, 200, insights);
    }

    // If no route matches
    return sendErrorResponse(res, 404, 'Wellness endpoint not found');

  } catch (error) {
    console.error('Wellness handler error:', error);
    return sendErrorResponse(res, 500, 'Internal server error');
  }
}

/**
 * Generate wellness recommendation based on user data
 */
function generateRecommendation(avgMood, avgEnergy, streakDays) {
  if (avgMood < 3) {
    return "Consider focusing on mood-boosting activities like meditation or talking to a friend.";
  } else if (avgEnergy < 3) {
    return "Your energy levels seem low. Try some breathing exercises or light physical activity.";
  } else if (streakDays < 3) {
    return "Building consistency is key! Try to maintain your wellness routine daily.";
  } else if (streakDays >= 7) {
    return "Great job maintaining your wellness streak! Keep up the excellent work.";
  } else {
    return "You're doing well! Consider trying new wellness activities to enhance your routine.";
  }
}

module.exports = wellnessHandler;
