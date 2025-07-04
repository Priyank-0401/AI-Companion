import { useCallback } from 'react';
import * as authService from '../services/authService';
import { useAuth as useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const { user, loading, error, isAuthenticated, refreshUser } = useAuthContext();

  const signIn = useCallback(async (email, password) => {
    try {
      const result = await authService.signIn(email, password);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const signUp = useCallback(async (email, password, displayName) => {
    try {
      const result = await authService.signUp(email, password, displayName);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const result = await authService.signInWithGoogle();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const resetPassword = useCallback(async (email) => {
    try {
      await authService.resetPassword(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const updateEmail = useCallback(async (newEmail) => {
    try {
      await authService.updateEmail(newEmail);
      refreshUser();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [refreshUser]);

  const updatePassword = useCallback(async (newPassword) => {
    try {
      await authService.updateUserPassword(newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    try {
      const result = await authService.updateUserProfile(updates);
      refreshUser();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, [refreshUser]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateEmail,
    updatePassword,
    updateProfile,
    refreshUser,
  };
};

export default useAuth;
