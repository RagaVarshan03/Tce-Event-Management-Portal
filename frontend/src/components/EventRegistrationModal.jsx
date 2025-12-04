import React, { useState } from 'react';
import './EventRegistrationModal.css';

const EventRegistrationModal = ({ event, user, onClose, onRegister }) => {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        registerNo: user?.registerNo || '',
        department: user?.department || '',
        year: user?.year || ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await onRegister(event._id, formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="modal-header">
                    <h2>Event Registration</h2>
                </div>

                <div className="event-details-section">
                    <h3>{event.eventName}</h3>
                    <p className="event-description">{event.description}</p>

                    <div className="event-info-grid">
                        <div className="info-item">
                            <span className="info-label">📅 Date:</span>
                            <span className="info-value">{new Date(event.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">📍 Venue:</span>
                            <span className="info-value">{event.venue}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">👤 Organizer:</span>
                            <span className="info-value">{event.organizer?.name || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <div className="registration-form-section">
                    <h4>Your Information</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="name">Full Name *</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="registerNo">Register Number *</label>
                            <input
                                type="text"
                                id="registerNo"
                                name="registerNo"
                                value={formData.registerNo}
                                onChange={handleChange}
                                required
                                placeholder="Enter your register number"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="department">Department *</label>
                                <input
                                    type="text"
                                    id="department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g., CSBS"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="year">Year *</label>
                                <select
                                    id="year"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select Year</option>
                                    <option value="1">1st Year</option>
                                    <option value="2">2nd Year</option>
                                    <option value="3">3rd Year</option>
                                    <option value="4">4th Year</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={onClose} className="btn-cancel">
                                Cancel
                            </button>
                            <button type="submit" className="btn-register">
                                Confirm Registration
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EventRegistrationModal;
