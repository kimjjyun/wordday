const router = require('express').Router();
const { teacherRegister, teacherLogin, studentLogin, forgotPassword, resetPassword, changeStudentPassword } = require('../controllers/authController');
const { requireStudent } = require('../middleware/auth');

router.post('/teacher/register', teacherRegister);
router.post('/teacher/login', teacherLogin);
router.post('/student/login', studentLogin);
router.post('/teacher/forgot-password', forgotPassword);
router.post('/teacher/reset-password', resetPassword);
router.post('/student/change-password', requireStudent, changeStudentPassword);

module.exports = router;
