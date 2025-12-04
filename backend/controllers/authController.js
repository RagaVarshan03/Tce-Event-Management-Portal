const Student = require('../models/Student');
const Coordinator = require('../models/Coordinator');
const Admin = require('../models/Admin');
const AllowedCoordinator = require('../models/AllowedCoordinator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { sendEmail, emailTemplates } = require('../services/emailService');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

// Student Auth
exports.registerStudent = async (req, res) => {
    try {
        const { name, email, password, registerNo, department, year } = req.body;

        if (!email.endsWith('@student.tce.edu')) {
            return res.status(400).json({ message: 'Only @student.tce.edu emails are allowed.' });
        }

        const student = await Student.create({ name, email, password, registerNo, department, year });

        // Send Welcome Email
        console.log('Sending welcome email to:', email);
        const emailResult = await sendEmail(emailTemplates.welcome(name, email));

        if (!emailResult.success) {
            console.error('Welcome email failed but continuing registration');
        }

        res.status(201).json({ message: 'Student registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'User with this email or register number already exists' });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;
        const student = await Student.findOne({ email });
        if (!student || !(await student.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({
            token: generateToken(student._id, 'student'),
            user: { ...student._doc, role: 'student' }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Coordinator Auth
exports.registerCoordinator = async (req, res) => {
    try {
        const { name, email, password, department } = req.body;

        // Check if email is allowed
        const isAllowed = await AllowedCoordinator.findOne({ email });
        if (!isAllowed) {
            return res.status(403).json({ message: 'This email is not authorized to register as a coordinator. Please contact the administrator.' });
        }

        const coordinator = await Coordinator.create({
            name,
            email,
            password,
            department,
            isApproved: true, // Auto-approve since they are on the allowed list
            approvedAt: new Date()
        });
        res.status(201).json({ message: 'Coordinator registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.loginCoordinator = async (req, res) => {
    try {
        const { email, password } = req.body;
        const coordinator = await Coordinator.findOne({ email });
        if (!coordinator || !(await coordinator.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if coordinator is approved
        if (!coordinator.isApproved) {
            // Check if they are in the allowed list (Retroactive approval)
            const isAllowed = await AllowedCoordinator.findOne({ email });

            if (isAllowed) {
                coordinator.isApproved = true;
                coordinator.approvedAt = new Date();
                // We don't have an admin ID here, so we leave approvedBy undefined or set it to a system value if needed
                // But for now, just approving is enough
                await coordinator.save();
                console.log(`Auto-approved coordinator during login: ${email}`);
            } else {
                return res.status(403).json({
                    message: 'Your account is pending approval by the administrator. Please wait for approval to access your account.'
                });
            }
        }

        res.json({
            token: generateToken(coordinator._id, 'coordinator'),
            user: { ...coordinator._doc, role: 'coordinator' }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Admin Auth
exports.registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!email.endsWith('@tce.edu.in')) {
            return res.status(400).json({ message: 'Only @tce.edu.in emails are allowed for admin registration.' });
        }

        const admin = await Admin.create({ name, email, password });
        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email.endsWith('@tce.edu.in')) {
            return res.status(400).json({ message: 'Only @tce.edu.in emails are allowed for admin login.' });
        }

        const admin = await Admin.findOne({ email });
        if (!admin || !(await admin.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({
            token: generateToken(admin._id, 'admin'),
            user: { ...admin._doc, role: 'admin' }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
