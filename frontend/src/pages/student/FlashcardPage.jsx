import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayWords, submitReview } from '../../api/study';

export default function FlashcardPage() {
  const navigate = useNavigate();
  const [words,   setWords]   = useState([]);
  const [index,   setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done,    setDone]    = useState(false);
  const [wrongWords, setWrongWords] = useState([]);
  const [rated,   setRated]   = useState(null);

  useEffect(() => {
    getTodayWords().then(r => setWords(r.data)).finally(() => setLoading(false));
  }, []);

  const current  = words[index];
  const progress = words.length > 0 ? (index / words.length) * 100 : 0;

  const handleRate = async (r) => {
    if (rated) return;
    setRated(r);
    if (r === 1) setWrongWords(w => [...w, current]);
    await submitReview({ wordId: current.id, rating: r });
    setTimeout(() => {
      if (index + 1 >= words.length) { setDone(true); }
      else { setIndex(i => i + 1); setFlipped(false); setRated(null); }
    }, 280);
  };

  // ── 로딩 ─────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white max-w-lg mx-auto">
      <div className="text-center">
        <div className="flex gap-1.5 justify-center mb-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-300">Loading</p>
      </div>
    </div>
  );

  // ── 단어 없음 ──────────────────────────────────────
  if (words.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white max-w-lg mx-auto px-6 text-center">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-6">Done</p>
      <p className="text-4xl font-black tracking-tighter mb-2">학습 완료</p>
      <p className="text-sm text-gray-400 mb-10">오늘 학습할 단어가 없어요</p>
      <button onClick={() => navigate('/student')} className="bg-black text-white font-bold py-4 px-10 rounded-full text-[15px] tracking-tight">
        홈으로
      </button>
    </div>
  );

  // ── 완료 화면 ──────────────────────────────────────
  if (done) return (
    <div className="min-h-screen flex flex-col bg-white max-w-lg mx-auto px-6">
      <div className="flex-1 flex flex-col justify-center pt-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-6">Complete</p>
        <h1 className="text-5xl font-black tracking-tighter leading-none mb-3">
          {wrongWords.length === 0 ? '완벽해요.' : '학습 완료.'}
        </h1>
        <p className="text-sm text-gray-400 font-medium">
          {words.length}개 중 <span className="text-black font-bold">{words.length - wrongWords.length}개</span> 맞았어요
        </p>

        {wrongWords.length > 0 && (
          <div className="mt-8">
            <div className="h-px bg-gray-100 mb-4" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-3">다시 볼 단어</p>
            <div className="space-y-0">
              {wrongWords.map((w, i) => (
                <div key={w.id}>
                  <div className="flex justify-between items-baseline py-3">
                    <span className="font-bold text-[15px] text-black">{w.english}</span>
                    <span className="text-[13px] text-gray-400">{w.korean}</span>
                  </div>
                  {i < wrongWords.length - 1 && <div className="h-px bg-gray-50" />}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pb-10">
        <button onClick={() => navigate('/student')} className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition">
          홈으로
        </button>
      </div>
    </div>
  );

  // ── 메인 플래시카드 ───────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-white max-w-lg mx-auto">

      {/* 상단 헤더 */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-4">
        <button
          onClick={() => navigate('/student')}
          className="text-black font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
        >←</button>
        <div className="flex-1">
          <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
            <div
              className="bg-black h-1 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-[11px] font-bold text-gray-300 tracking-wider min-w-[40px] text-right">
          {index + 1}/{words.length}
        </span>
      </div>

      {/* 카드 영역 */}
      <div className="flex-1 flex flex-col justify-between px-5 pb-8 pt-4">

        {/* 플립 카드 */}
        <div className="flex-1 flex items-center">
          <div className="flip-scene w-full" onClick={() => !rated && setFlipped(f => !f)}>
            <div
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                position: 'relative',
                height: '340px',
                cursor: 'pointer',
              }}
            >
              {/* 앞면 — 영단어 */}
              <div
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
                className="border border-gray-100 rounded-[28px] flex flex-col items-center justify-center p-8 text-center bg-white"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-200 mb-8">
                  {current.state === 'new' ? 'New Word' : 'Review'}
                </p>
                <p className="text-5xl font-black tracking-tighter text-black leading-tight">
                  {current.english}
                </p>
                <p className="text-[12px] font-medium text-gray-200 mt-8">
                  tap to flip
                </p>
              </div>

              {/* 뒷면 — 한국어 */}
              <div
                style={{
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  position: 'absolute', inset: 0,
                }}
                className="bg-black rounded-[28px] flex flex-col items-center justify-center p-8 text-center"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-8">
                  {current.english}
                </p>
                <p className="text-5xl font-black tracking-tighter text-white leading-tight">
                  {current.korean}
                </p>
                {current.example && (
                  <p className="text-[12px] text-white/40 mt-8 leading-relaxed font-medium max-w-[240px]">
                    "{current.example}"
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 평가 버튼 */}
        <div className="mt-6 space-y-2.5">
          {!flipped ? (
            <button
              onClick={() => setFlipped(true)}
              className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition"
            >
              뜻 확인하기
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleRate(1)}
                disabled={!!rated}
                className={`py-4 rounded-full font-bold text-[15px] tracking-tight transition active:scale-[0.97] disabled:opacity-50 ${
                  rated === 1 ? 'bg-black text-white' : 'bg-white text-black border-2 border-black'
                }`}
              >
                몰랐어
              </button>
              <button
                onClick={() => handleRate(3)}
                disabled={!!rated}
                className={`py-4 rounded-full font-bold text-[15px] tracking-tight transition active:scale-[0.97] disabled:opacity-50 ${
                  rated === 3 ? 'bg-black text-white' : 'bg-white text-black border-2 border-black'
                }`}
              >
                알았어
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
