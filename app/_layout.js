import { LanguageProvider } from '../utils/languageContext';
import { View, ActivityIndicator } from "react-native";
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router'; // Remove router import
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, useEffect, useState } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getToken } from "../utils/secureStore";
import useFetch from "@/utils/useFetch";
import { SocketProvider } from '@/utils/socketContext';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [trackChanges, setTrackChanges] = useState({ type: null });
  const { getRequest, data: user } = useFetch();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const prepare = async () => {
      try {
        const token = await getToken("userToken");
        const storedUserId = await getToken("userId");
        
        if (token) {
          setIsAuthenticated(true);
          if (storedUserId) { 
            setUserId(storedUserId);
          }
        } else {
          setIsAuthenticated(false);
          setUserId(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUserId(null);
      } finally {
        setLoading(false);
      }
    };

    prepare();
  }, []);

  useEffect(() => {
    if (loaded && !loading) {
      SplashScreen.hideAsync();
    }
  }, [loaded, loading]);

  useEffect(() => {
    if (userId) {
      getRequest(`/api/users/${userId}`);
    }
  }, [userId]);

  if (!loaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, userId, setUserId, trackChanges, setTrackChanges }}>
      <LanguageProvider>
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
      </LanguageProvider>
      <StatusBar backgroundColor='black' style="auto" />
    </AuthContext.Provider>
  );
}