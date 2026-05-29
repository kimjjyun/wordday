const router = require('express').Router();
const { teacherRegister, teacherLogin, studentLogin } = require('../controllers/authController');

router.post('/teacher/register', teacherRegister);
router.post('/teacher/login', teacherLogin);
router.post('/student/login', studentLogin);

module.exports = router;
