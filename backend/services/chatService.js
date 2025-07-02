const { db } = require('../config/firebase-admin');
const { v4: uuidv4 } = require('uuid');

const CONVERSATIONS_COLLECTION = 'conversations';

class ChatService {
  async saveConversation(conversationData, userId) {
    const conversationId = conversationData.id || `conv_${uuidv4()}`;
    const conversationRef = db.collection(CONVERSATIONS_COLLECTION).doc(conversationId);
    
    const conversation = {
      ...conversationData,
      id: conversationId,
      userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: conversationData.createdAt || admin.firestore.FieldValue.serverTimestamp()
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

module.exports = new ChatService();
