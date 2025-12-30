const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['FEEDBACK_REQUEST', 'EVENT_UPDATE', 'GENERIC'], // Add more types as needed
        default: 'GENERIC'
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
