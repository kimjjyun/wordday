import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGuestStore } from '../../store/guestStore';
import { RECOMMENDED_WORDS } from '../../data/recommendedWords';

function nextReviewDate(stability) {
  const days = Math.round(stability * 1.5);
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function SoloFlashcard() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { records, saveRecord } = useGuestStore();

  const words = useMemo(() => {
    const cat = state?.category ?? 'all';
    const now = new Date();
    return RECOMMENDED_WORDS.filter(w => {
      if (cat !== 'all' && w.category !== cat) return false;
      const rec = records[w.english];
      return !rec || new Date(rec.nextReview) <= now;
    });
  }, []);

  const [index,   setIndex]   = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rated,   setRated]   = useState(null);
  const [done,    setDone]    = useState(false);
  const [wrong,   setWrong]   = useState([]);

  if (words.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white max-w-lg mx-auto px-6 text-center">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-300 mb-4">All Done</p>
      <p className="text-4xl font-black tracking-tighter mb-6">학습 완료</p>
      <button onClick={() => navigate('/solo')} className="bg-black text-white font-bold py-4 px-10 rounded-full text-[15px]">홈으로</button>
    </div>
  );

  const current  = words[index];
  const progress = (index / words.length) * 100;

  const handleRate = (r) => {
    if (rated) return;
    setRated(r);
    const prev = records[current.english];
    const stability  = r === 3 ? ((prev?.stability ?? 1) * 2.5) : Math.max(1, (prev?.stability ?? 1) * 0.6);
    const newRecord  = {
      stability,
      nextReview: nextReviewDate(stability),
      reps:    (prev?.reps ?? 0) + 1,
      lapses:  r === 1 ? (prev?.lapses ?? 0) + 1 : (prev?.lapses ?? 0),
      state:   stability > 8 ? 'review' : 'learning',
    };
    saveRecord(current.english, newRecord);
    if (r === 1) setWrong(w => [...w, current]);
    setTimeout(() => {
      if (index + 1 >= words.length) { setDone(true); }
      else { setIndex(i => i + 1); setFlipped(false); setRated(null); }
    }, 280);
  };

  if (done) return (
    <div className="min-h-screen flex flex-col bg-white max-w-lg mx-auto px-6">
      <div className="flex-1 flex flex-col justify-center pt-16">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-6">Complete</p>
        <h1 className="text-5xl font-black tracking-tighter leading-none mb-3">
          {wrong.length === 0 ? '완벽해요.' : '학습 완료.'}
        </h1>
        <p className="text-sm text-gray-400 font-medium">
          {words.length}개 중 <span className="text-black font-bold">{words.length - wrong.length}개</span> 맞았어요
        </p>
        {wrong.length > 0 && (
          <div className="mt-8">
            <div className="h-px bg-gray-100 mb-4" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-3">다시 볼 단어</p>
            {wrong.map((w, i) => (
              <div key={w.english}>
                <div className="flex justify-between items-baseline py-3">
                  <span className="font-bold text-[15px] text-black">{w.english}</span>
                  <span className="text-[13px] text-gray-400">{w.korean}</span>
                </div>
                {i < wrong.length - 1 && <div className="h-px bg-gray-50" />}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="pb-10 space-y-2.5">
        <button
          onClick={() => { setIndex(0); setFlipped(false); setRated(null); setDone(false); setWrong([]); }}
          className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition"
        >다시 하기</button>
        <button
          onClick={() => navigate('/solo')}
          className="w-full bg-white text-black border-2 border-black font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition"
        >홈으로</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white max-w-lg mx-auto">
      <div className="px-5 pt-4 pb-3 flex items-center gap-4">
        <button onClick={() => navigate('/solo')} className="text-black font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">←</button>
        <div className="flex-1">
          <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
            <div className="bg-black h-1 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="text-[11px] font-bold text-gray-300 tracking-wider min-w-[40px] text-right">{index + 1}/{words.length}</span>
      </div>

      <div className="flex-1 flex flex-col justify-between px-5 pb-8 pt-4">
        <div className="flex-1 flex items-center">
          <div style={{ perspective: '1200px' }} className="w-full">
            <div
              onClick={() => !rated && setFlipped(f => !f)}
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                position: 'relative', height: '340px', cursor: 'pointer',
              }}
            >
              <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
                className="border border-gray-100 rounded-[28px] flex flex-col items-center justify-center p-8 text-center bg-white">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-200 mb-8">Solo Study</p>
                <p className="text-5xl font-black tracking-tighter text-black leading-tight">{current.english}</p>
              </div>
              <div style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', position: 'absolute', inset: 0 }}
                className="bg-black rounded-[28px] flex flex-col items-center justify-center p-8 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30 mb-8">{current.english}</p>
                <p className="text-5xl font-black tracking-tighter text-white leading-tight">{current.korean}</p>
                {current.example && <p className="text-[12px] text-white/40 mt-8 leading-relaxed font-medium max-w-[240px]">"{current.example}"</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          {!flipped ? (
            <button onClick={() => setFlipped(true)} className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition">뜻 확인하기</button>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <button onClick={() => handleRate(1)} disabled={!!rated}
                className={`py-4 rounded-full font-bold text-[15px] tracking-tight transition active:scale-[0.97] disabled:opacity-50 ${rated === 1 ? 'bg-black text-white' : 'bg-white text-black border-2 border-black'}`}>
                몰랐어
              </button>
              <button onClick={() => handleRate(3)} disabled={!!rated}
                className={`py-4 rounded-full font-bold text-[15px] tracking-tight transition active:scale-[0.97] disabled:opacity-50 ${rated === 3 ? 'bg-black text-white' : 'bg-white text-black border-2 border-black'}`}>
                알았어
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
