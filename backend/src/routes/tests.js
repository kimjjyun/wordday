const router = require('express').Router();
const { authenticate, requireTeacher } = require('../middleware/auth');
const {
  createTest,
  startTest,
  finishTest,
  submitAnswers,
  getResults,
} = require('../controllers/testController');

router.post('/', requireTeacher, createTest);
router.patch('/:id/start', requireTeacher, startTest);
router.patch('/:id/finish', requireTeacher, finishTest);
router.post('/:id/submit', authenticate, submitAnswers);
router.get('/:id/results', requireTeacher, getResults);

module.exports = router;
