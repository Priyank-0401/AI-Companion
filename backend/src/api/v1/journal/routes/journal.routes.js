import express from 'express';
import JournalController from '../controllers/journal.controller.js';
import { authenticate } from '../../../../middleware/auth.middleware.js';
import { 
  validateCreateEntry, 
  validateUpdateEntry, 
  validateEntryId, 
  validateGetEntries, 
  validateGetEntriesByMood,
  validateSearchEntries
} from '../validators/journal.validators.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new journal entry
router.post('/', validateCreateEntry, JournalController.createEntry);

// Get all journal entries for the authenticated user
router.get('/', validateGetEntries, JournalController.getEntries);

// Get a specific journal entry
router.get('/:entryId', validateEntryId, JournalController.getEntry);

// Update a journal entry
router.put('/:entryId', validateUpdateEntry, JournalController.updateEntry);

// Delete a journal entry
router.delete('/:entryId', validateEntryId, JournalController.deleteEntry);

// Get journal entries by mood
router.get('/mood/:mood', validateGetEntriesByMood, JournalController.getEntriesByMood);

// Search journal entries
router.get('/search', validateSearchEntries, JournalController.searchEntries);

export default router;
