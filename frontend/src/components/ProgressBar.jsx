import React from 'react';
import '../styles/ProgressBar.css';

const ProgressBar = ({ stage }) => {
    const stages = [
        { id: 1, label: 'Proposal' },
        { id: 2, label: 'Approval' },
        { id: 3, label: 'Preparation' },
        { id: 4, label: 'Execution' },
        { id: 5, label: 'Completed' }
    ];

    const progress = (stage / 5) * 100;

    return (
        <div className="progress-bar-container">
            <div className="progress-bar-track">
                <div
                    className="progress-bar-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="progress-stages">
                {stages.map((s) => (
                    <div
                        key={s.id}
                        className={`progress-stage ${stage >= s.id ? 'active' : ''}`}
                    >
                        <div className="stage-dot" />
                        <span className="stage-label">{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProgressBar;
