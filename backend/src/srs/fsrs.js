// FSRS v4 simplified implementation
const W = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14,
           0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61];

/**
 * 복습 후 새 학습 상태 계산
 * @param {Object} record - 현재 StudyRecord
 * @param {number} rating - 1(Again/몰랐어) | 3(Good/알았어)
 * @returns {Object} 업데이트할 필드
 */
function calculateNextReview(record, rating) {
  const now = new Date();
  let { stability, difficulty, reps, lapses, state } = record;

  if (state === 'new') {
    stability  = rating === 3 ? W[0] : 0.4;
    difficulty = Math.min(10, Math.max(1, W[4] - W[5] * (rating - 3)));
    state      = rating === 1 ? 'learning' : 'review';
  } else if (rating === 1) {
    lapses    += 1;
    stability  = Math.max(0.5, stability * W[11]);
    difficulty = Math.min(10, difficulty + W[6]);
    state      = 'relearning';
  } else {
    const retrievability = Math.exp(Math.log(0.9) / stability);
    const stabilityInc   = W[8] * Math.pow(stability, -W[9])
                         * (Math.exp((1 - retrievability) * W[10]) - 1);
    stability  = stability + stabilityInc;
    difficulty = Math.min(10, Math.max(1, difficulty - W[7] * (rating - 3)));
    state      = 'review';
  }

  const isShortInterval = state === 'learning' || state === 'relearning';
  const interval = isShortInterval
    ? 1 / 24  // 1시간 후
    : Math.round(stability * (0.95 + Math.random() * 0.1));

  const nextReview = new Date(now.getTime() + interval * 86400000);

  return {
    stability,
    difficulty,
    nextReview,
    lastReview: now,
    reps: reps + 1,
    lapses,
    state,
  };
}

/**
 * 오늘 학습할 단어 필터링 (nextReview <= 지금, 최대 limit개)
 */
function getDueWords(records, limit = 20) {
  const now = new Date();
  return records
    .filter(r => new Date(r.nextReview) <= now)
    .sort((a, b) => new Date(a.nextReview) - new Date(b.nextReview))
    .slice(0, limit);
}

module.exports = { calculateNextReview, getDueWords };
