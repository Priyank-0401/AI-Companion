import React, { useState, useEffect, useCallback, useContext, createContext, useMemo } from 'react';
import { gsap } from 'gsap';

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

  const toggleTheme = useCallback((buttonElement) => {
    try {
      if (typeof window === 'undefined' || !document?.documentElement) {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
        return;
      }

      const root = document.documentElement;
      const body = document.body;

      // Get button coordinates for circular expansion
      let x = window.innerWidth / 2; // fallback to center
      let y = window.innerHeight / 2;
      
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }

      // Calculate the maximum distance from button to any corner
      const maxDistance = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // Create or get the expanding circle element
      let circle = document.getElementById('theme-transition-circle');
      if (!circle) {
        circle = document.createElement('div');
        circle.id = 'theme-transition-circle';
        circle.style.cssText = `
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 2147483647;
          transform-origin: center;
        `;
        body.appendChild(circle);
      }

      // Set initial position and size
      const circleSize = maxDistance * 2.5; // Extra size to ensure full coverage
      circle.style.width = `${circleSize}px`;
      circle.style.height = `${circleSize}px`;
      circle.style.left = `${x - circleSize / 2}px`;
      circle.style.top = `${y - circleSize / 2}px`;
      
      // Set the circle color to the new theme's background
      const newTheme = theme === 'light' ? 'dark' : 'light';
      const newBg = newTheme === 'dark' ? '#0f172a' : '#ffffff';
      circle.style.backgroundColor = newBg;

      // Disable all transitions during the switch
      root.classList.add('theme-switching');

      // Start with invisible circle
      gsap.set(circle, { scale: 0, opacity: 1 });

      // Create GSAP timeline for smooth animation
      const tl = gsap.timeline({
        onComplete: () => {
          // Clean up
          root.classList.remove('theme-switching');
          if (circle.parentNode) {
            circle.parentNode.removeChild(circle);
          }
        }
      });

      // Animate circle expansion
      tl.to(circle, {
        scale: 1,
        duration: 0.6,
        ease: "power2.out"
      })
      // Change theme halfway through animation
      .call(() => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
      }, [], 0.3)
      // Fade out circle to reveal new theme
      .to(circle, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.inOut"
      }, 0.4);

    } catch (e) {
      // Fallback if anything goes wrong
      setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    }
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    isDark,
    setTheme,
    toggleTheme
  }), [theme, isDark, toggleTheme]);

  // Always render the provider with the current theme
  // The theme will be applied to the DOM once mounted
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
