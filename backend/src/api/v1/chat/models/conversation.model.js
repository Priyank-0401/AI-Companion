import { v4 as uuidv4 } from 'uuid';

/**
 * @class Conversation
 * @description Represents a chat conversation
 */
class Conversation {
  constructor({
    id = uuidv4(),
    userId,
    title = 'New Chat',
    model = 'llama3:latest',
    style = 'supportive',
    createdAt = new Date(),
    updatedAt = new Date(),
    isArchived = false,
    metadata = {}
  } = {}) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.model = model;
    this.style = style;
    
    // Handle Firestore timestamps and various date formats
    const toDate = (date) => {
      if (!date) return new Date();
      if (date.toDate) return date.toDate(); // Firestore Timestamp
      if (date.seconds) return new Date(date.seconds * 1000); // Firestore Timestamp in object form
      if (date._seconds) return new Date(date._seconds * 1000); // Firestore Timestamp in object form (alternative)
      return new Date(date);
    };
    
    this.createdAt = toDate(createdAt);
    this.updatedAt = toDate(updatedAt);
    this.isArchived = isArchived;
    this.metadata = {
      messageCount: 0,
      lastMessage: '',
      ...metadata
    };
  }

  /**
   * Convert the conversation to a plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    // Convert dates to ISO strings only if they are valid dates
    const formatDate = (date) => {
      if (!date) return null;
      try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? null : d.toISOString();
      } catch (e) {
        return null;
      }
    };

    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      model: this.model,
      style: this.style,
      createdAt: formatDate(this.createdAt),
      updatedAt: formatDate(this.updatedAt),
      isArchived: this.isArchived,
      metadata: this.metadata
    };
  }

  /**
   * Update the conversation's updatedAt timestamp
   */
  touch() {
    this.updatedAt = new Date();
    return this;
  }
}

export default Conversation;
