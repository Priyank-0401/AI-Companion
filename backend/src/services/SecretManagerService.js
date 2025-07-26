import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import config from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * SecretManagerService - Handles all interactions with Google Secret Manager
 * Stores and retrieves per-user encryption keys securely
 */
class SecretManagerService {
  constructor() {
    // Log configuration for debugging
    logger.debug('Initializing SecretManagerService');
    logger.debug(`Google Cloud Project ID from config: ${config.googleCloud.projectId}`);
    logger.debug(`Firebase Project ID from config: ${config.firebase.projectId}`);
    
    // Initialize the client with project ID from config
    this.client = new SecretManagerServiceClient({
      projectId: config.googleCloud.projectId
    });
    
    // Store project ID for use in secret names
    this.projectId = config.googleCloud.projectId;
    
    // Secret name prefix
    this.secretPrefix = 'seriva-user-key-';
    
    if (!this.projectId) {
      logger.error('Google Cloud Project ID is not configured');
      logger.error(`Available config: ${JSON.stringify(config.googleCloud)}`);
      throw new Error('Google Cloud Project ID is required for Secret Manager');
    }
    
    logger.info(`SecretManagerService initialized with project ID: ${this.projectId}`);
  }

  /**
   * Generate secret name for a user
   * @param {string} userId - Firebase user ID
   * @returns {string} Secret name for Google Secret Manager
   */
  generateSecretName(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Invalid user ID provided');
    }
    return `${this.secretPrefix}${userId}`;
  }

  /**
   * Store a user's encryption key in Secret Manager
   * @param {string} userId - Firebase user ID
   * @param {string} encryptionKey - Base64 encoded encryption key
   * @returns {Promise<boolean>} True if successful
   */
  async storeUserEncryptionKey(userId, encryptionKey) {
    try {
      if (!userId || !encryptionKey) {
        throw new Error('User ID and encryption key are required');
      }

      const secretName = this.generateSecretName(userId);
      const parent = `projects/${this.projectId}`;

      logger.info(`Storing encryption key for user: ${userId}`);

      // First, create the secret
      try {
        await this.client.createSecret({
          parent: parent,
          secretId: secretName,
          secret: {
            replication: {
              automatic: {},
            },
          },
        });
        logger.debug(`Created secret: ${secretName}`);
      } catch (error) {
        // Secret might already exist, which is fine
        if (!error.message.includes('already exists')) {
          throw error;
        }
        logger.debug(`Secret ${secretName} already exists, updating version`);
      }

      // Add the secret version with the encryption key
      const [version] = await this.client.addSecretVersion({
        parent: `${parent}/secrets/${secretName}`,
        payload: {
          data: Buffer.from(encryptionKey, 'utf8'),
        },
      });

      logger.info(`Successfully stored encryption key for user: ${userId}`);
      return true;

    } catch (error) {
      logger.error(`Failed to store encryption key for user ${userId}:`, error);
      throw new Error(`Failed to store encryption key: ${error.message}`);
    }
  }

  /**
   * Retrieve a user's encryption key from Secret Manager
   * @param {string} userId - Firebase user ID
   * @returns {Promise<string|null>} Base64 encoded encryption key or null if not found
   */
  async getUserEncryptionKey(userId) {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID provided');
      }

      const secretName = this.generateSecretName(userId);
      const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;

      logger.debug(`Retrieving encryption key for user: ${userId}`);

      const [version] = await this.client.accessSecretVersion({
        name: name,
      });

      const encryptionKey = version.payload.data.toString('utf8');
      
      if (!encryptionKey) {
        logger.warn(`Empty encryption key retrieved for user: ${userId}`);
        return null;
      }

      logger.debug(`Successfully retrieved encryption key for user: ${userId}`);
      return encryptionKey;

    } catch (error) {
      if (error.code === 5 || error.message.includes('not found')) {
        logger.warn(`Encryption key not found for user: ${userId}`);
        return null;
      }

      logger.error(`Failed to retrieve encryption key for user ${userId}:`, error);
      throw new Error(`Failed to retrieve encryption key: ${error.message}`);
    }
  }

  /**
   * Check if a user has an encryption key stored
   * @param {string} userId - Firebase user ID
   * @returns {Promise<boolean>} True if key exists
   */
  async hasUserEncryptionKey(userId) {
    try {
      const key = await this.getUserEncryptionKey(userId);
      return key !== null;
    } catch (error) {
      logger.error(`Error checking if user ${userId} has encryption key:`, error);
      return false;
    }
  }

  /**
   * Delete a user's encryption key from Secret Manager
   * WARNING: This will make all encrypted messages for this user unrecoverable
   * @param {string} userId - Firebase user ID
   * @returns {Promise<boolean>} True if successful
   */
  async deleteUserEncryptionKey(userId) {
    try {
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID provided');
      }

      const secretName = this.generateSecretName(userId);
      const name = `projects/${this.projectId}/secrets/${secretName}`;

      logger.warn(`Deleting encryption key for user: ${userId} - This will make messages unrecoverable!`);

      await this.client.deleteSecret({
        name: name,
      });

      logger.info(`Successfully deleted encryption key for user: ${userId}`);
      return true;

    } catch (error) {
      if (error.code === 5 || error.message.includes('not found')) {
        logger.warn(`Encryption key not found for user: ${userId} (already deleted?)`);
        return true; // Consider it successful if already deleted
      }

      logger.error(`Failed to delete encryption key for user ${userId}:`, error);
      throw new Error(`Failed to delete encryption key: ${error.message}`);
    }
  }

  /**
   * List all user encryption keys (for admin purposes)
   * @returns {Promise<Array<string>>} Array of user IDs that have encryption keys
   */
  async listUserEncryptionKeys() {
    try {
      const parent = `projects/${this.projectId}`;
      const [secrets] = await this.client.listSecrets({
        parent: parent,
        filter: `name:${this.secretPrefix}`,
      });

      const userIds = secrets
        .map(secret => {
          const secretName = secret.name.split('/').pop();
          return secretName.replace(this.secretPrefix, '');
        })
        .filter(userId => userId && userId.length > 0);

      logger.info(`Found encryption keys for ${userIds.length} users`);
      return userIds;

    } catch (error) {
      logger.error('Failed to list user encryption keys:', error);
      throw new Error(`Failed to list encryption keys: ${error.message}`);
    }
  }

  /**
   * Validate Secret Manager configuration
   * @returns {Promise<boolean>} True if configuration is valid
   */
  async validateConfiguration() {
    try {
      if (!this.projectId) {
        throw new Error('Google Cloud Project ID not configured');
      }

      // Test access by trying to list secrets (this requires minimal permissions)
      const parent = `projects/${this.projectId}`;
      await this.client.listSecrets({
        parent: parent,
        pageSize: 1, // Just test with one result
      });

      logger.info('Secret Manager configuration is valid');
      return true;

    } catch (error) {
      logger.error('Secret Manager configuration validation failed:', error);
      return false;
    }
  }

  /**
   * Get service health status
   * @returns {Promise<Object>} Health status information
   */
  async getHealthStatus() {
    try {
      const isValid = await this.validateConfiguration();
      
      return {
        service: 'SecretManagerService',
        status: isValid ? 'healthy' : 'unhealthy',
        projectId: this.projectId,
        timestamp: new Date().toISOString(),
        details: isValid ? 'Service is operational' : 'Configuration validation failed'
      };

    } catch (error) {
      return {
        service: 'SecretManagerService',
        status: 'error',
        projectId: this.projectId,
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

export default new SecretManagerService();
