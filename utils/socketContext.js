import { createContext, useContext, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { getToken } from './secureStore';
import { registerForPushNotificationsAsync,scheduleLocalNotification } from './notificationHelper';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { useLanguage } from './languageContext';
import { translations } from '../utils/languageContext';
const SocketContext = createContext(null);

export function SocketProvider({ children, isAuthenticated }) {
    const socketRef = useRef(null);
    const {language} = useLanguage();
    

    useEffect(() => {
      const connectSocket = async () => {
        if (isAuthenticated && !socketRef.current) {
          const token = await getToken("userToken");
          if (!token) {
            // console.error('No token available for socket connection');
            return;
          }
    
          // Use direct URL instead of environment variable
          const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL;
          // console.log('Attempting socket connection with:', {
          //   url: SOCKET_URL,
          //   token: token ? `${token.substring(0, 10)}...` : 'no token'
          // });
    
          try {
            socketRef.current = io(SOCKET_URL.trim(), {
              withCredentials: true,
              transports: ['websocket', 'polling'],
              path: '/socket.io',
              reconnectionAttempts: 5,
              reconnectionDelay: 1000,
              timeout: 20000,
              auth: { token, language },
              forceNew: true,
              reconnection: true,
              autoConnect: true
            });
    
            // Add connection event before other events
            socketRef.current.on('connect_error', (error) => {
              // console.error('Socket connection error details:', {
              //   error: error.message,
              //   transport: socketRef.current.io.engine.transport.name,
              //   readyState: socketRef.current.io.engine.readyState,
              //   protocol: socketRef.current.io.engine.protocol
              // });
            });
    
            socketRef.current.on('connect', () => {
              console.log("Socket connected");

              socketRef.current.on('notification', (notification) => {
                
                // Get current user ID
                const getCurrentUserId = async () => {
                  return await getToken('userId');
                };
                
                // Only process if it's for this user
                if (notification && notification.type === 'NEW_NOTIFICATION') {
                  getCurrentUserId().then(userId => {
                    if (userId && notification.user_id && Number(userId) === Number(notification.user_id)) {
                      const { title, message, translated_message, data = {} } = notification;
                      
                      // Schedule a local notification when in foreground
                      scheduleLocalNotification(
                        title || translations[language]?.notifications?.newNotification || "New Notification",
                        translated_message || message || translations[language]?.notifications?.newNotificationMessage || "You have a new notification",
                        data
                      );
                    }
                  });
                }
              });
            });

                socketRef.current.on('connect_error', (error) => {
                  // console.error('Detailed connection error:', {
                  //   message: error.message,
                  //   description: error.description,
                  //   context: error.context,
                  //   type: error.type
                  // });
                });

                socketRef.current.on('authenticated', (response) => {
                    // console.log('Socket authentication:', response);
                });

                socketRef.current.on('disconnect', (reason) => {
                    if (reason === 'io server disconnect') {
                        socketRef.current.connect();
                    }
                });

                socketRef.current.on('error', (error) => {
                  // console.error('Socket error:', error);
                });

                if (isAuthenticated) {
                  const pushToken = await registerForPushNotificationsAsync();
                  if (pushToken && socketRef.current) {
                    // Send token to server via socket
                    socketRef.current.emit('register_push_token', { 
                      token: pushToken, 
                      platform: Platform.OS,
                      deviceName: Device.deviceName || 'Unknown Device',
                      deviceYearClass: Device.deviceYearClass || 'Unknown',
                      isDevice: Device.isDevice
                    });
                  }
                }
              } catch (error) {
                // console.error('Socket initialization error:', error);
              }
          }
      };

      connectSocket();

      return () => {
          if (socketRef.current) {
              socketRef.current.disconnect();
              socketRef.current = null;
          }
      };
  }, [isAuthenticated]);

    return (
        <SocketContext.Provider value={socketRef.current}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const socket = useContext(SocketContext);
    if (socket === undefined) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return socket;
}