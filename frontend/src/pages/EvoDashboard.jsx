import React, { useState } from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import SearchBar from '../components/SearchBar';
import StatsCards from '../components/StatsCards';
import SectionTitle from '../components/SectionTitle';
import EventList from '../components/EventList';
import { stats, myEvents, otherEvents } from '../data/dummyEvents';
import '../styles/EvoDashboard.css';

const EvoDashboard = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('All');

    // Filter events based on search and tab
    const filterEvents = (events) => {
        let filtered = events;

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(event =>
                event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.association.toLowerCase().includes(searchQuery.toLowerCase()) ||
                event.coordinator.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by status tab
        if (selectedTab !== 'All') {
            filtered = filtered.filter(event =>
                event.status.toLowerCase() === selectedTab.toLowerCase()
            );
        }

        return filtered;
    };

    const filteredMyEvents = filterEvents(myEvents);
    const filteredOtherEvents = filterEvents(otherEvents);

    return (
        <div className="evo-dashboard">
            <DashboardNavbar />

            <div className="dashboard-main-content">
                <SearchBar
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedTab={selectedTab}
                    setSelectedTab={setSelectedTab}
                />

                <StatsCards stats={stats} />

                <div className="events-section">
                    <SectionTitle title="My Association's Events" />
                    <EventList events={filteredMyEvents} mode="my" />
                </div>

                <div className="events-section">
                    <SectionTitle title="Other Events" />
                    <EventList events={filteredOtherEvents} mode="other" />
                </div>
            </div>
        </div>
    );
};

export default EvoDashboard;
