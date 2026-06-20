import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import { getTestSocket, setTestSocket, clearTestSocket } from '../../lib/testSocketStore';
import { RECOMMENDED_WORDS } from '../../data/recommendedWords';

// 1000개+ 풀에서 이미 사용한 선택지를 피해 3개 오답 선택
const POOL = [...new Set(RECOMMENDED_WORDS.map(w => w.korean))];

function pickDistractors(correctKorean, usedSet) {
  // 아직 이번 세션에서 등장하지 않은 것 우선
  const fresh = POOL.filter(k => k !== correctKorean && !usedSet.has(k));
  const source = fresh.length >= 3 ? fresh : POOL.filter(k => k !== correctKorean);
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function buildOptions(word, usedSet) {
  const wrong = pickDistractors(word.answer, usedSet);
  wrong.forEach(k => usedSet.add(k));
  return [...wrong, word.answer].sort(() => Math.random() - 0.5);
}

export default function TestActivePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [words, setWords]               = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers]           = useState({});   // wordId → selected option
  const [results, setResults]           = useState({});   // wordId → 'correct' | 'wrong'
  const [score, setScore]               = useState(0);
  const [submitted, setSubmitted]       = useState(false);
  const [advancing, setAdvancing]       = useState(false);

  const answersRef   = useRef({});
  const wordsRef     = useRef([]);
  const submittedRef = useRef(false);
  const socketRef    = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('test_words');
    const raw = stored ? JSON.parse(stored) : [];
    // 1000개 풀에서 문제별 선택지 생성 (세션 내 중복 최소화)
    const usedSet = new Set();
    const parsed = raw.map(w => ({ ...w, options: buildOptions(w, usedSet) }));
    wordsRef.current = parsed;
    setWords(parsed);

    let socket = getTestSocket();
    if (!socket || socket.disconnected) {
      socket = io(import.meta.env.VITE_SOCKET_URL);
      setTestSocket(socket);
    }
    socketRef.current = socket;

    socket.on('test:finished', ({ avg, topScore, total }) => {
      sessionStorage.setItem('test_result', JSON.stringify({ avg, topScore, total }));
      if (!submittedRef.current) {
        submittedRef.current = true;
        const testId = sessionStorage.getItem('test_id');
        socket.emit('student:submit', { testId, studentId: user.id, answers: answersRef.current });
      }
      navigate('/student/test/result');
    });

    socket.on('submit:confirmed', ({ score: s, total }) => {
      sessionStorage.setItem('my_score', JSON.stringify({ score: s, total }));
      setSubmitted(true);
    });

    return () => {
      socket.off('test:finished');
      socket.off('submit:confirmed');
      clearTestSocket();
    };
  }, [navigate, user.id]);

  const doSubmit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const testId = sessionStorage.getItem('test_id');
    socketRef.current?.emit('student:submit', {
      testId,
      studentId: user.id,
      answers: answersRef.current,
    });
  };

  const handleSelect = (word, option) => {
    if (submitted || advancing) return;

    const isCorrect = option === word.answer;
    const newAnswers = { ...answersRef.current, [word.id]: option };
    answersRef.current = newAnswers;

    setAnswers(newAnswers);
    setResults(r => ({ ...r, [word.id]: isCorrect ? 'correct' : 'wrong' }));
    if (isCorrect) setScore(s => s + 1);
    setAdvancing(true);

    setTimeout(() => {
      setAdvancing(false);
      if (currentIndex + 1 >= wordsRef.current.length) {
        doSubmit();
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 1200);
  };

  const currentWord = words[currentIndex];
  const totalAnswered = Object.keys(answers).length;

  if (words.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-white max-w-lg mx-auto">
      <div className="flex gap-1.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-pulse"
               style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white max-w-lg mx-auto">

      {/* 상단 헤더: 진행바 + 점수 */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-black h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-gray-400 tracking-wider shrink-0">
            {currentIndex + 1}/{words.length}
          </span>
        </div>

        {/* 실시간 점수 */}
        {totalAnswered > 0 && (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[12px] font-black text-black">{score}</span>
            <span className="text-[11px] text-gray-300 font-medium">/ {totalAnswered} 맞춤</span>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col px-5 pb-8 pt-1">

        {/* 현재 문제 */}
        {currentWord && !submitted && (
          <>
            <div
              className="border border-gray-100 rounded-[28px] flex flex-col items-center justify-center p-8 text-center mb-5"
              style={{ minHeight: '160px' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-200 mb-3">뜻을 고르세요</p>
              <p className="text-5xl font-black tracking-tighter text-black leading-tight">
                {currentWord.english}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {(currentWord.options ?? []).map((opt, i) => {
                const selected = answers[currentWord.id] === opt;
                const isCorrectOpt = opt === currentWord.answer;
                const result = results[currentWord.id];

                let cls = 'border-gray-100 text-gray-700 bg-white active:bg-gray-50 disabled:opacity-60';
                if (result) {
                  if (isCorrectOpt) {
                    cls = 'bg-black border-black text-white';
                  } else if (selected) {
                    cls = 'bg-gray-100 border-gray-100 text-gray-400 line-through';
                  } else {
                    cls = 'border-gray-100 text-gray-200 bg-white';
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(currentWord, opt)}
                    disabled={!!result || advancing}
                    className={`rounded-2xl py-4 px-3 font-bold text-[14px] tracking-tight transition border-2 ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* 정오 피드백 메시지 */}
            {results[currentWord.id] && (
              <div className="text-center py-2.5 rounded-2xl mb-4 bg-gray-50">
                <span className="font-black text-[15px] text-black">
                  {results[currentWord.id] === 'correct' ? '✓ 정답' : '✗ 오답'}
                </span>
                {results[currentWord.id] === 'wrong' && (
                  <span className="text-[13px] font-bold text-black ml-2">
                    → {currentWord.answer}
                  </span>
                )}
              </div>
            )}

            {/* 이전 문제 답 목록 */}
            {currentIndex > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-2">
                  이전 답 · {score}/{currentIndex} 맞춤
                </p>
                <div className="space-y-1.5">
                  {words.slice(0, currentIndex).map(w => {
                    const r = results[w.id];
                    return (
                      <div key={w.id}
                           className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-gray-50">
                        <span className="font-bold text-[13px] text-black">{w.english}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[13px] font-medium ${
                            r === 'correct' ? 'text-black' : 'text-gray-400 line-through'
                          }`}>
                            {answers[w.id] ?? '—'}
                          </span>
                          {r === 'wrong' && (
                            <span className="text-[12px] font-bold text-black">{w.answer}</span>
                          )}
                          <span className="text-[13px] font-bold">{r === 'correct' ? '✓' : r === 'wrong' ? '✗' : ''}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* 제출 완료 대기 */}
        {submitted && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
            <div className="border border-gray-100 rounded-[28px] px-8 py-6 w-full text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-3">내 결과</p>
              <p className="text-6xl font-black tracking-tighter text-black">{score}</p>
              <p className="text-[13px] text-gray-400 font-medium mt-1">/ {words.length}문제 정답</p>
              <p className="text-[12px] font-black text-gray-300 mt-2">
                {Math.round((score / words.length) * 100)}점
              </p>
            </div>
            <div className="flex gap-1.5 justify-center">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-black animate-pulse"
                     style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <p className="text-[13px] text-gray-300 font-medium">선생님이 종료하면 전체 결과가 표시돼요</p>
          </div>
        )}
      </div>
    </div>
  );
}
