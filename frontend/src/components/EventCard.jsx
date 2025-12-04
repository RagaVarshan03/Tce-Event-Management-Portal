import React from 'react';
import StatusChip from './StatusChip';
import ProgressBar from './ProgressBar';
import '../styles/EventCard.css';

const EventCard = ({ event, mode }) => {
    return (
        <div className="event-card-container">
            <div className="event-card-header">
                <h3 className="event-title">{event.title}</h3>
                <StatusChip status={event.status} />
            </div>

            <div className="event-details">
                <div className="event-detail-row">
                    <span className="detail-label">🏢 Association:</span>
                    <span className="detail-value">{event.association}</span>
                </div>

                <div className="event-detail-row">
                    <span className="detail-label">📅 Date:</span>
                    <span className="detail-value">{new Date(event.date).toLocaleDateString()}</span>
                </div>

                <div className="event-detail-row">
                    <span className="detail-label">👤 Coordinator:</span>
                    <span className="detail-value">{event.coordinator}</span>
                </div>

                <div className="event-detail-row">
                    <span className="detail-label">📍 Venue:</span>
                    <span className="detail-value">{event.venue}</span>
                </div>
            </div>

            <ProgressBar stage={event.stage} />

            <button className={`event-action-btn ${mode === 'my' ? 'update-btn' : 'view-btn'}`}>
                {mode === 'my' ? 'Update Progress →' : 'View Details 👁'}
            </button>
        </div>
    );
};

export default EventCard;
