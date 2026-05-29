const router = require('express').Router();
const { requireTeacher } = require('../middleware/auth');
const {
  createClass,
  getClasses,
  getClass,
  bulkCreateStudents,
} = require('../controllers/classController');

router.use(requireTeacher);

router.post('/', createClass);
router.get('/', getClasses);
router.get('/:id', getClass);
router.post('/:id/students/bulk', bulkCreateStudents);

module.exports = router;
