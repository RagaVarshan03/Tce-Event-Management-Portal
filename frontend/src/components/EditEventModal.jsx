import React, { useState } from 'react';
import API from '../services/api';
import './ProofPhotosUploadModal.css'; // Reusing modal styles

const EditEventModal = ({ event, onClose, onUpdateSuccess }) => {
    // Parse existing date and time
    const eventDate = new Date(event.date);
    let initialHour = eventDate.getHours();
    const initialPeriod = initialHour >= 12 ? 'PM' : 'AM';
    initialHour = initialHour % 12 || 12; // Convert to 12-hour format

    const [formData, setFormData] = useState({
        eventName: event.eventName,
        description: event.description,
        date: event.date.split('T')[0], // Format date for input
        venue: event.venue,
        clubName: event.clubName || '',
        maxParticipants: event.maxParticipants || ''
    });

    const [timeData, setTimeData] = useState({
        hour: initialHour.toString(),
        minute: eventDate.getMinutes().toString().padStart(2, '0'),
        period: initialPeriod
    });

    const [posterFile, setPosterFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTimeChange = (e) => {
        setTimeData({ ...timeData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setPosterFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            data.append('eventName', formData.eventName);
            data.append('description', formData.description);

            // Combine Date and Time
            let hours = parseInt(timeData.hour);
            if (timeData.period === 'PM' && hours !== 12) hours += 12;
            if (timeData.period === 'AM' && hours === 12) hours = 0;

            const eventDateTime = new Date(formData.date);
            eventDateTime.setHours(hours, parseInt(timeData.minute));

            data.append('date', eventDateTime.toISOString());
            data.append('venue', formData.venue);
            if (formData.clubName) {
                data.append('clubName', formData.clubName);
            }
            if (posterFile) {
                data.append('poster', posterFile);
            }
            if (formData.maxParticipants) {
                data.append('maxParticipants', formData.maxParticipants);
            }

            await API.put(`/events/${event._id}`, data, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            alert('Event updated successfully!');
            onUpdateSuccess();
            onClose();
        } catch (err) {
            console.error('Update error:', err);
            setError(err.response?.data?.message || 'Failed to update event');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="proof-modal-overlay" onClick={onClose}>
            <div className="proof-modal-content" onClick={e => e.stopPropagation()}>
                <button className="proof-modal-close" onClick={onClose}>&times;</button>

                <h2>Edit Event</h2>

                {error && <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Event Name</label>
                        <input
                            type="text"
                            name="eventName"
                            value={formData.eventName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Time</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <select
                                name="hour"
                                value={timeData.hour}
                                onChange={handleTimeChange}
                                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                            <select
                                name="minute"
                                value={timeData.minute}
                                onChange={handleTimeChange}
                                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                            <select
                                name="period"
                                value={timeData.period}
                                onChange={handleTimeChange}
                                style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                            >
                                <option value="AM">AM</option>
                                <option value="PM">PM</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Venue</label>
                        <input
                            type="text"
                            name="venue"
                            value={formData.venue}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Club Name</label>
                        <select name="clubName" value={formData.clubName} onChange={handleChange}>
                            <option value="">Select a club</option>
                            <option value="IEEE CIS">IEEE CIS</option>
                            <option value="TECH EXPLORERS">TECH EXPLORERS</option>
                            <option value="CSBSA">CSBSA</option>
                            <option value="ASI">ASI</option>
                            <option value="CODERS CLUB">CODERS CLUB</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Max Participants</label>
                        <input
                            type="number"
                            name="maxParticipants"
                            value={formData.maxParticipants || ''}
                            onChange={handleChange}
                            placeholder="Leave empty for unlimited"
                            min="1"
                        />
                    </div>

                    <div className="form-group">
                        <label>Update Poster (Optional)</label>
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

                    <button
                        type="submit"
                        className="action-btn"
                        disabled={loading}
                        style={{ width: '100%', marginTop: '10px' }}
                    >
                        {loading ? 'Updating...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditEventModal;
