import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayWords, submitReview } from '../../api/study';

function buildQuestions(words) {
  return words.map(word => {
    const shuffled = words
      .filter(w => w.id !== word.id && w.korean !== word.korean)
      .sort(() => Math.random() - 0.5);
    const seen = new Set();
    const wrong = [];
    for (const w of shuffled) {
      if (!seen.has(w.korean)) { seen.add(w.korean); wrong.push(w.korean); }
      if (wrong.length >= 3) break;
    }
    if (wrong.length < 3) return null;
    const options = [...wrong, word.korean].sort(() => Math.random() - 0.5);
    return { word, options, answer: word.korean };
  }).filter(Boolean).sort(() => Math.random() - 0.5);
}

export default function QuizPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [wrongList, setWrongList] = useState([]);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTodayWords()
      .then(r => { setQuestions(buildQuestions(r.data)); })
      .finally(() => setLoading(false));
  }, []);

  const q = questions[index];

  const handleSelect = (opt) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === q.answer;
    if (correct) setScore(s => s + 1);
    else setWrongList(w => [...w, q.word]);
    submitReview({ wordId: q.word.id, rating: correct ? 4 : 1 }).catch(() => {});
    setTimeout(() => {
      if (index + 1 >= questions.length) setDone(true);
      else { setIndex(i => i + 1); setSelected(null); }
    }, 1500);
  };

  const restart = () => {
    setIndex(0); setSelected(null); setScore(0);
    setWrongList([]); setDone(false);
    setQuestions(buildQuestions(questions.map(q => q.word)));
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white max-w-lg mx-auto">
      <div className="flex gap-1.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  if (!loading && questions.length < 4) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white max-w-lg mx-auto px-6 text-center">
      <p className="text-2xl font-black tracking-tighter mb-2">단어가 부족해요</p>
      <p className="text-[13px] text-gray-300 font-medium mb-8">퀴즈는 단어 4개 이상이 필요해요</p>
      <button onClick={() => navigate('/student')} className="bg-black text-white font-bold py-4 px-10 rounded-full text-[15px] tracking-tight">돌아가기</button>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex flex-col bg-white max-w-lg mx-auto">
      <div className="px-5 pt-4 pb-3 flex items-center gap-4">
        <button
          onClick={() => navigate('/student')}
          className="text-black font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
        >←</button>
      </div>
      <div className="h-px bg-gray-100" />

      <div className="flex-1 flex flex-col px-5 pt-10 pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-300 mb-4">Result</p>
        <h1 className="text-6xl font-black tracking-tighter leading-none mb-1">
          {score}<span className="text-gray-200">/{questions.length}</span>
        </h1>
        <p className="text-[13px] font-bold text-gray-300 mt-2">
          {Math.round((score / Math.max(questions.length, 1)) * 100)}점
        </p>

        {wrongList.length > 0 && (
          <div className="mt-8">
            <div className="h-px bg-gray-100 mb-5" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-3">다시 볼 단어</p>
            <div className="space-y-0">
              {wrongList.map((w, i) => (
                <div key={w.id}>
                  <div className="flex justify-between items-baseline py-3">
                    <span className="font-bold text-[15px] tracking-tight text-black">{w.english}</span>
                    <span className="text-[13px] text-gray-400 font-medium">{w.korean}</span>
                  </div>
                  {i < wrongList.length - 1 && <div className="h-px bg-gray-50" />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto pt-8 space-y-2.5">
          <button
            onClick={restart}
            className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition"
          >다시 풀기</button>
          <button
            onClick={() => navigate('/student')}
            className="w-full bg-white text-black border-2 border-black font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition"
          >홈으로</button>
        </div>
      </div>
    </div>
  );

  if (!q) return null;

  return (
    <div className="min-h-screen flex flex-col bg-white max-w-lg mx-auto">
      {/* 헤더 */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-4">
        <button
          onClick={() => navigate('/student')}
          className="text-black font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
        >←</button>
        <div className="flex-1">
          <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
            <div
              className="bg-black h-1 rounded-full transition-all duration-500"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
        <span className="text-[11px] font-bold text-gray-300 tracking-wider min-w-[48px] text-right">
          {index + 1}/{questions.length} · {score}점
        </span>
      </div>

      <div className="flex-1 flex flex-col px-5 pb-8 pt-6">
        {/* 단어 카드 */}
        <div className="flex-1 flex items-center mb-8">
          <div className="w-full border border-gray-100 rounded-[28px] flex flex-col items-center justify-center p-8 text-center gap-6" style={{ minHeight: '200px' }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-200">뜻을 고르세요</p>
            <p className="text-5xl font-black tracking-tighter text-black leading-tight">
              {q.word.english}
            </p>
          </div>
        </div>

        {/* 보기 */}
        <div className="grid grid-cols-2 gap-2.5">
          {q.options.map((opt, i) => {
            let cls = 'border-2 border-gray-100 text-gray-700 bg-white';
            if (selected) {
              if (opt === q.answer)      cls = 'bg-black border-black text-white';
              else if (opt === selected) cls = 'bg-gray-100 border-gray-100 text-gray-400 line-through';
              else                       cls = 'border-gray-100 text-gray-200 bg-white';
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(opt)}
                className={`rounded-2xl py-4 px-3 font-bold text-[14px] tracking-tight transition ${cls}`}
              >
                {selected && opt === q.answer && <span className="mr-1">✓</span>}
                {selected && opt === selected && opt !== q.answer && <span className="mr-1">✗</span>}
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
