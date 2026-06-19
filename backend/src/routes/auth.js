const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { teacherRegister, teacherLogin, studentLogin, forgotPassword, resetPassword, changeStudentPassword } = require('../controllers/authController');

router.post('/teacher/register', teacherRegister);
router.post('/teacher/login', teacherLogin);
router.post('/student/login', studentLogin);
router.post('/teacher/forgot-password', forgotPassword);
router.post('/teacher/reset-password', resetPassword);
router.patch('/student/password', authenticate, changeStudentPassword);

module.exports = router;
