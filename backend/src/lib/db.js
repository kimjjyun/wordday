// DATABASE_URL에 따라 SQLite / PostgreSQL 분기 처리 유틸
const isSQLite = (process.env.DATABASE_URL || '').startsWith('file:');

/**
 * answers 값을 DB에 저장할 형태로 변환
 * SQLite: JSON 문자열 / PostgreSQL: 객체 그대로
 */
function serializeAnswers(answers) {
  return isSQLite ? JSON.stringify(answers) : answers;
}

/**
 * DB에서 읽은 answers를 객체로 파싱
 * SQLite: JSON.parse / PostgreSQL: 그대로 반환
 */
function parseAnswers(answers) {
  if (!answers) return {};
  if (isSQLite && typeof answers === 'string') return JSON.parse(answers);
  return answers;
}

module.exports = { isSQLite, serializeAnswers, parseAnswers };
