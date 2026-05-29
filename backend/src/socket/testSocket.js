const { PrismaClient } = require('@prisma/client');
const { serializeAnswers } = require('../lib/db');

const prisma = new PrismaClient();

module.exports = function registerTestSocket(io) {
  io.on('connection', (socket) => {

    // 교사: 방 생성
    socket.on('teacher:create_room', async ({ testId }) => {
      try {
        const test = await prisma.test.findUnique({ where: { id: testId } });
        if (!test) return socket.emit('error', { message: '테스트를 찾을 수 없습니다.' });
        socket.join(test.roomCode);
        socket.emit('room:created', { roomCode: test.roomCode });
      } catch (err) {
        socket.emit('error', { message: '방 생성 실패' });
      }
    });

    // 학생: 방 입장
    socket.on('student:join', async ({ roomCode, studentId }) => {
      try {
        const test = await prisma.test.findUnique({ where: { roomCode } });
        if (!test || test.status !== 'waiting') {
          return socket.emit('error', { message: '입장할 수 없는 방입니다.' });
        }
        socket.join(roomCode);
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        const roomSize = io.sockets.adapter.rooms.get(roomCode)?.size ?? 0;
        io.to(roomCode).emit('room:student_joined', {
          studentName: student?.name ?? '알 수 없음',
          count: Math.max(0, roomSize - 1), // 교사 소켓 제외
        });
        socket.emit('join:confirmed', { testId: test.id, roomCode });
      } catch (err) {
        socket.emit('error', { message: '입장 실패' });
      }
    });

    // 교사: 테스트 시작
    socket.on('teacher:start_test', async ({ testId }) => {
      try {
        const test = await prisma.test.update({
          where: { id: testId },
          data: { status: 'active' },
          include: { wordBook: { include: { words: { orderBy: { order: 'asc' } } } } },
        });

        const words = test.wordBook.words;
        io.to(test.roomCode).emit('test:started', {
          words: words.map(w => ({ id: w.id, english: w.english })),
        });

        // 5초 간격으로 단어를 교사 화면에 표시
        words.forEach((word, i) => {
          setTimeout(() => {
            io.to(test.roomCode).emit('test:show_word', {
              index: i,
              english: word.english,
              total: words.length,
              timeLeft: 5,
            });
          }, i * 5000);
        });
      } catch (err) {
        socket.emit('error', { message: '테스트 시작 실패' });
      }
    });

    // 학생: 답안 제출 (소켓 경유)
    socket.on('student:submit', async ({ testId, studentId, answers }) => {
      try {
        const test = await prisma.test.findUnique({
          where: { id: testId },
          include: { wordBook: { include: { words: true } } },
        });
        if (!test) return socket.emit('error', { message: '테스트를 찾을 수 없습니다.' });

        let score = 0;
        test.wordBook.words.forEach(word => {
          if ((answers[word.id] || '').trim() === word.korean.trim()) score++;
        });
        const total = test.wordBook.words.length;

        await prisma.testResult.upsert({
          where: { testId_studentId: { testId, studentId } },
          create: { testId, studentId, answers: serializeAnswers(answers), score, total },
          update: { answers: serializeAnswers(answers), score },
        });

        socket.emit('submit:confirmed', { score, total });

        // 교사에게 실시간 제출 현황 알림
        const submittedCount = await prisma.testResult.count({ where: { testId } });
        io.to(test.roomCode).emit('room:submission_update', { submittedCount });
      } catch (err) {
        socket.emit('error', { message: '답안 제출 실패' });
      }
    });

    // 교사: 테스트 종료
    socket.on('teacher:end_test', async ({ testId }) => {
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
      } catch (err) {
        socket.emit('error', { message: '테스트 종료 실패' });
      }
    });

    socket.on('disconnect', () => {});
  });
};
