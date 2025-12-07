const Event = require('../models/Event');
const Student = require('../models/Student');
const { sendEmail, emailTemplates } = require('../services/emailService');
const { generateCertificate } = require('../services/certificateService');
const path = require('path');
const fs = require('fs');

// Create Event (Coordinator only)
exports.createEvent = async (req, res) => {
    try {
        const { eventName, description, date, venue, clubName } = req.body;
        const eventData = {
            eventName,
            description,
            date,
            venue,
            organizer: req.user.id
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
    } catch (error) {
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
        // Return empty array if database is not connected
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

        if (event.participants.includes(studentId)) {
            return res.status(400).json({ message: 'Already registered' });
        }

        event.participants.push(studentId);
        await event.save();

        const student = await Student.findById(studentId);
        student.registeredEvents.push(eventId);
        await student.save();

        res.json({ message: 'Registered successfully' });

        // Send confirmation email
        if (student.email) {
            const emailOptions = emailTemplates.registrationConfirmation(
                student.name,
                student.email,
                event.eventName,
                event.date,
                event.venue
            );
            sendEmail(emailOptions).then(result => {
                if (result.success) {
                    console.log(`Confirmation email sent to ${student.email}`);
                } else {
                    console.error(`Failed to send confirmation email to ${student.email}:`, result.error);
                }
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get My Events (Student only)
exports.getMyEvents = async (req, res) => {
    try {
        const student = await Student.findById(req.user.id).populate('registeredEvents');
        res.json(student.registeredEvents);
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

// Update Event (Coordinator only - their own events)
exports.updateEvent = async (req, res) => {
    try {
        const { eventName, description, date, venue, clubName } = req.body;

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
            venue
        };

        // Add clubName if provided
        if (clubName !== undefined) {
            updateData.clubName = clubName;
        }

        // Add poster if file was uploaded
        if (req.file) {
            updateData.poster = req.file.filename;
        }

        // Update event
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('organizer', 'name email department');

        // Notify participants if there are significant changes
        if (changes.length > 0 && event.participants && event.participants.length > 0) {
            // Find all participants
            const Student = require('../models/Student');
            const participants = await Student.find({
                _id: { $in: event.participants }
            });

            // Send emails concurrently
            Promise.all(participants.map(student => {
                const emailOptions = emailTemplates.eventUpdate(
                    student.name,
                    student.email,
                    eventName,
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

        // Filter participants who attended
        // For now, sending to all registered participants

        const participants = event.participants;
        if (participants.length === 0) {
            return res.status(400).json({ message: 'No participants registered for this event.' });
        }

        let sentCount = 0;

        // Process sequentially
        for (const student of participants) {
            if (student.email) {
                try {
                    // Generate PDF
                    const pdfBuffer = await generateCertificate(
                        student.name,
                        event.eventName,
                        event.date,
                        event.venue,
                        event.clubName
                    );

                    // Prepare Email with Attachment
                    const emailOptions = emailTemplates.certificateDistribution(
                        student.name,
                        student.email,
                        event.eventName
                    );

                    // Add Attachment
                    emailOptions.attachments = [{
                        filename: `Certificate_${event.eventName.replace(/\s+/g, '_')}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }];

                    // Send Email
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

        // Verify the coordinator owns this event
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to upload photos for this event' });
        }

        // Check if event is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);

        if (eventDate >= today) {
            return res.status(400).json({ message: 'Can only upload proof photos for past events' });
        }

        // Check if files were uploaded
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const replaceAll = req.body.replaceAll === 'true';

        // If replace all, delete old photos
        if (replaceAll && event.proofPhotos && event.proofPhotos.length > 0) {
            event.proofPhotos.forEach(filename => {
                const oldFilePath = path.join(__dirname, '../uploads/proof-photos', filename);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            });
            event.proofPhotos = [];
        }

        // Add new photos
        const newPhotos = req.files.map(file => file.filename);
        const currentPhotos = event.proofPhotos || [];
        const totalPhotos = currentPhotos.concat(newPhotos);

        // Check if total exceeds 5
        if (totalPhotos.length > 5) {
            // Delete uploaded files
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '../uploads/proof-photos', file.filename);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
            return res.status(400).json({ message: 'Cannot upload more than 5 photos total' });
        }

        // Update event with new photos
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

        // Set response headers for ZIP download
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${event.eventName}_proof_photos.zip"`);

        // Create ZIP archive
        const archive = archiver('zip', {
            zlib: { level: 9 } // Compression level
        });

        // Pipe archive to response
        archive.pipe(res);

        // Add each photo to the archive
        event.proofPhotos.forEach((filename, index) => {
            const filePath = path.join(__dirname, '../uploads/proof-photos', filename);
            if (fs.existsSync(filePath)) {
                archive.file(filePath, { name: `photo_${index + 1}${path.extname(filename)}` });
            }
        });

        // Finalize the archive
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

        // Verify the coordinator owns this event
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete photos for this event' });
        }

        // Check if photo exists in event
        if (!event.proofPhotos || !event.proofPhotos.includes(filename)) {
            return res.status(404).json({ message: 'Photo not found in event' });
        }

        // Delete file from filesystem
        const filePath = path.join(__dirname, '../uploads/proof-photos', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove from event
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
