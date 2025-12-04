import React, { useState, useEffect, useContext } from 'react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../pages/Dashboard.css';

const CoordinatorHome = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [newEvent, setNewEvent] = useState({
        eventName: '',
        description: '',
        date: '',
        venue: ''
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const res = await API.get('/events/coordinator-events');
            setEvents(res.data);
        } catch (err) {
            console.error('Error fetching events:', err);
        }
    };

    const handleChange = (e) => {
        setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await API.post('/events/create', newEvent);
            alert('Event created! It will be visible to students after admin approval.');
            setNewEvent({ eventName: '', description: '', date: '', venue: '' });
            fetchEvents();
        } catch (err) {
            console.error('Error creating event:', err);
            alert('Failed to create event');
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: '#ffc107', text: 'Pending Approval' },
            approved: { color: '#28a745', text: 'Approved' },
            rejected: { color: '#dc3545', text: 'Rejected' }
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
            <span style={{
                background: config.color,
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '600'
            }}>
                {config.text}
            </span>
        );
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-content">
                <div className="card">
                    <h3>Create New Event</h3>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                        ℹ️ Events will be submitted for admin approval before being visible to students
                    </p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Event Name</label>
                            <input type="text" name="eventName" value={newEvent.eventName} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea name="description" value={newEvent.description} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Date</label>
                            <input type="date" name="date" value={newEvent.date} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Venue</label>
                            <input type="text" name="venue" value={newEvent.venue} onChange={handleChange} required />
                        </div>
                        <button type="submit" className="action-btn">Create Event</button>
                    </form>
                </div>

                <div className="card">
                    <h3>My Created Events</h3>
                    {events.length === 0 ? (
                        <p>No events created yet.</p>
                    ) : (
                        <ul className="list-group">
                            {events.map(event => (
                                <li key={event._id} className="list-item">
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                            <h4 style={{ margin: 0 }}>{event.eventName}</h4>
                                            {getStatusBadge(event.status)}
                                        </div>
                                        <p style={{ margin: '5px 0', color: '#666' }}>{event.description}</p>
                                        <small style={{ color: '#999' }}>
                                            📅 {new Date(event.date).toDateString()} | 📍 {event.venue}
                                        </small>
                                        {event.status === 'rejected' && event.rejectionReason && (
                                            <div style={{
                                                marginTop: '10px',
                                                padding: '10px',
                                                background: '#f8d7da',
                                                borderLeft: '3px solid #dc3545',
                                                borderRadius: '4px'
                                            }}>
                                                <strong style={{ color: '#721c24' }}>Rejection Reason:</strong>
                                                <p style={{ margin: '5px 0 0 0', color: '#721c24' }}>{event.rejectionReason}</p>
                                            </div>
                                        )}
                                    </div>
                                    {event.status === 'approved' && (
                                        <span className="badge">{event.participants?.length || 0} Participants</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoordinatorHome;
