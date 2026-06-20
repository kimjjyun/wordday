const { PrismaClient } = require('@prisma/client');
const { serializeAnswers } = require('../lib/db');

const prisma = new PrismaClient();

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

async function createTestWithWords(req, res, next) {
  try {
    const { classId, words } = req.body;
    if (!classId || !Array.isArray(words) || words.length === 0) {
      return res.status(400).json({ error: 'classId와 words는 필수입니다.' });
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

    const wb = await prisma.wordBook.create({
      data: {
        classId,
        title: `DAY 시험 (${new Date().toLocaleDateString('ko-KR')})`,
        week: 0,
        words: {
          create: words.map((w, i) => ({
            english: w.english,
            korean: w.korean,
            example: w.example || null,
            order: i,
          })),
        },
      },
    });

    const test = await prisma.test.create({
      data: { classId, wordBookId: wb.id, roomCode },
      select: { id: true, roomCode: true, status: true, createdAt: true },
    });
    res.status(201).json(test);
  } catch (err) {
    next(err);
  }
}

async function createTest(req, res, next) {
  try {
    const { classId, wordBookId } = req.body;
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
      data: { classId, wordBookId, roomCode },
      select: { id: true, roomCode: true, status: true, createdAt: true },
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
    const { answers } = req.body; // { wordId: "입력한 답" }

    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { wordBook: { include: { words: true } } },
    });
    if (!test) return res.status(404).json({ error: '테스트를 찾을 수 없습니다.' });

    let score = 0;
    test.wordBook.words.forEach(word => {
      const submitted = (answers[word.id] || '').trim();
      if (submitted === word.korean.trim()) score++;
    });
    const total = test.wordBook.words.length;

    const storedAnswers = serializeAnswers(answers);
    await prisma.testResult.upsert({
      where: { testId_studentId: { testId, studentId } },
      create: { testId, studentId, answers: storedAnswers, score, total },
      update: { answers: storedAnswers, score },
    });

    res.json({ score, total });
  } catch (err) {
    next(err);
  }
}

async function getResults(req, res, next) {
  try {
    const results = await prisma.testResult.findMany({
      where: { testId: req.params.id },
      include: { student: { select: { name: true, studentCode: true } } },
      orderBy: { score: 'desc' },
    });

    const scores = results.map(r => r.score);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const topScore = scores.length ? Math.max(...scores) : 0;

    res.json({
      avg: Math.round(avg * 10) / 10,
      topScore,
      results: results.map(r => ({
        studentName: r.student.name,
        studentCode: r.student.studentCode,
        score: r.score,
        total: r.total,
      })),
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

module.exports = { createTest, createTestWithWords, startTest, finishTest, submitAnswers, getResults, getClassActiveTest };
