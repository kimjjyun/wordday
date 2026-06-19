const router = require('express').Router();
const { authenticate, requireTeacher } = require('../middleware/auth');
const {
  createTest,
  startTest,
  finishTest,
  submitAnswers,
  getResults,
  getClassActiveTest,
  getWordBookTests,
} = require('../controllers/testController');

router.get('/class/active',           authenticate,   getClassActiveTest);
router.get('/wordbook/:wbId',         requireTeacher, getWordBookTests);
router.post('/',                      requireTeacher, createTest);
router.patch('/:id/start',            requireTeacher, startTest);
router.patch('/:id/finish',           requireTeacher, finishTest);
router.post('/:id/submit',            authenticate,   submitAnswers);
router.get('/:id/results',            requireTeacher, getResults);

module.exports = router;
