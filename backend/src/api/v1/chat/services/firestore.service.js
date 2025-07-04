import { getDb } from '../../../../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import Conversation from '../models/conversation.model.js';
import Message from '../models/message.model.js';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';

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
    } catch (e) {
      console.warn(`Error converting timestamp for field ${key}:`, e);
    }
  });
  
  return result;
};

class FirestoreService {
  // Conversation Operations
  
  /**
   * Create a new conversation
   * @param {Object} conversationData - Conversation data
   * @returns {Promise<Conversation>} Created conversation
   */
  static async createConversation(conversationData) {
    try {
      const now = new Date();
      
      // Ensure required fields are present with defaults
      const conversation = new Conversation({
        id: conversationData.id || uuidv4(),
        userId: conversationData.userId,
        title: conversationData.title || 'New Chat',
        model: conversationData.model || 'llama3:latest',
        style: conversationData.style || 'supportive',
        messages: conversationData.messages || [],
        isArchived: conversationData.isArchived || false,
        createdAt: now,
        updatedAt: now,
      });
      
      console.log('Creating conversation with data:', conversation);
      
      // Convert to plain object and ensure dates are properly formatted
      const conversationDataToSave = {
        ...conversation.toJSON(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      
      console.log('Saving conversation to Firestore:', conversationDataToSave);
      
      await getFirestoreDb()
        .collection(CONVERSATIONS_COLLECTION)
        .doc(conversation.id)
        .set(conversationDataToSave);
        
      console.log('Successfully created conversation:', conversation.id);
      
      // Return the created conversation
      return conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw new Error('Failed to create conversation');
    }
  }

  /**
   * Get a conversation by ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Conversation|null>} Conversation or null if not found
   */
  static async getConversation(conversationId) {
    try {
      const docRef = getFirestoreDb().collection(CONVERSATIONS_COLLECTION).doc(conversationId);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        return null;
      }
      
      return new Conversation({ id: docSnap.id, ...convertTimestamps(docSnap.data()) });
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw new Error('Failed to get conversation');
    }
  }

  /**
   * Get user's conversations
   * @param {string} userId - User ID
   * @param {number} limit - Number of conversations to return
   * @param {string} startAfterId - ID of the last conversation for pagination
   * @returns {Promise<{conversations: Array<Conversation>, lastVisible: any}>} List of conversations and pagination info
   */
  static async getUserConversations(userId, limitCount = 20, startAfterId = null) {
    try {
      let query = getFirestoreDb().collection(CONVERSATIONS_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .limit(limitCount);

      if (startAfterId) {
        const lastDoc = await getFirestoreDb().collection(CONVERSATIONS_COLLECTION).doc(startAfterId).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      const querySnapshot = await query.get();
      const conversations = [];
      let lastVisible = null;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const conversation = new Conversation({ 
          id: doc.id, 
          ...convertTimestamps(data) 
        });
        conversations.push(conversation);
        lastVisible = doc;
      });
      
      return {
        conversations,
        lastVisible: lastVisible ? lastVisible.id : null
      };
    } catch (error) {
      console.error('Error getting user conversations:', error);
      throw new Error('Failed to get conversations');
    }
  }

  /**
   * Update a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Conversation>} Updated conversation
   */
  static async updateConversation(conversationId, updateData) {
    try {
      console.log(`Updating conversation ${conversationId} with data:`, updateData);
      
      const conversationRef = getFirestoreDb().collection(CONVERSATIONS_COLLECTION).doc(conversationId);
      
      // First check if the document exists
      const doc = await conversationRef.get();
      if (!doc.exists) {
        console.log(`Conversation ${conversationId} does not exist`);
        return null;
      }
      
      // Prepare the update data
      const updateDataWithTimestamps = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };
      
      console.log('Performing update with data:', updateDataWithTimestamps);
      
      // Perform the update
      await conversationRef.update(updateDataWithTimestamps);
      
      // Return the updated conversation
      const updatedDoc = await conversationRef.get();
      if (!updatedDoc.exists) {
        console.log(`Failed to retrieve updated conversation ${conversationId}`);
        return null;
      }
      
      const updatedConversation = new Conversation({ 
        id: updatedDoc.id, 
        ...convertTimestamps(updatedDoc.data()) 
      });
      
      console.log('Successfully updated conversation:', updatedConversation);
      return updatedConversation;
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw new Error('Failed to update conversation');
    }
  }

