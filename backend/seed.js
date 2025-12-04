const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Coordinator = require('./models/Coordinator');
const Student = require('./models/Student');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_management';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected for Seeding');

        try {
            // Create Admin
            const adminExists = await Admin.findOne({ email: 'admin@portal.com' });
            if (!adminExists) {
                await Admin.create({
                    email: 'admin@portal.com',
                    password: 'adminpassword'
                });
                console.log('Admin created: admin@portal.com / adminpassword');
            } else {
                console.log('Admin already exists');
            }

            // Create Coordinator
            const coordinatorExists = await Coordinator.findOne({ email: 'coordinator@portal.com' });
            if (!coordinatorExists) {
                await Coordinator.create({
                    name: 'Dr. Coordinator',
                    email: 'coordinator@portal.com',
                    password: 'coordinatorpassword',
                    department: 'CSBS'
                });
                console.log('Coordinator created: coordinator@portal.com / coordinatorpassword');
            } else {
                console.log('Coordinator already exists');
            }

            // Create Dummy Student
            const studentExists = await Student.findOne({ email: 'student@student.tce.edu' });
            if (!studentExists) {
                await Student.create({
                    name: 'Dummy Student',
                    email: 'student@student.tce.edu',
                    password: 'studentpassword',
                    registerNo: '999999',
                    department: 'CSBS',
                    year: '3rd'
                });
                console.log('Student created: student@student.tce.edu / studentpassword');
            } else {
                console.log('Student already exists');
            }
        } catch (error) {
            console.error('Seeding Error:', error);
        }

        process.exit();
    })
    .catch(err => {
        console.error('Connection Error:', err);
        process.exit(1);
    });
