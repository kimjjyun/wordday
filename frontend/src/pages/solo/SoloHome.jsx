import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGuestStore } from '../../store/guestStore';
import { CATEGORIES, RECOMMENDED_WORDS } from '../../data/recommendedWords';

const DAYS_EN = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function SoloHome() {
  const { name, records, exit } = useGuestStore();
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);
  const [catFilter, setCatFilter] = useState('all');

  const now   = new Date();
  const dayEn = DAYS_EN[now.getDay()];
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  const dueWords = useMemo(() => {
    const now = new Date();
    return RECOMMENDED_WORDS
      .filter(w => {
        if (catFilter !== 'all' && w.category !== catFilter) return false;
        const rec = records[w.english];
        return !rec || new Date(rec.nextReview) <= now;
      });
  }, [records, catFilter]);

  const PREVIEW = 5;
  const visible  = showAll ? dueWords : dueWords.slice(0, PREVIEW);
  const remaining = Math.max(0, dueWords.length - PREVIEW);

  const learned = Object.values(records).filter(r => r.state === 'review').length;

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-5 pt-4 pb-3 flex items-center">
        <h1 className="flex-1 font-black text-[15px] tracking-tight">WORDDAY</h1>
        <button
          onClick={() => { exit(); navigate('/login'); }}
          className="text-[11px] text-gray-300 hover:text-black transition font-medium"
        >나가기</button>
      </div>
      <div className="h-px bg-gray-100" />

      <div className="flex-1 px-5 py-4 pb-10">
        {/* 날짜 */}
        <div className="pt-2 pb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">{dateStr}</p>
          <h1 className="text-5xl font-black tracking-tighter text-black leading-none">{dayEn}</h1>
          <div className="flex items-center gap-1.5 mt-4">
            {[...Array(8)].map((_, i) => {
              const ratio = RECOMMENDED_WORDS.length > 0 ? learned / RECOMMENDED_WORDS.length : 0;
              return <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < Math.round(ratio * 8) ? 'bg-black' : 'bg-gray-200'}`} />;
            })}
            <span className="text-[11px] text-gray-300 ml-1 font-medium">{learned}개 암기 완료</span>
          </div>
        </div>

        <div className="h-px bg-gray-100 mb-5" />

        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {[{ key: 'all', label: '전체' }, ...CATEGORIES].map(c => (
            <button
              key={c.key}
              onClick={() => setCatFilter(c.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition ${
                catFilter === c.key ? 'bg-black text-white' : 'border border-gray-200 text-gray-400 hover:border-gray-400'
              }`}
            >{c.label}</button>
          ))}
        </div>

        {/* 단어 리스트 */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">Words to Study</p>
          <span className="text-[11px] font-bold text-gray-300">{dueWords.length}개</span>
        </div>

        {dueWords.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-2xl font-black tracking-tighter mb-1">모두 완료!</p>
            <p className="text-sm text-gray-300">이 카테고리의 단어를 다 익혔어요</p>
          </div>
        ) : (
          <>
            {visible.map((w, i) => (
              <div key={w.english}>
                <div className="flex items-baseline justify-between py-3.5">
                  <span className="font-bold text-[15px] text-black tracking-tight">{w.english}</span>
                  <span className="text-[13px] text-gray-400 font-medium ml-3">{w.korean}</span>
                </div>
                {i < visible.length - 1 && <div className="h-px bg-gray-50" />}
              </div>
            ))}

            {(remaining > 0 || showAll) && (
              <button
                onClick={() => setShowAll(v => !v)}
                className="w-full flex items-center justify-between border border-gray-100 rounded-full px-5 py-3 mt-3 hover:border-gray-300 transition"
              >
                <span className="text-[13px] font-medium text-gray-400">
                  {showAll ? '접기' : `+${remaining}개 더 보기`}
                </span>
                <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">{showAll ? '−' : '+'}</span>
                </div>
              </button>
            )}

            <div className="space-y-2.5 mt-5">
              <button
                onClick={() => navigate('/solo/flashcard', { state: { category: catFilter } })}
                className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition"
              >암기하기</button>
              <button
                onClick={() => navigate('/solo/quiz', { state: { category: catFilter } })}
                className="w-full bg-white text-black border-2 border-black font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition"
              >퀴즈 풀기</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
