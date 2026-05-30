import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import Layout from '../../components/Layout';
import Button from '../../components/Button';

export default function TestActivePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [words, setWords] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const socketRef = useRef(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('test_words');
    if (stored) setWords(JSON.parse(stored));

    const socket = io(import.meta.env.VITE_SOCKET_URL);
    socketRef.current = socket;

    socket.on('test:show_word', ({ index }) => setCurrentWordIndex(index));
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

  const handleSubmit = () => {
    const testId = sessionStorage.getItem('test_id');
    socketRef.current?.emit('student:submit', { testId, studentId: user.id, answers });
  };

  if (words.length === 0) return (
    <Layout title="테스트 진행 중" back>
      <p className="text-center py-20 text-gray-300 text-[13px] font-medium">단어 로딩 중...</p>
    </Layout>
  );

  return (
    <Layout title="테스트 진행 중">
      <div className="space-y-3 pb-6">
        {currentWordIndex >= 0 && (
          <div className="bg-gray-50 rounded-2xl px-5 py-3 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">현재 출제</p>
            <p className="text-xl font-black tracking-tighter text-black">{words[currentWordIndex]?.english}</p>
          </div>
        )}

        <p className="text-[12px] font-medium text-gray-300 pt-1">각 단어의 뜻을 한국어로 입력하세요</p>

        {words.map((w, i) => (
          <div
            key={w.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition ${
              i === currentWordIndex ? 'border-black bg-white' : 'border-gray-100 bg-white'
            }`}
          >
            <span className="font-bold text-[15px] tracking-tight text-black w-28 shrink-0">{w.english}</span>
            <input
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-[14px] font-medium focus:border-black outline-none transition placeholder:text-gray-200"
              placeholder="한국어 뜻"
              value={answers[w.id] || ''}
              onChange={e => setAnswers(a => ({ ...a, [w.id]: e.target.value }))}
              disabled={submitted}
            />
          </div>
        ))}

        <div className="pt-2">
          {!submitted ? (
            <Button onClick={handleSubmit}>제출하기</Button>
          ) : (
            <div className="text-center py-5 border border-gray-100 rounded-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">Submitted</p>
              <p className="text-[15px] font-bold tracking-tight text-black">제출 완료</p>
              <p className="text-[12px] text-gray-300 font-medium mt-0.5">선생님이 종료하면 결과가 표시돼요</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
