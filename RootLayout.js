// RootLayout.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useLanguage } from '@/utils/languageContext';
import { getToken } from '@/utils/secureStore';
import useFetch from '@/utils/useFetch';
import { SocketProvider } from '@/utils/socketContext';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [appReady, setAppReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const { getRequest, data: user } = useFetch();
  const { setLanguage } = useLanguage();   // ← here it works

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

  if (!appReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
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
  );
}
