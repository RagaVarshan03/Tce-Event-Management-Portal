import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import API from '../services/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user, token } = useContext(AuthContext); // Access auth status
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // If no user/token, clear state and stop
        if (!user || !token) {
            setNotifications([]);
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        // Fetch existing notifications for the logged-in user
        const fetchNotifications = async () => {
            try {
                const res = await API.get('/notifications');
                setNotifications(res.data);
                console.log('[Socket] Fetched stored notifications:', res.data.length);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };
        fetchNotifications();

        // Determine Socket URL
        const socketURL = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace('/api', '')
            : 'http://localhost:4000';

        const newSocket = io(socketURL, {
            auth: { token } // Pass token to socket if backend uses it for auth
        });

        setSocket(newSocket);

        newSocket.on('newNotification', (notification) => {
            // Only add if intended for this user (Real-time filter)
            if (notification.recipient === user._id || !notification.recipient) {
                setNotifications(prev => [notification, ...prev]);
                console.log('[Socket] New Notification matched:', notification);
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [user, token]); // Re-run when user logs in/out

    const clearNotifications = async () => {
        try {
            await API.put('/notifications/mark-all-read');
            setNotifications([]);
        } catch (err) {
            console.error('Error clearing notifications:', err);
        }
    };

    const markAsRead = async (id) => {
        try {
            await API.put(`/notifications/${id}/read`);
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, isRead: true } : n)
            );
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    return (
        <SocketContext.Provider value={{ socket, notifications, clearNotifications, markAsRead }}>
            {children}
        </SocketContext.Provider>
    );
};
