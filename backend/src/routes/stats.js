const router = require('express').Router();
const { recordVisit, getAdminStats } = require('../controllers/statsController');

// 공개: 익명 방문 집계
router.post('/visit', recordVisit);

// 운영자 전용: 비밀키 필요 (앱 어디에도 노출되지 않음)
router.get('/admin', getAdminStats);

module.exports = router;
