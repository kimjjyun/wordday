const router = require('express').Router();
const { requireTeacher } = require('../middleware/auth');
const {
  createClass,
  getClasses,
  getClass,
  bulkCreateStudents,
  deleteStudent,
} = require('../controllers/classController');

router.use(requireTeacher);

router.post('/', createClass);
router.get('/', getClasses);
router.get('/:id', getClass);
router.post('/:id/students/bulk', bulkCreateStudents);
router.delete('/:id/students/:studentId', deleteStudent);

module.exports = router;
