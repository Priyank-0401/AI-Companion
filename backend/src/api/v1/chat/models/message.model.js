import { v4 as uuidv4 } from 'uuid';

/**
 * @class Message
 * @description Represents a chat message
 */
class Message {
  constructor({
    id = uuidv4(),
    conversationId,
    content,
    role, // 'user', 'assistant', or 'system'
    timestamp = new Date(),
    metadata = {}
  } = {}) {
    if (!['user', 'assistant', 'system'].includes(role)) {
      throw new Error('Invalid message role');
    }

    this.id = id;
    this.conversationId = conversationId;
    this.content = content;
    this.role = role;
    this.timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);
    this.metadata = {
      model: metadata.model || null,
      tokens: metadata.tokens || 0,
      isEdited: metadata.isEdited || false,
      encrypted: metadata.encrypted || false,
      encryptionVersion: metadata.encryptionVersion || null,
      ...metadata
    };
  }

  /**
   * Convert the message to a plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      conversationId: this.conversationId,
      content: this.content,
      role: this.role,
      timestamp: this.timestamp.toISOString(),
      metadata: this.metadata
    };
  }

  /**
   * Update the message content
   * @param {string} newContent - New message content
   */
  updateContent(newContent) {
    this.content = newContent;
    this.metadata.isEdited = true;
    return this;
  }

  /**
   * Mark message as encrypted
   * @param {string} version - Encryption version
   */
  markAsEncrypted(version = '1.0') {
    this.metadata.encrypted = true;
    this.metadata.encryptionVersion = version;
    return this;
  }

  /**
   * Check if message is encrypted
   * @returns {boolean} True if message is encrypted
   */
  isEncrypted() {
    return this.metadata.encrypted === true;
  }

  /**
   * Get encryption version
   * @returns {string|null} Encryption version or null if not encrypted
   */
  getEncryptionVersion() {
    return this.metadata.encrypted ? this.metadata.encryptionVersion : null;
  }
}

export default Message;
