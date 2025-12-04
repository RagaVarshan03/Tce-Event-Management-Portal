const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventName: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    venue: { type: String, required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'Coordinator', required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
