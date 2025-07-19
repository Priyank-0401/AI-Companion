import { db, storage, auth } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

// Collection name
const JOURNAL_ENTRIES_COLLECTION = 'journalEntries';

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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add media metadata only if present and with defined values
      if (mediaMetadata) {
        if (mediaMetadata.url) journalEntryDoc.mediaUrl = mediaMetadata.url;
        if (mediaMetadata.path) journalEntryDoc.mediaPath = mediaMetadata.path;
        if (mediaMetadata.size !== undefined) journalEntryDoc.mediaSize = mediaMetadata.size;
        if (mediaMetadata.type) journalEntryDoc.mediaType = mediaMetadata.type;
      }
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, JOURNAL_ENTRIES_COLLECTION), journalEntryDoc);
      
      return { 
        id: docRef.id, 
        ...journalEntryDoc,
        // Convert serverTimestamp to actual date for immediate UI use
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating journal entry:', error);
      throw error;
    }
  },

  // Get all journal entries for current user
  async getEntries(limitCount = 50) {
    try {
      const userId = getCurrentUserId();
      const q = query(
        collection(db, JOURNAL_ENTRIES_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const entry = {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
      
      // Reconstruct media array from individual fields for viewer compatibility
      if (data.mediaUrl) {
        // Extract base media type (audio/video) from MIME type
        const baseType = data.mediaType?.startsWith('audio/') ? 'audio' : 
                        data.mediaType?.startsWith('video/') ? 'video' : 'audio';
        
        entry.media = [{
          url: data.mediaUrl,
          type: baseType,
          mimeType: data.mediaType || 'audio/webm', // Keep full MIME type for reference
          size: data.mediaSize || 0,
          path: data.mediaPath
        }];
      }
      
      return entry;
    });
    } catch (error) {
      console.error('Error getting journal entries:', error);
      throw error;
    }
  },

  // Get a single journal entry
  async getEntry(entryId) {
    try {
      const docRef = doc(db, JOURNAL_ENTRIES_COLLECTION, entryId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Journal entry not found');
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
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
        updatedAt: serverTimestamp(),
        ...(mediaMetadata && {
          mediaUrl: mediaMetadata.url,
          mediaPath: mediaMetadata.path,
          mediaSize: mediaMetadata.size,
          mediaType: mediaMetadata.type
        })
      };
      
      // Update in Firestore
      const docRef = doc(db, JOURNAL_ENTRIES_COLLECTION, entryId);
      await updateDoc(docRef, updateData);
      
      return await this.getEntry(entryId);
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
      
      // Delete from Firestore
      const docRef = doc(db, JOURNAL_ENTRIES_COLLECTION, entryId);
      await deleteDoc(docRef);
      
      return true;
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      throw error;
    }
  },

  // Subscribe to real-time updates of journal entries
  subscribeToEntries(callback, limitCount = 50) {
    try {
      const userId = getCurrentUserId();
      
      const q = query(
        collection(db, JOURNAL_ENTRIES_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      return onSnapshot(
        q,
        (querySnapshot) => {
          try {
            const entries = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
              updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
            }));
            callback(entries);
          } catch (error) {
            console.error('Error processing journal entries:', error);
          }
        },
        (error) => {
          console.error('Error in journal entries subscription:', error);
        }
      );
    } catch (error) {
      console.error('Error setting up journal entries subscription:', error);
      // Return a no-op function for consistent API
      return () => {};
    }
  },

  // Get entries filtered by mood
  async getEntriesByMood(mood, limitCount = 20) {
    try {
      const userId = getCurrentUserId();
      const q = query(
        collection(db, JOURNAL_ENTRIES_COLLECTION),
        where('userId', '==', userId),
        where('mood', '==', mood),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      }));
    } catch (error) {
      console.error('Error getting entries by mood:', error);
      throw error;
    }
  },

  // Search entries by text content
  async searchEntries(searchTerm, limitCount = 20) {
    try {
      const userId = getCurrentUserId();
      // Note: This is a basic implementation. For advanced full-text search,
      // consider using Algolia or implementing client-side filtering
      const q = query(
        collection(db, JOURNAL_ENTRIES_COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount * 2) // Get more to filter client-side
      );

      const querySnapshot = await getDocs(q);
      const allEntries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt
      }));

      // Filter client-side for text search
      const filteredEntries = allEntries.filter(entry => 
        entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return filteredEntries.slice(0, limitCount);
    } catch (error) {
      console.error('Error searching entries:', error);
      throw error;
    }
  }
};

export default journalService;
