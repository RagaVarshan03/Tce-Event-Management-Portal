import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import EventRegistrationModal from './EventRegistrationModal';
import '../pages/Dashboard.css';

const StudentHome = () => {
    const { user } = useContext(AuthContext);
    const [events, setEvents] = useState([]);
    const [myEvents, setMyEvents] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'my'
    const [showModal, setShowModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        fetchEvents();
        fetchMyEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await API.get('/events/all');
            setEvents(res.data);
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    };

    const fetchMyEvents = async () => {
        try {
            const res = await API.get('/events/my-events');
            setMyEvents(res.data);
        } catch (err) {
            console.error('Error fetching my events:', err);
        }
    };

    const openRegistrationModal = (event) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    const handleRegister = async (eventId, formData) => {
        try {
            await API.post(`/events/${eventId}/register`, formData);
            alert('Registered Successfully! Check your email for confirmation.');
            setShowModal(false);
            setSelectedEvent(null);
            fetchEvents();
            fetchMyEvents();
        } catch (err) {
            alert(err.response?.data?.message || 'Registration failed');
        }
    };

    const isRegistered = (eventId) => {
        return myEvents.some(e => e._id === eventId);
    };

    const isEventPast = (eventDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
        const eventDay = new Date(eventDate);
        eventDay.setHours(0, 0, 0, 0);
        return eventDay < today;
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-content">
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Events
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
                        onClick={() => setActiveTab('my')}
                    >
                        My Registrations
                    </button>
                </div>

                {activeTab === 'all' ? (
                    <div className="card-grid">
                        {events.map(event => {
                            const isPast = isEventPast(event.date);
                            const registered = isRegistered(event._id);

                            return (
                                <div key={event._id} className="event-card">
                                    <h3>{event.eventName}</h3>
                                    <p>{event.description}</p>
                                    <p><strong>Date:</strong> {new Date(event.date).toDateString()}</p>
                                    <p><strong>Venue:</strong> {event.venue}</p>
                                    <p><strong>Organizer:</strong> {event.organizer?.name}</p>
                                    {isPast ? (
                                        <button className="event-over-btn" disabled style={{
                                            background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)',
                                            color: 'white',
                                            cursor: 'not-allowed',
                                            opacity: 0.7
                                        }}>Event Over</button>
                                    ) : registered ? (
                                        <button className="registered-btn" disabled>Registered</button>
                                    ) : (
                                        <button onClick={() => openRegistrationModal(event)} className="register-btn">Register</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="card-grid">
                        {myEvents.length === 0 ? <p>No registrations yet.</p> : (
                            myEvents.map(event => (
                                <div key={event._id} className="event-card">
                                    <h3>{event.eventName}</h3>
                                    <p>{event.description}</p>
                                    <p><strong>Date:</strong> {new Date(event.date).toDateString()}</p>
                                    <p><strong>Venue:</strong> {event.venue}</p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {showModal && selectedEvent && (
                <EventRegistrationModal
                    event={selectedEvent}
                    user={user}
                    onClose={() => {
                        setShowModal(false);
                        setSelectedEvent(null);
                    }}
                    onRegister={handleRegister}
                />
            )}
        </div>
    );
};

export default StudentHome;
