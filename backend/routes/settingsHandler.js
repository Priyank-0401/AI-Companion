const { parseRequestBody, sendJsonResponse, sendErrorResponse, readJsonFile, writeJsonFile } = require('../utils/helpers');
const path = require('path');
const url = require('url');

const SETTINGS_DATA_FILE = path.join(__dirname, '../data/settings.json');

/**
 * Initialize settings data file if it doesn't exist
 */
async function initializeSettingsData() {
  try {
    const data = await readJsonFile(SETTINGS_DATA_FILE);
    return data;
  } catch (error) {
    // File doesn't exist, create it with default structure
    const defaultSettings = {
      profile: {
        name: '',
        email: '',
        bio: '',
        timezone: 'UTC',
        language: 'en'
      },
      appearance: {
        theme: 'dark',
        fontSize: 'medium',
        animations: true,
        compactMode: false
      },
      notifications: {
        dailyReminders: true,
        journalReminders: true,
        wellnessReminders: true,
        emailNotifications: false,
        pushNotifications: true,
        soundEnabled: true
      },
      ai: {
        conversationStyle: 'supportive',
        responseLength: 'medium',
        personalityType: 'empathetic',
        autoSave: true,
        contextMemory: true
      },
      privacy: {
        dataCollection: true,
        analytics: false,
        shareUsageData: false,
        encryptData: true
      },
      audio: {
        voiceEnabled: false,
        speechRate: 1.0,
        speechPitch: 1.0,
        preferredVoice: 'default',
        backgroundSounds: true
      }
    };
    await writeJsonFile(SETTINGS_DATA_FILE, defaultSettings);
    return defaultSettings;
  }
}

/**
 * Validate settings data
 */
function validateSettings(section, data) {
  const validations = {
    profile: {
      name: (val) => typeof val === 'string' && val.length <= 100,
      email: (val) => typeof val === 'string' && (val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)),
      bio: (val) => typeof val === 'string' && val.length <= 500,
      timezone: (val) => typeof val === 'string',
      language: (val) => typeof val === 'string' && ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh'].includes(val)
    },
    appearance: {
      theme: (val) => ['light', 'dark', 'auto'].includes(val),
      fontSize: (val) => ['small', 'medium', 'large'].includes(val),
      animations: (val) => typeof val === 'boolean',
      compactMode: (val) => typeof val === 'boolean'
    },
    notifications: {
      dailyReminders: (val) => typeof val === 'boolean',
      journalReminders: (val) => typeof val === 'boolean',
      wellnessReminders: (val) => typeof val === 'boolean',
      emailNotifications: (val) => typeof val === 'boolean',
      pushNotifications: (val) => typeof val === 'boolean',
      soundEnabled: (val) => typeof val === 'boolean'
    },
    ai: {
      conversationStyle: (val) => ['supportive', 'analytical', 'casual', 'professional'].includes(val),
      responseLength: (val) => ['short', 'medium', 'long'].includes(val),
      personalityType: (val) => ['empathetic', 'logical', 'creative', 'balanced'].includes(val),
      autoSave: (val) => typeof val === 'boolean',
      contextMemory: (val) => typeof val === 'boolean'
    },
    privacy: {
      dataCollection: (val) => typeof val === 'boolean',
      analytics: (val) => typeof val === 'boolean',
      shareUsageData: (val) => typeof val === 'boolean',
      encryptData: (val) => typeof val === 'boolean'
    },
    audio: {
      voiceEnabled: (val) => typeof val === 'boolean',
      speechRate: (val) => typeof val === 'number' && val >= 0.5 && val <= 2.0,
      speechPitch: (val) => typeof val === 'number' && val >= 0.5 && val <= 2.0,
      preferredVoice: (val) => typeof val === 'string',
      backgroundSounds: (val) => typeof val === 'boolean'
    }
  };

  const sectionValidations = validations[section];
  if (!sectionValidations) return false;

  for (const [key, value] of Object.entries(data)) {
    const validator = sectionValidations[key];
    if (validator && !validator(value)) {
      return false;
    }
  }
  return true;
}

/**
 * Handle settings-related requests
 */
