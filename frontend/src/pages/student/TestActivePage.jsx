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
      <p className="text-center py-20 text-gray-400">단어 로딩 중...</p>
    </Layout>
  );

  return (
    <Layout title="테스트 진행 중">
      <div className="space-y-3">
        {currentWordIndex >= 0 && (
          <div className="bg-indigo-100 rounded-xl p-3 text-center">
            <p className="text-sm text-indigo-600">현재 출제: <span className="font-bold">{words[currentWordIndex]?.english}</span></p>
          </div>
        )}

        <p className="text-sm text-gray-500 font-medium">각 단어의 뜻을 한국어로 입력하세요</p>

        {words.map((w, i) => (
          <div key={w.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition ${i === currentWordIndex ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 bg-white'}`}>
            <span className="font-bold text-gray-700 w-28 shrink-0">{w.english}</span>
            <input
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-indigo-400 outline-none"
              placeholder="한국어 뜻"
              value={answers[w.id] || ''}
              onChange={e => setAnswers(a => ({ ...a, [w.id]: e.target.value }))}
              disabled={submitted}
            />
          </div>
        ))}

        {!submitted ? (
          <Button onClick={handleSubmit} className="mt-4">제출하기</Button>
        ) : (
          <div className="text-center py-4 bg-emerald-50 rounded-xl">
            <p className="text-emerald-600 font-semibold">제출 완료! 결과를 기다리는 중...</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
