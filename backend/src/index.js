require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');
const wordbookRoutes = require('./routes/wordbooks');
const studyRoutes = require('./routes/study');
const testRoutes = require('./routes/tests');
const errorHandler = require('./middleware/errorHandler');
const registerTestSocket = require('./socket/testSocket');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// JSON 파싱 에러를 잡아서 서버가 죽지 않도록 처리
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: '잘못된 JSON 형식입니다.' });
  }
  next(err);
});

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/wordbooks', wordbookRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/tests', testRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

registerTestSocket(io);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WordDay server running on port ${PORT}`);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`포트 ${PORT}이 이미 사용 중입니다. 기존 서버를 종료한 뒤 다시 실행하세요.`);
    process.exit(1);
  } else {
    throw err;
  }
});
