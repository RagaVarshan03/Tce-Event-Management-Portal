import React, { useState, useEffect } from 'react';
import API from '../services/api';
import '../pages/AdminDashboard.css';

const AdminHome = () => {
    const [activeTab, setActiveTab] = useState('add-coordinators');
    const [allowedCoordinators, setAllowedCoordinators] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [attendanceData, setAttendanceData] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'add-coordinators') {
                const res = await API.get('/admin/allowed-coordinators');
                setAllowedCoordinators(res.data);
            } else if (activeTab === 'pending-events') {
                const res = await API.get('/admin/events/pending');
                setPendingEvents(res.data);
            } else if (activeTab === 'all-events') {
                const res = await API.get('/admin/events');
                setAllEvents(res.data);
            } else if (activeTab === 'analytics') {
                const res = await API.get('/admin/analytics/monthly');
                setAnalytics(res.data);
            }
        } catch (err) {
            console.error('Error loading data:', err);
        }
        setLoading(false);
    };

    const handleAddCoordinator = async (email) => {
        try {
            await API.post('/admin/allowed-coordinators', { email });
            alert('Coordinator email added successfully');
            loadData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add coordinator');
        }
    };

    const handleRemoveCoordinator = async (id) => {
        if (!window.confirm('Are you sure you want to remove this email?')) return;
        try {
            await API.delete(`/admin/allowed-coordinators/${id}`);
            alert('Coordinator email removed successfully');
            loadData();
        } catch (err) {
            alert('Failed to remove coordinator');
        }
    };

    const handleApproveEvent = async (id) => {
        try {
            await API.put(`/admin/events/${id}/approve`);
            alert('Event approved successfully');
            loadData();
        } catch (err) {
            alert('Failed to approve event');
        }
    };

    const handleRejectEvent = async (id) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;
        try {
            await API.put(`/admin/events/${id}/reject`, { reason });
            alert('Event rejected');
            loadData();
        } catch (err) {
            alert('Failed to reject event');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            await API.delete(`/admin/events/${id}`);
            alert('Event deleted successfully');
            loadData();
        } catch (err) {
            alert('Failed to delete event');
        }
    };

    const loadAttendance = async (eventId) => {
        try {
            const res = await API.get(`/admin/attendance/${eventId}`);
            setAttendanceData(res.data);
            setSelectedEvent(eventId);
        } catch (err) {
            alert('Failed to load attendance');
        }
    };

    return (
        <div className="admin-dashboard">
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'add-coordinators' ? 'active' : ''}`}
                    onClick={() => setActiveTab('add-coordinators')}
                >
                    Add Coordinators
                </button>
                <button
                    className={`tab ${activeTab === 'pending-events' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending-events')}
                >
                    Pending Events
                    {pendingEvents.length > 0 && <span className="badge">{pendingEvents.length}</span>}
                </button>
                <button
                    className={`tab ${activeTab === 'all-events' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all-events')}
                >
                    All Events
                </button>
                <button
                    className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analytics')}
                >
                    Analytics
                </button>
            </div>

            <div className="tab-content">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <>
                        {activeTab === 'add-coordinators' && (
                            <AddCoordinators
                                coordinators={allowedCoordinators}
                                onAdd={handleAddCoordinator}
                                onRemove={handleRemoveCoordinator}
                            />
                        )}

                        {activeTab === 'pending-events' && (
                            <PendingEvents
                                events={pendingEvents}
                                onApprove={handleApproveEvent}
                                onReject={handleRejectEvent}
                            />
                        )}

                        {activeTab === 'all-events' && (
                            <AllEvents
                                events={allEvents}
                                onDelete={handleDeleteEvent}
                                onViewAttendance={loadAttendance}
                            />
                        )}

                        {activeTab === 'analytics' && analytics && (
                            <Analytics data={analytics} />
                        )}
                    </>
                )}

                {attendanceData && (
                    <AttendanceModal
                        data={attendanceData}
                        onClose={() => setAttendanceData(null)}
                    />
                )}
            </div>
        </div>
    );
};

// Sub-components
const AddCoordinators = ({ coordinators, onAdd, onRemove }) => {
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email) {
            onAdd(email);
            setEmail('');
        }
    };

    return (
        <div className="approval-section">
            <h2>Manage Coordinators</h2>

            <form onSubmit={handleSubmit} style={{ marginBottom: '30px', display: 'flex', gap: '10px' }}>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter coordinator email"
                    required
                    style={{
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        flex: '1',
                        maxWidth: '400px'
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: '10px 20px',
                        background: '#830000',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Add Coordinator
                </button>
            </form>

            <h3>Allowed Coordinators</h3>
            {coordinators.length === 0 ? (
                <p className="empty-state">No allowed coordinators added yet.</p>
            ) : (
                <div className="table-container">
                    <table className="events-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Added On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coordinators.map(coord => (
                                <tr key={coord._id}>
                                    <td>{coord.email}</td>
                                    <td>{new Date(coord.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="btn-danger"
                                            onClick={() => onRemove(coord._id)}
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const PendingEvents = ({ events, onApprove, onReject }) => (
    <div className="approval-section">
        <h2>Pending Event Approvals</h2>
        {events.length === 0 ? (
            <p className="empty-state">No pending event approvals</p>
        ) : (
            <div className="approval-grid">
                {events.map(event => (
                    <div key={event._id} className="approval-card">
                        <h3>{event.eventName}</h3>
                        <p>{event.description}</p>
                        <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                        <p><strong>Venue:</strong> {event.venue}</p>
                        <p><strong>Organizer:</strong> {event.organizer?.name} ({event.organizer?.department})</p>
                        <div className="approval-actions">
                            <button className="btn-approve" onClick={() => onApprove(event._id)}>
                                ✓ Approve
                            </button>
                            <button className="btn-reject" onClick={() => onReject(event._id)}>
                                ✗ Reject
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
);

const AllEvents = ({ events, onDelete, onViewAttendance }) => (
    <div className="events-section">
        <h2>All Events</h2>
        <div className="table-container">
            <table className="events-table">
                <thead>
                    <tr>
                        <th>Event Name</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Organizer</th>
                        <th>Participants</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map(event => (
                        <tr key={event._id}>
                            <td>{event.eventName}</td>
                            <td>
                                <span className={`status-badge status-${event.status}`}>
                                    {event.status}
                                </span>
                            </td>
                            <td>{new Date(event.date).toLocaleDateString()}</td>
                            <td>{event.organizer?.name}</td>
                            <td>{event.participants?.length || 0}</td>
                            <td className="action-buttons">
                                {event.participants?.length > 0 && (
                                    <button
                                        className="btn-secondary"
                                        onClick={() => onViewAttendance(event._id)}
                                    >
                                        Attendance
                                    </button>
                                )}
                                <button
                                    className="btn-danger"
                                    onClick={() => onDelete(event._id)}
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const Analytics = ({ data }) => (
    <div className="analytics-section">
        <h2>Monthly Analytics</h2>
        <div className="analytics-grid">
            <div className="stat-card">
                <h3>{data.summary.totalEvents}</h3>
                <p>Total Events</p>
            </div>
            <div className="stat-card">
                <h3>{data.summary.approvedEvents}</h3>
                <p>Approved Events</p>
            </div>
            <div className="stat-card">
                <h3>{data.summary.pendingEvents}</h3>
                <p>Pending Events</p>
            </div>
            <div className="stat-card">
                <h3>{data.summary.totalRegistrations}</h3>
                <p>Total Registrations</p>
            </div>
            <div className="stat-card">
                <h3>{data.summary.totalAttendance}</h3>
                <p>Total Attendance</p>
            </div>
        </div>
    </div>
);

const AttendanceModal = ({ data, onClose }) => {
    const attendancePercentage = data.totalRegistered > 0
        ? Math.round((data.totalAttended / data.totalRegistered) * 100)
        : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content attendance-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>
                <h2>Attendance Report: {data.event.eventName}</h2>
                <p><strong>Date:</strong> {new Date(data.event.date).toLocaleDateString()}</p>
                <p><strong>Venue:</strong> {data.event.venue}</p>

                <div className="attendance-summary">
                    <div className="attendance-stats">
                        <div className="stat">
                            <span className="stat-number">{data.totalAttended}</span>
                            <span className="stat-label">Present</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">{data.totalRegistered - data.totalAttended}</span>
                            <span className="stat-label">Absent</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">{data.totalRegistered}</span>
                            <span className="stat-label">Total</span>
                        </div>
                    </div>

                    <div className="progress-bar-container">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${attendancePercentage}%` }}
                            >
                                {attendancePercentage}%
                            </div>
                        </div>
                        <p className="progress-label">Attendance Rate</p>
                    </div>
                </div>

                <div className="attendance-list">
                    <h3>Student List</h3>
                    {data.attendanceList.map(item => (
                        <div key={item.student._id} className="attendance-item">
                            <div>
                                <strong>{item.student.name}</strong>
                                <p>{item.student.registerNo} - {item.student.department}</p>
                                {item.checkedIn && item.checkInTime && (
                                    <small style={{ color: '#28a745' }}>
                                        Checked in at {new Date(item.checkInTime).toLocaleTimeString()}
                                    </small>
                                )}
                            </div>
                            <span className={item.checkedIn ? 'status-present' : 'status-absent'}>
                                {item.checkedIn ? '✓ Present' : '✗ Absent'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminHome;
