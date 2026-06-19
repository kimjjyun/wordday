const { PrismaClient } = require('@prisma/client');
const { serializeAnswers, parseAnswers } = require('../lib/db');

const prisma = new PrismaClient();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

function getDayWords(words, dayNumber, wordsPerDay) {
  if (!dayNumber || dayNumber <= 0) return words;
  const start = (dayNumber - 1) * wordsPerDay;
  const end   = dayNumber * wordsPerDay;
  return words.slice(start, end);
}

async function createTest(req, res, next) {
  try {
    const { classId, wordBookId, dayNumber = 0 } = req.body;
    if (!classId || !wordBookId) {
      return res.status(400).json({ error: 'classId와 wordBookId는 필수입니다.' });
    }

    const cls = await prisma.class.findFirst({
      where: { id: classId, teacherId: req.user.sub },
    });
    if (!cls) return res.status(404).json({ error: '학급을 찾을 수 없습니다.' });

    let roomCode;
    let exists = true;
    while (exists) {
      roomCode = generateRoomCode();
      exists = await prisma.test.findUnique({ where: { roomCode } });
    }

    const test = await prisma.test.create({
      data: { classId, wordBookId, roomCode, dayNumber: Number(dayNumber) },
      select: { id: true, roomCode: true, status: true, dayNumber: true, createdAt: true },
    });
    res.status(201).json(test);
  } catch (err) {
    next(err);
  }
}

async function startTest(req, res, next) {
  try {
    const test = await prisma.test.update({
      where: { id: req.params.id },
      data: { status: 'active' },
      select: { id: true, status: true, roomCode: true },
    });
    res.json(test);
  } catch (err) {
    next(err);
  }
}

async function finishTest(req, res, next) {
  try {
    const test = await prisma.test.update({
      where: { id: req.params.id },
      data: { status: 'finished', finishedAt: new Date() },
      select: { id: true, status: true },
    });
    res.json(test);
  } catch (err) {
    next(err);
  }
}

async function submitAnswers(req, res, next) {
  try {
    const studentId = req.user.sub;
    const testId = req.params.id;
    const { answers } = req.body;

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { wordBook: { include: { words: { orderBy: { order: 'asc' } } } } },
    });
    if (!test) return res.status(404).json({ error: '테스트를 찾을 수 없습니다.' });

    const dayWords = getDayWords(test.wordBook.words, test.dayNumber, test.wordBook.wordsPerDay);

    let score = 0;
    dayWords.forEach(word => {
      if ((answers[word.id] || '').trim() === word.korean.trim()) score++;
    });
    const total = dayWords.length;

    await prisma.testResult.upsert({
      where: { testId_studentId: { testId, studentId } },
      create: { testId, studentId, answers: serializeAnswers(answers), score, total },
      update: { answers: serializeAnswers(answers), score, total },
    });

    res.json({ score, total });
  } catch (err) {
    next(err);
  }
}

async function getResults(req, res, next) {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: { wordBook: { include: { words: { orderBy: { order: 'asc' } } } } },
    });
    if (!test) return res.status(404).json({ error: '테스트를 찾을 수 없습니다.' });

    const dayWords = getDayWords(test.wordBook.words, test.dayNumber, test.wordBook.wordsPerDay);

    const results = await prisma.testResult.findMany({
      where: { testId: req.params.id },
      include: { student: { select: { name: true, studentCode: true } } },
      orderBy: { score: 'desc' },
    });

    const scores = results.map(r => r.score);
    const avg      = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const topScore = scores.length ? Math.max(...scores) : 0;

    res.json({
      avg: Math.round(avg * 10) / 10,
      topScore,
      dayNumber: test.dayNumber,
      words: dayWords.map(w => ({ id: w.id, english: w.english, korean: w.korean })),
      results: results.map(r => {
        const answers = parseAnswers(r.answers);
        const detail  = dayWords.map(w => ({
          wordId:  w.id,
          english: w.english,
          korean:  w.korean,
          correct: (answers[w.id] || '').trim() === w.korean.trim(),
        }));
        return {
          studentName: r.student.name,
          studentCode: r.student.studentCode,
          score:       r.score,
          total:       r.total,
          detail,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
}

async function getClassActiveTest(req, res, next) {
  try {
    const classId = req.user.classId;
    if (!classId) return res.json(null);
    const test = await prisma.test.findFirst({
      where: { classId, status: { in: ['waiting', 'active'] } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, roomCode: true, status: true },
    });
    res.json(test);
  } catch (err) { next(err); }
}

async function getWordBookTests(req, res, next) {
  try {
    const tests = await prisma.test.findMany({
      where: { wordBookId: req.params.wbId, status: 'finished' },
      include: {
        results: { select: { score: true, total: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    res.json(tests.map(t => ({
      id:           t.id,
      dayNumber:    t.dayNumber,
      createdAt:    t.createdAt,
      studentCount: t.results.length,
      avg:          t.results.length
        ? Math.round(t.results.reduce((a, b) => a + b.score, 0) / t.results.length * 10) / 10
        : 0,
      total: t.results[0]?.total ?? 0,
    })));
  } catch (err) {
    next(err);
  }
}

module.exports = { createTest, startTest, finishTest, submitAnswers, getResults, getClassActiveTest, getWordBookTests };