  /**
   * Delete a conversation and its messages
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<void>}
   */
  static async deleteConversation(conversationId) {
    const batch = getFirestoreDb().batch();
    
    try {
      // First, get all messages in the conversation
      const messagesSnapshot = await getFirestoreDb().collection(MESSAGES_COLLECTION)
        .where('conversationId', '==', conversationId)
        .get();
      
      // Add all message deletes to batch
      messagesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      // Add conversation delete to batch
      const conversationRef = getFirestoreDb().collection(CONVERSATIONS_COLLECTION).doc(conversationId);
      batch.delete(conversationRef);
      
      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  }

  // Message Operations

  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @returns {Promise<Message>} Created message
   */
  static async createMessage(messageData) {
    try {
      const message = new Message({
        ...messageData,
        timestamp: FieldValue.serverTimestamp(),
      });
      
      const docRef = await getFirestoreDb().collection(MESSAGES_COLLECTION).add(message.toJSON());
      const docSnap = await docRef.get();
      return new Message({ id: docRef.id, ...convertTimestamps(docSnap.data()) });
    } catch (error) {
      console.error('Error creating message:', error);
      throw new Error('Failed to create message');
    }
  }

  /**
   * Get messages in a conversation
   * @param {string} conversationId - Conversation ID
   * @param {number} limit - Number of messages to return
   * @param {string} startAfterId - ID of the last message for pagination
   * @returns {Promise<{messages: Array<Message>, lastVisible: any}>} List of messages and pagination info
   */
  static async getMessages(conversationId, limitCount = 50, startAfterId = null) {
    try {
      let query = getFirestoreDb().collection(MESSAGES_COLLECTION)
        .where('conversationId', '==', conversationId)
        .orderBy('timestamp', 'desc')
        .limit(limitCount);

      if (startAfterId) {
        const lastDoc = await getFirestoreDb().collection(MESSAGES_COLLECTION).doc(startAfterId).get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      const querySnapshot = await query.get();
      const messages = [];
      let lastVisible = null;

      querySnapshot.forEach((doc) => {
        messages.push(new Message({ id: doc.id, ...convertTimestamps(doc.data()) }));
        lastVisible = doc;
      });

      // Sort by timestamp ascending for display
      messages.sort((a, b) => a.timestamp - b.timestamp);

      return {
        messages,
        lastVisible: lastVisible ? lastVisible.id : null
      };
    } catch (error) {
      console.error('Error getting messages:', error);
      throw new Error('Failed to get messages');
    }
  }

  /**
   * Update a message
   * @param {string} messageId - Message ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Message>} Updated message
   */
  static async updateMessage(messageId, updateData) {
    try {
      const messageRef = getFirestoreDb().collection(MESSAGES_COLLECTION).doc(messageId);
      const update = {
        ...updateData,
        'metadata.isEdited': true,
        'metadata.updatedAt': FieldValue.serverTimestamp()
      };
      
      await messageRef.update(update);
      const updatedDoc = await messageRef.get();
      return new Message({ id: updatedDoc.id, ...convertTimestamps(updatedDoc.data()) });
    } catch (error) {
      console.error('Error updating message:', error);
      throw new Error('Failed to update message');
    }
  }

  /**
   * Delete a message
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  static async deleteMessage(messageId) {
    try {
      await getFirestoreDb().collection(MESSAGES_COLLECTION).doc(messageId).delete();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw new Error('Failed to delete message');
    }
  }
}

export default FirestoreService;
