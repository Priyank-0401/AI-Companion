import { storage, auth } from '../config/firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import chatApi from './api';

// Helper to get current user ID
const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.uid;
};

// Generate unique file path for media uploads
const generateMediaPath = (userId, entryId, fileExtension) => {
  return `journals/${userId}/${entryId}.${fileExtension}`;
};

// Get file extension from blob type
const getFileExtension = (mimeType) => {
  const extensions = {
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'video/webm': 'webm',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov'
  };
  return extensions[mimeType] || 'webm';
};

// Upload media file to Firebase Storage
const uploadMediaFile = async (file, userId, entryId) => {
  try {
    const fileExtension = getFileExtension(file.type);
    const filePath = generateMediaPath(userId, entryId, fileExtension);
    const storageRef = ref(storage, filePath);
    
    // Upload file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      url: downloadURL,
      path: filePath,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('Error uploading media file:', error);
    throw new Error('Failed to upload media file');
  }
};

// Delete media file from Firebase Storage
const deleteMediaFile = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting media file:', error);
    // Don't throw here - we still want to delete the Firestore document
  }
};

// Journal Service Functions
export const journalService = {
  // Create a new journal entry
  async createEntry(entryData) {
    try {
      const userId = getCurrentUserId();
      const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let mediaMetadata = null;
      
      // Handle media upload if present
      if (entryData.media && entryData.media.length > 0) {
        const mediaFile = entryData.media[0]; // Assuming single file for now
        mediaMetadata = await uploadMediaFile(mediaFile, userId, entryId);
      }
      
      // Prepare entry document
      const journalEntryDoc = {
        userId,
        entryId,
        title: entryData.title || '',
        content: entryData.content || '',
        mood: entryData.mood || 'neutral',
        tags: entryData.tags || [],
        type: entryData.type || 'text',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add media metadata only if present and with defined values
      if (mediaMetadata) {
        if (mediaMetadata.url) journalEntryDoc.mediaUrl = mediaMetadata.url;
        if (mediaMetadata.path) journalEntryDoc.mediaPath = mediaMetadata.path;
        if (mediaMetadata.size !== undefined) journalEntryDoc.mediaSize = mediaMetadata.size;
        if (mediaMetadata.type) journalEntryDoc.mediaType = mediaMetadata.type;
      }
      
      const response = await chatApi.createJournalEntry(journalEntryDoc);
      return response.data;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  },

  // Get all journal entries for the current user
  async getEntries(limitCount = 50, startAfter = null) {
    try {
      const params = { limit: limitCount };
      if (startAfter) params.startAfter = startAfter;
      const response = await chatApi.getJournalEntries(params);
      return response.data.entries;
    } catch (error) {
      console.error('Error getting journal entries:', error);
      throw error;
    }
  },

  // Get a single journal entry
  async getEntry(entryId) {
    try {
      const response = await chatApi.getJournalEntry(entryId);
      return response.data;
    } catch (error) {
      console.error('Error getting journal entry:', error);
      throw error;
    }
  },

  // Update an existing journal entry
  async updateEntry(entryId, updates) {
    try {
      const userId = getCurrentUserId();
      
      // Verify ownership
      const existingEntry = await this.getEntry(entryId);
      if (existingEntry.userId !== userId) {
        throw new Error('Unauthorized: Cannot update another user\'s entry');
      }
      
      let mediaMetadata = null;
      
      // Handle new media upload if present
      if (updates.media && updates.media.length > 0) {
        // Delete old media file if it exists
        if (existingEntry.mediaPath) {
          await deleteMediaFile(existingEntry.mediaPath);
        }
        
        // Upload new media file
        const mediaFile = updates.media[0];
        mediaMetadata = await uploadMediaFile(mediaFile, userId, existingEntry.entryId || entryId);
      }
      
      // Prepare updates
      const updateData = {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.content !== undefined && { content: updates.content }),
        ...(updates.mood !== undefined && { mood: updates.mood }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
        updatedAt: new Date().toISOString(),
        ...(mediaMetadata && {
          mediaUrl: mediaMetadata.url,
          mediaPath: mediaMetadata.path,
          mediaSize: mediaMetadata.size,
          mediaType: mediaMetadata.type
        })
      };
      
      const response = await chatApi.updateJournalEntry(entryId, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating journal entry:', error);
      throw error;
    }
  },

  // Delete a journal entry
  async deleteEntry(entryId) {
    try {
      const userId = getCurrentUserId();
      
      // Get entry to check ownership and get media path
      const entry = await this.getEntry(entryId);
      if (entry.userId !== userId) {
        throw new Error('Unauthorized: Cannot delete another user\'s entry');
      }
      
      // Delete media file if it exists
      if (entry.mediaPath) {
        await deleteMediaFile(entry.mediaPath);
      }
      
      const response = await chatApi.deleteJournalEntry(entryId);
      return response.data;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  },

  // Subscribe to journal entries updates (returns initial data only)
  async subscribeToEntries(callback, limitCount = 50) {
    try {
      const params = { limit: limitCount };
      const response = await chatApi.getJournalEntries(params);
      const entries = response.data.entries;
      
      // Call callback with initial entries
      callback(entries);
      
      // Return a no-op function for consistent API
      return () => {};
    } catch (error) {
      console.error('Error setting up journal entries subscription:', error);
      // Return a no-op function for consistent API
      return () => {};
    }
  },

  // Get entries filtered by mood
  async getEntriesByMood(mood, limitCount = 20) {
    try {
      const params = { limit: limitCount };
      const response = await chatApi.getJournalEntriesByMood(mood, params);
      return response.data.entries;
    } catch (error) {
      console.error('Error getting entries by mood:', error);
      throw error;
    }
  },

  // Search entries by text content
  async searchEntries(searchTerm, limitCount = 20) {
    try {
      const params = { limit: limitCount };
      const response = await chatApi.searchJournalEntries(searchTerm, params);
      return response.data.entries;
    } catch (error) {
      console.error('Error searching entries:', error);
      throw error;
    }
  }
};

export default journalService;
