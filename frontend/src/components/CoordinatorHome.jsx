import React, { useState, useEffect, useContext } from 'react';
import { Calendar, Clock, MapPin, Users, Upload, Type, Image } from 'lucide-react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import AttendanceUploadModal from './AttendanceUploadModal';
import ProofPhotosUploadModal from './ProofPhotosUploadModal';
import EditEventModal from './EditEventModal';
import ViewFeedbackModal from './ViewFeedbackModal';
import '../pages/Dashboard.css';

const CoordinatorHome = () => {
    const { user } = useContext(AuthContext);
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [newEvent, setNewEvent] = useState({
        eventName: '',
        description: '',
        date: '',
        venue: '',
        clubName: ''
    });
    const [timeData, setTimeData] = useState({
        hour: '12',
        minute: '00',
        period: 'AM'
    });
    const [posterFile, setPosterFile] = useState(null);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showProofPhotosModal, setShowProofPhotosModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewFeedbackModal, setShowViewFeedbackModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('dashboardUpdate', (data) => {
            console.log('[Socket] Dashboard update received:', data);
            fetchEvents();
        });

        return () => socket.off('dashboardUpdate');
    }, [socket]);

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

    const handleTimeChange = (e) => {
        setTimeData({ ...timeData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setPosterFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('eventName', newEvent.eventName);
            formData.append('description', newEvent.description);

            // Combine Date and Time
            let hours = parseInt(timeData.hour);
            if (timeData.period === 'PM' && hours !== 12) hours += 12;
            if (timeData.period === 'AM' && hours === 12) hours = 0;

            const eventDateTime = new Date(newEvent.date);
            eventDateTime.setHours(hours, parseInt(timeData.minute));

            formData.append('date', eventDateTime.toISOString());
            formData.append('venue', newEvent.venue);
            if (newEvent.clubName) {
                formData.append('clubName', newEvent.clubName);
            }
            if (posterFile) {
                formData.append('poster', posterFile);
            }
            if (newEvent.maxParticipants) {
                formData.append('maxParticipants', newEvent.maxParticipants);
            }

            await API.post('/events/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            alert('Event created! It will be visible to students after admin approval.');
            setNewEvent({ eventName: '', description: '', date: '', venue: '', clubName: '' });
            setTimeData({ hour: '12', minute: '00', period: 'AM' });
            setPosterFile(null);
            // Reset file input
            const fileInput = document.querySelector('input[type="file"]');
            if (fileInput) fileInput.value = '';
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

    const isEventPast = (eventDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDay = new Date(eventDate);
        eventDay.setHours(0, 0, 0, 0);
        return eventDay < today;
    };

    const handleUploadAttendance = (event) => {
        setSelectedEvent(event);
        setShowAttendanceModal(true);
    };

    const handleUploadProofPhotos = (event) => {
        setSelectedEvent(event);
        setShowProofPhotosModal(true);
    };

    const handleEditEvent = (event) => {
        setSelectedEvent(event);
        setShowEditModal(true);
    };

    const handleDistributeCertificates = async (event) => {
        if (!window.confirm(`Are you sure you want to generate and email certificates to all ${event.participants?.length || 0} participants for "${event.eventName}"?`)) {
            return;
        }
        try {
            alert('Starting certificate distribution. This may take a moment...');
            const res = await API.post(`/events/${event._id}/distribute-certificates`);
            alert(res.data.message);
        } catch (err) {
            console.error('Error distributing certificates:', err);
            alert(err.response?.data?.message || 'Failed to distribute certificates');
        }
    };

    const handleRequestFeedback = async (event) => {
        if (!window.confirm(`Request feedback from all participants for "${event.eventName}"?`)) return;
        try {
            const res = await API.post(`/events/${event._id}/request-feedback`);
            alert(res.data.message);
            fetchEvents();
        } catch (err) {
            console.error('Error requesting feedback:', err);
            alert(err.response?.data?.message || 'Failed to request feedback');
        }
    };

    const handleUploadSuccess = () => {
        fetchEvents();
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-content">
                <div className="card">
                    <h3>Create New Event</h3>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                        Events will be submitted for admin approval before being visible to students
                    </p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>
                                <Type size={16} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#830000' }} />
                                Event Name
                            </label>
                            <input type="text" name="eventName" value={newEvent.eventName} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>
                                <Type size={16} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#830000' }} />
                                Description
                            </label>
                            <textarea name="description" value={newEvent.description} onChange={handleChange} required />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>
                                    <Calendar size={16} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#830000' }} />
                                    Date
                                </label>
                                <input type="date" name="date" value={newEvent.date} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>
                                    <Clock size={16} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#830000' }} />
                                    Time
                                </label>
                                <div className="time-inputs">
                                    <select
                                        name="hour"
                                        value={timeData.hour}
                                        onChange={handleTimeChange}
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                    <select
                                        name="minute"
                                        value={timeData.minute}
                                        onChange={handleTimeChange}
                                    >
                                        {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <select
                                        name="period"
                                        value={timeData.period}
                                        onChange={handleTimeChange}
                                    >
                                        <option value="AM">AM</option>
                                        <option value="PM">PM</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>
                                    <MapPin size={16} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#830000' }} />
                                    Venue
                                </label>
                                <input type="text" name="venue" value={newEvent.venue} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>
                                    <Users size={16} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#830000' }} />
                                    Club Name
                                </label>
                                <select name="clubName" value={newEvent.clubName} onChange={handleChange}>
                                    <option value="">Select a club</option>
                                    <option value="IEEE CIS">IEEE CIS</option>
                                    <option value="TECH EXPLORERS">TECH EXPLORERS</option>
                                    <option value="CSBSA">CSBSA</option>
                                    <option value="ASI">ASI</option>
                                    <option value="CODERS CLUB">CODERS CLUB</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>
                                <Users size={16} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#830000' }} />
                                Max Participants
                            </label>
                            <input
                                type="number"
                                name="maxParticipants"
                                value={newEvent.maxParticipants || ''}
                                onChange={handleChange}
                                placeholder="Leave empty for unlimited"
                                min="1"
                            />
                        </div>

                        <div className="form-group">
                            <label>
                                <Image size={16} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#830000' }} />
                                Event Poster
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                style={{ padding: '8px' }}
                            />
                            {posterFile && (
                                <small style={{ color: '#28a745', display: 'block', marginTop: '5px' }}>
                                    ✓ Selected: {posterFile.name}
                                </small>
                            )}
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
                                            {isEventPast(event.date) && event.status === 'approved' && (
                                                <span style={{
                                                    backgroundColor: '#6c757d',
                                                    color: 'white',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    Event Over
                                                </span>
                                            )}
                                            {getStatusBadge(event.status)}
                                        </div>
                                        <p style={{ margin: '5px 0', color: '#666' }}>{event.description}</p>
                                        <small style={{ color: '#999' }}>
                                            <small style={{ color: '#999' }}>
                                                📅 {new Date(event.date).toLocaleDateString()} | ⏰ {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | 📍 {event.venue}
                                            </small>
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
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                                        {event.status === 'approved' && (
                                            <span className="badge">
                                                {event.participants?.length || 0}
                                                {event.maxParticipants ? ` / ${event.maxParticipants}` : ''} Participants
                                            </span>
                                        )}
                                        {event.status === 'approved' && isEventPast(event.date) && (
                                            <>
                                                <button
                                                    onClick={() => handleRequestFeedback(event)}
                                                    disabled={event.feedbackEmailSent}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: event.feedbackEmailSent ? '#6c757d' : 'linear-gradient(135deg, #17a2b8 0%, #117a8b 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: event.feedbackEmailSent ? 'not-allowed' : 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    {event.feedbackEmailSent ? '✓ Feedback Requested' : '📢 Request Feedback'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedEvent(event);
                                                        setShowViewFeedbackModal(true);
                                                    }}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: 'linear-gradient(135deg, #6610f2 0%, #520dc2 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    💬 View Feedback ({event.feedback?.length || 0})
                                                </button>
                                                <button
                                                    onClick={() => handleUploadAttendance(event)}
                                                    style={{
                                                        padding: '8px 16px',
                                                        background: 'linear-gradient(135deg, #830000 0%, #a00000 100%)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    {event.attendanceSheet ? '📝 Update Attendance' : '📤 Upload Attendance'}
                                                </button>
                                            </>
                                        )}
                                        {event.status === 'approved' && isEventPast(event.date) && (
                                            <button
                                                onClick={() => handleUploadProofPhotos(event)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'linear-gradient(135deg, #28a745 0%, #34ce57 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                {event.proofPhotos?.length > 0
                                                    ? `📸 Manage Photos (${event.proofPhotos.length}/5)`
                                                    : '📸 Upload Photos (0/5)'}
                                            </button>
                                        )}
                                        {event.status === 'approved' && isEventPast(event.date) && (
                                            <button
                                                onClick={() => handleDistributeCertificates(event)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'linear-gradient(135deg, #ffc107 0%, #ffca2c 100%)',
                                                    color: '#000',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                🎓 Distribute Certificates
                                            </button>
                                        )}
                                        {(event.status === 'pending' || (event.status === 'approved' && !isEventPast(event.date))) && (
                                            <button
                                                onClick={() => handleEditEvent(event)}
                                                style={{
                                                    padding: '8px 16px',
                                                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    transition: 'all 0.3s ease'
                                                }}
                                            >
                                                ✏️ Edit
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {showAttendanceModal && selectedEvent && (
                <AttendanceUploadModal
                    event={selectedEvent}
                    onClose={() => {
                        setShowAttendanceModal(false);
                        setSelectedEvent(null);
                    }}
                    onUploadSuccess={handleUploadSuccess}
                />
            )}

            {showProofPhotosModal && selectedEvent && (
                <ProofPhotosUploadModal
                    event={selectedEvent}
                    onClose={() => {
                        setShowProofPhotosModal(false);
                        setSelectedEvent(null);
                    }}
                    onUploadSuccess={handleUploadSuccess}
                />
            )}

            {showEditModal && selectedEvent && (
                <EditEventModal
                    event={selectedEvent}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedEvent(null);
                    }}
                    onUpdateSuccess={fetchEvents}
                />
            )}

            {showViewFeedbackModal && selectedEvent && (
                <ViewFeedbackModal
                    event={selectedEvent}
                    onClose={() => {
                        setShowViewFeedbackModal(false);
                        setSelectedEvent(null);
                    }}
                />
            )}
        </div>
    );
};

export default CoordinatorHome;
