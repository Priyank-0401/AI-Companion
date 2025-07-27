import { v4 as uuidv4 } from 'uuid';

/**
 * @class JournalEntry
 * @description Represents a journal entry
 */
class JournalEntry {
  constructor({
    id = uuidv4(),
    userId,
    title = '',
    content = '',
    mood = 'neutral',
    tags = [],
    type = 'text',
    mediaUrl = null,
    mediaPath = null,
    mediaSize = 0,
    mediaType = null,
    createdAt = new Date(),
    updatedAt = new Date(),
    metadata = {}
  } = {}) {
    this.id = id;
    this.userId = userId;
    this.title = title;
    this.content = content;
    this.mood = mood;
    this.tags = Array.isArray(tags) ? tags : [];
    this.type = type;
    this.mediaUrl = mediaUrl;
    this.mediaPath = mediaPath;
    this.mediaSize = mediaSize;
    this.mediaType = mediaType;
    this.createdAt = createdAt instanceof Date ? createdAt : new Date(createdAt);
    this.updatedAt = updatedAt instanceof Date ? updatedAt : new Date(updatedAt);
    // Create metadata object with proper defaults
    // We need to be careful about the order to avoid overriding encryption properties
    this.metadata = {
      encrypted: false,
      encryptionVersion: null,
      ...metadata
    };
    
    // Ensure encryption properties are correctly set
    if (metadata.encrypted !== undefined) {
      this.metadata.encrypted = metadata.encrypted;
    }
    if (metadata.encryptionVersion !== undefined) {
      this.metadata.encryptionVersion = metadata.encryptionVersion;
    }
  }

  /**
   * Convert the journal entry to a plain object
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      content: this.content,
      mood: this.mood,
      tags: this.tags,
      type: this.type,
      mediaUrl: this.mediaUrl,
      mediaPath: this.mediaPath,
      mediaSize: this.mediaSize,
      mediaType: this.mediaType,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      metadata: this.metadata
    };
  }

  /**
   * Mark the journal entry as encrypted
   * @param {string} version - Encryption version
   */
  markAsEncrypted(version = '1.0') {
    this.metadata.encrypted = true;
    this.metadata.encryptionVersion = version;
  }

  /**
   * Check if the journal entry is encrypted
   * @returns {boolean} True if encrypted
   */
  isEncrypted() {
    return !!this.metadata.encrypted;
  }
}

export default JournalEntry;
