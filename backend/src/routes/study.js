const router = require('express').Router();
const { requireStudent } = require('../middleware/auth');
const { getTodayWords, submitReview, getStats, getWrongWords } = require('../controllers/studyController');

router.use(requireStudent);

router.get('/today', getTodayWords);
router.post('/review', submitReview);
router.get('/stats', getStats);
router.get('/wrong', getWrongWords);

module.exports = router;
