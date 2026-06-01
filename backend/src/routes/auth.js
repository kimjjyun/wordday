const router = require('express').Router();
const { teacherRegister, teacherLogin, studentLogin, forgotPassword, resetPassword } = require('../controllers/authController');

router.post('/teacher/register', teacherRegister);
router.post('/teacher/login', teacherLogin);
router.post('/student/login', studentLogin);
router.post('/teacher/forgot-password', forgotPassword);
router.post('/teacher/reset-password', resetPassword);

module.exports = router;
