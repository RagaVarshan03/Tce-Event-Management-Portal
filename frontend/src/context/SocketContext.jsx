import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import API from '../services/api';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Fetch existing notifications
        const fetchNotifications = async () => {
            try {
                const res = await API.get('/notifications');
                setNotifications(res.data);
            } catch (err) {
                console.error('Error fetching notifications:', err);
            }
        };
        fetchNotifications();

        // Determine Socket URL (Base URL without /api)
        const socketURL = import.meta.env.VITE_API_URL
            ? import.meta.env.VITE_API_URL.replace('/api', '')
            : 'http://localhost:4000';

        const newSocket = io(socketURL); // Connect to dynamic URL
        setSocket(newSocket);

        newSocket.on('newNotification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            console.log('[Socket] New Notification:', notification);
        });

        return () => newSocket.close();
    }, []);

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
