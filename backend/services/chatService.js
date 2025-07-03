import admin, { db } from '../config/firebase-admin.js';
import { v4 as uuidv4 } from 'uuid';

const { FieldValue } = admin.firestore;

const CONVERSATIONS_COLLECTION = 'conversations';

class ChatService {
  async saveConversation(conversationData, userId) {
    const conversationId = conversationData.id || `conv_${uuidv4()}`;
    const conversationRef = db.collection(CONVERSATIONS_COLLECTION).doc(conversationId);
    
    const conversation = {
      ...conversationData,
      id: conversationId,
      userId,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: conversationData.createdAt || FieldValue.serverTimestamp()
    };

    await conversationRef.set(conversation, { merge: true });
    return conversation;
  }

  async getConversation(conversationId, userId) {
    const doc = await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).get();
    
    if (!doc.exists || doc.data().userId !== userId) {
      return null;
    }

    return { id: doc.id, ...doc.data() };
  }

  async getUserConversations(userId) {
    const snapshot = await db.collection(CONVERSATIONS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async deleteConversation(conversationId, userId) {
    const conversation = await this.getConversation(conversationId, userId);
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).delete();
    return true;
  }
}

// Create and export a single instance of ChatService
const chatService = new ChatService();
export default chatService;
