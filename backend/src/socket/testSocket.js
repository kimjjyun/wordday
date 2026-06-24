const { PrismaClient } = require('@prisma/client');
const { serializeAnswers } = require('../lib/db');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

module.exports = function registerTestSocket(io) {
  // 소켓 연결 시 JWT 검증
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('인증 토큰이 필요합니다.'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('유효하지 않은 토큰입니다.'));
    }
  });

  io.on('connection', (socket) => {

    // 교사: 방 생성
    socket.on('teacher:create_room', async ({ testId }) => {
      if (socket.user.role !== 'teacher') return socket.emit('error', { message: '권한이 없습니다.' });
      try {
        const test = await prisma.test.findUnique({
          where: { id: testId },
          include: { class: { select: { teacherId: true } } },
        });
        if (!test) return socket.emit('error', { message: '테스트를 찾을 수 없습니다.' });
        if (test.class.teacherId !== socket.user.sub) return socket.emit('error', { message: '권한이 없습니다.' });
        socket.join(test.roomCode);
        socket.emit('room:created', { roomCode: test.roomCode, classId: test.classId });
      } catch {
        socket.emit('error', { message: '방 생성 실패' });
      }
    });

    // 교사: 학급 전체에 테스트 초대 브로드캐스트
    socket.on('teacher:invite_class', async ({ classId, testId, roomCode, targetStudentIds }) => {
      if (socket.user.role !== 'teacher') return socket.emit('error', { message: '권한이 없습니다.' });
      const cls = await prisma.class.findFirst({ where: { id: classId, teacherId: socket.user.sub } });
      if (!cls) return socket.emit('error', { message: '권한이 없습니다.' });
      socket.to(`class:${classId}`).emit('class:test_invite', { testId, roomCode, targetStudentIds: targetStudentIds ?? [] });
    });

    // 학생: 학급 채널 구독 (홈 화면에서 초대 수신용)
    socket.on('student:subscribe_class', ({ classId }) => {
      if (socket.user.role !== 'student') return;
      if (socket.user.classId !== classId) return;
      socket.join(`class:${classId}`);
    });

    // 학생: 방 입장 (studentId는 JWT에서 추출)
    socket.on('student:join', async ({ roomCode }) => {
      if (socket.user.role !== 'student') return socket.emit('error', { message: '권한이 없습니다.' });
      const studentId = socket.user.sub;
      try {
        const test = await prisma.test.findUnique({ where: { roomCode } });
        if (!test || test.status !== 'waiting') {
          return socket.emit('error', { message: '입장할 수 없는 방입니다.' });
        }
        if (test.classId !== socket.user.classId) {
          return socket.emit('error', { message: '이 테스트에 참여할 권한이 없습니다.' });
        }
        if (test.targetStudentIds.length > 0 && !test.targetStudentIds.includes(studentId)) {
          return socket.emit('error', { message: '이 테스트에 초대된 학생이 아닙니다.' });
        }
        socket.join(roomCode);
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        const roomSize = io.sockets.adapter.rooms.get(roomCode)?.size ?? 0;
        io.to(roomCode).emit('room:student_joined', {
          studentName: student?.name ?? '알 수 없음',
          count: Math.max(0, roomSize - 1),
        });
        socket.emit('join:confirmed', { testId: test.id, roomCode });
      } catch {
        socket.emit('error', { message: '입장 실패' });
      }
    });

    // 교사: 테스트 시작
    socket.on('teacher:start_test', async ({ testId }) => {
      if (socket.user.role !== 'teacher') return socket.emit('error', { message: '권한이 없습니다.' });
      try {
        const test = await prisma.test.update({
          where: { id: testId },
          data: { status: 'active' },
          include: { wordBook: { include: { words: { orderBy: { order: 'asc' } } } } },
        });

        const wordsWithOptions = test.wordBook.words.map(word => ({
          id: word.id, english: word.english, answer: word.korean,
        }));
        io.to(test.roomCode).emit('test:started', { words: wordsWithOptions });
      } catch {
        socket.emit('error', { message: '테스트 시작 실패' });
      }
    });

    // 학생: 답안 제출 (studentId는 JWT에서 추출)
    socket.on('student:submit', async ({ testId, answers }) => {
      if (socket.user.role !== 'student') return socket.emit('error', { message: '권한이 없습니다.' });
      const studentId = socket.user.sub;
      try {
        const test = await prisma.test.findUnique({
          where: { id: testId },
          include: { wordBook: { include: { words: true } } },
        });
        if (!test) return socket.emit('error', { message: '테스트를 찾을 수 없습니다.' });
        if (test.classId !== socket.user.classId) return socket.emit('error', { message: '권한이 없습니다.' });

        let score = 0;
        let answered = 0;
        test.wordBook.words.forEach(word => {
          const submitted = (answers[word.id] || '').trim();
          if (submitted) answered++;
          if (submitted === word.korean.trim()) score++;
        });
        const total = test.wordBook.words.length;

        await prisma.testResult.upsert({
          where: { testId_studentId: { testId, studentId } },
          create: { testId, studentId, answers: JSON.stringify({ _answered: answered }), score, total },
          update: { answers: JSON.stringify({ _answered: answered }), score },
        });

        socket.emit('submit:confirmed', { score, total });

        const submittedCount = await prisma.testResult.count({ where: { testId } });
        io.to(test.roomCode).emit('room:submission_update', { submittedCount });
      } catch {
        socket.emit('error', { message: '답안 제출 실패' });
      }
    });

    // 교사: 테스트 종료
    socket.on('teacher:end_test', async ({ testId }) => {
      if (socket.user.role !== 'teacher') return socket.emit('error', { message: '권한이 없습니다.' });
      try {
        const test = await prisma.test.update({
          where: { id: testId },
          data: { status: 'finished', finishedAt: new Date() },
        });

        const results = await prisma.testResult.findMany({ where: { testId } });
        const scores = results.map(r => r.score);
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        const topScore = scores.length ? Math.max(...scores) : 0;

        io.to(test.roomCode).emit('test:finished', {
          avg: Math.round(avg * 10) / 10,
          topScore,
          total: results[0]?.total ?? 0,
        });
      } catch {
        socket.emit('error', { message: '테스트 종료 실패' });
      }
    });

    socket.on('disconnect', () => {});
  });
};
