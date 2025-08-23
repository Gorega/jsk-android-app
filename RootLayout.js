// RootLayout.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet,Platform } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/utils/languageContext';
import { getToken, deleteToken, getMasterAccountId, setMasterAccountId, addAccountToMaster, isDirectLogin } from '@/utils/secureStore';
import useFetch from '@/utils/useFetch';
import { SocketProvider } from '@/utils/socketContext';
import { RTLWrapper } from './utils/RTLWrapper';
import { initializeNotifications } from './utils/notificationHelper';
import { useTheme } from './utils/themeContext';
import { Colors } from './constants/Colors';
import { handleAppUpdates } from './utils/updateChecker';
import { ReferenceModalProvider } from './contexts/ReferenceModalContext';
import GlobalReferenceModal from './components/GlobalReferenceModal';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Component to handle theme-aware navigation
function AppNavigationStack({ isAuthenticated, colors }) {
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
  const { language, setLanguage } = useLanguage();
  const notificationListenerRef = useRef(null);
  
  // Add state for RTL initialization
  const [rtlInitialized, setRtlInitialized] = useState(false);
  
  // Add state for update check
  const [updateCheckComplete, setUpdateCheckComplete] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  
  // Use theme from context - moved up here to ensure consistent hook order
  const { isDark, colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'ios' ? Math.max(insets.bottom - 30, 0) : insets.bottom;
  
  // Initialize RTL on component mount - using the simplified flag
  useEffect(() => {
    setRtlInitialized(true);
  }, []);


  // Check for updates before initializing the app
  useEffect(() => {
    async function checkForUpdates() {
      try {
        // Get saved language for localized update messages
        const savedLanguage = await getToken('language') || 'ar';
        
        // Add timeout to ensure we don't get stuck
        const updateCheckPromise = handleAppUpdates(savedLanguage);
        const timeoutPromise = new Promise(resolve => {
          // Timeout after 10 seconds
          setTimeout(() => {
            resolve(true);
          }, 10000);
        });
        
        // Use Promise.race to either get the update check result or timeout
        const shouldContinue = await Promise.race([updateCheckPromise, timeoutPromise]);
        
        // Set states based on update check result
        setUpdateCheckComplete(true);
        setCanContinue(shouldContinue);
      } catch (error) {
        // In case of error, allow the app to continue
        setUpdateCheckComplete(true);
        setCanContinue(true);
      }
    }
    
    checkForUpdates();
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
    // Don't initialize the app if update is required
    if (!canContinue && updateCheckComplete) {
      return;
    }
    
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
    
    if (updateCheckComplete && canContinue) {
      prepare();
    }
  }, [setLanguage, updateCheckComplete, canContinue]);

  // Hide splash when ready
  useEffect(() => {
    if (appReady && fontsLoaded && updateCheckComplete && canContinue) {
      SplashScreen.hideAsync().catch(err => {
      });
    } else {
    }
  }, [appReady, fontsLoaded, updateCheckComplete, canContinue]);

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

  // Keep splash screen visible if update check is not complete or update is required
  if (!updateCheckComplete || !canContinue || !appReady || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <RTLWrapper>
      <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, userId, setUserId }}>
        <SocketProvider isAuthenticated={isAuthenticated}>
          <ReferenceModalProvider>
            <SafeAreaView 
              style={{ flex: 1, backgroundColor: colors.background,paddingBottom: bottomPadding }}
              edges={['right', 'left']} // Handle top, left, and right edges
            >
              <StatusBar style={colors.statusBarStyle} />
              <AppNavigationStack isAuthenticated={isAuthenticated} colors={colors} />
              <GlobalReferenceModal />
            </SafeAreaView>
          </ReferenceModalProvider>
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