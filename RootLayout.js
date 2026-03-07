// RootLayout.js
import React, { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Platform, AppState, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';
import { useLanguage, translations } from '@/utils/languageContext';
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
import memoryManager, { addMemoryWarningListener, forceGarbageCollection } from './utils/memoryManager';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);
export { AuthContext };

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
  const [isOnline, setIsOnline] = useState(null);
  const [retryNonce, setRetryNonce] = useState(0);
  const { getRequest, data: user } = useFetch();
  const { language, setLanguage } = useLanguage();
  const notificationListenerRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Add state for RTL initialization
  const [rtlInitialized, setRtlInitialized] = useState(false);

  // Add state for update check
  const [updateCheckComplete, setUpdateCheckComplete] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [initialLaunchComplete, setInitialLaunchComplete] = useState(false);

  // Use theme from context - moved up here to ensure consistent hook order
  const { isDark, colorScheme } = useTheme();
  const colors = useMemo(() => Colors[colorScheme], [colorScheme]);

  const insets = useSafeAreaInsets();
  const bottomPadding = useMemo(() =>
    Platform.OS === 'ios' ? Math.max(insets.bottom - 30, 0) : insets.bottom,
    [insets.bottom]
  );

  const computeOnline = useCallback((netInfoState) => {
    if (!netInfoState) return false;
    const connected = netInfoState.isConnected === true;
    const reachable = netInfoState.isInternetReachable;
    if (reachable === null || reachable === undefined) {
      return connected;
    }
    return connected && reachable === true;
  }, []);

  // Initialize RTL on component mount - using the simplified flag
  useEffect(() => {
    setRtlInitialized(true);
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(computeOnline(state));
    });
    return () => unsubscribe();
  }, [computeOnline]);

  useEffect(() => {
    if (isOnline === false && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [isOnline, fontsLoaded]);

  const handleRetryConnectivity = useCallback(async () => {
    const state = await NetInfo.fetch();
    const online = computeOnline(state);
    setIsOnline(online);
    if (!online) return;
    setAppReady(false);
    setUpdateCheckComplete(false);
    setCanContinue(false);
    setRetryNonce((v) => v + 1);
  }, [computeOnline]);

  // Handle app state changes for memory optimization
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground - minimal operations only
        console.log('App has come to the foreground');
      } else if (nextAppState.match(/inactive|background/)) {
        // App is going to background - cleanup non-essential operations
        console.log('App is going to background');
        // Force garbage collection on low memory devices when going to background
        if (memoryManager.isLowMemoryDevice) {
          setTimeout(() => forceGarbageCollection(), 1000);
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  // Setup memory warning listener
  useEffect(() => {
    const removeMemoryWarningListener = addMemoryWarningListener(() => {
      console.warn('Memory warning - cleaning up resources');
      // Force garbage collection
      forceGarbageCollection();
      // You can add more cleanup logic here
    });

    return removeMemoryWarningListener;
  }, []);


  // Check for updates before initializing the app
  useEffect(() => {
    if (isOnline === false) {
      setUpdateCheckComplete(true);
      setCanContinue(true);
      return;
    }
    if (isOnline !== true) {
      return;
    }

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
  }, [isOnline, retryNonce]);

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
    if (isOnline !== true) {
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

        const hasValidToken = token && token !== "undefined" && token !== "null";
        const hasValidUserId = storedUserId && storedUserId !== "undefined" && storedUserId !== "null";

        if (hasValidToken && hasValidUserId) {
          // Verify token with the server
          try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/users/${storedUserId}`, {
              method: "GET",
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Accept-Language': savedLanguage || 'ar',
                Authorization: `Bearer ${token}`
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
            } else if (response.status === 401 || response.status === 403) {
              // Token is invalid or expired
              await deleteToken('userToken');
              await deleteToken('userId');
              setIsAuthenticated(false);
            } else {
              setIsAuthenticated(true);
              setUserId(storedUserId);
            }
          } catch (error) {
            console.warn('Token verification failed:', error?.message ?? String(error));
            setIsAuthenticated(true);
            setUserId(storedUserId);
          }
        }
      } catch (err) {
        console.warn('RootLayout bootstrap error:', err?.message ?? String(err));
      } finally {
        setAppReady(true);
      }
    }

    if (updateCheckComplete && canContinue) {
      prepare();
    }
  }, [setLanguage, updateCheckComplete, canContinue, isOnline, retryNonce]);

  // Hide splash when ready
  useEffect(() => {
    if (appReady && fontsLoaded && updateCheckComplete && canContinue) {
      SplashScreen.hideAsync().catch(err => {
      });
    } else {
    }
  }, [appReady, fontsLoaded, updateCheckComplete, canContinue]);

  useEffect(() => {
    if (initialLaunchComplete) return;
    if (appReady && fontsLoaded && updateCheckComplete && canContinue) {
      setInitialLaunchComplete(true);
    }
  }, [initialLaunchComplete, appReady, fontsLoaded, updateCheckComplete, canContinue]);

  // Fetch user data
  useEffect(() => {
    if (!userId) return;
    getRequest(`/api/users/${userId}`, language);
  }, [userId, language]);


  // Render loading state until RTL is initialized
  if (!rtlInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (isOnline === false && !initialLaunchComplete) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RTLWrapper>
          <SafeAreaView
            style={[styles.offlineContainer, { backgroundColor: colors.background }]}
            edges={['top', 'bottom', 'left', 'right']}
          >
            <View style={styles.offlineInner}>
              <Text style={[styles.offlineTitle, { color: colors.text }]}>
                {translations[language]?.errors?.noInternetConnection || 'No Internet Connection'}
              </Text>
              <Text style={[styles.offlineSubtitle, { color: colors.textSecondary }]}>
                {translations[language]?.errors?.networkRequestFailed || translations[language]?.errors?.requestTimedOut || 'Please check your connection and try again.'}
              </Text>
              <TouchableOpacity
                style={[styles.offlineButton, { backgroundColor: colors.primary }]}
                onPress={handleRetryConnectivity}
                activeOpacity={0.8}
              >
                <Text style={styles.offlineButtonText}>
                  {translations[language]?.common?.retry || 'Retry'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </RTLWrapper>
      </GestureHandlerRootView>
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RTLWrapper>
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, userId, setUserId }}>
          <SocketProvider isAuthenticated={isAuthenticated}>
            <ReferenceModalProvider>
              <SafeAreaView
                style={{ flex: 1, backgroundColor: colors.background, paddingBottom: bottomPadding }}
                edges={['right', 'left']} // Handle top, left, and right edges
              >
                {isOnline === false && initialLaunchComplete ? (
                  <View style={[styles.offlineBanner, { backgroundColor: colors.warning, paddingTop: insets.top }]}>
                    <Text style={[styles.offlineBannerText, { color: colors.textInverse }]}>
                      {translations[language]?.errors?.noInternetConnection || 'No Internet Connection'}
                    </Text>
                  </View>
                ) : null}
                <StatusBar style={colors.statusBarStyle} />
                <AppNavigationStack isAuthenticated={isAuthenticated} colors={colors} />
                <GlobalReferenceModal />
              </SafeAreaView>
            </ReferenceModalProvider>
          </SocketProvider>
        </AuthContext.Provider>
      </RTLWrapper>
    </GestureHandlerRootView>
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
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  offlineInner: {
    gap: 12,
    alignItems: 'center',
  },
  offlineTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  offlineSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  offlineButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  offlineButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  offlineBanner: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  offlineBannerText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Your existing styles...
});
