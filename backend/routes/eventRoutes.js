const express = require('express');
const { createEvent, getAllEvents, registerForEvent, unregisterForEvent, submitFeedback, requestFeedback, getMyEvents, getCoordinatorEvents, notifyParticipants, updateEvent, uploadAttendance, downloadAttendance, uploadProofPhotos, downloadProofPhotos, deleteProofPhoto, distributeCertificates } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.post('/create', protect, authorize('coordinator'), upload.single('poster'), createEvent);
router.put('/:id', protect, authorize('coordinator'), upload.single('poster'), updateEvent);
router.get('/all', getAllEvents);
router.post('/:id/register', protect, authorize('student'), registerForEvent);
router.post('/:id/unregister', protect, authorize('student'), unregisterForEvent);
router.post('/:id/feedback', protect, authorize('student'), submitFeedback);
router.post('/:id/request-feedback', protect, authorize('coordinator'), requestFeedback);
router.get('/my-events', protect, authorize('student'), getMyEvents);
router.get('/coordinator-events', protect, authorize('coordinator'), getCoordinatorEvents);
router.post('/:id/notify', protect, authorize('admin', 'coordinator'), notifyParticipants);

// Attendance routes
router.post('/:id/upload-attendance', protect, authorize('coordinator'), upload.uploadAttendance.single('attendanceSheet'), uploadAttendance);
router.get('/:id/download-attendance', protect, authorize('admin'), downloadAttendance);
router.post('/:id/distribute-certificates', protect, authorize('coordinator'), distributeCertificates);

// Proof photos routes
router.post('/:id/upload-proof-photos', protect, authorize('coordinator'), upload.uploadProofPhotos.array('proofPhotos', 5), uploadProofPhotos);
router.get('/:id/download-proof-photos', protect, authorize('admin'), downloadProofPhotos);
router.delete('/:id/proof-photos/:filename', protect, authorize('coordinator'), deleteProofPhoto);

module.exports = router;
