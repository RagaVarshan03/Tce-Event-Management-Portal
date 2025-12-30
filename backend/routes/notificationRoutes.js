const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.get('/', notificationController.getUserNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/mark-all-read', notificationController.markAllAsRead);

module.exports = router;
