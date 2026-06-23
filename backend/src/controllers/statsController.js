const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// KST(UTC+9) 기준 YYYY-MM-DD
function kstDate(d = new Date()) {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// 방문 기록 (공개, 인증 없음) — 익명 visitorId 기준 하루 1회 집계
async function recordVisit(req, res) {
  try {
    const { visitorId, kind } = req.body || {};
    if (!visitorId) return res.status(400).json({ ok: false });

    const vid = String(visitorId).slice(0, 64);
    const date = kstDate();
    const k = kind === 'student' || kind === 'teacher' ? kind : 'guest';

    await prisma.visit.upsert({
      where: { visitorId_date_kind: { visitorId: vid, date, kind: k } },
      create: { visitorId: vid, date, kind: k },
      update: {},
    });
    res.json({ ok: true });
  } catch {
    // 통계 실패가 사용자 흐름을 막지 않도록 항상 200
    res.json({ ok: false });
  }
}

// 운영자 통계 (앱 비노출 / 비밀키 필요)
async function getAdminStats(req, res, next) {
  try {
    const key = req.query.key || req.headers['x-admin-key'];
    const expected = process.env.ADMIN_STATS_KEY;
    if (!expected) {
      return res.status(503).json({ error: 'ADMIN_STATS_KEY 환경변수가 설정되지 않았습니다.' });
    }
    if (key !== expected) {
      return res.status(401).json({ error: '인증 실패' });
    }

    const [teachers, classes, students, tests, results, guestVisits, tCreated, sCreated] =
      await Promise.all([
        prisma.teacher.count(),
        prisma.class.count(),
        prisma.student.count(),
        prisma.test.count(),
        prisma.testResult.count(),
        prisma.visit.findMany({ where: { kind: 'guest' }, select: { visitorId: true, date: true } }),
        prisma.teacher.findMany({ select: { createdAt: true } }),
        prisma.student.findMany({ select: { createdAt: true } }),
      ]);

    const uniqueGuests = new Set(guestVisits.map(v => v.visitorId)).size;

    // 날짜별 버킷
    const guestByDate = {};
    for (const v of guestVisits) guestByDate[v.date] = (guestByDate[v.date] || 0) + 1; // 유니크 제약상 row수=고유방문자수
    const bucket = (arr) => {
      const m = {};
      for (const x of arr) { const d = kstDate(new Date(x.createdAt)); m[d] = (m[d] || 0) + 1; }
      return m;
    };
    const tByDate = bucket(tCreated);
    const sByDate = bucket(sCreated);

    // 최근 30일 (최신순)
    const daily = [...Array(30)].map((_, i) => {
      const date = kstDate(new Date(Date.now() - i * 86400000));
      return {
        date,
        guests: guestByDate[date] || 0,
        newTeachers: tByDate[date] || 0,
        newStudents: sByDate[date] || 0,
      };
    });

    res.json({
      generatedAt: new Date().toISOString(),
      totals: {
        teachers,
        classes,
        students,
        tests,
        testResults: results,
        uniqueGuests,
        guestVisitLogs: guestVisits.length,
      },
      daily,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { recordVisit, getAdminStats };
