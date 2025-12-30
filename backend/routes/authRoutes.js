const express = require('express');
const { registerStudent, loginStudent, loginCoordinator, loginAdmin, registerCoordinator, registerAdmin, googleLogin } = require('../controllers/authController');
const router = express.Router();

router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
router.post('/coordinator/register', registerCoordinator);
router.post('/coordinator/login', loginCoordinator);
router.post('/admin/register', registerAdmin);
router.post('/admin/login', loginAdmin);
router.post('/google', googleLogin);

module.exports = router;
