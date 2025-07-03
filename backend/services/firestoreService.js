import admin, { db } from '../config/firebase-admin.js';

const { FieldValue } = admin.firestore;
import { v4 as uuidv4 } from 'uuid';

const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

class FirestoreService {
  // Create a new conversation
  static async createConversation(userId, conversationData = {}) {
    const conversationRef = db.collection(CONVERSATIONS_COLLECTION).doc();
    const now = new Date();
    
    const conversation = {
      id: conversationRef.id,
      userId,
      title: conversationData.title || 'New Conversation',
      model: conversationData.model || 'default',
      tags: conversationData.tags || [],
      isArchived: false,
      createdAt: now,
      updatedAt: now,
      metadata: conversationData.metadata || {}
    };

    await conversationRef.set(conversation);
    return conversation;
  }

  // Get a conversation by ID
  static async getConversation(userId, conversationId) {
    const doc = await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).get();
    
    if (!doc.exists) {
      throw new Error('Conversation not found');
    }

    const data = doc.data();
    
    if (data.userId !== userId) {
      throw new Error('Unauthorized access to conversation');
    }

    return { id: doc.id, ...data };
  }

  // List user's conversations
  static async listConversations(userId, options = {}) {
    try {
      // First get by userId
      let query = db.collection(CONVERSATIONS_COLLECTION)
        .where('userId', '==', userId);
      
      const snapshot = await query.get();
      let conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in memory
      conversations.sort((a, b) => {
        const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt);
        const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt);
        return dateB - dateA; // Sort by updatedAt descending
      });
      
      // Apply limit if specified
      if (options.limit) {
        conversations = conversations.slice(0, options.limit);
      }
      
      return conversations;
    } catch (error) {
      console.error('Error listing conversations:', error);
      throw error;
    }
  }

  // Update conversation
  static async updateConversation(userId, conversationId, updates) {
    const docRef = db.collection(CONVERSATIONS_COLLECTION).doc(conversationId);
    
    // Verify user owns the conversation
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== userId) {
      throw new Error('Conversation not found or access denied');
    }

    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await docRef.update(updateData);
    return { id: conversationId, ...updateData };
  }

  // Add a message to a conversation
  static async addMessage(userId, conversationId, messageData) {
    const conversationRef = db.collection(CONVERSATIONS_COLLECTION).doc(conversationId);
    const messagesRef = conversationRef.collection(MESSAGES_SUBCOLLECTION);
    
    // Verify conversation exists and user has access
    const conversation = await conversationRef.get();
    if (!conversation.exists || conversation.data().userId !== userId) {
      throw new Error('Conversation not found or access denied');
    }

    const message = {
      id: uuidv4(),
      role: messageData.role, // 'user', 'assistant', or 'system'
      content: messageData.content,
      model: messageData.model || conversation.data().model,
      timestamp: new Date(),
      metadata: messageData.metadata || {}
    };

    // Add message to subcollection
    await messagesRef.doc(message.id).set(message);
    
    // Update conversation's updatedAt
    await conversationRef.update({ updatedAt: message.timestamp });
    
    return message;
  }

  // Get messages from a conversation
  static async getMessages(userId, conversationId, options = {}) {
    // Verify conversation exists and user has access
    const conversation = await this.getConversation(userId, conversationId);
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    let query = db.collection(CONVERSATIONS_COLLECTION)
      .doc(conversationId)
      .collection(MESSAGES_SUBCOLLECTION)
      .orderBy('timestamp', 'asc');

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Delete a conversation
  static async deleteConversation(userId, conversationId) {
    const docRef = db.collection(CONVERSATIONS_COLLECTION).doc(conversationId);
    
    // Verify user owns the conversation
    const doc = await docRef.get();
    if (!doc.exists || doc.data().userId !== userId) {
      throw new Error('Conversation not found or access denied');
    }

    // Delete all messages in the subcollection first
    const messagesRef = docRef.collection(MESSAGES_SUBCOLLECTION);
    const messages = await messagesRef.listDocuments();
    const batch = db.batch();
    
    messages.forEach(message => {
      batch.delete(message);
    });
    
    await batch.commit();
    
    // Delete the conversation
    await docRef.delete();
    
    return { success: true };
  }

  // Subscribe to conversation updates
  static subscribeToConversation(userId, conversationId, callback) {
    const docRef = db.collection(CONVERSATIONS_COLLECTION).doc(conversationId);
    
    return docRef.onSnapshot(async (doc) => {
      if (!doc.exists) {
        return callback(new Error('Conversation not found'));
      }
      
      const data = doc.data();
      if (data.userId !== userId) {
        return callback(new Error('Unauthorized access to conversation'));
      }
      
      // Get messages
      const messages = await this.getMessages(userId, conversationId);
      
      callback(null, {
        ...data,
        id: doc.id,
        messages
      });
    }, (error) => {
      console.error('Error in conversation subscription:', error);
      callback(error);
    });
  }
}

// Export the FirestoreService class as default
export default FirestoreService;
