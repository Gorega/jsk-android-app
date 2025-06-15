// utils/themeContext.js
import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { getToken, saveToken } from './secureStore';

// Create the theme context
const ThemeContext = createContext();

// Define the theme colors
export const themes = {
  light: {
    // Base colors
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    
    // Text colors
    text: '#1E293B',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    
    // UI elements
    border: '#E2E8F0',
    divider: '#E2E8F0',
    
    // Component specific
    card: '#FFFFFF',
    cardHeader: '#F8FAFC',
    
    // Icons and buttons
    primary: '#4361EE',
    primaryLight: '#EEF2FF',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    success: '#10B981',
    warning: '#F59E0B',
    
    // Status bar
    statusBar: 'dark',
    
    // Modal
    modalBackground: '#FFFFFF',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    
    // Toggle
    toggleTrack: '#D1D5DB',
    toggleTrackActive: '#93C5FD',
    toggleThumb: '#FFFFFF',
    toggleThumbActive: '#3B82F6',
  },
  dark: {
    // Base colors
    background: '#0F172A',
    surface: '#1E293B',
    surfaceVariant: '#334155',
    
    // Text colors
    text: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textTertiary: '#94A3B8',
    
    // UI elements
    border: '#334155',
    divider: '#334155',
    
    // Component specific
    card: '#1E293B',
    cardHeader: '#0F172A',
    
    // Icons and buttons
    primary: '#60A5FA',
    primaryLight: '#1E3A8A',
    danger: '#F87171',
    dangerLight: '#7F1D1D',
    success: '#34D399',
    warning: '#FBBF24',
    
    // Status bar
    statusBar: 'light',
    
    // Modal
    modalBackground: '#1E293B',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    
    // Toggle
    toggleTrack: '#475569',
    toggleTrackActive: '#2563EB',
    toggleThumb: '#F1F5F9',
    toggleThumbActive: '#DBEAFE',
  }
};

// Theme provider component
export function ThemeProvider({ children }) {
  // Get system color scheme
  const systemColorScheme = useColorScheme();
  
  // State for theme mode
  const [themeMode, setThemeMode] = useState('system');
  const [loading, setLoading] = useState(true);
  
  // Initialize on component mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Get saved theme mode
        const savedThemeMode = await getToken('themeMode') || 'system';
        setThemeMode(savedThemeMode);
      } catch (error) {
        console.error('Error initializing theme:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
  }, []);
  
  // Calculate the actual theme based on mode and system preference
  const actualTheme = themeMode === 'system' 
    ? (systemColorScheme || 'light')
    : themeMode;
  
  // Theme setter
  const setTheme = async (newThemeMode) => {
    await saveToken('themeMode', newThemeMode);
    setThemeMode(newThemeMode);
  };
  
  // Toggle theme
  const toggleTheme = async () => {
    const newThemeMode = actualTheme === 'dark' ? 'light' : 'dark';
    // If system theme is active, we need to set explicit mode
    await setTheme(newThemeMode);
  };
  
  // Context value
  const contextValue = {
    theme: themes[actualTheme],
    themeMode,
    setTheme,
    toggleTheme,
    isDark: actualTheme === 'dark',
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}