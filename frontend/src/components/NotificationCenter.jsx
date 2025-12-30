import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell } from 'lucide-react';
import './NotificationCenter.css';

const NotificationCenter = () => {
    const { notifications, clearNotifications } = useSocket();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="notification-center">
            <button className="notif-bell" onClick={() => setIsOpen(!isOpen)}>
                <Bell size={24} />
                {notifications.length > 0 && <span className="notif-badge">{notifications.length}</span>}
            </button>

            {isOpen && (
                <div className="notif-dropdown">
                    <div className="notif-header">
                        <h4>Notifications</h4>
                        <button onClick={clearNotifications}>Clear</button>
                    </div>
                    <div className="notif-body">
                        {notifications.length === 0 ? (
                            <p className="no-notif">No new notifications</p>
                        ) : (
                            notifications.map((notif, idx) => (
                                <div key={idx} className="notif-item">
                                    <div className="notif-msg">{notif.message}</div>
                                    <div className="notif-time">{new Date(notif.createdAt || notif.date).toLocaleString()}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
