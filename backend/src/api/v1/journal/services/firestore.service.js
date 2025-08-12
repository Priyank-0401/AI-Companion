import { getDb } from '../../../../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import JournalEntry from '../models/journalEntry.model.js';
import UserEncryptionService from '../../../../services/UserEncryptionService.js';
import { logger } from '../../../../utils/logger.js';

const JOURNAL_ENTRIES_COLLECTION = 'journalEntries';

// Initialize Firestore instance
let db;

// Helper function to get Firestore instance with initialization check
const getFirestoreDb = () => {
  if (!db) {
    db = getDb();
  }
  return db;
};

// Helper function to convert Firestore timestamps to Date objects
const convertTimestamps = (data) => {
  if (!data) return null;
  
  const result = { ...data };
  
  // Convert Firestore Timestamp to JavaScript Date
  Object.keys(result).forEach(key => {
    try {
      // Handle Firestore Timestamp
      if (result[key] && typeof result[key] === 'object') {
        if ('toDate' in result[key]) {
          result[key] = result[key].toDate();
        } 
        // Handle timestamp in seconds/nanoseconds format
        else if ('_seconds' in result[key] || 'seconds' in result[key]) {
          const seconds = result[key]._seconds || result[key].seconds;
          const nanoseconds = result[key]._nanoseconds || result[key].nanoseconds || 0;
          result[key] = new Date(seconds * 1000 + nanoseconds / 1000000);
        }
      }
      // Handle ISO date strings
      else if (typeof result[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result[key])) {
        const date = new Date(result[key]);
        if (!isNaN(date.getTime())) {
          result[key] = date;
        }
      }
    } catch (error) {
      logger.warn(`Error converting timestamp for key ${key}:`, error);
    }
  });
  
  return result;
};

