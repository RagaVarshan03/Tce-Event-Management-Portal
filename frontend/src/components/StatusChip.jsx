import React from 'react';
import '../styles/StatusChip.css';

const StatusChip = ({ status }) => {
    const getStatusConfig = () => {
        switch (status) {
            case 'ongoing':
                return { label: 'Ongoing', className: 'status-ongoing' };
            case 'completed':
                return { label: 'Completed', className: 'status-completed' };
            case 'planning':
                return { label: 'Planning', className: 'status-planning' };
            default:
                return { label: 'Unknown', className: 'status-default' };
        }
    };

    const { label, className } = getStatusConfig();

    return (
        <span className={`status-chip ${className}`}>
            {label}
        </span>
    );
};

export default StatusChip;
