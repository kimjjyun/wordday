const router = require('express').Router();
const { recordVisit, getAdminStats, resetAll } = require('../controllers/statsController');

// 공개: 익명 방문 집계
router.post('/visit', recordVisit);

// 운영자 전용: 비밀키 필요 (앱 어디에도 노출되지 않음)
router.get('/admin', getAdminStats);

// 운영자 전용: 전체 초기화 (비밀키 + confirm=RESET 필요, 방문 통계 보존)
router.post('/admin/reset', resetAll);

module.exports = router;
