import React from 'react';
import '../styles/StatsCards.css';

const StatsCards = ({ stats }) => {
    return (
        <div className="stats-cards-container">
            <div className="stat-card-item">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                    <h3>{stats.totalEvents}</h3>
                    <p>Total Events</p>
                </div>
            </div>

            <div className="stat-card-item">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                    <h3>{stats.myAssociationEvents}</h3>
                    <p>My Association's Events</p>
                </div>
            </div>

            <div className="stat-card-item">
                <div className="stat-icon">🌐</div>
                <div className="stat-content">
                    <h3>{stats.otherEvents}</h3>
                    <p>Other Events</p>
                </div>
            </div>
        </div>
    );
};

export default StatsCards;
