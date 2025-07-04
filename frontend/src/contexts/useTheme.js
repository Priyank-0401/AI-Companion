import React, { useState, useEffect, useCallback, useContext, createContext } from 'react';

const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const getInitialTheme = useCallback(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme;
      
      const systemPrefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      return systemPrefersDark ? 'dark' : 'light';
    }
    return 'light'; // Default to light theme
  }, []);

  const [theme, setTheme] = useState('light');
  const [isMounted, setIsMounted] = useState(false);

  // Set theme on initial load
  useEffect(() => {
    setTheme(getInitialTheme());
    setIsMounted(true);
  }, [getInitialTheme]);

  // Update the theme in localStorage and on the HTML element
  useEffect(() => {
    if (!isMounted) return;
    
    const root = window.document.documentElement;
    const isDark = theme === 'dark';
    
    // Remove all theme classes
    root.classList.remove('light', 'dark');
    
    // Add the current theme class
    root.classList.add(theme);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme, isMounted]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  // Apply theme class to html element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    root.setAttribute('data-theme', theme);
  }, [theme]);

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme, setTheme, toggleTheme } },
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

// Export both the hook and ThemeProvider as named exports
export { useTheme, ThemeProvider };
