const Student = require('../models/Student');
const Event = require('../models/Event');
const Coordinator = require('../models/Coordinator');
const AllowedCoordinator = require('../models/AllowedCoordinator');
const { sendEmail, emailTemplates } = require('../services/emailService');

exports.getStats = async (req, res) => {
    try {
        const totalStudents = await Student.countDocuments();
        const totalCoordinators = await Coordinator.countDocuments();
        const totalEvents = await Event.countDocuments();

        // Count total event registrations
        const events = await Event.find();
        const totalRegistrations = events.reduce((sum, event) => sum + event.participants.length, 0);

        res.json({
            totalStudents,
            totalCoordinators,
            totalEvents,
            totalRegistrations
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organizer', 'name email department')
            .populate('participants', 'name registerNo email');
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllStudents = async (req, res) => {
    try {
        const students = await Student.find().select('name registerNo email department year');
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllCoordinators = async (req, res) => {
    try {
        const coordinators = await Coordinator.find().select('name email department isApproved approvedAt');
        res.json(coordinators);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get pending coordinators (Deprecated but kept for now)
exports.getPendingCoordinators = async (req, res) => {
    try {
        const coordinators = await Coordinator.find({ isApproved: false })
            .select('name email department createdAt')
            .sort({ createdAt: -1 });
        res.json(coordinators);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add allowed coordinator
exports.addAllowedCoordinator = async (req, res) => {
    try {
        const { email, department } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (!department) {
            return res.status(400).json({ message: 'Department is required' });
        }

        const existing = await AllowedCoordinator.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'Email is already allowed' });
        }

        const allowed = await AllowedCoordinator.create({
            email,
            department,
            addedBy: req.user.id
        });

        // Check if a coordinator account already exists for this email
        const existingCoordinator = await Coordinator.findOne({ email });
        if (existingCoordinator && !existingCoordinator.isApproved) {
            existingCoordinator.isApproved = true;
            existingCoordinator.approvedBy = req.user.id;
            existingCoordinator.approvedAt = new Date();
            existingCoordinator.rejectionReason = undefined;
            await existingCoordinator.save();
            console.log(`Auto-approved existing coordinator: ${email}`);
        }

        res.status(201).json({ message: 'Coordinator email added successfully', allowed });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get allowed coordinators
exports.getAllowedCoordinators = async (req, res) => {
    try {
        const allowed = await AllowedCoordinator.find().sort({ createdAt: -1 });
        res.json(allowed);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Remove allowed coordinator
exports.removeAllowedCoordinator = async (req, res) => {
    try {
        const { id } = req.params;
        await AllowedCoordinator.findByIdAndDelete(id);
        res.json({ message: 'Coordinator email removed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Approve coordinator
exports.approveCoordinator = async (req, res) => {
    try {
        const coordinator = await Coordinator.findByIdAndUpdate(
            req.params.id,
            {
                isApproved: true,
                approvedBy: req.user.id,
                approvedAt: new Date(),
                $unset: { rejectionReason: 1 }
            },
            { new: true }
        );

        if (!coordinator) {
            return res.status(404).json({ message: 'Coordinator not found' });
        }

        res.json({ message: 'Coordinator approved successfully', coordinator });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reject coordinator
exports.rejectCoordinator = async (req, res) => {
    try {
        const { reason } = req.body;
        const coordinator = await Coordinator.findByIdAndUpdate(
            req.params.id,
            {
                isApproved: false,
                rejectionReason: reason || 'No reason provided',
                $unset: { approvedBy: 1, approvedAt: 1 }
            },
            { new: true }
        );

        if (!coordinator) {
            return res.status(404).json({ message: 'Coordinator not found' });
        }

        res.json({ message: 'Coordinator rejected', coordinator });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get pending events
exports.getPendingEvents = async (req, res) => {
    try {
        const events = await Event.find({ status: 'pending' })
            .populate('organizer', 'name email department')
            .sort({ createdAt: -1 });
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Approve event
exports.approveEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            {
                status: 'approved',
                approvedBy: req.user.id,
                approvedAt: new Date(),
                $unset: { rejectionReason: 1 }
            },
            { new: true }
        ).populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ message: 'Event approved successfully', event });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reject event
exports.rejectEvent = async (req, res) => {
    try {
        const { reason } = req.body;
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            {
                status: 'rejected',
                rejectionReason: reason || 'No reason provided',
                $unset: { approvedBy: 1, approvedAt: 1 }
            },
            { new: true }
        ).populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ message: 'Event rejected', event });

        // Send rejection email to coordinator
        if (event.organizer && event.organizer.email) {
            const emailOptions = emailTemplates.eventRejected(
                event.organizer.name,
                event.organizer.email,
                event.eventName,
                reason || 'No reason provided'
            );

            sendEmail(emailOptions).then(result => {
                if (result.success) {
                    console.log(`Rejection email sent to ${event.organizer.email}`);
                } else {
                    console.error(`Failed to send rejection email to ${event.organizer.email}:`, result.error);
                }
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Edit any event (Admin only)
exports.updateEvent = async (req, res) => {
    try {
        const { eventName, description, date, venue, clubName } = req.body;

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

        const event = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('organizer', 'name email');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ message: 'Event updated successfully', event });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete any event (Admin only)
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Attendance Tracking
const Attendance = require('../models/Attendance');

// Mark student attendance
exports.markAttendance = async (req, res) => {
    try {
        const { eventId, studentId } = req.params;

        const attendance = await Attendance.findOneAndUpdate(
            { event: eventId, student: studentId },
            {
                checkedIn: true,
                checkInTime: new Date()
            },
            { upsert: true, new: true }
        ).populate('student', 'name registerNo email');

        res.json({ message: 'Attendance marked successfully', attendance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get event attendance
exports.getEventAttendance = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId)
            .populate('participants', 'name registerNo email department');

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const attendance = await Attendance.find({ event: eventId })
            .populate('student', 'name registerNo email department');

        const attendanceMap = {};
        attendance.forEach(att => {
            if (att.student) {
                attendanceMap[att.student._id.toString()] = att;
            }
        });

        const attendanceList = event.participants.map(student => ({
            student,
            checkedIn: attendanceMap[student._id.toString()]?.checkedIn || false,
            checkInTime: attendanceMap[student._id.toString()]?.checkInTime || null
        }));

        res.json({
            event: {
                _id: event._id,
                eventName: event.eventName,
                date: event.date,
                venue: event.venue
            },
            totalRegistered: event.participants.length,
            totalAttended: attendance.filter(a => a.checkedIn).length,
            attendanceList
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Monthly analytics
exports.getMonthlyAnalytics = async (req, res) => {
    try {
        const { month, year } = req.query;
        const startDate = new Date(year || new Date().getFullYear(), month ? month - 1 : 0, 1);
        const endDate = new Date(year || new Date().getFullYear(), month ? parseInt(month) : 12, 0);

        const events = await Event.find({
            date: { $gte: startDate, $lte: endDate }
        }).populate('organizer', 'name department');

        const totalEvents = events.length;
        const approvedEvents = events.filter(e => e.status === 'approved').length;
        const pendingEvents = events.filter(e => e.status === 'pending').length;
        const rejectedEvents = events.filter(e => e.status === 'rejected').length;

        const totalRegistrations = events.reduce((sum, event) => sum + event.participants.length, 0);

        // Get attendance for events in this period
        const eventIds = events.map(e => e._id);
        const attendanceRecords = await Attendance.find({
            event: { $in: eventIds },
            checkedIn: true
        });

        const totalAttendance = attendanceRecords.length;
        const attendanceRate = totalRegistrations > 0
            ? Math.round((totalAttendance / totalRegistrations) * 100)
            : 0;

        // Department-wise breakdown
        const departmentCounts = {};
        events.forEach(event => {
            if (event.organizer && event.organizer.department) {
                const dept = event.organizer.department;
                departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
            }
        });

        const departmentData = Object.keys(departmentCounts).map(dept => ({
            name: dept,
            count: departmentCounts[dept]
        }));

        res.json({
            period: {
                month: month || 'All',
                year: year || new Date().getFullYear(),
                startDate,
                endDate
            },
            summary: {
                totalEvents,
                approvedEvents,
                pendingEvents,
                rejectedEvents,
                totalRegistrations,
                totalAttendance,
                attendanceRate
            },
            events: events.map(e => ({
                _id: e._id,
                eventName: e.eventName,
                date: e.date,
                status: e.status,
                organizer: e.organizer,
                registrations: e.participants.length
            })),
            departmentData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Test Email Configuration
exports.testEmailConfig = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const emailOptions = emailTemplates.registrationConfirmation(
            'Test Admin',
            email,
            'Test Event System Check',
            new Date(),
            'Test Venue'
        );

        const result = await sendEmail(emailOptions);

        if (result.success) {
            res.json({
                message: process.env.MOCK_EMAIL === 'true' ? 'Success: Simulated email (MOCK MODE active)' : 'Success: Test email sent successfully',
                debug: {
                    envUser: process.env.EMAIL_USER ? 'Set' : 'Missing',
                    envPass: process.env.EMAIL_PASS ? 'Set' : 'Missing',
                    isMock: process.env.MOCK_EMAIL === 'true'
                }
            });
        } else {
            res.status(500).json({
                message: `Failed to send email: ${result.error || 'Unknown error'}`,
                debug: {
                    envUser: process.env.EMAIL_USER ? 'Set' : 'Missing',
                    envPass: process.env.EMAIL_PASS ? 'Set' : 'Missing',
                    isMock: process.env.MOCK_EMAIL === 'true',
                    fullError: result.error
                }
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
