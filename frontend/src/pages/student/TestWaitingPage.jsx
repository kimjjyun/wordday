import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import Layout from '../../components/Layout';

export default function TestWaitingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const socketRef = useRef(null);
  const testRef   = useRef(null);

  const [code,   setCode]   = useState('');
  const [joined, setJoined] = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => () => socketRef.current?.disconnect(), []);

  const handleJoin = () => {
    const roomCode = code.trim().toUpperCase();
    if (roomCode.length !== 4) { setError('방 코드는 4자리입니다.'); return; }
    setError('');

    const socket = io(import.meta.env.VITE_SOCKET_URL);
    socketRef.current = socket;

    socket.emit('student:join', { roomCode, studentId: user.id });

    socket.on('join:confirmed', ({ testId }) => {
      testRef.current = { testId, roomCode };
      setJoined(true);
    });

    socket.on('test:started', ({ words }) => {
      sessionStorage.setItem('test_words', JSON.stringify(words));
      sessionStorage.setItem('test_id', testRef.current?.testId);
      navigate('/student/test/active');
    });

    socket.on('error', ({ message }) => {
      setError(message);
      socket.disconnect();
      socketRef.current = null;
    });
  };

  return (
    <Layout title="WORDDAY" back>
      {!joined ? (
        <div className="pt-12 pb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-3">Together</p>
          <h1 className="text-4xl font-black tracking-tighter mb-2">방 코드 입력</h1>
          <p className="text-[13px] text-gray-300 font-medium mb-8">선생님이 테스트를 시작하면 화면에 코드가 표시돼요</p>

          <input
            className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-center text-3xl font-black tracking-[0.3em] uppercase outline-none focus:border-black transition mb-3"
            maxLength={4}
            placeholder="AB12"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoFocus
          />

          {error && (
            <p className="text-[13px] font-medium text-black text-center mb-4">{error}</p>
          )}

          <p className="text-[12px] text-gray-300 font-medium text-center mb-6">
            선생님이 알려준 4자리 코드를 입력하세요
          </p>

          <button
            onClick={handleJoin}
            className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition"
          >
            입장하기
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="flex gap-1.5 justify-center mb-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-black animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-3">Waiting</p>
          <p className="text-3xl font-black tracking-tighter mb-2">참여 완료</p>
          <p className="text-sm text-gray-300 font-medium">선생님이 시작하면 자동으로 넘어가요</p>
        </div>
      )}
    </Layout>
  );
}
