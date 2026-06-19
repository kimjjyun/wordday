import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import { getTestSocket, setTestSocket, clearTestSocket } from '../../lib/testSocketStore';

export default function TestActivePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [words, setWords] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  const answersRef   = useRef({});
  const wordsRef     = useRef([]);
  const submittedRef = useRef(false);
  const socketRef    = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('test_words');
    const parsed = stored ? JSON.parse(stored) : [];
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

    socket.on('submit:confirmed', ({ score, total }) => {
      sessionStorage.setItem('my_score', JSON.stringify({ score, total }));
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

  const handleSelect = (wordId, option) => {
    if (submitted || advancing) return;

    const newAnswers = { ...answersRef.current, [wordId]: option };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
    setAdvancing(true);

    setTimeout(() => {
      setAdvancing(false);
      if (currentIndex + 1 >= wordsRef.current.length) {
        doSubmit();
      } else {
        setCurrentIndex(i => i + 1);
      }
    }, 600);
  };

  const currentWord = words[currentIndex];

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
          <div
            className="bg-black h-1 rounded-full transition-all duration-700"
            style={{ width: `${((currentIndex + 1) / words.length) * 100}%` }}
          />
        </div>
        <span className="text-[11px] font-bold text-gray-300 tracking-wider">
          {currentIndex + 1}/{words.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col px-5 pb-8 pt-2">

        {currentWord && !submitted && (
          <>
            <div
              className="border border-gray-100 rounded-[28px] flex flex-col items-center justify-center p-8 text-center mb-5"
              style={{ minHeight: '170px' }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-200 mb-3">뜻을 고르세요</p>
              <p className="text-5xl font-black tracking-tighter text-black leading-tight">
                {currentWord.english}
              </p>
              {advancing && (
                <div className="flex gap-1 mt-4 justify-center">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-pulse"
                         style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {(currentWord.options ?? []).map((opt, i) => {
                const isSelected = answers[currentWord.id] === opt;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(currentWord.id, opt)}
                    disabled={advancing}
                    className={`rounded-2xl py-4 px-3 font-bold text-[14px] tracking-tight transition border-2
                      ${isSelected
                        ? 'bg-black border-black text-white'
                        : 'border-gray-100 text-gray-700 bg-white active:bg-gray-50 disabled:opacity-60'}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* 이전 단어들 답 목록 */}
            {currentIndex > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-2">선택한 답</p>
                <div className="space-y-1.5">
                  {words.slice(0, currentIndex).map(w => (
                    <div key={w.id} className="flex justify-between items-center px-4 py-2.5 bg-gray-50 rounded-xl">
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

        {/* 제출 완료 */}
        {submitted && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="flex gap-1.5 justify-center">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-black animate-pulse"
                     style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">Submitted</p>
            <p className="text-xl font-black tracking-tighter">제출 완료!</p>
            <p className="text-[13px] text-gray-300 font-medium">선생님이 종료하면 결과가 표시돼요</p>
          </div>
        )}
      </div>
    </div>
  );
}
