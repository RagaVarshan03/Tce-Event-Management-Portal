import React from 'react';
import './FeedbackModal.css'; // Reusing styles

const ViewFeedbackModal = ({ event, onClose }) => {
    // Calculate stats
    const totalFeedback = event.feedback?.length || 0;
    const averageRating = totalFeedback > 0
        ? (event.feedback.reduce((acc, curr) => acc + curr.rating, 0) / totalFeedback).toFixed(1)
        : 'N/A';

    return (
        <div className="feedback-modal-overlay">
            <div className="feedback-modal-content" style={{ maxWidth: '600px' }}>
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h2>Feedback for: {event.eventName}</h2>

                <div style={{ margin: '20px 0', padding: '15px', background: '#f8f9fa', borderRadius: '8px', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107' }}>
                            {averageRating} <span style={{ fontSize: '1.2rem', color: '#666' }}>/ 5</span>
                        </div>
                        <div>Average Rating</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#830000' }}>
                            {totalFeedback}
                        </div>
                        <div>Total Reviews</div>
                    </div>
                </div>

                <div className="feedback-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {totalFeedback === 0 ? (
                        <p style={{ textAlign: 'center', color: '#666' }}>No feedback received yet.</p>
                    ) : (
                        event.feedback.map((item, index) => (
                            <div key={index} style={{ borderBottom: '1px solid #eee', padding: '15px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <div style={{ color: '#ffc107' }}>
                                        {'★'.repeat(item.rating)}
                                        <span style={{ color: '#ccc' }}>{'★'.repeat(5 - item.rating)}</span>
                                    </div>
                                    <small style={{ color: '#999' }}>
                                        {/* Assuming item has no date, or we iterate to find it? The model has it. */}
                                        {/* If backend doesn't populate nested date, it's fine */}
                                    </small>
                                </div>
                                {item.comment && (
                                    <p style={{ margin: '5px 0', fontStyle: 'italic', color: '#555' }}>"{item.comment}"</p>
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="modal-actions">
                    <button type="button" onClick={onClose} className="submit-btn" style={{ background: '#6c757d' }}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ViewFeedbackModal;
