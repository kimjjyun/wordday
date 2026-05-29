import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/authStore';
import Layout from '../../components/Layout';
import Button from '../../components/Button';

export default function TestWaitingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [roomCode, setRoomCode] = useState('');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const testDataRef = useRef(null);

  useEffect(() => {
    return () => socketRef.current?.disconnect();
  }, []);

  const handleJoin = () => {
    if (roomCode.length !== 4) { setError('4자리 방 코드를 입력하세요.'); return; }
    setError('');

    const socket = io(import.meta.env.VITE_SOCKET_URL);
    socketRef.current = socket;

    socket.emit('student:join', { roomCode: roomCode.toUpperCase(), studentId: user.id });

    socket.on('join:confirmed', ({ testId }) => {
      testDataRef.current = { testId, roomCode: roomCode.toUpperCase() };
      setJoined(true);
    });

    socket.on('test:started', ({ words }) => {
      navigate('/student/test/active', { state: { testId: testDataRef.current?.testId, words, socket: null, roomCode: roomCode.toUpperCase() } });
    });

    socket.on('error', ({ message }) => setError(message));
  };

  // Socket 인스턴스를 navigate state로 넘길 수 없으므로 sessionStorage 활용
  const handleStarted = (words, testId) => {
    sessionStorage.setItem('test_words', JSON.stringify(words));
    sessionStorage.setItem('test_id', testId);
    navigate('/student/test/active');
  };

  useEffect(() => {
    if (!socketRef.current) return;
    socketRef.current.on('test:started', ({ words }) => {
      handleStarted(words, testDataRef.current?.testId);
    });
  }, [joined]);

  return (
    <Layout title="테스트 참여" back>
      {!joined ? (
        <div className="space-y-4 mt-8">
          <p className="text-center text-gray-600">선생님이 알려준 4자리 방 코드를 입력하세요.</p>
          <input
            className="w-full border-2 border-gray-200 rounded-xl p-4 text-center text-2xl font-bold tracking-widest uppercase focus:border-indigo-500 outline-none"
            maxLength={4}
            placeholder="AB12"
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button onClick={handleJoin}>입장하기</Button>
        </div>
      ) : (
        <div className="text-center mt-16 space-y-4">
          <p className="text-4xl">⏳</p>
          <p className="text-xl font-bold">선생님이 테스트를 시작할 때까지 대기 중...</p>
          <p className="text-gray-500">방 코드: <span className="font-bold text-indigo-600">{roomCode}</span></p>
          <div className="flex justify-center mt-4">
            <div className="w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}
    </Layout>
  );
}
