// 기본제공 단어 — 카테고리별 파일을 합쳐 단일 배열로 제공합니다.
// 소비처(SoloHome/SoloQuiz/WordBookPage)는 RECOMMENDED_WORDS / CATEGORIES 만 사용하므로
// 데이터를 카테고리별 파일로 나눠도 기존 코드는 그대로 동작합니다.
import { EMOTION_WORDS }  from './words/emotion';
import { SOCIETY_WORDS }  from './words/society';
import { NATURE_WORDS }   from './words/nature';
import { ACADEMIC_WORDS } from './words/academic';
import { ECONOMY_WORDS }  from './words/economy';

export const CATEGORIES = [
  { key: 'emotion',  label: '감정/성격' },
  { key: 'society',  label: '사회/문화' },
  { key: 'nature',   label: '자연/환경' },
  { key: 'academic', label: '학문/사고' },
  { key: 'economy',  label: '경제/일상' },
];

const ALL_WORDS = [
  ...EMOTION_WORDS,
  ...SOCIETY_WORDS,
  ...NATURE_WORDS,
  ...ACADEMIC_WORDS,
  ...ECONOMY_WORDS,
];

// 하루 20개씩 day 번호 부여 (뜯어먹는 1800단어 방식)
export const WORDS_PER_DAY = 20;
export const TOTAL_DAYS = Math.ceil(ALL_WORDS.length / WORDS_PER_DAY);

export const RECOMMENDED_WORDS = ALL_WORDS.map((word, index) => ({
  ...word,
  day: Math.floor(index / WORDS_PER_DAY) + 1,
}));
