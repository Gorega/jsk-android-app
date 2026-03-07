import { createContext, useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { getToken } from './secureStore';
import { registerForPushNotificationsAsync, scheduleLocalNotification } from './notificationHelper';
import { Platform, AppState } from 'react-native';
import * as Device from 'expo-device';
import { useLanguage } from './languageContext';
import { translations } from '../utils/languageContext';
const SocketContext = createContext(null);

export { SocketContext };

export function SocketProvider({ children, isAuthenticated }) {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const { language } = useLanguage();
  const appStateRef = useRef(AppState.currentState);
  const reconnectTimeoutRef = useRef(null);


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
          // Get user ID for socket auth
          const userId = await getToken('userId');

          // Main socket for notifications - optimized for low-RAM devices
          socketRef.current = io(SOCKET_URL.trim(), {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            path: '/socket.io',
            reconnectionAttempts: 3, // Reduced for memory efficiency
            reconnectionDelay: 2000, // Increased delay to reduce memory pressure
            timeout: 15000, // Reduced timeout
            auth: {
              token,
              language,
              userId: userId || null
            },
            forceNew: true,
            reconnection: true,
            autoConnect: true,
            // Memory optimization settings
            upgrade: true,
            rememberUpgrade: false, // Don't remember upgrade to save memory
            maxHttpBufferSize: 1e6, // Limit buffer size to 1MB
          });

          // Chat socket for real-time messaging - optimized for low-RAM devices
          const chatSocket = io(`${SOCKET_URL.trim()}/chat`, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            path: '/socket.io',
            reconnectionAttempts: 3,
            reconnectionDelay: 2000,
            timeout: 15000,
            auth: {
              token,
              language,
              userId: userId || null
            },
            forceNew: true,
            reconnection: true,
            autoConnect: true,
            upgrade: true,
            rememberUpgrade: false,
            maxHttpBufferSize: 1e6,
          });

          // Store chat socket reference
          socketRef.current.chatSocket = chatSocket;
          setSocket(socketRef.current);

          // Add connection event before other events
          socketRef.current.on('connect_error', (error) => {
            // console.error('Socket connection error details:', {
            //   error: error.message,
            //   transport: socketRef.current.io.engine.transport.name,
            //   readyState: socketRef.current.io.engine.readyState,
            //   protocol: socketRef.current.io.engine.protocol
            // });
          });

          socketRef.current.on('connect', async () => {
            console.log("Socket connected");

            // Get current user ID once for efficiency
            const userId = await getToken('userId');

            if (userId) {
              // Join user-specific room for targeted notifications
              const userRoom = `user_${userId}`;
              socketRef.current.emit('join_room', { room: userRoom });
              console.log(`Joined room: ${userRoom}`);
            }

            // Handle all notification types
            socketRef.current.on('notification', (notification) => {
              if (!notification) return;

              // Validate the notification is for this user
              if (userId && notification.user_id && Number(userId) === Number(notification.user_id)) {
                // Handle different notification types
                switch (notification.type) {
                  case 'NEW_NOTIFICATION':
                    const { title, message, translated_message, data = {} } = notification;

                    // Schedule a local notification when in foreground
                    scheduleLocalNotification(
                      title || translations[language]?.notifications?.newNotification || "New Notification",
                      translated_message || message || translations[language]?.notifications?.newNotificationMessage || "You have a new notification",
                      {
                        ...data,
                        notificationId: notification.notification_id,
                        notificationType: notification.notificationType || 'system',
                        orderId: notification.order_id
                      }
                    );
                    break;

                  case 'NOTIFICATION_UPDATED':
                  case 'NOTIFICATION_DELETED':
                  case 'ALL_NOTIFICATIONS_DELETED':
                  case 'NOTIFICATIONS_RESET':
                    // These events are handled by the components that use the socket
                    break;
                }
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
                isDevice: Device.isDevice,
                userId: await getToken('userId') // Include userId for better tracking
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
      // Clear any pending reconnection timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (socketRef.current) {
        // Remove all listeners before disconnecting to prevent memory leaks
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();

        if (socketRef.current.chatSocket) {
          socketRef.current.chatSocket.removeAllListeners();
          socketRef.current.chatSocket.disconnect();
        }
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={socket}>
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
