const router = require('express').Router();
const { teacherRegister, teacherLogin, studentLogin, forgotPassword, verifySecurityAnswer, setSecurityQuestion, resetPassword, changeStudentPassword } = require('../controllers/authController');
const { requireStudent, requireTeacher } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  teacherRegisterSchema,
  teacherLoginSchema,
  studentLoginSchema,
  changeStudentPasswordSchema,
  resetPasswordSchema,
} = require('../lib/schemas');

router.post('/teacher/register', validate(teacherRegisterSchema), teacherRegister);
router.post('/teacher/login',    validate(teacherLoginSchema),    teacherLogin);
router.post('/student/login',    validate(studentLoginSchema),    studentLogin);
router.post('/teacher/forgot-password', forgotPassword);
router.post('/teacher/verify-security', verifySecurityAnswer);
router.post('/teacher/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/teacher/security-question', requireTeacher, setSecurityQuestion);
router.post('/student/change-password', requireStudent, validate(changeStudentPasswordSchema), changeStudentPassword);

module.exports = router;
