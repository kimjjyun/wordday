const logger = require('../lib/logger');

const isProd = process.env.NODE_ENV === 'production';

function errorHandler(err, req, res, next) {
  // Prisma 에러 → 사용자 친화적 메시지
  if (err.code === 'P2002') {
    return res.status(409).json({ error: '이미 존재하는 데이터입니다.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: '데이터를 찾을 수 없습니다.' });
  }

  const status = err.status || 500;

  if (status >= 500) {
    logger.error({ message: err.message, stack: err.stack, path: req.path, method: req.method });
  } else {
    logger.warn({ message: err.message, path: req.path, method: req.method });
  }

  // 프로덕션에서는 500 에러의 내부 메시지를 클라이언트에 노출하지 않음
  const message = (isProd && status >= 500)
    ? '서버 오류가 발생했습니다.'
    : (err.message || '서버 오류가 발생했습니다.');

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