async function settingsHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  try {
    // GET /api/settings - Get all settings
    if (pathname === '/api/settings' && method === 'GET') {
      const settings = await initializeSettingsData();
      return sendJsonResponse(res, 200, settings);
    }

    // GET /api/settings/:section - Get specific settings section
    if (pathname.startsWith('/api/settings/') && method === 'GET') {
      const section = pathname.split('/').pop();
      const settings = await initializeSettingsData();
      
      if (!settings[section]) {
        return sendErrorResponse(res, 404, 'Settings section not found');
      }
      
      return sendJsonResponse(res, 200, settings[section]);
    }

    // PUT /api/settings/:section - Update specific settings section
    if (pathname.startsWith('/api/settings/') && method === 'PUT') {
      const section = pathname.split('/').pop();
      const body = await parseRequestBody(req);
      
      const settings = await initializeSettingsData();
      
      if (!settings[section]) {
        return sendErrorResponse(res, 404, 'Settings section not found');
      }

      // Validate the data
      if (!validateSettings(section, body)) {
        return sendErrorResponse(res, 400, 'Invalid settings data');
      }

      // Update only the provided fields
      settings[section] = { ...settings[section], ...body };
      
      await writeJsonFile(SETTINGS_DATA_FILE, settings);
      
      return sendJsonResponse(res, 200, {
        message: 'Settings updated successfully',
        section: settings[section]
      });
    }

    // POST /api/settings/reset - Reset all settings to defaults
    if (pathname === '/api/settings/reset' && method === 'POST') {
      const body = await parseRequestBody(req);
      const { section } = body;
      
      if (section) {
        // Reset specific section
        const settings = await initializeSettingsData();
        const defaultSettings = await initializeSettingsData(); // This will get defaults
        
        if (!settings[section]) {
          return sendErrorResponse(res, 404, 'Settings section not found');
        }
        
        // Get default values for the section
        const fs = require('fs').promises;
        try {
          await fs.unlink(SETTINGS_DATA_FILE);
        } catch (error) {
          // File might not exist, that's ok
        }
        
        const freshDefaults = await initializeSettingsData();
        settings[section] = freshDefaults[section];
        
        await writeJsonFile(SETTINGS_DATA_FILE, settings);
        
        return sendJsonResponse(res, 200, {
          message: `${section} settings reset to defaults`,
          section: settings[section]
        });
      } else {
        // Reset all settings
        const fs = require('fs').promises;
        try {
          await fs.unlink(SETTINGS_DATA_FILE);
        } catch (error) {
          // File might not exist, that's ok
        }
        
        const defaultSettings = await initializeSettingsData();
        
        return sendJsonResponse(res, 200, {
          message: 'All settings reset to defaults',
          settings: defaultSettings
        });
      }
    }

    // POST /api/settings/export - Export settings
    if (pathname === '/api/settings/export' && method === 'POST') {
      const settings = await initializeSettingsData();
      
      const exportData = {
        exported: new Date().toISOString(),
        version: '1.0',
        settings
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="ai-companion-settings.json"');
      res.writeHead(200);
      res.end(JSON.stringify(exportData, null, 2));
    }

    // POST /api/settings/import - Import settings
    if (pathname === '/api/settings/import' && method === 'POST') {
      const body = await parseRequestBody(req);
      const { settings: importedSettings } = body;
      
      if (!importedSettings) {
        return sendErrorResponse(res, 400, 'Settings data is required');
      }

      const currentSettings = await initializeSettingsData();
      
      // Validate and merge imported settings
      const validSections = ['profile', 'appearance', 'notifications', 'ai', 'privacy', 'audio'];
      const updatedSettings = { ...currentSettings };
      
      for (const section of validSections) {
        if (importedSettings[section] && validateSettings(section, importedSettings[section])) {
          updatedSettings[section] = { ...updatedSettings[section], ...importedSettings[section] };
        }
      }
      
      await writeJsonFile(SETTINGS_DATA_FILE, updatedSettings);
      
      return sendJsonResponse(res, 200, {
        message: 'Settings imported successfully',
        settings: updatedSettings
      });
    }

    // GET /api/settings/backup - Create settings backup
    if (pathname === '/api/settings/backup' && method === 'GET') {
      const settings = await initializeSettingsData();
      
      const backupData = {
        created: new Date().toISOString(),
        version: '1.0',
        type: 'backup',
        settings
      };
      
      return sendJsonResponse(res, 200, backupData);
    }

    // If no route matches
    return sendErrorResponse(res, 404, 'Settings endpoint not found');

  } catch (error) {
    console.error('Settings handler error:', error);
    return sendErrorResponse(res, 500, 'Internal server error');
  }
}

module.exports = settingsHandler;
