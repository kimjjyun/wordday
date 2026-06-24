import { EMOTION_WORDS }    from './words/emotion';
import { SOCIETY_WORDS }    from './words/society';
import { NATURE_WORDS }     from './words/nature';
import { ACADEMIC_WORDS }   from './words/academic';
import { ECONOMY_WORDS }    from './words/economy';
import { HEALTH_WORDS }     from './words/health';
import { TECHNOLOGY_WORDS } from './words/technology';
import { ACTION_WORDS }     from './words/action';
import { CULTURE_WORDS }    from './words/culture';

export const CATEGORIES = [
  { key: 'emotion',     label: '감정/성격' },
  { key: 'society',     label: '사회/문화' },
  { key: 'nature',      label: '자연/환경' },
  { key: 'academic',    label: '학문/사고' },
  { key: 'economy',     label: '경제/일상' },
  { key: 'health',      label: '건강/신체' },
  { key: 'technology',  label: '기술/과학' },
  { key: 'action',      label: '행동/동작' },
  { key: 'culture',     label: '문화/예술' },
];

const ALL_WORDS = [
  ...EMOTION_WORDS,
  ...SOCIETY_WORDS,
  ...NATURE_WORDS,
  ...ACADEMIC_WORDS,
  ...ECONOMY_WORDS,
  ...HEALTH_WORDS,
  ...TECHNOLOGY_WORDS,
  ...ACTION_WORDS,
  ...CULTURE_WORDS,
];

export const WORDS_PER_DAY = 20;
export const TOTAL_DAYS    = 90;

export const RECOMMENDED_WORDS = ALL_WORDS.slice(0, 1800).map((word, index) => ({
  ...word,
  no:  index + 1,
  day: Math.floor(index / WORDS_PER_DAY) + 1,
}));
