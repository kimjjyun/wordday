const router = require('express').Router();
const multer = require('multer');
const { requireTeacher } = require('../middleware/auth');
const {
  createWordBook,
  getWordBook,
  getWords,
  addWord,
  importCSV,
} = require('../controllers/wordbookController');

const upload = multer({ storage: multer.memoryStorage() });

router.use(requireTeacher);

router.post('/', createWordBook);
router.get('/:id', getWordBook);
router.get('/:id/words', getWords);
router.post('/:id/words', addWord);
router.post('/:id/import', upload.single('file'), importCSV);

module.exports = router;
