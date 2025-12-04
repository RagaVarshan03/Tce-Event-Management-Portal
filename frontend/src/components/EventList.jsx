import React from 'react';
import EventCard from './EventCard';
import '../styles/EventList.css';

const EventList = ({ events, mode }) => {
    if (events.length === 0) {
        return (
            <div className="empty-state">
                <p>No events found</p>
            </div>
        );
    }

    return (
        <div className="event-list-grid">
            {events.map((event) => (
                <EventCard key={event.id} event={event} mode={mode} />
            ))}
        </div>
    );
};

export default EventList;
