const router = require('express').Router();
const multer = require('multer');
const { requireTeacher } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createWordBookSchema, addWordSchema } = require('../lib/schemas');
const {
  createWordBook,
  getWordBook,
  getWords,
  addWord,
  bulkAddWords,
  importCSV,
  deleteWord,
  deleteWordBook,
} = require('../controllers/wordbookController');

const upload = multer({ storage: multer.memoryStorage() });

router.use(requireTeacher);

router.post('/',                         validate(createWordBookSchema), createWordBook);
router.get('/:id',                       getWordBook);
router.get('/:id/words',                 getWords);
router.post('/:id/words',                validate(addWordSchema), addWord);
router.post('/:id/words/bulk',           bulkAddWords);
router.post('/:id/import',               upload.single('file'), importCSV);
router.delete('/:id/words/:wordId',      deleteWord);
router.delete('/:id',                    deleteWordBook);

module.exports = router;
