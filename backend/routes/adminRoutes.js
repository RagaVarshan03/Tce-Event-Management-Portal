const express = require('express');
const {
    getStats,
    getAllEvents,
    getAllStudents,
    getAllCoordinators,
    getPendingCoordinators,
    approveCoordinator,
    rejectCoordinator,
    getPendingEvents,
    approveEvent,
    rejectEvent,
    updateEvent,
    deleteEvent,
    markAttendance,
    getEventAttendance,

    getMonthlyAnalytics,
    addAllowedCoordinator,
    getAllowedCoordinators,
    removeAllowedCoordinator
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.get('/stats', protect, authorize('admin'), getStats);
router.get('/events', protect, authorize('admin'), getAllEvents);
router.get('/students', protect, authorize('admin'), getAllStudents);
router.get('/coordinators', protect, authorize('admin'), getAllCoordinators);

// Coordinator approval routes
router.get('/coordinators/pending', protect, authorize('admin'), getPendingCoordinators);
router.put('/coordinators/:id/approve', protect, authorize('admin'), approveCoordinator);
router.put('/coordinators/:id/reject', protect, authorize('admin'), rejectCoordinator);

// Allowed Coordinators Management
router.post('/allowed-coordinators', protect, authorize('admin'), addAllowedCoordinator);
router.get('/allowed-coordinators', protect, authorize('admin'), getAllowedCoordinators);
router.delete('/allowed-coordinators/:id', protect, authorize('admin'), removeAllowedCoordinator);

// Event approval and management routes
router.get('/events/pending', protect, authorize('admin'), getPendingEvents);
router.put('/events/:id/approve', protect, authorize('admin'), approveEvent);
router.put('/events/:id/reject', protect, authorize('admin'), rejectEvent);
router.put('/events/:id', protect, authorize('admin'), upload.single('poster'), updateEvent);
router.delete('/events/:id', protect, authorize('admin'), deleteEvent);

// Attendance tracking routes
router.post('/attendance/:eventId/:studentId', protect, authorize('admin'), markAttendance);
router.get('/attendance/:eventId', protect, authorize('admin'), getEventAttendance);

// Analytics routes
router.get('/analytics/monthly', protect, authorize('admin'), getMonthlyAnalytics);

module.exports = router;
