const router = require('express').Router();
const multer = require('multer');
const { requireTeacher } = require('../middleware/auth');
const {
  createWordBook,
  getWordBook,
  getWords,
  addWord,
  bulkAddWords,
  importCSV,
  deleteWord,
} = require('../controllers/wordbookController');

const upload = multer({ storage: multer.memoryStorage() });

router.use(requireTeacher);

router.post('/', createWordBook);
router.get('/:id', getWordBook);
router.get('/:id/words', getWords);
router.post('/:id/words', addWord);
router.post('/:id/words/bulk', bulkAddWords);
router.post('/:id/import', upload.single('file'), importCSV);
router.delete('/:id/words/:wordId', deleteWord);

module.exports = router;
