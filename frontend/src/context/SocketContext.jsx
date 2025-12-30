import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Force refresh - pointing to backend port 4000
        const newSocket = io('http://localhost:4000'); // Use port 4000 to match backend
        setSocket(newSocket);

        newSocket.on('newNotification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            // You can also trigger a toast here if you have a toast library
            console.log('[Socket] New Notification:', notification);
        });

        return () => newSocket.close();
    }, []);

    const clearNotifications = () => setNotifications([]);

    return (
        <SocketContext.Provider value={{ socket, notifications, clearNotifications }}>
            {children}
        </SocketContext.Provider>
    );
};
