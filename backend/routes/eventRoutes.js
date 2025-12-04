const express = require('express');
const { createEvent, getAllEvents, registerForEvent, getMyEvents, getCoordinatorEvents, notifyParticipants } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/create', protect, authorize('coordinator'), createEvent);
router.get('/all', getAllEvents);
router.post('/:id/register', protect, authorize('student'), registerForEvent);
router.get('/my-events', protect, authorize('student'), getMyEvents);
router.get('/coordinator-events', protect, authorize('coordinator'), getCoordinatorEvents);
router.post('/:id/notify', protect, authorize('admin', 'coordinator'), notifyParticipants);

module.exports = router;
