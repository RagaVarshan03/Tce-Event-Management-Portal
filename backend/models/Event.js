const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    eventName: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    venue: { type: String, required: true },
    clubName: { type: String },
    poster: { type: String },
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
    attendanceSheet: { type: String }, // Filename of uploaded attendance sheet
    attendanceUploadedAt: { type: Date },
    attendanceUploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Coordinator' },
    proofPhotos: [{ type: String }], // Array of filenames (max 5)
    proofPhotosUploadedAt: { type: Date },
    proofPhotosUploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Coordinator' }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
