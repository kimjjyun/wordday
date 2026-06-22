const router = require('express').Router();
const { teacherRegister, teacherLogin, studentLogin, forgotPassword, verifySecurityAnswer, setSecurityQuestion, resetPassword, changeStudentPassword, cleanupTestAccounts } = require('../controllers/authController');
const { requireStudent, requireTeacher } = require('../middleware/auth');

router.post('/teacher/register', teacherRegister);
router.post('/teacher/login', teacherLogin);
router.post('/student/login', studentLogin);
router.post('/teacher/forgot-password', forgotPassword);
router.post('/teacher/verify-security', verifySecurityAnswer);
router.post('/teacher/reset-password', resetPassword);
router.post('/teacher/security-question', requireTeacher, setSecurityQuestion);
router.post('/teacher/_cleanup-test', cleanupTestAccounts);
router.post('/student/change-password', requireStudent, changeStudentPassword);

module.exports = router;
