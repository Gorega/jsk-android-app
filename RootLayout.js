// RootLayout.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, I18nManager, Platform, Alert } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useLanguage } from '@/utils/languageContext';
import { getToken } from '@/utils/secureStore';
import useFetch from '@/utils/useFetch';
import { SocketProvider } from '@/utils/socketContext';
import { RTLWrapper } from './utils/RTLWrapper';
import { LanguageProvider } from './utils/languageContext';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Simple RTL configuration function
const setupRTL = async () => {
  try {
    const savedLanguage = await getToken('language') || 'ar';
    const shouldBeRTL = savedLanguage === 'ar' || savedLanguage === 'he';
    
    // Force RTL direction based on language
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    
    return true;
  } catch (error) {
    console.error('Error setting up RTL:', error);
    return false;
  }
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [appReady, setAppReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const { getRequest, data: user } = useFetch();
  const { setLanguage } = useLanguage();   // ← here it works

  // Add state for RTL initialization
  const [rtlInitialized, setRtlInitialized] = useState(false);
  
  // Initialize RTL on component mount
  useEffect(() => {
    setupRTL().then(() => setRtlInitialized(true));
  }, []);

  // Bootstrap everything in one effect
  useEffect(() => {
    async function prepare() {
      try {
        // 1) Load saved language
        const savedLanguage = await getToken('language');
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }

        // 2) Auth setup
        const token = await getToken('userToken');
        const storedUserId = await getToken('userId');
        if (token) {
          setIsAuthenticated(true);
          if (storedUserId) setUserId(storedUserId);
        }

      } catch (err) {
        console.warn('RootLayout bootstrap error:', err);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, [setLanguage]);

  // Hide splash when ready
  useEffect(() => {
    if (appReady && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [appReady, fontsLoaded]);

  // Fetch user data
  useEffect(() => {
    if (userId) {
      getRequest(`/api/users/${userId}`);
    }
  }, [userId]);

  // Render loading state until RTL is initialized
  if (!rtlInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!appReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <LanguageProvider>
      <RTLWrapper style={styles.container}>
        <AuthContext.Provider
          value={{ isAuthenticated, setIsAuthenticated, user, userId, setUserId }}
        >
          <SocketProvider isAuthenticated={isAuthenticated}>
            <Stack
              screenOptions={{
                headerShown: false,
                gestureEnabled: false,
              }}
            >
              <Stack.Screen
                name={isAuthenticated ? "(tabs)" : "(auth)"}
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
            </Stack>
          </SocketProvider>
          <StatusBar backgroundColor="black" style="auto" />
        </AuthContext.Provider>
      </RTLWrapper>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  // Your existing styles...
});