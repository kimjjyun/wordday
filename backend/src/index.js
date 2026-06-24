require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');
const wordbookRoutes = require('./routes/wordbooks');
const studyRoutes = require('./routes/study');
const testRoutes = require('./routes/tests');
const statsRoutes = require('./routes/stats');
const errorHandler = require('./middleware/errorHandler');
const registerTestSocket = require('./socket/testSocket');

const app = express();
const server = http.createServer(app);

// 허용 오리진 목록 (쉼표로 여러 개 가능, 끝의 / 는 무시)
// FRONTEND_URL 미설정 시 기본으로 Netlify 도메인 허용
const DEFAULT_ORIGINS = ['https://wordday123.netlify.app', 'https://wordday999.netlify.app'];
const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowedOrigins = envOrigins.length > 0 ? envOrigins : DEFAULT_ORIGINS;

const corsOrigin = (origin, callback) => {
  // 서버-서버 요청(origin 없음) 또는 FRONTEND_URL 미설정 시 허용
  if (!origin || allowedOrigins.length === 0) return callback(null, true);
  const clean = origin.replace(/\/$/, '');
  return callback(null, allowedOrigins.includes(clean));
};

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '5mb' }));

// 전역 rate limit: 15분에 500회
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.' },
});
// 로그인 전용 rate limit: 15분에 20회 (브루트포스 방지)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '로그인 시도가 너무 많습니다. 15분 후 다시 시도하세요.' },
});

app.use('/api', globalLimiter);
app.use('/api/auth/teacher/login', authLimiter);
app.use('/api/auth/student/login', authLimiter);

// JSON 파싱 에러를 잡아서 서버가 죽지 않도록 처리
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: '잘못된 JSON 형식입니다.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: '요청 데이터가 너무 큽니다.' });
  }
  next(err);
});

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/wordbooks', wordbookRoutes);
app.use('/api/study', studyRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 프로덕션: 프론트엔드 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(clientDist));
  app.get('/{*catchall}', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

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
