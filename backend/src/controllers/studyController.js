const { PrismaClient } = require('@prisma/client');
const { calculateNextReview, getDueWords } = require('../srs/fsrs');

const prisma = new PrismaClient();

async function getTodayWords(req, res, next) {
  try {
    const studentId = req.user.sub;
    const classId = req.user.classId;

    // 현재 학급의 활성 단어장 단어들 가져오기
    const wordBooks = await prisma.wordBook.findMany({
      where: { classId, isActive: true },
      include: { words: true },
    });

    const allWords = wordBooks.flatMap(wb => wb.words);
    if (allWords.length === 0) return res.json([]);

    // 기존 학습 기록 조회
    const records = await prisma.studyRecord.findMany({
      where: { studentId },
      select: { wordId: true, nextReview: true, state: true, stability: true, difficulty: true },
    });
    const recordMap = new Map(records.map(r => [r.wordId, r]));

    // 학습 기록 없는 단어는 new 상태로 추가
    const now = new Date();
    const dueWords = allWords
      .map(word => {
        const record = recordMap.get(word.id);
        return {
          ...word,
          state: record?.state ?? 'new',
          nextReview: record?.nextReview ?? now,
          stability: record?.stability ?? 1.0,
          difficulty: record?.difficulty ?? 5.0,
        };
      })
      .filter(w => new Date(w.nextReview) <= now)
      .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview))
      .slice(0, 20);

    res.json(dueWords);
  } catch (err) {
    next(err);
  }
}

async function submitReview(req, res, next) {
  try {
    const studentId = req.user.sub;
    const { wordId, rating } = req.body;
    if (!wordId || !rating) {
      return res.status(400).json({ error: 'wordId와 rating은 필수입니다.' });
    }

    const existing = await prisma.studyRecord.findUnique({
      where: { studentId_wordId: { studentId, wordId } },
    });

    const baseRecord = existing ?? {
      stability: 1.0,
      difficulty: 5.0,
      reps: 0,
      lapses: 0,
      state: 'new',
    };

    const updated = calculateNextReview(baseRecord, Number(rating));

    const record = await prisma.studyRecord.upsert({
      where: { studentId_wordId: { studentId, wordId } },
      create: { studentId, wordId, ...updated },
      update: updated,
    });

    res.json({ nextReview: record.nextReview, stability: record.stability, state: record.state });
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const studentId = req.user.sub;
    const records = await prisma.studyRecord.findMany({ where: { studentId } });

    const totalWords = records.length;
    const mastered = records.filter(r => r.state === 'review' && r.stability >= 10).length;
    const now = new Date();
    const due = records.filter(r => new Date(r.nextReview) <= now).length;

    res.json({ totalWords, mastered, due });
  } catch (err) {
    next(err);
  }
}

async function getWrongWords(req, res, next) {
  try {
    const studentId = req.user.sub;
    const records = await prisma.studyRecord.findMany({
      where: { studentId, lapses: { gt: 0 } },
      include: { word: true },
      orderBy: { lapses: 'desc' },
    });
    res.json(records.map(r => ({ ...r.word, lapses: r.lapses })));
  } catch (err) {
    next(err);
  }
}

module.exports = { getTodayWords, submitReview, getStats, getWrongWords };
