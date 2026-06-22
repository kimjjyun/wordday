const router = require('express').Router();
const { requireTeacher } = require('../middleware/auth');
const {
  createClass,
  getClasses,
  getClass,
  bulkCreateStudents,
  deleteStudent,
  updateStudent,
} = require('../controllers/classController');

router.use(requireTeacher);

router.post('/', createClass);
router.get('/', getClasses);
router.get('/:id', getClass);
router.post('/:id/students/bulk', bulkCreateStudents);
router.delete('/:id/students/:studentId', deleteStudent);
router.put('/:id/students/:studentId', updateStudent);

module.exports = router;
