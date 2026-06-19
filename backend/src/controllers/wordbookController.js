const { PrismaClient } = require('@prisma/client');
const csv = require('csv-parser');
const { Readable } = require('stream');

const prisma = new PrismaClient();

async function createWordBook(req, res, next) {
  try {
    const { classId, title, week } = req.body;
    if (!classId || !title || week === undefined) {
      return res.status(400).json({ error: 'classId, title, week는 필수입니다.' });
    }

    const cls = await prisma.class.findFirst({
      where: { id: classId, teacherId: req.user.sub },
    });
    if (!cls) return res.status(404).json({ error: '학급을 찾을 수 없습니다.' });

    const wb = await prisma.wordBook.create({
      data: { title, week: Number(week), classId },
      include: { _count: { select: { words: true } } },
    });
    res.status(201).json({ id: wb.id, title: wb.title, week: wb.week, wordCount: wb._count.words });
  } catch (err) {
    next(err);
  }
}

async function getWordBook(req, res, next) {
  try {
    const wb = await prisma.wordBook.findUnique({
      where: { id: req.params.id },
      include: { words: { orderBy: { order: 'asc' } } },
    });
    if (!wb) return res.status(404).json({ error: '단어장을 찾을 수 없습니다.' });
    res.json(wb);
  } catch (err) {
    next(err);
  }
}

async function getWords(req, res, next) {
  try {
    const words = await prisma.word.findMany({
      where: { wordBookId: req.params.id },
      orderBy: { order: 'asc' },
    });
    res.json(words);
  } catch (err) {
    next(err);
  }
}

async function addWord(req, res, next) {
  try {
    const { english, korean, example } = req.body;
    if (!english || !korean) {
      return res.status(400).json({ error: '영단어와 뜻은 필수입니다.' });
    }

    const maxOrder = await prisma.word.aggregate({
      where: { wordBookId: req.params.id },
      _max: { order: true },
    });
    const order = (maxOrder._max.order ?? -1) + 1;

    const { pronunciation } = req.body;
    const word = await prisma.word.create({
      data: { english, korean, example: example || null, pronunciation: pronunciation || null, wordBookId: req.params.id, order },
    });
    res.status(201).json(word);
  } catch (err) {
    next(err);
  }
}

async function importCSV(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV 파일을 업로드하세요.' });

    const wordBookId = req.params.id;
    const wb = await prisma.wordBook.findUnique({ where: { id: wordBookId } });
    if (!wb) return res.status(404).json({ error: '단어장을 찾을 수 없습니다.' });

    const maxOrder = await prisma.word.aggregate({
      where: { wordBookId },
      _max: { order: true },
    });
    let order = (maxOrder._max.order ?? -1) + 1;

    const rows = [];
    const errors = [];

    await new Promise((resolve, reject) => {
      const stream = Readable.from(req.file.buffer.toString('utf-8'));
      stream
        .pipe(csv())
        .on('data', row => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    const toCreate = [];
    for (const row of rows) {
      const english = (row.english || '').trim();
      const korean = (row.korean || '').trim();
      if (!english || !korean) {
        errors.push({ row, reason: 'english 또는 korean 누락' });
        continue;
      }
      toCreate.push({
        english,
        korean,
        example: (row.example || '').trim() || null,
        pronunciation: (row.pronunciation || '').trim() || null,
        wordBookId,
        order: order++,
      });
    }

    await prisma.word.createMany({ data: toCreate });
    res.status(201).json({ imported: toCreate.length, errors });
  } catch (err) {
    next(err);
  }
}

async function bulkAddWords(req, res, next) {
  try {
    const words = req.body;
    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: '단어 목록이 비어있습니다.' });
    }

    const wb = await prisma.wordBook.findUnique({ where: { id: req.params.id } });
    if (!wb) return res.status(404).json({ error: '단어장을 찾을 수 없습니다.' });

    const maxOrder = await prisma.word.aggregate({
      where: { wordBookId: req.params.id },
      _max: { order: true },
    });
    let order = (maxOrder._max.order ?? -1) + 1;

    const toCreate = words
      .filter(w => w.english?.trim() && w.korean?.trim())
      .map(w => ({
        english: w.english.trim(),
        korean: w.korean.trim(),
        example: w.example?.trim() || null,
        pronunciation: w.pronunciation?.trim() || null,
        wordBookId: req.params.id,
        order: order++,
      }));

    await prisma.word.createMany({ data: toCreate });
    res.status(201).json({ added: toCreate.length });
  } catch (err) {
    next(err);
  }
}

async function deleteWord(req, res, next) {
  try {
    const word = await prisma.word.findFirst({
      where: { id: req.params.wordId, wordBookId: req.params.id },
    });
    if (!word) return res.status(404).json({ error: '단어를 찾을 수 없습니다.' });

    await prisma.studyRecord.deleteMany({ where: { wordId: word.id } });
    await prisma.word.delete({ where: { id: word.id } });

    res.json({ message: '단어가 삭제되었습니다.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createWordBook, getWordBook, getWords, addWord, bulkAddWords, importCSV, deleteWord };
