import React, { useState, useEffect } from 'react';
import useAuth from '../auth/hooks/useAuth';
import { useTheme } from '../contexts/useTheme';
import { getAuthUser } from '../auth/services/authService';
import ProfileSettings from '../components/settings/ProfileSettings';

// Theme colors
const themeColors = {
  light: {
    background: 'white',
    text: 'gray-900',
    primary: 'blue-600',
    border: 'gray-200',
    textPrimary: 'gray-900',
    textSecondary: 'gray-600',
    backgroundSecondary: 'gray-100',
    backgroundTertiary: 'gray-50',
    hover: 'gray-200',
    success: 'green-500',
    danger: 'red-500',
  },
  dark: {
    background: 'gray-900',
    text: 'white',
    primary: 'blue-500',
    border: 'gray-700',
    textPrimary: 'white',
    textSecondary: 'gray-300',
    backgroundSecondary: 'gray-800',
    backgroundTertiary: 'gray-900',
    hover: 'gray-700',
    success: 'green-400',
    danger: 'red-400',
  },
};

const SettingsPage = () => {
  const { user: currentUser, loading: authLoading, initialized } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { theme } = useTheme();
  const colors = themeColors[theme] || themeColors.light;

  // Fetch complete user profile from Firestore
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!initialized || authLoading) return;
      
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get complete user data from Firestore
        const completeUserData = await getAuthUser(currentUser);
        
        setUserProfile({
          ...completeUserData,
          photoURL: completeUserData?.photoURL || completeUserData?.photoUrl || '',
          displayName: completeUserData?.displayName || completeUserData?.name || 'User',
          email: completeUserData?.email || 'user@example.com'
        });
      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
        // Fallback to basic user data
        setUserProfile({
          ...currentUser,
          photoURL: currentUser?.photoURL || currentUser?.photoUrl || '',
          displayName: currentUser?.displayName || currentUser?.name || 'User',
          email: currentUser?.email || 'user@example.com'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [currentUser, initialized, authLoading]);

  if (!initialized || authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-5rem)] w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="ml-3 text-gray-600 dark:text-gray-400">Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-5rem)] w-full">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-${colors.background} text-${colors.text}`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ProfileSettings user={userProfile} colors={colors} />
      </main>
    </div>
  );  
};

export default SettingsPage;