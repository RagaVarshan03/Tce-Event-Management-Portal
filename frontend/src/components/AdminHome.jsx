import React, { useState, useEffect } from 'react';
import { Download, Image, Trash2, Plus } from 'lucide-react';
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import API from '../services/api';
import { useSocket } from '../context/SocketContext';
import '../pages/AdminDashboard.css';
import '../styles/RejectionModal.css';

const AdminHome = () => {
    const { socket } = useSocket();
    const [activeTab, setActiveTab] = useState('add-coordinators');
    const [allowedCoordinators, setAllowedCoordinators] = useState([]);
    const [pendingEvents, setPendingEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [attendanceData, setAttendanceData] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [rejectionModal, setRejectionModal] = useState({ show: false, eventId: null, eventName: '' });
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    useEffect(() => {
        if (!socket) return;

        socket.on('dashboardUpdate', (data) => {
            console.log('[Socket] Admin Dashboard update received:', data);
            loadData();
        });

        return () => socket.off('dashboardUpdate');
    }, [socket, activeTab]);

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

    const handleAddCoordinator = async (email, department) => {
        try {
            await API.post('/admin/allowed-coordinators', { email, department });
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

    const handleRejectEvent = async (eventId, eventName) => {
        setRejectionModal({ show: true, eventId, eventName });
    };

    const submitRejection = async () => {
        if (!rejectionReason.trim()) {
            alert('Please enter a rejection reason');
            return;
        }
        try {
            await API.put(`/admin/events/${rejectionModal.eventId}/reject`, { reason: rejectionReason });
            alert('Event rejected');
            setRejectionModal({ show: false, eventId: null, eventName: '' });
            setRejectionReason('');
            loadData();
        } catch (err) {
            alert('Failed to reject event');
        }
    };

    const cancelRejection = () => {
        setRejectionModal({ show: false, eventId: null, eventName: '' });
        setRejectionReason('');
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

                {rejectionModal.show && (
                    <RejectionModal
                        eventName={rejectionModal.eventName}
                        reason={rejectionReason}
                        onReasonChange={setRejectionReason}
                        onSubmit={submitRejection}
                        onCancel={cancelRejection}
                    />
                )}
            </div>
        </div>
    );
};


// Sub-components
const AddCoordinators = ({ coordinators, onAdd, onRemove }) => {
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (email && department) {
            onAdd(email, department);
            setEmail('');
            setDepartment('');
        }
    };

    return (
        <div className="approval-section">
            <h2>Manage Coordinators</h2>

            <form onSubmit={handleSubmit} className="coordinator-form">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter coordinator email"
                    required
                    className="coordinator-input"
                />
                <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    className="coordinator-select"
                >
                    <option value="">Select Department</option>
                    <option value="CSE">CSE</option>
                    <option value="CSBS">CSBS</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                </select>
                <button
                    type="submit"
                    className="btn-add"
                >
                    <Plus size={18} />
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
                                <th>Department</th>
                                <th>Added On</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coordinators.map(coord => (
                                <tr key={coord._id}>
                                    <td>{coord.email}</td>
                                    <td>{coord.department || 'N/A'}</td>
                                    <td>{new Date(coord.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="icon-btn btn-delete"
                                            title="Remove Coordinator"
                                            onClick={() => onRemove(coord._id)}
                                        >
                                            <Trash2 size={18} />
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
                            <button className="btn-reject" onClick={() => onReject(event._id, event.eventName)}>
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
                                {event.attendanceSheet && (
                                    <button
                                        className="icon-btn btn-download"
                                        title="Download Attendance"
                                        onClick={async () => {
                                            try {
                                                const response = await API.get(`/events/${event._id}/download-attendance`, {
                                                    responseType: 'blob'
                                                });
                                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', event.attendanceSheet);
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                            } catch (err) {
                                                alert('Failed to download attendance sheet');
                                            }
                                        }}
                                    >
                                        <Download size={18} />
                                    </button>
                                )}
                                {event.proofPhotos && event.proofPhotos.length > 0 && (
                                    <button
                                        className="icon-btn btn-photos"
                                        title={`Download Photos (${event.proofPhotos.length})`}
                                        onClick={async () => {
                                            try {
                                                const response = await API.get(`/events/${event._id}/download-proof-photos`, {
                                                    responseType: 'blob'
                                                });
                                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.setAttribute('download', `${event.eventName}_proof_photos.zip`);
                                                document.body.appendChild(link);
                                                link.click();
                                                link.remove();
                                            } catch (err) {
                                                alert('Failed to download proof photos');
                                            }
                                        }}
                                    >
                                        <Image size={18} />
                                    </button>
                                )}
                                <button
                                    className="icon-btn btn-delete"
                                    title="Delete Event"
                                    onClick={() => onDelete(event._id)}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const Analytics = ({ data }) => {
    // Prepare data for Pie Chart
    const statusData = [
        { name: 'Approved', value: data.summary.approvedEvents, color: '#28a745' },
        { name: 'Pending', value: data.summary.pendingEvents, color: '#ffc107' },
        { name: 'Rejected', value: data.summary.rejectedEvents, color: '#dc3545' }
    ].filter(item => item.value > 0);

    // Prepare data for Bar Chart (Top 5 Events by Registration)
    const eventData = [...data.events]
        .sort((a, b) => b.registrations - a.registrations)
        .slice(0, 5)
        .map(event => ({
            name: event.eventName.length > 15 ? event.eventName.substring(0, 15) + '...' : event.eventName,
            registrations: event.registrations
        }));

    return (
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
            </div>

            <div className="analytics-charts-container">
                <div className="chart-wrapper">
                    <h3>Event Status Distribution</h3>
                    {statusData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend
                                    formatter={(value, entry) => {
                                        const { payload } = entry;
                                        return `${value} : ${payload.value}`;
                                    }}
                                />
                                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                                    <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold" fill="#333">
                                        {data.summary.totalEvents}
                                    </tspan>
                                    <tspan x="50%" dy="1.5em" fontSize="14" fill="#666">
                                        Total
                                    </tspan>
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="no-data-text">No event data available</p>
                    )}
                </div>


            </div>
        </div>
    );
};

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

const RejectionModal = ({ eventName, reason, onReasonChange, onSubmit, onCancel }) => {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content rejection-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onCancel}>×</button>
                <div className="rejection-modal-header">
                    <h2>Reject Event</h2>
                    <p className="event-name-highlight">{eventName}</p>
                </div>
                <div className="rejection-modal-body">
                    <label htmlFor="rejection-reason">
                        <strong>Reason for Rejection</strong>
                        <span className="required-indicator">*</span>
                    </label>
                    <textarea
                        id="rejection-reason"
                        value={reason}
                        onChange={(e) => onReasonChange(e.target.value)}
                        placeholder="Please provide a clear reason for rejecting this event..."
                        rows="5"
                        autoFocus
                    />
                    <p className="helper-text">
                        This reason will be sent to the coordinator via email and displayed in their dashboard.
                    </p>
                </div>
                <div className="rejection-modal-footer">
                    <button className="btn-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button className="btn-submit-rejection" onClick={onSubmit}>
                        Confirm Rejection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminHome;
