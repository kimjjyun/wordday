const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
  }
  const token = header.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
  }
}

function requireTeacher(req, res, next) {
  authenticate(req, res, () => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: '교사 권한이 필요합니다.' });
    }
    next();
  });
}

function requireStudent(req, res, next) {
  authenticate(req, res, () => {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: '학생 권한이 필요합니다.' });
    }
    next();
  });
}

module.exports = { authenticate, requireTeacher, requireStudent };
