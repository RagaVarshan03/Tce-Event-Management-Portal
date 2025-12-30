import React, { useState } from 'react';
import API from '../services/api';
import './FeedbackModal.css';

const FeedbackModal = ({ event, onClose, onSubmitSuccess }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await API.post(`/events/${event._id}/feedback`, { rating, comment });
            alert('Thank you for your feedback!');
            onSubmitSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit feedback');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="feedback-modal-overlay">
            <div className="feedback-modal-content">
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h2>Rate Event: {event.eventName}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Rating:</label>
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    className={`star ${star <= rating ? 'filled' : ''}`}
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Comment (Optional):</label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience..."
                            rows="4"
                        />
                    </div>
                    {error && <p className="error-msg">{error}</p>}
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} disabled={submitting}>Cancel</button>
                        <button type="submit" className="submit-btn" disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;
