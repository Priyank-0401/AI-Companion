import EncryptionService from './EncryptionService.js';
import SecretManagerService from './SecretManagerService.js';
import { logger } from '../utils/logger.js';

/**
 * UserEncryptionService - Handles user-specific encryption operations
 * Coordinates between EncryptionService and SecretManagerService
 */
class UserEncryptionService {
  constructor() {
    this.encryptionService = EncryptionService;
    this.secretManagerService = SecretManagerService;
  }

  /**
   * Initialize encryption for a new user (called during signup)
   * @param {string} userId - Firebase user ID
   * @returns {Promise<boolean>} True if successful
   */
  async initializeUserEncryption(userId) {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID provided');
      }

      logger.info(`Initializing encryption for new user: ${userId}`);
      
      // Log the services to ensure they're properly initialized
      logger.debug(`SecretManagerService available: ${!!this.secretManagerService}`);
      logger.debug(`EncryptionService available: ${!!this.encryptionService}`);

      // Check if user already has an encryption key
      logger.debug(`Checking if user ${userId} already has an encryption key`);
      const hasKey = await this.secretManagerService.hasUserEncryptionKey(userId);
      if (hasKey) {
        logger.info(`User ${userId} already has an encryption key, skipping initialization`);
        return true;
      }

      // Generate a new encryption key
      logger.debug(`Generating new encryption key for user: ${userId}`);
      const encryptionKey = this.encryptionService.generateEncryptionKey();
      logger.debug(`Generated encryption key length: ${encryptionKey?.length}`);
      
      // Store the key in Secret Manager
      logger.debug(`Storing encryption key for user: ${userId}`);
      await this.secretManagerService.storeUserEncryptionKey(userId, encryptionKey);

