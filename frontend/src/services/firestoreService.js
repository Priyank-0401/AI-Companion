import { db } from '../config/firebase';
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
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { auth } from '../config/firebase';

// Collection names
const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_SUBCOLLECTION = 'messages';

// Helper to get current user ID
const getCurrentUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.uid;
};

// Helper functions for conversation operations
const createConversation = async (title = 'New Chat', model = 'gpt-3.5-turbo') => {
  const userID = getCurrentUserId();
  const conversationData = {
    userID,
    title,
    model,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), conversationData);
  return { id: docRef.id, ...conversationData };
};

const getConversations = async (limit = 20) => {
  const userID = getCurrentUserId();
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION),
    where('userID', '==', userID),
    orderBy('updatedAt', 'desc'),
    firestoreLimit(limit)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

const getConversation = async (conversationId) => {
  const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error('Conversation not found');
  }
  
  return { id: docSnap.id, ...docSnap.data() };
};

const updateConversation = async (conversationId, updates) => {
  const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
  return getConversation(conversationId);
};

const deleteConversation = async (conversationId) => {
  const docRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  await deleteDoc(docRef);
  // Note: Firestore will automatically delete subcollections in the background
};

// Conversation operations
export const conversationService = {
  createConversation,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,

  // Subscribe to conversation updates
  subscribeToConversations(callback) {
    const userID = getCurrentUserId();
    
    if (!userID) {
      console.error('No user ID available for subscription');
      // Return a no-op function for consistent API
      return () => {};
    }

    const q = query(
      collection(db, CONVERSATIONS_COLLECTION),
      where('userID', '==', userID),
      orderBy('updatedAt', 'desc')
    );

    // Add error handling to the onSnapshot callback
    return onSnapshot(
      q,
      (querySnapshot) => {
        try {
          const conversations = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(conversations);
        } catch (error) {
          console.error('Error processing conversation data:', error);
        }
      },
      (error) => {
        console.error('Error in conversation subscription:', error);
      }
    );
  }
};

// Message operations
export const messageService = {
  // Add a message to a conversation
  async addMessage(conversationId, { role, content, model }) {
    const messageData = {
      role,
      content,
      model: model || 'gpt-3.5-turbo',
      timestamp: serverTimestamp()
    };

    const messagesRef = collection(db, `${CONVERSATIONS_COLLECTION}/${conversationId}/${MESSAGES_SUBCOLLECTION}`);
    const docRef = await addDoc(messagesRef, messageData);
    
    // Update conversation's updatedAt
    await updateDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId), {
      updatedAt: serverTimestamp()
    });

    return { id: docRef.id, ...messageData };
  },

  // Get messages from a conversation
  async getMessages(conversationId, limit = 50) {
    const messagesRef = collection(db, `${CONVERSATIONS_COLLECTION}/${conversationId}/${MESSAGES_SUBCOLLECTION}`);
    const q = query(
      messagesRef,
      orderBy('timestamp', 'asc'),
      firestoreLimit(limit)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Subscribe to messages in a conversation
  subscribeToMessages(conversationId, callback) {
    const messagesRef = collection(db, `${CONVERSATIONS_COLLECTION}/${conversationId}/${MESSAGES_SUBCOLLECTION}`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (querySnapshot) => {
      const messages = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(messages);
    });
  },

  // Delete all messages in a conversation
  async deleteAllMessages(conversationId) {
    const messagesRef = collection(db, `${CONVERSATIONS_COLLECTION}/${conversationId}/${MESSAGES_SUBCOLLECTION}`);
    const querySnapshot = await getDocs(messagesRef);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
  }
};

// Feedback operations
const submitFeedback = async (feedbackData) => {
  try {
    const feedbackWithTimestamp = {
      ...feedbackData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      userId: auth.currentUser?.uid || 'anonymous',
      status: 'new',
      // Convert rating to number if it's a string
      rating: typeof feedbackData.rating === 'string' 
        ? parseInt(feedbackData.rating, 10) 
        : feedbackData.rating
    };

    const docRef = await addDoc(collection(db, 'feedback'), feedbackWithTimestamp);
    return { id: docRef.id, ...feedbackWithTimestamp };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw new Error('Failed to submit feedback. Please try again later.');
  }
};

export const feedbackService = {
  submitFeedback
};

// Combined service for backward compatibility
export const firestoreService = {
  ...conversationService,
  ...messageService,
  ...feedbackService
};
