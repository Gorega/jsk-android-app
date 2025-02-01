import {View,ActivityIndicator} from "react-native"
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext, useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { getToken, deleteToken } from "../utils/secureStore";


const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRoleId, setUserRoleId] = useState(null);
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    const prepare = async () => {
      try {
        const token = await getToken("userToken");
        const storedUserId = await getToken("userId");
        console.log("Retrieved token:", token);
        
        if (token) {
          console.log("User is authenticated");
          setIsAuthenticated(true);
          if (storedUserId) { 
            setUserRoleId(storedUserId);
          }
        } else {
          console.log("No token found");
          setIsAuthenticated(false);
          setUserRoleId(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setUserRoleId(null);
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

  if (!loaded || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated,userRoleId,setUserRoleId }}>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
          }}
        >
          {!isAuthenticated ? (
            <Stack.Screen
              name="(auth)"
              options={{
                gestureEnabled: false,
              }}
            />
          ) : (
            <Stack.Screen
              name="(tabs)"
              options={{
                gestureEnabled: false,
              }}
            />
          )}
          <Stack.Screen name="+not-found" options={{ presentation: 'modal' }} />
        </Stack>
        <StatusBar backgroundColor='black' style="auto" />
      </AuthContext.Provider>
  );
}