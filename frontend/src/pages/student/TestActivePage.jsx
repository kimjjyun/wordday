import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';

export default function TestActivePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [words, setWords]           = useState([]);
  const [answers, setAnswers]       = useState({});
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [submitted, setSubmitted]   = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('test_words');
    if (stored) setWords(JSON.parse(stored));

    const socket = io(import.meta.env.VITE_SOCKET_URL);
    socketRef.current = socket;

    socket.on('test:show_word', ({ index }) => setCurrentIndex(index));

    socket.on('test:finished', ({ avg, topScore, total }) => {
      sessionStorage.setItem('test_result', JSON.stringify({ avg, topScore, total }));
      navigate('/student/test/result');
    });

    socket.on('submit:confirmed', ({ score, total }) => {
      sessionStorage.setItem('my_score', JSON.stringify({ score, total }));
      setSubmitted(true);
    });

    return () => socket.disconnect();
  }, []);

  const handleSelect = (wordId, option) => {
    if (submitted) return;
    setAnswers(a => ({ ...a, [wordId]: option }));
  };

  const handleSubmit = () => {
    const testId = sessionStorage.getItem('test_id');
    socketRef.current?.emit('student:submit', { testId, studentId: user.id, answers });
  };

  const currentWord = words[currentIndex];
  const allShown = words.length > 0 && currentIndex >= words.length - 1;

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

      {/* 진행 바 */}
      <div className="px-5 pt-4 pb-3 flex items-center gap-4">
        <div className="flex-1 bg-gray-100 rounded-full h-1 overflow-hidden">
          <div className="bg-black h-1 rounded-full transition-all duration-700"
               style={{ width: `${currentIndex < 0 ? 0 : ((currentIndex + 1) / words.length) * 100}%` }} />
        </div>
        <span className="text-[11px] font-bold text-gray-300 tracking-wider">
          {currentIndex < 0 ? '0' : currentIndex + 1}/{words.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col px-5 pb-8 pt-2">

        {/* 대기 중 */}
        {currentIndex === -1 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="flex gap-1.5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-black animate-pulse"
                     style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">대기 중</p>
            <p className="text-xl font-black tracking-tighter">선생님이 단어를 표시하면 시작돼요</p>
          </div>
        )}

        {/* 현재 단어 + 4지선다 */}
        {currentIndex >= 0 && currentWord && (
          <>
            <div className="border border-gray-100 rounded-[28px] flex flex-col items-center justify-center p-8 text-center mb-5"
                 style={{ minHeight: '170px' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-200 mb-3">뜻을 고르세요</p>
              <p className="text-5xl font-black tracking-tighter text-black leading-tight">
                {currentWord.english}
              </p>
              {answers[currentWord.id] && (
                <p className="text-[12px] font-bold text-gray-300 mt-3">✓ 선택 완료</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {(currentWord.options ?? []).map((opt, i) => {
                const isSelected = answers[currentWord.id] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(currentWord.id, opt)}
                    disabled={submitted}
                    className={`rounded-2xl py-4 px-3 font-bold text-[14px] tracking-tight transition border-2
                      ${isSelected
                        ? 'bg-black border-black text-white'
                        : 'border-gray-100 text-gray-700 bg-white active:bg-gray-50'}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* 지금까지 선택한 답 목록 */}
            {currentIndex > 0 && (
              <div className="mb-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-2">
                  선택한 답
                </p>
                <div className="space-y-1.5">
                  {words.slice(0, currentIndex).map(w => (
                    <div key={w.id}
                         className="flex justify-between items-center px-4 py-2.5 bg-gray-50 rounded-xl">
                      <span className="font-bold text-[13px] text-black">{w.english}</span>
                      <span className={`text-[13px] font-medium ${answers[w.id] ? 'text-gray-500' : 'text-gray-200'}`}>
                        {answers[w.id] ?? '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 제출 버튼 — 마지막 단어까지 다 보여진 후 */}
        {allShown && !submitted && (
          <button
            onClick={handleSubmit}
            className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition mt-auto"
          >
            제출하기
          </button>
        )}

        {/* 제출 완료 */}
        {submitted && (
          <div className="text-center py-6 border border-gray-100 rounded-2xl mt-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-2">Submitted</p>
            <p className="text-[17px] font-black tracking-tighter text-black">제출 완료</p>
            <p className="text-[12px] text-gray-300 font-medium mt-1">선생님이 종료하면 결과가 표시돼요</p>
          </div>
        )}
      </div>
    </div>
  );
}
