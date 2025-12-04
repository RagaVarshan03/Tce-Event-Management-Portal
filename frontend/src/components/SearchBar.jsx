import React from 'react';
import '../styles/SearchBar.css';

const SearchBar = ({ searchQuery, setSearchQuery, selectedTab, setSelectedTab }) => {
    const tabs = ['All', 'Ongoing', 'Completed'];

    return (
        <div className="search-bar-container">
            <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                    type="text"
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
            </div>

            <div className="filter-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        className={`filter-tab ${selectedTab === tab ? 'active' : ''}`}
                        onClick={() => setSelectedTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SearchBar;
