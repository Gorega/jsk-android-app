// app/_layout.js
import React from 'react';
import { Stack } from 'expo-router';
import { LanguageProvider } from '@/utils/languageContext';
import { ThemeProvider } from '@/utils/themeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootLayout from '../RootLayout';

// This layout wraps all routes
export default function Layout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <RootLayout />
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}