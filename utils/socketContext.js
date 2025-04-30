import { createContext, useContext, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { getToken } from './secureStore';

const SocketContext = createContext(null);

export function SocketProvider({ children, isAuthenticated }) {
    const socketRef = useRef(null);

    useEffect(() => {
      const connectSocket = async () => {
        if (isAuthenticated && !socketRef.current) {
          const token = await getToken("userToken");
          if (!token) {
            console.error('No token available for socket connection');
            return;
          }
    
          // Use direct URL instead of environment variable
          const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL;
          console.log('Attempting socket connection with:', {
            url: SOCKET_URL,
            token: token ? `${token.substring(0, 10)}...` : 'no token'
          });
    
          try {
            socketRef.current = io(SOCKET_URL.trim(), {
              withCredentials: true,
              transports: ['websocket', 'polling'],
              path: '/socket.io',
              reconnectionAttempts: 5,
              reconnectionDelay: 1000,
              timeout: 20000,
              auth: { token },
              forceNew: true,
              reconnection: true,
              autoConnect: true,
            });
    
            // Add connection event before other events
            socketRef.current.on('connect_error', (error) => {
              console.error('Socket connection error details:', {
                error: error.message,
                transport: socketRef.current.io.engine.transport.name,
                readyState: socketRef.current.io.engine.readyState,
                protocol: socketRef.current.io.engine.protocol
              });
            });
    
            socketRef.current.on('connect', () => {
              console.log('Socket successfully connected with ID:', socketRef.current.id);
            });

                socketRef.current.on('connect_error', (error) => {
                  console.error('Detailed connection error:', {
                    message: error.message,
                    description: error.description,
                    context: error.context,
                    type: error.type
                  });
                });

                socketRef.current.on('authenticated', (response) => {
                    console.log('Socket authentication:', response);
                });

                socketRef.current.on('disconnect', (reason) => {
                    console.log('Socket disconnected:', reason);
                    if (reason === 'io server disconnect') {
                        socketRef.current.connect();
                    }
                });

                socketRef.current.on('error', (error) => {
                  console.error('Socket error:', error);
                });
              } catch (error) {
                console.error('Socket initialization error:', error);
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