class FirestoreService {
  /**
   * Create a new journal entry
   * @param {Object} entryData - Journal entry data
   * @returns {Promise<JournalEntry>} Created journal entry
   */
  static async createEntry(entryData) {
    try {
      // Create journal entry without timestamp first
      // Remove id from entryData to ensure Firestore document ID is used
      const { id: entryIdToRemove, ...entryDataWithoutId } = entryData;
      const entry = new JournalEntry({
        ...entryDataWithoutId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // If we have a userId and plain text content, encrypt it
      if (entryData.userId && entryData.content && typeof entryData.content === 'string') {
        try {
          // Check if user has encryption enabled
          const encryptionStatus = await UserEncryptionService.getUserEncryptionStatus(entryData.userId);
          
          if (encryptionStatus.encryptionEnabled) {
            // Encrypt the journal entry content
            const encryptedContent = await UserEncryptionService.encryptUserMessage(
              entryData.userId, 
              entryData.content
            );
            
            // Update entry with encrypted content
            entry.content = encryptedContent;
            entry.markAsEncrypted('1.0');
            
            logger.debug(`Journal entry content encrypted for user: ${entryData.userId}`);
          } else {
            logger.debug(`User ${entryData.userId} does not have encryption enabled`);
          }
        } catch (encryptionError) {
          logger.error(`Failed to encrypt journal entry for user ${entryData.userId}:`, encryptionError);
          // Continue with unencrypted entry if encryption fails
        }
      }
      
      // Convert to plain object and add server timestamp
      const entryObject = entry.toJSON();
      // Remove the generated id from the entry object to ensure Firestore document ID is used
      const { id: generatedId, ...entryObjectWithoutId } = entryObject;
      const entryDataWithTimestamps = {
        ...entryObjectWithoutId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };
      
      // Add to Firestore
      const docRef = await getFirestoreDb().collection(JOURNAL_ENTRIES_COLLECTION).add(entryDataWithTimestamps);
      
      // Update the entry with the Firestore document ID
      const entryDataWithFirestoreId = {
        ...entryDataWithTimestamps,
        id: docRef.id
      };
      
      // Update the document with the Firestore document ID
      await docRef.update({ id: docRef.id });
      
      // Get the newly created document
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        throw new Error('Failed to create journal entry: Document not found after creation');
      }
      
      // Convert Firestore timestamp to Date and return
      const entryDoc = convertTimestamps(docSnap.data());
      // Remove any existing id from entryDoc to prevent overwriting the Firestore document ID
      const { id: _, ...entryDocWithoutId } = entryDoc;
      let createdEntry = new JournalEntry({ id: docRef.id, ...entryDocWithoutId });
      
      // If the entry is encrypted, decrypt it for display
      if (createdEntry.isEncrypted()) {
        try {
          let decryptedContent = await UserEncryptionService.processMessageContent(
            entryData.userId,
            createdEntry.content
          );
          
          // Check if content is still in encrypted format (double encryption)
          const isStillEncrypted = decryptedContent.includes(':') && decryptedContent.split(':').length === 3;
          
          if (isStillEncrypted) {
            // Decrypt again to handle double encryption
            decryptedContent = await UserEncryptionService.processMessageContent(
              entryData.userId,
              decryptedContent
            );
          }
          
          // Create a new metadata object without encryption properties
          const metadataWithoutEncryption = {};
          for (const [key, value] of Object.entries(createdEntry.metadata)) {
            if (key !== 'encrypted' && key !== 'encryptionVersion') {
              metadataWithoutEncryption[key] = value;
            }
          }
          
          // Create a new entry with decrypted content for display
          createdEntry = new JournalEntry({
            id: createdEntry.id,
            userId: createdEntry.userId,
            title: createdEntry.title,
            content: decryptedContent,
            mood: createdEntry.mood,
            tags: createdEntry.tags,
            type: createdEntry.type,
            mediaUrl: createdEntry.mediaUrl,
            mediaPath: createdEntry.mediaPath,
            mediaSize: createdEntry.mediaSize,
            mediaType: createdEntry.mediaType,
            createdAt: createdEntry.createdAt,
            updatedAt: createdEntry.updatedAt,
            metadata: metadataWithoutEncryption
          });
          
        } catch (decryptionError) {
          logger.error(`Failed to decrypt journal entry ${createdEntry.id} for display:`, decryptionError);
        }
      }
      
      return createdEntry;
    } catch (error) {
      logger.error('Error creating journal entry:', error);
      throw new Error(`Failed to create journal entry: ${error.message}`);
    }
  }

  /**
   * Get a journal entry by ID
   * @param {string} entryId - Journal entry ID
   * @param {string} userId - User ID (optional, for decryption)
   * @returns {Promise<JournalEntry|null>} Journal entry or null if not found
   */
  static async getEntry(entryId, userId = null) {
    try {
      const doc = await getFirestoreDb().collection(JOURNAL_ENTRIES_COLLECTION).doc(entryId).get();
      if (!doc.exists) {
        return null;
      }
      
      const data = convertTimestamps(doc.data());
      // Remove any existing id from data to prevent overwriting the Firestore document ID
      const { id: _, ...dataWithoutId } = data;
      let entry = new JournalEntry({ id: doc.id, ...dataWithoutId });
      
      // If userId is provided and entry is encrypted, decrypt it for display
      if (userId && entry.isEncrypted()) {
        try {
          let decryptedContent = await UserEncryptionService.processMessageContent(
            userId,
            entry.content
          );
          
          // Check if content is still in encrypted format (double encryption)
          const isStillEncrypted = decryptedContent.includes(':') && decryptedContent.split(':').length === 3;
          
          if (isStillEncrypted) {
            // Decrypt again to handle double encryption
            decryptedContent = await UserEncryptionService.processMessageContent(
              userId,
              decryptedContent
            );
          }
          
          // Create a new metadata object without encryption properties
          const metadataWithoutEncryption = {};
          for (const [key, value] of Object.entries(entry.metadata)) {
            if (key !== 'encrypted' && key !== 'encryptionVersion') {
              metadataWithoutEncryption[key] = value;
            }
          }
          
          // Create a new entry with decrypted content for display
          entry = new JournalEntry({
            id: entry.id,
            userId: entry.userId,
            title: entry.title,
            content: decryptedContent,
            mood: entry.mood,
            tags: entry.tags,
            type: entry.type,
            mediaUrl: entry.mediaUrl,
            mediaPath: entry.mediaPath,
            mediaSize: entry.mediaSize,
            mediaType: entry.mediaType,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            metadata: metadataWithoutEncryption
          });
          
        } catch (decryptionError) {
          logger.error(`Failed to decrypt journal entry ${entryId} for display:`, decryptionError);
        }
      }
      
      return entry;
    } catch (error) {
      logger.error(`Error getting journal entry ${entryId}:`, error);
      throw new Error(`Failed to get journal entry: ${error.message}`);
    }
  }

  /**
   * Get user's journal entries
   * @param {string} userId - User ID
   * @param {number} limit - Number of entries to return
   * @param {string} startAfterId - ID of the last entry for pagination
   * @returns {Promise<{entries: Array<JournalEntry>, lastVisible: any}>} List of entries and pagination info
   */
  static async getUserEntries(userId, limitCount = 50, startAfterId = null) {
    try {
      let query = getFirestoreDb().collection(JOURNAL_ENTRIES_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limitCount);

      if (startAfterId) {
        const lastDoc = await getFirestoreDb().collection(JOURNAL_ENTRIES_COLLECTION).doc(startAfterId).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      const querySnapshot = await query.get();
      const entries = [];
      let lastVisible = null;

      querySnapshot.forEach((doc) => {
        entries.push(new JournalEntry({ id: doc.id, ...convertTimestamps(doc.data()) }));
        lastVisible = doc;
      });

      return {
        entries,
        lastVisible: lastVisible ? lastVisible.id : null
      };
    } catch (error) {
      logger.error(`Error getting journal entries for user ${userId}:`, error);
      throw new Error(`Failed to get journal entries: ${error.message}`);
    }
  }

  /**
   * Get and decrypt journal entries for display purposes
   * @param {string} userId - User ID
   * @param {number} limit - Number of entries to return
   * @param {string} startAfterId - ID of the last entry for pagination
   * @returns {Promise<{entries: Array<JournalEntry>, lastVisible: any}>} List of decrypted entries and pagination info
   */
  static async getEntriesForDisplay(userId, limitCount = 50, startAfterId = null) {
    try {
      // Get entries from Firestore
      const { entries, lastVisible } = await this.getUserEntries(userId, limitCount, startAfterId);
      
      // Decrypt entries if they are encrypted
      const decryptedEntries = [];
      
      for (const entry of entries) {
        try {
          // Check if entry content is encrypted
          if (entry.isEncrypted()) {
            // Decrypt the entry content
            let decryptedContent = await UserEncryptionService.processMessageContent(
              userId,
              entry.content
            );

            // Detect if still looks like encrypted (iv:authTag:ciphertext) and decrypt again
            const looksEncrypted = typeof decryptedContent === 'string' && decryptedContent.includes(':') && decryptedContent.split(':').length === 3;
            if (looksEncrypted) {
              decryptedContent = await UserEncryptionService.processMessageContent(
                userId,
                decryptedContent
              );
            }

            // Strip encryption flags from metadata for display
            const metadataWithoutEncryption = {};
            for (const [key, value] of Object.entries(entry.metadata || {})) {
              if (key !== 'encrypted' && key !== 'encryptionVersion') {
                metadataWithoutEncryption[key] = value;
              }
            }

            // Create a new entry with decrypted content
            const decryptedEntry = new JournalEntry({
              id: entry.id,
              userId: entry.userId,
              title: entry.title,
              content: decryptedContent,
              mood: entry.mood,
              tags: entry.tags,
              type: entry.type,
              mediaUrl: entry.mediaUrl,
              mediaPath: entry.mediaPath,
              mediaSize: entry.mediaSize,
              mediaType: entry.mediaType,
              createdAt: entry.createdAt,
              updatedAt: entry.updatedAt,
              metadata: metadataWithoutEncryption
            });

            decryptedEntries.push(decryptedEntry);
          } else {
            // Entry is not encrypted, use as-is
            decryptedEntries.push(entry);
          }
        } catch (decryptionError) {
          logger.error(`Failed to decrypt journal entry ${entry.id} for user ${userId}:`, decryptionError);
          // Keep original entry if decryption fails
          decryptedEntries.push(entry);
        }
      }
      
      return {
        entries: decryptedEntries,
        lastVisible
      };
    } catch (error) {
      logger.error(`Error getting journal entries for display for user ${userId}:`, error);
      throw new Error(`Failed to get journal entries for display: ${error.message}`);
    }
  }

  /**
   * Update a journal entry
   * @param {string} entryId - Journal entry ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<JournalEntry>} Updated journal entry
   */
  static async updateEntry(entryId, updateData) {
    try {
      const entryRef = getFirestoreDb().collection(JOURNAL_ENTRIES_COLLECTION).doc(entryId);
      
      // First check if the document exists
      const doc = await entryRef.get();
      if (!doc.exists) {
        return null;
      }
      
      // Prepare the update data
      // Remove id from updateData to prevent conflicts
      const { id: updateId, ...updateDataWithoutId } = updateData;
      const updateDataWithTimestamps = {
        ...updateDataWithoutId,
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      // If we have content to update and a userId, encrypt it
      if (updateData.content && updateData.userId) {
        try {
          // Check if user has encryption enabled
          const encryptionStatus = await UserEncryptionService.getUserEncryptionStatus(updateData.userId);
          
          if (encryptionStatus.encryptionEnabled) {
            // Encrypt the journal entry content
            const encryptedContent = await UserEncryptionService.encryptUserMessage(
              updateData.userId, 
              updateData.content
            );
            
            // Update with encrypted content
            updateDataWithTimestamps.content = encryptedContent;
            updateDataWithTimestamps['metadata.encrypted'] = true;
            updateDataWithTimestamps['metadata.encryptionVersion'] = '1.0';
            
            logger.debug(`Journal entry content encrypted for user: ${updateData.userId}`);
          } else {
            logger.debug(`User ${updateData.userId} does not have encryption enabled`);
            updateDataWithTimestamps['metadata.encrypted'] = false;
            updateDataWithTimestamps['metadata.encryptionVersion'] = null;
          }
        } catch (encryptionError) {
          logger.error(`Failed to encrypt journal entry for user ${updateData.userId}:`, encryptionError);
          // Continue with unencrypted content if encryption fails
        }
      }
      
      // Perform the update
      await entryRef.update(updateDataWithTimestamps);
      
      // Return the updated entry
      const updatedDoc = await entryRef.get();
      if (!updatedDoc.exists) {
        return null;
      }
      
      // Remove any existing id from data to prevent overwriting the Firestore document ID
      const updatedData = convertTimestamps(updatedDoc.data());
      const { id: _, ...updatedDataWithoutId } = updatedData;
      let updatedEntry = new JournalEntry({ 
        id: updatedDoc.id, 
        ...updatedDataWithoutId 
      });
      
      // If the entry is encrypted, decrypt it for display (similar to createEntry)
      if (updatedEntry.isEncrypted() && updateData.userId) {
        try {
          let decryptedContent = await UserEncryptionService.processMessageContent(
            updateData.userId,
            updatedEntry.content
          );
          
          // Check if content is still in encrypted format (double encryption)
          const isStillEncrypted = decryptedContent.includes(':') && decryptedContent.split(':').length === 3;
          
          if (isStillEncrypted) {
            // Decrypt again to handle double encryption
            decryptedContent = await UserEncryptionService.processMessageContent(
              updateData.userId,
              decryptedContent
            );
          }
          
          // Create a new metadata object without encryption properties
          const metadataWithoutEncryption = {};
          for (const [key, value] of Object.entries(updatedEntry.metadata)) {
            if (key !== 'encrypted' && key !== 'encryptionVersion') {
              metadataWithoutEncryption[key] = value;
            }
          }
          
          // Create a new entry with decrypted content for display
          updatedEntry = new JournalEntry({
            id: updatedEntry.id,
            userId: updatedEntry.userId,
            title: updatedEntry.title,
            content: decryptedContent,
            mood: updatedEntry.mood,
            tags: updatedEntry.tags,
            type: updatedEntry.type,
            mediaUrl: updatedEntry.mediaUrl,
            mediaPath: updatedEntry.mediaPath,
            mediaSize: updatedEntry.mediaSize,
            mediaType: updatedEntry.mediaType,
            createdAt: updatedEntry.createdAt,
            updatedAt: updatedEntry.updatedAt,
            metadata: metadataWithoutEncryption
          });
          
        } catch (decryptionError) {
          logger.error(`Failed to decrypt journal entry ${updatedEntry.id} for display:`, decryptionError);
        }
      }
      
      return updatedEntry;
    } catch (error) {
      logger.error(`Error updating journal entry ${entryId}:`, error);
      throw new Error(`Failed to update journal entry: ${error.message}`);
    }
  }

  /**
   * Delete a journal entry
   * @param {string} entryId - Journal entry ID
   * @returns {Promise<void>}
   */
  static async deleteEntry(entryId) {
    try {
      await getFirestoreDb().collection(JOURNAL_ENTRIES_COLLECTION).doc(entryId).delete();
    } catch (error) {
      logger.error(`Error deleting journal entry ${entryId}:`, error);
      throw new Error(`Failed to delete journal entry: ${error.message}`);
    }
  }

  /**
   * Decrypt entry content
   * @param {string} userId - User ID
   * @param {string} encryptedContent - Encrypted content
   * @returns {Promise<string>} Decrypted content
   */
  static async decryptEntryContent(userId, encryptedContent) {
    try {
      return await UserEncryptionService.processMessageContent(userId, encryptedContent);
    } catch (error) {
      logger.error(`Error decrypting journal entry content for user ${userId}:`, error);
      throw new Error(`Failed to decrypt journal entry content: ${error.message}`);
    }
  }

  /**
   * Get entries by mood
   * @param {string} userId - User ID
   * @param {string} mood - Mood to filter by
   * @param {number} limit - Number of entries to return
   * @returns {Promise<Array<JournalEntry>>} List of entries
   */
  static async getEntriesByMood(userId, mood, limitCount = 20) {
    try {
      const query = getFirestoreDb().collection(JOURNAL_ENTRIES_COLLECTION)
        .where('userId', '==', userId)
        .where('mood', '==', mood)
        .orderBy('createdAt', 'desc')
        .limit(limitCount);

      const querySnapshot = await query.get();
      const entries = [];

      querySnapshot.forEach((doc) => {
        // Remove any existing id from data to prevent overwriting the Firestore document ID
        const data = convertTimestamps(doc.data());
        const { id: _, ...dataWithoutId } = data;
        entries.push(new JournalEntry({ id: doc.id, ...dataWithoutId }));
      });

      // Decrypt entries for display
      const decryptedEntries = [];
      for (const entry of entries) {
        try {
          if (entry.isEncrypted()) {
            const decryptedContent = await UserEncryptionService.processMessageContent(
              userId,
              entry.content
            );
            
            const decryptedEntry = new JournalEntry({
              ...entry,
              content: decryptedContent
            });
            
            decryptedEntries.push(decryptedEntry);
          } else {
            decryptedEntries.push(entry);
          }
        } catch (decryptionError) {
          logger.error(`Failed to decrypt journal entry ${entry.id} for user ${userId}:`, decryptionError);
          decryptedEntries.push(entry);
        }
      }

      return decryptedEntries;
    } catch (error) {
      logger.error(`Error getting journal entries by mood ${mood} for user ${userId}:`, error);
      throw new Error(`Failed to get journal entries by mood: ${error.message}`);
    }
  }

  /**
   * Search entries by text content
   * @param {string} userId - User ID
   * @param {string} searchTerm - Text to search for
   * @param {number} limit - Number of entries to return
   * @returns {Promise<Array<JournalEntry>>} List of entries
   */
  static async searchEntries(userId, searchTerm, limitCount = 20) {
    try {
      // Note: This is a simplified search implementation
      // For production, consider using Firestore's full-text search capabilities
      const query = getFirestoreDb().collection(JOURNAL_ENTRIES_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limitCount);

      const querySnapshot = await query.get();
      const entries = [];

      for (const doc of querySnapshot.docs) {
        const data = convertTimestamps(doc.data());
        // Remove any existing id from data to prevent overwriting the Firestore document ID
        const { id: _, ...dataWithoutId } = data;
        let entry = new JournalEntry({ id: doc.id, ...dataWithoutId });
        
        // Check if search term matches title or content (after decryption)
        let contentToSearch = entry.content;
        
        // Decrypt content if encrypted for search
        if (entry.isEncrypted()) {
          try {
            contentToSearch = await UserEncryptionService.processMessageContent(
              userId,
              entry.content
            );
          } catch (decryptionError) {
            logger.error(`Failed to decrypt journal entry ${entry.id} for search:`, decryptionError);
          }
        }
        
        if (entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            contentToSearch.toLowerCase().includes(searchTerm.toLowerCase())) {
          
          // If the entry is encrypted, decrypt it for display
          if (entry.isEncrypted()) {
            try {
              let decryptedContent = await UserEncryptionService.processMessageContent(
                userId,
                entry.content
              );
              
              // Check if content is still in encrypted format (double encryption)
              // Encrypted format has 3 parts separated by colons (iv:salt:encryptedData)
              const isStillEncrypted = decryptedContent.includes(':') && decryptedContent.split(':').length === 3;
              
              if (isStillEncrypted) {
                // Decrypt again to handle double encryption
                decryptedContent = await UserEncryptionService.processMessageContent(
                  userId,
                  decryptedContent
                );
              }
              
              // Create a new metadata object without encryption properties
              const metadataWithoutEncryption = {};
              for (const [key, value] of Object.entries(entry.metadata)) {
                if (key !== 'encrypted' && key !== 'encryptionVersion') {
                  metadataWithoutEncryption[key] = value;
                }
              }
              
              // Create a new entry with decrypted content
              entry = new JournalEntry({
                id: entry.id,
                userId: entry.userId,
                title: entry.title,
                content: decryptedContent,
                mood: entry.mood,
                tags: entry.tags,
                type: entry.type,
                mediaUrl: entry.mediaUrl,
                mediaPath: entry.mediaPath,
                mediaSize: entry.mediaSize,
                mediaType: entry.mediaType,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
                metadata: metadataWithoutEncryption
              });
              
            } catch (decryptionError) {
              logger.error(`Failed to decrypt journal entry ${entry.id} for display:`, decryptionError);
            }
          }
          
          entries.push(entry);
        }
      }
      
      // DEBUG: Log the final entries array
      logger.debug(`Final entries array length: ${entries.length}`);
      if (entries.length > 0) {
        logger.debug(`First entry isEncrypted: ${entries[0].isEncrypted()}`);
        logger.debug(`First entry content: ${entries[0].content}`);
        logger.debug(`First entry content length: ${entries[0].content.length}`);
      }
      
      // Return all entries
      return entries;
    } catch (error) {
      logger.error(`Error searching journal entries for user ${userId}:`, error);
      throw new Error(`Failed to search journal entries: ${error.message}`);
    }
  }
}

export default FirestoreService;
