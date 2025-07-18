import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Service for managing persistent avatar conversations in Firestore
 * Uses a single document per user to store the entire conversation history
 */
class AvatarConversationService {
  constructor() {
    this.collectionName = 'avatar_conversations';
  }

  /**
   * Get the conversation document reference for a user
   * @param {string} userId - The user's unique ID
   * @returns {DocumentReference} Firestore document reference
   */
  getUserConversationRef(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return doc(db, this.collectionName, userId);
  }

  /**
   * Load conversation history for a user
   * @param {string} userId - The user's unique ID
   * @returns {Promise<Array>} Array of conversation messages
   */
  async loadConversationHistory(userId) {
    try {
      console.log('📚 Loading conversation history for user:', userId);
      
      const docRef = this.getUserConversationRef(userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const messages = data.messages || [];
        
        console.log(`✅ Loaded ${messages.length} messages from Firestore`);
        return messages;
      } else {
        console.log('📝 No existing conversation found, starting fresh');
        return [];
      }
    } catch (error) {
      console.error('❌ Error loading conversation history:', error);
      throw new Error(`Failed to load conversation history: ${error.message}`);
    }
  }

  /**
   * Save new messages to the conversation history
   * @param {string} userId - The user's unique ID
   * @param {Array} newMessages - Array of new messages to add
   * @returns {Promise<void>}
   */
  async saveMessages(userId, newMessages) {
    try {
      if (!newMessages || newMessages.length === 0) {
        console.log('⚠️ No messages to save');
        return;
      }

      console.log(`💾 Saving ${newMessages.length} messages for user:`, userId);
      
      const docRef = this.getUserConversationRef(userId);
      const docSnap = await getDoc(docRef);
      
      // Prepare messages with timestamps
      const messagesWithTimestamp = newMessages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp || new Date().toISOString(),
        savedAt: new Date().toISOString()
      }));

      if (docSnap.exists()) {
        // Update existing document by appending new messages
        await updateDoc(docRef, {
          messages: arrayUnion(...messagesWithTimestamp),
          lastUpdate: serverTimestamp(),
          messageCount: (docSnap.data().messageCount || 0) + newMessages.length
        });
      } else {
        // Create new document with initial messages
        await setDoc(docRef, {
          messages: messagesWithTimestamp,
          createdAt: serverTimestamp(),
          lastUpdate: serverTimestamp(),
          messageCount: newMessages.length,
          userId: userId
        });
      }
      
      console.log('✅ Messages saved successfully to Firestore');
    } catch (error) {
      console.error('❌ Error saving messages:', error);
      throw new Error(`Failed to save messages: ${error.message}`);
    }
  }

  /**
   * Save a single message pair (user + assistant) to conversation history
   * @param {string} userId - The user's unique ID
   * @param {Object} userMessage - The user's message
   * @param {Object} assistantMessage - Seriva's response
   * @returns {Promise<void>}
   */
  async saveMessagePair(userId, userMessage, assistantMessage) {
    const messagesToSave = [];
    if (userMessage) messagesToSave.push(userMessage);
    if (assistantMessage) messagesToSave.push(assistantMessage);

    if (messagesToSave.length === 0) {
      console.warn('⚠️ saveMessagePair called with no messages to save.');
      return;
    }

    return this.saveMessages(userId, messagesToSave);
  }

  /**
   * Get conversation statistics for a user
   * @param {string} userId - The user's unique ID
   * @returns {Promise<Object>} Conversation statistics
   */
  async getConversationStats(userId) {
    try {
      const docRef = this.getUserConversationRef(userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const messages = data.messages || [];
        
        return {
          totalMessages: messages.length,
          userMessages: messages.filter(msg => msg.role === 'user').length,
          assistantMessages: messages.filter(msg => msg.role === 'assistant').length,
          firstMessage: messages[0]?.timestamp,
          lastMessage: messages[messages.length - 1]?.timestamp,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
          lastUpdate: data.lastUpdate?.toDate?.()?.toISOString() || null
        };
      } else {
        return {
          totalMessages: 0,
          userMessages: 0,
          assistantMessages: 0,
          firstMessage: null,
          lastMessage: null,
          createdAt: null,
          lastUpdate: null
        };
      }
    } catch (error) {
      console.error('❌ Error getting conversation stats:', error);
      throw new Error(`Failed to get conversation stats: ${error.message}`);
    }
  }

  /**
   * Clear conversation history for a user (use with caution)
   * @param {string} userId - The user's unique ID
   * @returns {Promise<void>}
   */
  async clearConversationHistory(userId) {
    try {
      console.log('🗑️ Clearing conversation history for user:', userId);
      
      const docRef = this.getUserConversationRef(userId);
      await setDoc(docRef, {
        messages: [],
        clearedAt: serverTimestamp(),
        lastUpdate: serverTimestamp(),
        messageCount: 0,
        userId: userId
      });
      
      console.log('✅ Conversation history cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing conversation history:', error);
      throw new Error(`Failed to clear conversation history: ${error.message}`);
    }
  }
}

// Export singleton instance
export default new AvatarConversationService();
