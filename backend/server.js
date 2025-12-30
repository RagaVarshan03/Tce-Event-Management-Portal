const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const initCronJobs = require('./services/cronService');

dotenv.config();

// Initialize Cron Jobs
initCronJobs();

const app = express();
const http = require('http');
const server = http.createServer(app);
const socketService = require('./services/socketService');
const io = socketService.init(server);

// Make io accessible globally if needed, or use getIO
app.set('socketio', io);

const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: process.env.CLIENT_URL || '*',
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logging Middleware
app.use((req, res, next) => {
    console.log(`[DEBUG] Request: ${req.method} ${req.originalUrl}`);
    next();
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
})
    .then(() => {
        console.log('MongoDB Connected');
        // Start Server only after DB connection
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1); // Exit process on DB connection failure
    });

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected!');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

app.get('/api/health', (req, res) => {
    const state = mongoose.connection.readyState;
    const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
    res.json({
        status: state === 1 ? 'ok' : 'error',
        dbState: states[state] || 'unknown',
        host: mongoose.connection.host
    });
});
