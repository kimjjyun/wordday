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
        const testKoreans = [...new Set(words.map(w => w.korean))];

        // 학급 전체 단어장의 한국어 풀 수집 → 선택지 다양성 최대화
        const classWords = await prisma.word.findMany({
          where: { wordBook: { classId: test.classId } },
          select: { korean: true },
        });
        const extPool = [...new Set(classWords.map(w => w.korean))];
        // 풀이 충분하면 전체 학급 단어 사용, 아니면 현재 단어장만 사용
        const basePool = extPool.length >= 6 ? extPool : testKoreans;

        // 4벌 독립 셔플 후 연결 → 각 선택지가 최대한 고르게, 간격 넓게 등장
        const distractorDeck = [];
        for (let i = 0; i < 4; i++) {
          distractorDeck.push(...[...basePool].sort(() => Math.random() - 0.5));
        }

        // 덱을 순차 소진하며 각 문제에 중복 없이 3개 오답 배정
        let deckCursor = 0;
        const wordsWithOptions = words.map(word => {
          const wrong = [];
          while (wrong.length < 3 && deckCursor < distractorDeck.length) {
            const candidate = distractorDeck[deckCursor++];
            if (candidate !== word.korean && !wrong.includes(candidate)) {
              wrong.push(candidate);
            }
          }
          // 덱이 소진됐을 때 폴백
          if (wrong.length < 3) {
            for (const k of basePool) {
              if (k !== word.korean && !wrong.includes(k) && wrong.length < 3) wrong.push(k);
            }
          }
          const options = [...wrong, word.korean].sort(() => Math.random() - 0.5);
          return { id: word.id, english: word.english, options };
        });

        io.to(test.roomCode).emit('test:started', { words: wordsWithOptions });

        // 3초 후 첫 단어 표시, 이후 10초 간격 (학생 페이지 로딩 여유)
        words.forEach((word, i) => {
          setTimeout(() => {
            io.to(test.roomCode).emit('test:show_word', {
              index: i,
              english: word.english,
              total: words.length,
            });
          }, 3000 + i * 10000);
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
