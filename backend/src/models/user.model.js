import { getDb } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// This will be initialized when first used
let db;

const getDbInstance = () => {
  if (!db) {
    db = getDb();
    if (!db) {
      throw new Error('Firebase Firestore is not initialized');
    }
  }
  return db;
};

class User {
  constructor({
    id = uuidv4(),
    firebaseUid = null,
    email = null,
    displayName = null,
    photoURL = null,
    phoneNumber = null,
    emailVerified = false,
    disabled = false,
    metadata = {
      creationTime: new Date().toISOString(),
      lastSignInTime: null,
      lastRefreshTime: null,
    },
    providerData = [],
    customClaims = {},
    tokensValidAfterTime = null,
    tenantId = null,
    role = 'user',
    preferences = {},
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString(),
  } = {}) {
    this.id = id;
    this.firebaseUid = firebaseUid;
    this.email = email;
    this.displayName = displayName;
    this.photoURL = photoURL;
    this.phoneNumber = phoneNumber;
    this.emailVerified = emailVerified;
    this.disabled = disabled;
    this.metadata = metadata;
    this.providerData = providerData;
    this.customClaims = customClaims;
    this.tokensValidAfterTime = tokensValidAfterTime;
    this.tenantId = tenantId;
    this.role = role;
    this.preferences = preferences;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Convert to plain object
  toJSON() {
    return {
      id: this.id,
      firebaseUid: this.firebaseUid,
      email: this.email,
      displayName: this.displayName,
      photoURL: this.photoURL,
      phoneNumber: this.phoneNumber,
      emailVerified: this.emailVerified,
      disabled: this.disabled,
      metadata: this.metadata,
      providerData: this.providerData,
      customClaims: this.customClaims,
      tokensValidAfterTime: this.tokensValidAfterTime,
      tenantId: this.tenantId,
      role: this.role,
      preferences: this.preferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Create a new user in Firestore
  static async create(userData) {
    try {
      const user = new User(userData);
      const db = getDbInstance();
      const userRef = db.collection('users').doc(user.id);
      
      const userToSave = { ...user };
      delete userToSave.id; // Don't store the id in the document
      
      await userRef.set(userToSave);
      logger.info(`User ${user.id} created in Firestore`);
      
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  // Find user by ID
  static async findById(userId) {
    try {
      const db = getDbInstance();
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return null;
      }
      return new User({ id: userDoc.id, ...userDoc.data() });
    } catch (error) {
      logger.error(`Error finding user by ID ${userId}: ${error.message}`);
      throw error;
    }
  }

  // Find user by Firebase UID
  static async findByFirebaseUid(firebaseUid) {
    try {
      const db = getDbInstance();
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('firebaseUid', '==', firebaseUid).limit(1).get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const userDoc = snapshot.docs[0];
      return new User({ id: userDoc.id, ...userDoc.data() });
    } catch (error) {
      logger.error(`Error finding user by Firebase UID ${firebaseUid}: ${error.message}`);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const db = getDbInstance();
      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).limit(1).get();
      
      if (snapshot.empty) {
        return null;
      }
      
      const userDoc = snapshot.docs[0];
      return new User({ id: userDoc.id, ...userDoc.data() });
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw new Error(`Failed to find user by email: ${error.message}`);
    }
  }

  // Update user
  async update(updateData) {
    try {
      const db = getDbInstance();
      const userRef = db.collection('users').doc(this.id);
      await userRef.update({
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
      
      // Update the current instance with new data
      Object.assign(this, {
        ...this.toJSON(),
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
      
      return this;
    } catch (error) {
      logger.error(`Error updating user ${this.id}: ${error.message}`);
      throw error;
    }
  }

  // Delete user
  async delete() {
    try {
      const db = getDbInstance();
      const userRef = db.collection('users').doc(this.id);
      await userRef.delete();
      logger.info(`User ${this.id} deleted from Firestore`);
      return true;
    } catch (error) {
      logger.error('Error deleting user from Firestore:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Set user role
  async setRole(role) {
    try {
      const db = getDbInstance();
      const userRef = db.collection('users').doc(this.id);
      await userRef.update({ role, updatedAt: new Date().toISOString() });
      this.role = role;
      this.updatedAt = new Date().toISOString();
      return this;
    } catch (error) {
      logger.error(`Error setting role for user ${this.id}: ${error.message}`);
      throw error;
    }
  }

  // Update user password
  async updatePassword(newPassword) {
    try {
      const { getAuth } = await import('../config/firebase.js');
      const auth = getAuth();
      await auth.updateUser(this.firebaseUid, { password: newPassword });
      
      const db = getDbInstance();
      const userRef = db.collection('users').doc(this.id);
      await userRef.update({ 
        passwordChangedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      });
      
      this.passwordChangedAt = new Date().toISOString();
      this.updatedAt = new Date().toISOString();
      
      return this;
    } catch (error) {
      logger.error('Error updating password:', error);
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  // Check if user has role
  hasRole(role) {
    return this.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles) {
    return roles.includes(this.role);
  }

  // Get user's full profile (including sensitive data)
  static async getFullProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      // Add any additional sensitive data here
      const fullProfile = user.toJSON();
      
      return fullProfile;
    } catch (error) {
      logger.error(`Error getting full profile for user ${userId}: ${error.message}`);
      throw error;
    }
  }
}

export default User;
