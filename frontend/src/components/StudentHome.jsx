import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import EventRegistrationModal from './EventRegistrationModal';
import FeedbackModal from './FeedbackModal';
import { useSocket } from '../context/SocketContext';
import '../pages/Dashboard.css';

const StudentHome = () => {
    const { user } = useContext(AuthContext);
    const { socket, notifications } = useSocket();
    const [events, setEvents] = useState([]);
    const [registeredEvents, setRegisteredEvents] = useState([]);
    const [waitlistedEvents, setWaitlistedEvents] = useState([]);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'my'
    const [showModal, setShowModal] = useState(false);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        fetchEvents();
        fetchMyEvents();
    }, []);

    useEffect(() => {
        if (!socket) return;

        // Listen for seat updates
        socket.on('seatUpdate', (data) => {
            setEvents(prevEvents => prevEvents.map(event =>
                event._id === data.eventId
                    ? { ...event, participants: new Array(data.participantsCount), waitlist: new Array(data.waitlistCount) }
                    : event
            ));
        });

        // Optionally join rooms for all visible events
        events.forEach(event => {
            socket.emit('joinEvent', event._id);
        });

        return () => {
            socket.off('seatUpdate');
            events.forEach(event => {
                socket.emit('leaveEvent', event._id);
            });
        };
    }, [socket, events.length]);

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
            if (res.data.registered) {
                setRegisteredEvents(res.data.registered);
                setWaitlistedEvents(res.data.waitlisted);
            } else {
                // Fallback for old API response (if cached or something)
                setRegisteredEvents(res.data);
                setWaitlistedEvents([]);
            }
        } catch (err) {
            console.error('Error fetching my events:', err);
        }
    };

    const openRegistrationModal = (event) => {
        setSelectedEvent(event);
        setShowModal(true);
    };

    const openFeedbackModal = (event) => {
        setSelectedEvent(event);
        setShowFeedbackModal(true);
    };

    const handleRegister = async (eventId, formData) => {
        try {
            const res = await API.post(`/events/${eventId}/register`, formData);
            alert(res.data.message || 'Registered Successfully!');
            setShowModal(false);
            setSelectedEvent(null);
            fetchEvents();
            fetchMyEvents();
        } catch (err) {
            alert(err.response?.data?.message || 'Registration failed');
        }
    };

    const handleUnregister = async (eventId, isWaitlist = false) => {
        if (!window.confirm(`Are you sure you want to ${isWaitlist ? 'leave the waitlist' : 'unregister'}?`)) return;

        try {
            await API.post(`/events/${eventId}/unregister`);
            alert(isWaitlist ? 'Left waitlist successfully' : 'Unregistered successfully');
            fetchEvents();
            fetchMyEvents();
        } catch (err) {
            alert(err.response?.data?.message || 'Action failed');
        }
    };

    const isRegistered = (eventId) => {
        return registeredEvents.some(e => e._id === eventId);
    };

    const isWaitlisted = (eventId) => {
        return waitlistedEvents.some(e => e._id === eventId);
    };

    const isEventFull = (event) => {
        if (!event.maxParticipants) return false;
        return event.participants && event.participants.length >= event.maxParticipants;
    };

    const isEventPast = (eventDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
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
                        My Events
                    </button>
                </div>

                {activeTab === 'all' ? (
                    <div className="card-grid">
                        {events.map(event => {
                            const isPast = isEventPast(event.date);
                            const registered = isRegistered(event._id);
                            const waitlisted = isWaitlisted(event._id);
                            const full = isEventFull(event);

                            return (
                                <div key={event._id} className="event-card">
                                    <h3>{event.eventName}</h3>
                                    <p>{event.description}</p>
                                    <p><strong>Date:</strong> {new Date(event.date).toDateString()}</p>
                                    <p><strong>Venue:</strong> {event.venue}</p>
                                    <p><strong>Organizer:</strong> {event.organizer?.name}</p>

                                    {event.maxParticipants && (
                                        <p className="spots-info">
                                            Spots: {event.participants?.length || 0} / {event.maxParticipants}
                                        </p>
                                    )}

                                    {isPast ? (
                                        <button className="event-over-btn" disabled style={{
                                            background: '#6c757d', color: 'white', cursor: 'not-allowed', opacity: 0.7
                                        }}>Event Over</button>
                                    ) : registered ? (
                                        <button className="registered-btn" disabled>Registered</button>
                                    ) : waitlisted ? (
                                        <button className="waitlist-btn" disabled style={{ background: '#ffc107', color: 'black' }}>On Waitlist</button>
                                    ) : full ? (
                                        <button onClick={() => openRegistrationModal(event)} className="waitlist-join-btn" style={{ background: '#ffc107', color: 'black', border: '1px solid #e0a800' }}>
                                            Join Waitlist
                                        </button>
                                    ) : (
                                        <button onClick={() => openRegistrationModal(event)} className="register-btn">Register</button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="my-events-section">
                        <h3>Registered Events</h3>
                        <div className="card-grid">
                            {registeredEvents.length === 0 ? <p>No registered events.</p> : (
                                registeredEvents.map(event => {
                                    const isPast = isEventPast(event.date);
                                    return (
                                        <div key={event._id} className="event-card">
                                            <h3>{event.eventName}</h3>
                                            <p><strong>Date:</strong> {new Date(event.date).toDateString()}</p>
                                            <p><strong>Venue:</strong> {event.venue}</p>
                                            {isPast ? (
                                                <button onClick={() => openFeedbackModal(event)} className="feedback-btn" style={{ marginTop: '10px', background: '#17a2b8', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                                    Give Feedback
                                                </button>
                                            ) : (
                                                <button onClick={() => handleUnregister(event._id)} className="unregister-btn" style={{ marginTop: '10px', background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                                                    Unregister
                                                </button>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {waitlistedEvents.length > 0 && (
                            <>
                                <h3 style={{ marginTop: '30px' }}>Waitlisted Events</h3>
                                <div className="card-grid">
                                    {waitlistedEvents.map(event => (
                                        <div key={event._id} className="event-card">
                                            <h3>{event.eventName}</h3>
                                            <p><strong>Date:</strong> {new Date(event.date).toDateString()}</p>
                                            <p><strong>Venue:</strong> {event.venue}</p>
                                            <div className="status-badge" style={{ background: '#ffc107', color: 'black', padding: '5px', borderRadius: '4px', textAlign: 'center', margin: '10px 0' }}>
                                                On Waitlist
                                            </div>
                                            <button onClick={() => handleUnregister(event._id, true)} className="leave-waitlist-btn" style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
                                                Leave Waitlist
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
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

            {showFeedbackModal && selectedEvent && (
                <FeedbackModal
                    event={selectedEvent}
                    onClose={() => {
                        setShowFeedbackModal(false);
                        setSelectedEvent(null);
                    }}
                    onSubmitSuccess={() => {
                        fetchMyEvents(); // Refresh data potentially
                    }}
                />
            )}
        </div>
    );
};

export default StudentHome;
