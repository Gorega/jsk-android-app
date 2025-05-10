// App.js
import React from 'react';
import { LanguageProvider } from '@/utils/languageContext';
import RootLayout from '../RootLayout';

export default function App() {
  return (
    <LanguageProvider>
      <RootLayout />
    </LanguageProvider>
  );
}
