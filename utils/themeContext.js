import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { saveToken, getToken } from './secureStore';
import { ActivityIndicator } from 'react-native';

// Create the theme context
const ThemeContext = createContext();

// Theme options
export const ThemeModes = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system' // Follow system preference
};

export function ThemeProvider({ children }) {
  const deviceColorScheme = useDeviceColorScheme(); // Get system preference
  const [theme, setThemeState] = useState(ThemeModes.SYSTEM); // Default to system
  const [loading, setLoading] = useState(true);
  
  // Get the effective theme (resolves system preference to either light or dark)
  const effectiveTheme = theme === ThemeModes.SYSTEM 
    ? deviceColorScheme || ThemeModes.LIGHT 
    : theme;

  // Theme setter that saves to secure storage
  const setTheme = async (newTheme) => {
    await saveToken('theme', newTheme);
    setThemeState(newTheme);
  };

  // Initialize on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get saved theme preference
        const savedTheme = await getToken('theme');
        if (savedTheme) {
          setThemeState(savedTheme);
        }
      } catch (error) {
        // If error, default to system
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);

  // Show loading indicator while initializing theme
  if (loading) {
    return <ActivityIndicator size="large" color="#4361EE" style={{ flex: 1 }} />;
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, // Current theme preference (light, dark, system)
      setTheme, // Function to change theme
      colorScheme: effectiveTheme, // Resolved to either light or dark
      isDark: effectiveTheme === ThemeModes.DARK // Helper for conditional styling
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}