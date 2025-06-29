/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

/**
 * Modern colors for light and dark mode
 */

export const Colors = {
  light: {
    // Main colors
    primary: '#4361EE',
    secondary: '#3A0CA3',
    accent: '#4CC9F0',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // UI colors
    background: '#FFFFFF',
    card: '#FFFFFF',
    surface: '#F8FAFC',
    border: '#E2E8F0',
    divider: '#E2E8F0',
    
    // Text colors
    text: '#1E293B',
    textSecondary: '#64748B',
    textTertiary: '#94A3B8',
    textInverse: '#FFFFFF',
    
    // Status colors
    statusBarStyle: 'dark',
    statusBarBg: '#FFFFFF',
    
    // Gradients
    gradientStart: '#4361EE',
    gradientEnd: '#3A0CA3',
    
    // Component specific
    cardShadow: 'rgba(0, 0, 0, 0.1)',
    headerBg: '#FFFFFF',
    headerBorder: 'rgba(0, 0, 0, 0.05)',
    modalBg: '#FFFFFF',
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    inputBg: '#F8FAFC',
    inputBorder: '#E2E8F0',
    inputText: '#1E293B',
    buttonPrimary: '#4361EE',
    buttonSecondary: '#E2E8F0',
    buttonText: '#FFFFFF',
    iconDefault: '#64748B',
    iconSelected: '#4361EE',
  },
  dark: {
    // Main colors - softened for eye comfort
    primary: '#6C8EFF', // Softer blue that's less harsh
    secondary: '#8B71E9', // Softer purple
    accent: '#59D2FF', // Slightly muted accent
    success: '#34D399', // Brighter, easier to see success color
    warning: '#FBBF24', // Warmer, less harsh warning
    error: '#F87171', // Softer red for errors
    info: '#60A5FA', // Calmer info blue
    
    // UI colors - warmer dark tones
    background: '#1A1A1A', // Slightly warmer than pure black
    card: '#242424', // Slightly lighter for cards
    surface: '#2C2C2C', // Slightly warmer surface
    border: '#404040', // Softer border
    divider: '#3A3A3A', // Subtle divider
    
    // Text colors - improved contrast but not too harsh
    text: '#E2E8F0', // Slightly off-white for better eye comfort
    textSecondary: '#B0B7C3', // Warmer secondary text
    textTertiary: '#8891A0', // Improved tertiary text visibility
    textInverse: '#1A1A1A', // Dark text on light backgrounds
    
    // Status colors
    statusBarStyle: 'light',
    statusBarBg: '#1A1A1A',
    
    // Gradients - softer, more elegant
    gradientStart: '#6C8EFF', // Matching primary color
    gradientEnd: '#7E8FFF', // Softer gradient end
    
    // Component specific
    cardShadow: 'rgba(0, 0, 0, 0.4)',
    headerBg: '#242424',
    headerBorder: 'rgba(255, 255, 255, 0.03)', // Less visible border
    modalBg: '#242424',
    tabBarBg: '#242424',
    tabBarBorder: '#404040',
    inputBg: '#333333', // Slightly lighter for better visibility
    inputBorder: '#404040',
    inputText: '#E2E8F0',
    buttonPrimary: '#6C8EFF', // Match primary
    buttonSecondary: '#404040', // Lighter secondary for better contrast
    buttonText: '#FFFFFF',
    iconDefault: '#B0B7C3', // Brighter icons for visibility
    iconSelected: '#59D2FF', // Match accent
  },
};
