import React from 'react';
import useAuth from '../auth/hooks/useAuth';
import { useTheme } from '../contexts/useTheme';
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
  const { currentUser, loading, initialized } = useAuth();
  const authUser = localStorage.getItem('authUser');
  const user = authUser ? JSON.parse(authUser) : currentUser;
  
  const userProfile = {
    ...user,
    photoURL: user?.photoURL || user?.photoUrl || '',
    displayName: user?.displayName || user?.name || 'User',
    email: user?.email || 'user@example.com'
  };

  const { theme } = useTheme();
  const colors = themeColors[theme] || themeColors.light;

  if (!initialized || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`bg-${colors.background} text-${colors.text} min-h-screen`}>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 pt-20">
        <ProfileSettings user={userProfile} colors={colors} />
      </main>
    </div>
  );  
};

export default SettingsPage;