import crypto from 'crypto';
import { logger } from '../utils/logger.js';

/**
 * EncryptionService - Handles all encryption/decryption operations for user messages
 * Uses AES-256-GCM encryption with per-user keys stored in Google Secret Manager
 */
class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
  }

  /**
   * Generate a secure random encryption key for a new user
   * @returns {string} Base64 encoded encryption key
   */
  generateEncryptionKey() {
    try {
      const key = crypto.randomBytes(this.keyLength);
      return key.toString('base64');
    } catch (error) {
      logger.error('Failed to generate encryption key:', error);
      throw new Error('Failed to generate encryption key');
    }
  }

  /**
   * Encrypt a message using the provided key
   * @param {string} plaintext - The message to encrypt
   * @param {string} encryptionKey - Base64 encoded encryption key
   * @returns {string} Encrypted message with format: iv:authTag:encryptedData (all base64)
   */
  encryptMessage(plaintext, encryptionKey) {
    try {
      if (!plaintext || typeof plaintext !== 'string') {
        throw new Error('Invalid plaintext provided');
      }

      if (!encryptionKey || typeof encryptionKey !== 'string') {
        throw new Error('Invalid encryption key provided');
      }

      // Convert base64 key to buffer
      const key = Buffer.from(encryptionKey, 'base64');
      
      // Generate random IV
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher with GCM mode
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      cipher.setAAD(Buffer.from('seriva-message', 'utf8')); // Additional authenticated data
      
      // Encrypt the message
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      // Get authentication tag
      const authTag = cipher.getAuthTag();
      
      // Combine IV, auth tag, and encrypted data
      const result = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
      
      logger.debug('Message encrypted successfully');
      return result;
      
    } catch (error) {
      logger.error('Failed to encrypt message:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt a message using the provided key
   * @param {string} encryptedMessage - Encrypted message with format: iv:authTag:encryptedData
   * @param {string} encryptionKey - Base64 encoded encryption key
   * @returns {string} Decrypted plaintext message
   */
  decryptMessage(encryptedMessage, encryptionKey) {
    try {
      if (!encryptedMessage || typeof encryptedMessage !== 'string') {
        throw new Error('Invalid encrypted message provided');
      }

      if (!encryptionKey || typeof encryptionKey !== 'string') {
        throw new Error('Invalid encryption key provided');
      }

      // Parse the encrypted message
      const parts = encryptedMessage.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted message format');
      }

      const [ivBase64, authTagBase64, encryptedData] = parts;
      
      // Convert from base64
      const key = Buffer.from(encryptionKey, 'base64');
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      
      // Create decipher with GCM mode
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAAD(Buffer.from('seriva-message', 'utf8')); // Same AAD as encryption
      decipher.setAuthTag(authTag);
      
      // Decrypt the message
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      logger.debug('Message decrypted successfully');
      return decrypted;
      
    } catch (error) {
      logger.error('Failed to decrypt message:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Encrypt multiple messages in batch
   * @param {Array<string>} messages - Array of messages to encrypt
   * @param {string} encryptionKey - Base64 encoded encryption key
   * @returns {Array<string>} Array of encrypted messages
   */
  encryptMessages(messages, encryptionKey) {
    try {
      if (!Array.isArray(messages)) {
        throw new Error('Messages must be an array');
      }

      return messages.map(message => this.encryptMessage(message, encryptionKey));
    } catch (error) {
      logger.error('Failed to encrypt messages in batch:', error);
      throw error;
    }
  }

  /**
   * Decrypt multiple messages in batch
   * @param {Array<string>} encryptedMessages - Array of encrypted messages
   * @param {string} encryptionKey - Base64 encoded encryption key
   * @returns {Array<string>} Array of decrypted messages
   */
  decryptMessages(encryptedMessages, encryptionKey) {
    try {
      if (!Array.isArray(encryptedMessages)) {
        throw new Error('Encrypted messages must be an array');
      }

      return encryptedMessages.map(encryptedMessage => 
        this.decryptMessage(encryptedMessage, encryptionKey)
      );
    } catch (error) {
      logger.error('Failed to decrypt messages in batch:', error);
      throw error;
    }
  }

  /**
   * Check if a message appears to be encrypted
   * @param {string} message - Message to check
   * @returns {boolean} True if message appears encrypted
   */
  isMessageEncrypted(message) {
    if (!message || typeof message !== 'string') {
      return false;
    }

    // Check if message has the expected encrypted format (iv:authTag:encryptedData)
    const parts = message.split(':');
    if (parts.length !== 3) {
      return false;
    }

    // Check if parts are valid base64
    try {
      parts.forEach(part => {
        Buffer.from(part, 'base64');
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate encryption key format
   * @param {string} key - Encryption key to validate
   * @returns {boolean} True if key is valid
   */
  isValidEncryptionKey(key) {
    if (!key || typeof key !== 'string') {
      return false;
    }

    try {
      const keyBuffer = Buffer.from(key, 'base64');
      return keyBuffer.length === this.keyLength;
    } catch {
      return false;
    }
  }
}

export default new EncryptionService();
