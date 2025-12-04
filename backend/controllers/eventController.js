const Event = require('../models/Event');
const Student = require('../models/Student');
const { sendEmail, emailTemplates } = require('../services/emailService');

// Create Event (Coordinator only)
exports.createEvent = async (req, res) => {
    try {
        const { eventName, description, date, venue } = req.body;
        const event = await Event.create({
            eventName,
            description,
            date,
            venue,
            organizer: req.user.id
        });
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
