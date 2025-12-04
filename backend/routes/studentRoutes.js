const express = require('express');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// Get student profile
router.get('/profile', protect, authorize('student'), async (req, res) => {
    try {
        const student = await Student.findById(req.user.id).populate('registeredEvents');
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
