const { parseRequestBody, sendJsonResponse, sendErrorResponse, readJsonFile, writeJsonFile } = require('../utils/helpers');
const path = require('path');
const url = require('url');

const JOURNAL_DATA_FILE = path.join(__dirname, '../data/journal.json');

/**
 * Initialize journal data file if it doesn't exist
 */
async function initializeJournalData() {
  try {
    const data = await readJsonFile(JOURNAL_DATA_FILE);
    return data;
  } catch (error) {
    // File doesn't exist, create it with default structure
    const defaultData = {
      entries: [],
      totalEntries: 0,
      streakDays: 0,
      lastEntryDate: null
    };
    await writeJsonFile(JOURNAL_DATA_FILE, defaultData);
    return defaultData;
  }
}

/**
 * Handle journal-related requests
 */
async function journalHandler(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;
  const searchParams = new URLSearchParams(url.search);

  try {
    // GET /api/journal/entries - Get journal entries with optional filtering
    if (pathname === '/api/journal/entries' && method === 'GET') {
      const data = await initializeJournalData();
      
      let entries = [...data.entries];
      
      // Apply filters
      const search = searchParams.get('search');
      const mood = searchParams.get('mood');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const page = parseInt(searchParams.get('page')) || 1;
      const limit = parseInt(searchParams.get('limit')) || 10;
      
      // Filter by search term
      if (search) {
        const searchTerm = search.toLowerCase();
        entries = entries.filter(entry => 
          entry.title.toLowerCase().includes(searchTerm) ||
          entry.content.toLowerCase().includes(searchTerm) ||
          (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
      }
      
      // Filter by mood
      if (mood) {
        entries = entries.filter(entry => entry.mood === mood);
      }
      
      // Filter by date range
      if (startDate) {
        entries = entries.filter(entry => entry.date >= startDate);
      }
      if (endDate) {
        entries = entries.filter(entry => entry.date <= endDate);
      }
      
      // Sort by date (newest first)
      entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Pagination
      const totalEntries = entries.length;
      const totalPages = Math.ceil(totalEntries / limit);
      const startIndex = (page - 1) * limit;
      const paginatedEntries = entries.slice(startIndex, startIndex + limit);
      
      return sendJsonResponse(res, 200, {
        entries: paginatedEntries,
        pagination: {
          currentPage: page,
          totalPages,
          totalEntries,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      });
    }

    // POST /api/journal/entries - Create new journal entry
    if (pathname === '/api/journal/entries' && method === 'POST') {
      const body = await parseRequestBody(req);
      const { title, content, mood, tags } = body;
      
      if (!title || !content) {
        return sendErrorResponse(res, 400, 'Title and content are required');
      }

      const data = await initializeJournalData();
      
      const entry = {
        id: Date.now().toString(),
        title: title.trim(),
        content: content.trim(),
        mood: mood || 'neutral',
        tags: tags || [],
        timestamp: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        wordCount: content.trim().split(/\s+/).length
      };

      data.entries.push(entry);
      data.totalEntries++;
      
      // Update streak
      const today = new Date().toISOString().split('T')[0];
      if (data.lastEntryDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (data.lastEntryDate === yesterdayStr) {
          data.streakDays++;
        } else {
          data.streakDays = 1;
        }
        data.lastEntryDate = today;
      }
      
      await writeJsonFile(JOURNAL_DATA_FILE, data);
      
      return sendJsonResponse(res, 201, {
        message: 'Journal entry created successfully',
        entry
      });
    }

    // GET /api/journal/entries/:id - Get specific journal entry
    if (pathname.startsWith('/api/journal/entries/') && method === 'GET') {
      const entryId = pathname.split('/').pop();
      const data = await initializeJournalData();
      
      const entry = data.entries.find(e => e.id === entryId);
      if (!entry) {
        return sendErrorResponse(res, 404, 'Journal entry not found');
      }
      
      return sendJsonResponse(res, 200, entry);
    }

    // PUT /api/journal/entries/:id - Update journal entry
    if (pathname.startsWith('/api/journal/entries/') && method === 'PUT') {
      const entryId = pathname.split('/').pop();
      const body = await parseRequestBody(req);
      const data = await initializeJournalData();
      
      const entryIndex = data.entries.findIndex(e => e.id === entryId);
      if (entryIndex === -1) {
        return sendErrorResponse(res, 404, 'Journal entry not found');
      }
      
      const { title, content, mood, tags } = body;
      
      if (title !== undefined) data.entries[entryIndex].title = title.trim();
      if (content !== undefined) {
        data.entries[entryIndex].content = content.trim();
        data.entries[entryIndex].wordCount = content.trim().split(/\s+/).length;
      }
      if (mood !== undefined) data.entries[entryIndex].mood = mood;
      if (tags !== undefined) data.entries[entryIndex].tags = tags;
      
      data.entries[entryIndex].updatedAt = new Date().toISOString();
      
      await writeJsonFile(JOURNAL_DATA_FILE, data);
      
      return sendJsonResponse(res, 200, {
        message: 'Journal entry updated successfully',
        entry: data.entries[entryIndex]
      });
    }

    // DELETE /api/journal/entries/:id - Delete journal entry
    if (pathname.startsWith('/api/journal/entries/') && method === 'DELETE') {
      const entryId = pathname.split('/').pop();
      const data = await initializeJournalData();
      
      const entryIndex = data.entries.findIndex(e => e.id === entryId);
      if (entryIndex === -1) {
        return sendErrorResponse(res, 404, 'Journal entry not found');
      }
      
      data.entries.splice(entryIndex, 1);
      data.totalEntries = Math.max(0, data.totalEntries - 1);
      
      await writeJsonFile(JOURNAL_DATA_FILE, data);
      
      return sendJsonResponse(res, 200, {
        message: 'Journal entry deleted successfully'
      });
    }

    // GET /api/journal/stats - Get journal statistics
    if (pathname === '/api/journal/stats' && method === 'GET') {
      const data = await initializeJournalData();
      
      // Calculate stats
      const totalWords = data.entries.reduce((sum, entry) => sum + (entry.wordCount || 0), 0);
      const averageWordsPerEntry = data.totalEntries > 0 ? Math.round(totalWords / data.totalEntries) : 0;
      
      // Mood distribution
      const moodCounts = data.entries.reduce((acc, entry) => {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
        return acc;
      }, {});
      
      // Entries this month
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const entriesThisMonth = data.entries.filter(entry => 
        entry.date.startsWith(thisMonth)
      ).length;
      
      const stats = {
        totalEntries: data.totalEntries,
        totalWords,
        averageWordsPerEntry,
        streakDays: data.streakDays,
        entriesThisMonth,
        moodDistribution: moodCounts,
        lastEntryDate: data.lastEntryDate
      };
      
      return sendJsonResponse(res, 200, stats);
    }

    // GET /api/journal/tags - Get all unique tags
    if (pathname === '/api/journal/tags' && method === 'GET') {
      const data = await initializeJournalData();
      
      const allTags = data.entries.flatMap(entry => entry.tags || []);
      const uniqueTags = [...new Set(allTags)].sort();
      
      return sendJsonResponse(res, 200, { tags: uniqueTags });
    }

    // POST /api/journal/export - Export journal entries
    if (pathname === '/api/journal/export' && method === 'POST') {
      const body = await parseRequestBody(req);
      const { format = 'json', startDate, endDate } = body;
      const data = await initializeJournalData();
      
      let entries = [...data.entries];
      
      // Filter by date range if provided
      if (startDate) {
        entries = entries.filter(entry => entry.date >= startDate);
      }
      if (endDate) {
        entries = entries.filter(entry => entry.date <= endDate);
      }
      
      // Sort by date
      entries.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      if (format === 'txt') {
        const textContent = entries
          .map(entry => `Date: ${entry.date}\nTitle: ${entry.title}\nMood: ${entry.mood}\n\n${entry.content}\n\n${'='.repeat(50)}\n`)
          .join('\n');
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', 'attachment; filename="journal-export.txt"');
        res.writeHead(200);
        res.end(textContent);
      } else if (format === 'csv') {
        const csvHeader = 'Date,Title,Content,Mood,Tags,Word Count\n';
        const csvContent = entries
          .map(entry => `"${entry.date}","${entry.title}","${entry.content.replace(/"/g, '""')}","${entry.mood}","${(entry.tags || []).join(';')}","${entry.wordCount || 0}"`)
          .join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="journal-export.csv"');
        res.writeHead(200);
        res.end(csvHeader + csvContent);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="journal-export.json"');
        res.writeHead(200);
        res.end(JSON.stringify({ entries }, null, 2));
      }
    }

    // If no route matches
    return sendErrorResponse(res, 404, 'Journal endpoint not found');

  } catch (error) {
    console.error('Journal handler error:', error);
    return sendErrorResponse(res, 500, 'Internal server error');
  }
}

module.exports = journalHandler;
