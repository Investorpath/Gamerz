import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { BACKEND_URL } from '../config';

/**
 * Custom hook to manage a Socket.IO connection with Firebase authentication.
 * @returns {Socket|null} The socket instance or null if not yet initialized.
 */
export const useSocket = () => {
    const { token } = useAuth();
    const [socket, setSocket] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
            return;
        }

        // Initialize socket with token
        if (!socketRef.current) {
            const newSocket = io(BACKEND_URL, {
                auth: {
                    token
                },
                // Reconnect automatically
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            socketRef.current = newSocket;
            setSocket(newSocket);

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
                if (err.message === 'Authentication error: Invalid token') {
                    // Token might have expired, AuthContext should refresh it
                }
            });
        } else {
            // Update auth token if it changed
            socketRef.current.auth = { token };
            if (socketRef.current.connected) {
                // Some versions of Socket.io require a disconnect/connect to update auth 
                // but checking current.auth is usually enough for the next reconnect.
                // For immediate update:
                socketRef.current.disconnect().connect();
            }
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
        };
    }, [token]);

    return socket;
};
