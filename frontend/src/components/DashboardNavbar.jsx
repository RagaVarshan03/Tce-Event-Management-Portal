import React from 'react';
import '../styles/DashboardNavbar.css';

const DashboardNavbar = () => {
    return (
        <nav className="dashboard-navbar">
            <div className="navbar-brand">
                <h1 className="navbar-title">Evo</h1>
                <p className="navbar-subtitle">Your Event Evolution Partner</p>
            </div>

            <button className="create-event-btn">
                + Create Event
            </button>
        </nav>
    );
};

export default DashboardNavbar;
