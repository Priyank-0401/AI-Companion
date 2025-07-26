import UserEncryptionService from './src/services/UserEncryptionService.js';
import { logger } from './src/utils/logger.js';

// Add console.log for better visibility
console.log = function() {
  logger.info.apply(logger, arguments);
  process.stdout.write([].slice.call(arguments).join(' ') + '\n');
};

// Test the encryption workflow
async function testEncryption() {
  try {
    console.log('Starting encryption test...');
    
    // Test user ID (in a real scenario, this would be a Firebase user ID)
    const testUserId = 'test-user-123';
    
    // Test 1: Initialize user encryption
    console.log('Test 1: Initializing user encryption...');
    await UserEncryptionService.initializeUserEncryption(testUserId);
    console.log('User encryption initialized successfully');
    
    // Test 2: Check if user has encryption enabled
    console.log('Test 2: Checking encryption status...');
    const encryptionStatus = await UserEncryptionService.getUserEncryptionStatus(testUserId);
    console.log('Encryption status:', JSON.stringify(encryptionStatus));
    
    // Test 3: Encrypt a message
    console.log('Test 3: Encrypting a test message...');
    const testMessage = 'This is a secret message that should be encrypted!';
    const encryptedMessage = await UserEncryptionService.encryptUserMessage(testUserId, testMessage);
    console.log('Message encrypted successfully');
    console.log('Encrypted message:', JSON.stringify(encryptedMessage));
    
    // Test 4: Decrypt the message
    console.log('Test 4: Decrypting the message...');
    const decryptedMessage = await UserEncryptionService.processMessageContent(testUserId, encryptedMessage);
    console.log('Message decrypted successfully');
    
    // Verify the decrypted message matches the original
    if (testMessage === decryptedMessage) {
      console.log('SUCCESS: Encryption/decryption workflow working correctly!');
    } else {
      console.log('ERROR: Decrypted message does not match original');
      console.log('Original:', testMessage);
      console.log('Decrypted:', decryptedMessage);
    }
    
    // Test 5: Clean up - delete the test user's encryption key
    console.log('Test 5: Cleaning up encryption key...');
    // Note: We won't actually delete the key in Secret Manager for testing
    // await UserEncryptionService.removeUserEncryption(testUserId);
    console.log('Encryption key cleanup skipped for testing');
    
    console.log('All tests completed!');
  } catch (error) {
    console.log('Test failed with error:', error.message);
    console.log('Stack trace:', error.stack);
  }
}

testEncryption();
