const Event = require('../models/Event');
const Student = require('../models/Student');
const Notification = require('../models/Notification');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { generateCertificate } = require('../services/certificateService');
const path = require('path');
const fs = require('fs');

// Create Event (Coordinator only)
exports.createEvent = async (req, res) => {
    try {
        const { eventName, description, date, venue, clubName, maxParticipants } = req.body;
        const eventData = {
            eventName,
            description,
            date,
            venue,
            organizer: req.user.id,
            maxParticipants: maxParticipants ? parseInt(maxParticipants) : null
        };

        // Add clubName if provided
        if (clubName) {
            eventData.clubName = clubName;
        }

        // Add poster path if file was uploaded
        if (req.file) {
            eventData.poster = req.file.filename;
        }

        const event = await Event.create(eventData);
        res.status(201).json(event);

        // Broadcast New Event Notification
        try {
            const io = require('../services/socketService').getIO();
            io.emit('newNotification', {
                type: 'NEW_EVENT',
                message: `New event published: ${event.eventName}`,
                eventId: event._id,
                date: new Date()
            });
        } catch (err) {
            console.error('[Socket] Error broadcasting new event:', err.message);
        }
    } catch (error) {
        console.error("Create Event Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get All Events (Public/Student) - Only show approved events
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find({ status: 'approved' })
            .populate('organizer', 'name email');
        res.json(events);
    } catch (error) {
        console.error('Error fetching events:', error.message);
        res.json([]);
    }
};

// Register for Event (Student only)
exports.registerForEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const studentId = req.user.id;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Check if already registered or in waitlist
        if (event.participants.includes(studentId)) {
            return res.status(400).json({ message: 'Already registered' });
        }
        if (event.waitlist.includes(studentId)) {
            return res.status(400).json({ message: 'Already on the waitlist' });
        }

        const student = await Student.findById(studentId);

        // Check if full
        if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
            // Join Waitlist
            event.waitlist.push(studentId);
            await event.save();

            // Broadcast Waitlist Update
            try {
                const io = require('../services/socketService').getIO();
                io.to(`event_${eventId}`).emit('seatUpdate', {
                    eventId,
                    participantsCount: event.participants.length,
                    waitlistCount: event.waitlist.length
                });
            } catch (err) {
                console.error('[Socket] Error broadcasting waitlist update:', err.message);
            }

            // Send Waitlist Email
            if (student.email) {
                sendEmail(emailTemplates.waitlistJoined(
                    student.name,
                    student.email,
                    event.eventName
                ));
            }
            return res.json({ message: 'Event is full. You have joined the waitlist.' });
        }

        // Register normally
        event.participants.push(studentId);
        await event.save();

        student.registeredEvents.push(eventId);
        await student.save();

        res.json({ message: 'Registered successfully' });

        // Broadcast Seat Update
        try {
            const io = require('../services/socketService').getIO();
            io.to(`event_${eventId}`).emit('seatUpdate', {
                eventId,
                participantsCount: event.participants.length,
                waitlistCount: event.waitlist.length
            });
            // Also notify dashboard
            io.emit('dashboardUpdate', { type: 'REGISTRATION', eventId });
        } catch (err) {
            console.error('[Socket] Error broadcasting seat update:', err.message);
        }

        // Send confirmation email
        if (student.email) {
            sendEmail(emailTemplates.registrationConfirmation(
                student.name,
                student.email,
                event.eventName,
                event.date,
                event.venue
            ));
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Unregister / Cancel Registration
exports.unregisterForEvent = async (req, res) => {
    try {
        const eventId = req.params.id;
        const studentId = req.user.id;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Check if in participants
        const participantIndex = event.participants.indexOf(studentId);
        if (participantIndex === -1) {
            // Check if in waitlist
            const waitlistIndex = event.waitlist.indexOf(studentId);
            if (waitlistIndex !== -1) {
                event.waitlist.splice(waitlistIndex, 1);
                await event.save();
                return res.json({ message: 'Removed from waitlist' });
            }
            return res.status(400).json({ message: 'Not registered for this event' });
        }

        // Remove from participants
        event.participants.splice(participantIndex, 1);

        // Remove from student's registered events
        await Student.findByIdAndUpdate(studentId, {
            $pull: { registeredEvents: eventId }
        });

        // Promote from waitlist
        let promotedStudentId = null;
        if (event.waitlist.length > 0) {
            promotedStudentId = event.waitlist.shift(); // Get first in line
            event.participants.push(promotedStudentId);
        }

        await event.save();
        res.json({ message: 'Unregistered successfully' });

        // Send promotion email if someone was moved up
        if (promotedStudentId) {
            const promotedStudent = await Student.findById(promotedStudentId);
            promotedStudent.registeredEvents.push(eventId);
            await promotedStudent.save();

            if (promotedStudent.email) {
                sendEmail(emailTemplates.waitlistPromoted(
                    promotedStudent.name,
                    promotedStudent.email,
                    event.eventName,
                    event.date,
                    event.venue
                ));
            }
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Submit Feedback
exports.submitFeedback = async (req, res) => {
    try {
        const eventId = req.params.id;
        const studentId = req.user.id;
        const { rating, comment } = req.body;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Verify attendance (optional, but good practice)
        // For simplicity, checking if registered
        if (!event.participants.includes(studentId)) {
            return res.status(403).json({ message: 'Only participants can submit feedback' });
        }

        // Check if already submitted
        const existingFeedback = event.feedback.find(f => f.student.toString() === studentId);
        if (existingFeedback) {
            return res.status(400).json({ message: 'Feedback already submitted' });
        }

        // Add feedback
        event.feedback.push({
            student: studentId,
            rating: parseInt(rating),
            comment
        });

        // Recalculate average rating
        const totalRating = event.feedback.reduce((sum, f) => sum + f.rating, 0);
        event.averageRating = totalRating / event.feedback.length;

        await event.save();
        res.json({ message: 'Feedback submitted successfully' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Request Feedback (Coordinator Action)
exports.requestFeedback = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId).populate('participants');

        if (!event) return res.status(404).json({ message: 'Event not found' });
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Prevent spam
        if (event.feedbackEmailSent) {
            return res.status(400).json({ message: 'Feedback request already sent' });
        }

        // Send emails
        // Create notifications for all participants
        const notifications = event.participants.map(student => ({
            recipient: student._id,
            message: `Feedback requested for event: ${event.eventName}`,
            type: 'FEEDBACK_REQUEST',
            relatedId: event._id
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);

            // Real-time socket notification
            const io = require('../services/socketService').getIO();
            event.participants.forEach(student => {
                io.emit('newNotification', {
                    recipient: student._id,
                    message: `Feedback requested for event: ${event.eventName}`,
                    type: 'FEEDBACK_REQUEST',
                    relatedId: event._id,
                    date: new Date()
                });
            });
        }

        event.feedbackEmailSent = true;
        await event.save();

        res.json({ message: 'Feedback request emails sent' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get My Events (Student only)
exports.getMyEvents = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id).populate('registeredEvents');

        // Find waitlisted events
        const waitlistedEvents = await Event.find({ waitlist: req.user.id });

        res.json({
            registered: student.registeredEvents,
            waitlisted: waitlistedEvents
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Coordinator Events (Coordinator only)
exports.getCoordinatorEvents = async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user.id });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Notify Participants (Admin/Coordinator only)
exports.notifyParticipants = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId).populate('participants');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!event.participants || event.participants.length === 0) {
            return res.status(400).json({ message: 'No participants registered for this event' });
        }

        let emailCount = 0;
        const errors = [];

        for (const student of event.participants) {
            if (student.email) {
                const emailOptions = emailTemplates.eventNotification(
                    student.name,
                    student.email,
                    event.eventName,
                    event.date,
                    event.venue,
                    event.description
                );

                const result = await sendEmail(emailOptions);
                if (result.success) {
                    emailCount++;
                } else {
                    errors.push({ email: student.email, error: result.error });
                }
            }
        }

        res.json({
            message: `Emails sent successfully to ${emailCount} participants`,
            totalParticipants: event.participants.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update Event (Coordinator only)
exports.updateEvent = async (req, res) => {
    try {
        const { eventName, description, date, venue, clubName, maxParticipants } = req.body;

        // Find event and verify ownership
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Verify the coordinator owns this event
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to edit this event' });
        }

        // Detect changes
        const changes = [];
        if (event.venue !== venue) changes.push(`Venue changed from "${event.venue}" to "${venue}"`);
        if (new Date(event.date).toISOString() !== new Date(date).toISOString()) {
            changes.push(`Date changed from "${new Date(event.date).toLocaleString()}" to "${new Date(date).toLocaleString()}"`);
        }
        if (event.description !== description) changes.push("Event description has been updated.");

        // Build update object
        const updateData = {
            eventName,
            description,
            date,
            venue,
            maxParticipants: maxParticipants ? parseInt(maxParticipants) : null
        };

        // Add clubName if provided
        if (clubName !== undefined) {
            updateData.clubName = clubName;
        }

        // Add poster if file was uploaded
        if (req.file) {
            updateData.poster = req.file.filename;
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('organizer', 'name email department');

        // Notify participants if there are significant changes
        if (changes.length > 0 && event.participants && event.participants.length > 0) {
            const Student = require('../models/Student');
            const participants = await Student.find({
                _id: { $in: event.participants }
            });

            // Send emails concurrently
            Promise.all(participants.map(student => {
                const emailOptions = emailTemplates.eventUpdate(
                    student.name,
                    student.email,
                    event.eventName,
                    changes
                );
                return sendEmail(emailOptions);
            })).catch(err => console.error('Error sending update emails:', err));
        }

        res.json({ message: 'Event updated successfully', event: updatedEvent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upload Attendance Sheet (Coordinator only - for past events)
exports.uploadAttendance = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to upload attendance for this event' });
        }

        // Check if event is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);

        if (eventDate >= today) {
            return res.status(400).json({ message: 'Can only upload attendance for past events' });
        }

        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Delete old attendance file if exists
        if (event.attendanceSheet) {
            const oldFilePath = path.join(__dirname, '../uploads/attendance', event.attendanceSheet);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // Update event with new attendance file
        event.attendanceSheet = req.file.filename;
        event.attendanceUploadedAt = new Date();
        event.attendanceUploadedBy = req.user.id;
        await event.save();

        res.json({
            message: 'Attendance sheet uploaded successfully',
            filename: req.file.filename,
            uploadedAt: event.attendanceUploadedAt
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Distribute Certificates (Coordinator only - for past events)
exports.distributeCertificates = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId).populate('participants');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to distribute certificates for this event' });
        }

        const participants = event.participants;
        if (participants.length === 0) {
            return res.status(400).json({ message: 'No participants registered for this event.' });
        }

        let sentCount = 0;

        for (const student of participants) {
            if (student.email) {
                try {
                    const pdfBuffer = await generateCertificate(
                        student.name,
                        event.eventName,
                        event.date,
                        event.venue,
                        event.clubName
                    );

                    const emailOptions = emailTemplates.certificateDistribution(
                        student.name,
                        student.email,
                        event.eventName
                    );

                    emailOptions.attachments = [{
                        filename: `Certificate_${event.eventName.replace(/\s+/g, '_')}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }];

                    const result = await sendEmail(emailOptions);
                    if (result.success) sentCount++;

                } catch (err) {
                    console.error(`Failed to generate/send certificate for ${student.email}:`, err);
                }
            }
        }

        res.json({ message: `Certificates distributed to ${sentCount} participants.` });

    } catch (error) {
        console.error('Certificate distribution error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Download Attendance Sheet (Admin only)
exports.downloadAttendance = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!event.attendanceSheet) {
            return res.status(404).json({ message: 'No attendance sheet uploaded for this event' });
        }

        const filePath = path.join(__dirname, '../uploads/attendance', event.attendanceSheet);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'Attendance file not found on server' });
        }

        res.download(filePath, event.attendanceSheet, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                res.status(500).json({ error: 'Error downloading file' });
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Upload Proof Photos (Coordinator only - for past events)
exports.uploadProofPhotos = async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to upload photos for this event' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);

        if (eventDate >= today) {
            return res.status(400).json({ message: 'Can only upload proof photos for past events' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const replaceAll = req.body.replaceAll === 'true';

        if (replaceAll && event.proofPhotos && event.proofPhotos.length > 0) {
            event.proofPhotos.forEach(filename => {
                const oldFilePath = path.join(__dirname, '../uploads/proof-photos', filename);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            });
            event.proofPhotos = [];
        }

        const newPhotos = req.files.map(file => file.filename);
        const currentPhotos = event.proofPhotos || [];
        const totalPhotos = currentPhotos.concat(newPhotos);

        if (totalPhotos.length > 5) {
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '../uploads/proof-photos', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
            return res.status(400).json({ message: 'Cannot upload more than 5 photos total' });
        }

        event.proofPhotos = totalPhotos;
        event.proofPhotosUploadedAt = new Date();
        event.proofPhotosUploadedBy = req.user.id;
        await event.save();

        res.json({
            message: 'Proof photos uploaded successfully',
            photoCount: event.proofPhotos.length,
            uploadedAt: event.proofPhotosUploadedAt
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Download Proof Photos as ZIP (Admin only)
exports.downloadProofPhotos = async (req, res) => {
    try {
        const archiver = require('archiver');
        const eventId = req.params.id;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (!event.proofPhotos || event.proofPhotos.length === 0) {
            return res.status(404).json({ message: 'No proof photos uploaded for this event' });
        }

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${event.eventName}_proof_photos.zip"`);

        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        archive.pipe(res);

        event.proofPhotos.forEach((filename, index) => {
            const filePath = path.join(__dirname, '../uploads/proof-photos', filename);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: `photo_${index + 1}${path.extname(filename)}` });
            }
        });

        archive.finalize();

    } catch (error) {
        console.error('Error creating ZIP:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete Individual Proof Photo (Coordinator only)
exports.deleteProofPhoto = async (req, res) => {
    try {
        const eventId = req.params.id;
        const filename = req.params.filename;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete photos for this event' });
        }

        if (!event.proofPhotos || !event.proofPhotos.includes(filename)) {
            return res.status(404).json({ message: 'Photo not found in event' });
        }

        const filePath = path.join(__dirname, '../uploads/proof-photos', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        event.proofPhotos = event.proofPhotos.filter(photo => photo !== filename);
        await event.save();

        res.json({
            message: 'Photo deleted successfully',
            remainingPhotos: event.proofPhotos.length
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
