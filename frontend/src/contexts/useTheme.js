import React, { useState, useEffect, useCallback, useContext, createContext, useMemo } from 'react';

const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isMounted, setIsMounted] = useState(false);
  const isDark = theme === 'dark';

  // Get initial theme from localStorage or system preference
  const getInitialTheme = useCallback(() => {
    if (typeof window === 'undefined') return 'light';
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return systemPrefersDark ? 'dark' : 'light';
  }, []);

  // Set theme on initial load
  useEffect(() => {
    setTheme(getInitialTheme());
    setIsMounted(true);
    
    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!localStorage.getItem('theme')) {
        setTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [getInitialTheme]);

  // Update the theme in localStorage and on the HTML element
  useEffect(() => {
    if (!isMounted) return;
    
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    root.classList.add(theme);
    root.style.colorScheme = theme;
    
    // Update meta theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.content = isDark ? '#0f172a' : '#ffffff';
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme, isMounted, isDark]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const value = useMemo(() => ({
    theme,
    isDark,
    setTheme,
    toggleTheme
  }), [theme, isDark, toggleTheme]);

  // Prevent flash of wrong theme
  if (!isMounted) {
    return null;
  }

  return React.createElement(
    ThemeContext.Provider,
    { value },
    children
  );
};

// Custom hook to use the theme
const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export { useTheme, ThemeProvider };
