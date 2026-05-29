import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayWords } from '../../api/study';
import Layout from '../../components/Layout';
import Button from '../../components/Button';

function buildQuestions(words) {
  return words.map(word => {
    const wrong = words
      .filter(w => w.id !== word.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.korean);
    const options = [...wrong, word.korean].sort(() => Math.random() - 0.5);
    return { word, options, answer: word.korean };
  }).sort(() => Math.random() - 0.5);
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
      .then(r => {
        if (r.data.length < 4) { setDone(true); return; }
        setQuestions(buildQuestions(r.data));
      })
      .finally(() => setLoading(false));
  }, []);

  const q = questions[index];

  const handleSelect = (opt) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt === q.answer;
    if (correct) setScore(s => s + 1);
    else setWrongList(w => [...w, q.word]);
    setTimeout(() => {
      if (index + 1 >= questions.length) setDone(true);
      else { setIndex(i => i + 1); setSelected(null); }
    }, 800);
  };

  if (loading) return <Layout title="퀴즈" back><p className="text-center py-20 text-gray-400">불러오는 중...</p></Layout>;

  if (done) return (
    <Layout title="퀴즈 결과" back>
      <div className="text-center py-10 space-y-4">
        <p className="text-5xl">{score === questions.length ? '🏆' : score >= questions.length * 0.7 ? '👍' : '📚'}</p>
        <p className="text-2xl font-bold">{score} / {questions.length}</p>
        <p className="text-gray-500">{Math.round((score / Math.max(questions.length, 1)) * 100)}점</p>
        {wrongList.length > 0 && (
          <div className="bg-red-50 rounded-xl p-4 text-left space-y-2">
            <p className="font-semibold text-red-600 text-sm">틀린 단어</p>
            {wrongList.map(w => (
              <div key={w.id} className="flex justify-between text-sm">
                <span>{w.english}</span><span className="text-gray-500">{w.korean}</span>
              </div>
            ))}
          </div>
        )}
        <div className="space-y-2">
          <Button onClick={() => { setIndex(0); setSelected(null); setScore(0); setWrongList([]); setDone(false); setQuestions(buildQuestions(questions.map(q => q.word))); }}>
            다시 풀기
          </Button>
          <Button variant="secondary" onClick={() => navigate('/student')}>홈으로</Button>
        </div>
      </div>
    </Layout>
  );

  if (!q) return null;

  return (
    <Layout title="퀴즈" back>
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>{index + 1} / {questions.length}</span>
          <span>점수 {score}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${((index) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="bg-indigo-50 rounded-2xl p-6 text-center mb-6">
        <p className="text-3xl font-bold text-indigo-700">{q.word.english}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {q.options.map(opt => {
          let style = 'bg-white border-2 border-gray-200 text-gray-700';
          if (selected) {
            if (opt === q.answer) style = 'bg-emerald-500 border-emerald-500 text-white';
            else if (opt === selected) style = 'bg-red-500 border-red-500 text-white';
          }
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className={`rounded-xl py-4 px-3 font-medium text-sm transition ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </Layout>
  );
}
