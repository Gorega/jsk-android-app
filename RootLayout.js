// RootLayout.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, I18nManager } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useLanguage } from '@/utils/languageContext';
import { getToken, deleteToken, getMasterAccountId, setMasterAccountId, addAccountToMaster, isDirectLogin } from '@/utils/secureStore';
import useFetch from '@/utils/useFetch';
import { SocketProvider } from '@/utils/socketContext';
import { RTLWrapper } from './utils/RTLWrapper';
import { LanguageProvider } from './utils/languageContext';
import { initializeNotifications } from './utils/notificationHelper';
import { ThemeProvider, useTheme } from './utils/themeContext';
import { Colors } from './constants/Colors';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();


// Component to handle theme-aware navigation
function NavigationContainer({ children, isAuthenticated }) {
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        // Set the background color for the stack based on theme
        contentStyle: { backgroundColor: colors.background },
        // Add animation configuration to prevent white flash
        animation: 'fade',
        // Ensure transitions maintain the background color
        presentation: 'card',
      }}
    >
      <Stack.Screen
        name={isAuthenticated ? "(tabs)" : "(auth)"}
        options={{ 
          gestureEnabled: false,
          contentStyle: { backgroundColor: colors.background }
        }}
      />
      <Stack.Screen 
        name="+not-found" 
        options={{ 
          presentation: 'modal',
          contentStyle: { backgroundColor: colors.background } 
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [appReady, setAppReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const { getRequest, data: user } = useFetch();
  const { setLanguage } = useLanguage();
  const notificationListenerRef = useRef(null);
  
  // Add state for RTL initialization
  const [rtlInitialized, setRtlInitialized] = useState(false);
  
  // Initialize RTL on component mount - using the simplified flag
  useEffect(() => {
    setRtlInitialized(true);
  }, []);

  useEffect(() => {
    // Initialize notifications and store the listener reference
    async function setupNotifications() {
      if (isAuthenticated) {
        notificationListenerRef.current = await initializeNotifications();
      }
    }
    
    setupNotifications();
    
    // Clean up notification listeners when component unmounts
    return () => {
      if (notificationListenerRef.current) {
        notificationListenerRef.current.remove();
      }
    };
  }, [isAuthenticated]);

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
        
        if (token && storedUserId) {
          // Verify token with the server
          try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${storedUserId}`, {
              method: "GET",
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Accept-Language': savedLanguage || 'ar'
              },
              credentials: "include"
            });
            
            if (response.ok) {
              // Token is valid
              setIsAuthenticated(true);
              setUserId(storedUserId);
              
              // Get user data
              const userData = await response.json();
              
              // Check if this is a direct login
              const directLogin = await isDirectLogin();
              
              if (directLogin) {
                // This is a direct login, set this user as the master account
                await setMasterAccountId(storedUserId);
              }
              
              // Get master account ID
              const masterId = await getMasterAccountId();
              
              // Update account in master's registry with latest data
              const lastLoginPhone = await getToken("lastLoginPhone");
              const lastLoginPassword = await getToken("lastLoginPassword");
              
              if (masterId) {
                await addAccountToMaster(masterId, {
                  userId: storedUserId,
                  name: userData.name || userData.username || "",
                  phone: lastLoginPhone || "",
                  role: userData.role || "user",
                  token: token,
                  lastLoginPhone: lastLoginPhone || "",
                  lastLoginPassword: lastLoginPassword || ""
                });
              }
            } else {
              // Token is invalid or expired
              await deleteToken('userToken');
              await deleteToken('userId');
              setIsAuthenticated(false);
            }
          } catch (error) {
            console.warn('Token verification failed:', error);
            setIsAuthenticated(false);
          }
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
    getRequest(`/api/users/${userId}`);
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
      <ThemeProvider>
        <ThemedApp 
          isAuthenticated={isAuthenticated} 
          setIsAuthenticated={setIsAuthenticated} 
          user={user} 
          userId={userId} 
          setUserId={setUserId} 
        />
      </ThemeProvider>
    </LanguageProvider>
  );
}

// Separate component to access theme context
function ThemedApp({ isAuthenticated, setIsAuthenticated, user, userId, setUserId }) {
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  
  return (
    <RTLWrapper style={[styles.container, { backgroundColor: colors.background }]}>
      <AuthContext.Provider
        value={{ isAuthenticated, setIsAuthenticated, user, userId, setUserId }}
      >
        <SocketProvider isAuthenticated={isAuthenticated}>
          <NavigationContainer isAuthenticated={isAuthenticated} />
          <StatusBar style={isDark ? "light" : "dark"} />
        </SocketProvider>
      </AuthContext.Provider>
    </RTLWrapper>
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