      logger.info(`Successfully initialized encryption for user: ${userId}`);
      return true;

    } catch (error) {
      logger.error(`Failed to initialize encryption for user ${userId}:`, error);
      logger.error(`Error stack: ${error.stack}`);
      throw new Error(`Failed to initialize user encryption: ${error.message}`);
    }
  }

  /**
   * Encrypt a message for a specific user
   * @param {string} userId - Firebase user ID
   * @param {string} message - Plain text message to encrypt
   * @returns {Promise<string>} Encrypted message
   */
  async encryptUserMessage(userId, message) {
    try {
      if (!userId || !message) {
        throw new Error('User ID and message are required');
      }

      // Get user's encryption key
      const encryptionKey = await this.secretManagerService.getUserEncryptionKey(userId);
      if (!encryptionKey) {
        throw new Error(`No encryption key found for user: ${userId}`);
      }

      // Encrypt the message
      const encryptedMessage = this.encryptionService.encryptMessage(message, encryptionKey);
      
      logger.debug(`Successfully encrypted message for user: ${userId}`);
      return encryptedMessage;

    } catch (error) {
      logger.error(`Failed to encrypt message for user ${userId}:`, error);
      throw new Error(`Failed to encrypt user message: ${error.message}`);
    }
  }

  /**
   * Decrypt a message for a specific user
   * @param {string} userId - Firebase user ID
   * @param {string} encryptedMessage - Encrypted message to decrypt
   * @returns {Promise<string>} Decrypted plain text message
   */
  async decryptUserMessage(userId, encryptedMessage) {
    try {
      if (!userId || !encryptedMessage) {
        throw new Error('User ID and encrypted message are required');
      }

      // Get user's encryption key
      const encryptionKey = await this.secretManagerService.getUserEncryptionKey(userId);
      if (!encryptionKey) {
        throw new Error(`No encryption key found for user: ${userId}`);
      }

      // Decrypt the message
      const decryptedMessage = this.encryptionService.decryptMessage(encryptedMessage, encryptionKey);
      
      logger.debug(`Successfully decrypted message for user: ${userId}`);
      return decryptedMessage;

    } catch (error) {
      logger.error(`Failed to decrypt message for user ${userId}:`, error);
      throw new Error(`Failed to decrypt user message: ${error.message}`);
    }
  }

  /**
   * Encrypt multiple messages for a specific user
   * @param {string} userId - Firebase user ID
   * @param {Array<string>} messages - Array of plain text messages
   * @returns {Promise<Array<string>>} Array of encrypted messages
   */
  async encryptUserMessages(userId, messages) {
    try {
      if (!userId || !Array.isArray(messages)) {
        throw new Error('User ID and messages array are required');
      }

      // Get user's encryption key
      const encryptionKey = await this.secretManagerService.getUserEncryptionKey(userId);
      if (!encryptionKey) {
        throw new Error(`No encryption key found for user: ${userId}`);
      }

      // Encrypt all messages
      const encryptedMessages = this.encryptionService.encryptMessages(messages, encryptionKey);
      
      logger.debug(`Successfully encrypted ${messages.length} messages for user: ${userId}`);
      return encryptedMessages;

    } catch (error) {
      logger.error(`Failed to encrypt messages for user ${userId}:`, error);
      throw new Error(`Failed to encrypt user messages: ${error.message}`);
    }
  }

  /**
   * Decrypt multiple messages for a specific user
   * @param {string} userId - Firebase user ID
   * @param {Array<string>} encryptedMessages - Array of encrypted messages
   * @returns {Promise<Array<string>>} Array of decrypted plain text messages
   */
  async decryptUserMessages(userId, encryptedMessages) {
    try {
      if (!userId || !Array.isArray(encryptedMessages)) {
        throw new Error('User ID and encrypted messages array are required');
      }

      // Get user's encryption key
      const encryptionKey = await this.secretManagerService.getUserEncryptionKey(userId);
      if (!encryptionKey) {
        throw new Error(`No encryption key found for user: ${userId}`);
      }

      // Decrypt all messages
      const decryptedMessages = this.encryptionService.decryptMessages(encryptedMessages, encryptionKey);
      
      logger.debug(`Successfully decrypted ${encryptedMessages.length} messages for user: ${userId}`);
      return decryptedMessages;

    } catch (error) {
      logger.error(`Failed to decrypt messages for user ${userId}:`, error);
      throw new Error(`Failed to decrypt user messages: ${error.message}`);
    }
  }

  /**
   * Process message content - handles both encrypted and plain text messages
   * This is useful during the transition period when some messages might not be encrypted yet
   * @param {string} userId - Firebase user ID
   * @param {string} messageContent - Message content (encrypted or plain text)
   * @param {boolean} forceDecrypt - Force decryption even if message doesn't appear encrypted
   * @returns {Promise<string>} Plain text message
   */
  async processMessageContent(userId, messageContent, forceDecrypt = false) {
    try {
      if (!userId || !messageContent) {
        throw new Error('User ID and message content are required');
      }

      // Check if message appears to be encrypted
      const isEncrypted = this.encryptionService.isMessageEncrypted(messageContent);
      
      if (isEncrypted || forceDecrypt) {
        // Decrypt the message
        return await this.decryptUserMessage(userId, messageContent);
      } else {
        // Return as-is (plain text)
        logger.debug(`Message for user ${userId} is not encrypted, returning as plain text`);
        return messageContent;
      }

    } catch (error) {
      // If decryption fails, it might be a plain text message
      if (!forceDecrypt && error.message.includes('Failed to decrypt')) {
        logger.warn(`Decryption failed for user ${userId}, treating as plain text`);
        return messageContent;
      }
      
      logger.error(`Failed to process message content for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Migrate user's existing plain text messages to encrypted format
   * @param {string} userId - Firebase user ID
   * @param {Array<Object>} messages - Array of message objects with content property
   * @returns {Promise<Array<Object>>} Array of messages with encrypted content
   */
  async migrateUserMessages(userId, messages) {
    try {
      if (!userId || !Array.isArray(messages)) {
        throw new Error('User ID and messages array are required');
      }

      logger.info(`Starting message migration for user: ${userId} (${messages.length} messages)`);

      const migratedMessages = [];

      for (const message of messages) {
        try {
          // Skip if already encrypted
          if (this.encryptionService.isMessageEncrypted(message.content)) {
            migratedMessages.push(message);
            continue;
          }

          // Encrypt the message content
          const encryptedContent = await this.encryptUserMessage(userId, message.content);
          
          // Create new message object with encrypted content
          migratedMessages.push({
            ...message,
            content: encryptedContent,
            metadata: {
              ...message.metadata,
              encrypted: true,
              migrated: true,
              migratedAt: new Date().toISOString()
            }
          });

        } catch (error) {
          logger.error(`Failed to migrate message ${message.id} for user ${userId}:`, error);
          // Keep original message if migration fails
          migratedMessages.push(message);
        }
      }

      logger.info(`Completed message migration for user: ${userId} (${migratedMessages.length} messages processed)`);
      return migratedMessages;

    } catch (error) {
      logger.error(`Failed to migrate messages for user ${userId}:`, error);
      throw new Error(`Failed to migrate user messages: ${error.message}`);
    }
  }

  /**
   * Get user encryption status
   * @param {string} userId - Firebase user ID
   * @returns {Promise<Object>} Encryption status information
   */
  async getUserEncryptionStatus(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const hasKey = await this.secretManagerService.hasUserEncryptionKey(userId);
      
      return {
        userId,
        hasEncryptionKey: hasKey,
        encryptionEnabled: hasKey,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error(`Failed to get encryption status for user ${userId}:`, error);
      return {
        userId,
        hasEncryptionKey: false,
        encryptionEnabled: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Remove user encryption (for account deletion)
   * WARNING: This will make all encrypted messages unrecoverable
   * @param {string} userId - Firebase user ID
   * @returns {Promise<boolean>} True if successful
   */
  async removeUserEncryption(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      logger.warn(`Removing encryption for user: ${userId} - This will make messages unrecoverable!`);
      
      await this.secretManagerService.deleteUserEncryptionKey(userId);
      
      logger.info(`Successfully removed encryption for user: ${userId}`);
      return true;

    } catch (error) {
      logger.error(`Failed to remove encryption for user ${userId}:`, error);
      throw new Error(`Failed to remove user encryption: ${error.message}`);
    }
  }
}

export default new UserEncryptionService();
