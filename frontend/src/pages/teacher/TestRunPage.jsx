import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { startTest, finishTest } from '../../api/tests';
import Layout from '../../components/Layout';
import Button from '../../components/Button';

export default function TestRunPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('waiting'); // waiting | active | finished
  const [roomCode, setRoomCode] = useState('');
  const [studentCount, setStudentCount] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [currentWord, setCurrentWord] = useState(null);
  const [wordIndex, setWordIndex] = useState(-1);
  const [totalWords, setTotalWords] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL);
    socketRef.current = socket;

    socket.emit('teacher:create_room', { testId: id });
    socket.on('room:created', ({ roomCode: rc }) => setRoomCode(rc));
    socket.on('room:student_joined', ({ count }) => setStudentCount(count));
    socket.on('room:submission_update', ({ submittedCount: sc }) => setSubmittedCount(sc));
    socket.on('test:show_word', ({ index, english, total }) => {
      setCurrentWord(english);
      setWordIndex(index);
      setTotalWords(total);
    });
    socket.on('test:finished', ({ avg, topScore }) => {
      sessionStorage.setItem('test_class_result', JSON.stringify({ avg, topScore }));
      setStatus('finished');
    });

    return () => socket.disconnect();
  }, [id]);

  const handleStart = async () => {
    await startTest(id);
    setStatus('active');
    socketRef.current?.emit('teacher:start_test', { testId: id });
  };

  const handleFinish = async () => {
    socketRef.current?.emit('teacher:end_test', { testId: id });
    await finishTest(id);
    navigate(`/teacher/test/${id}/results`);
  };

  return (
    <Layout title="조회 테스트 진행" back={status === 'waiting'}>
      <div className="space-y-6">
        {status === 'waiting' && (
          <>
            <div className="bg-indigo-50 rounded-2xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-2">학생들에게 이 코드를 알려주세요</p>
              <p className="text-6xl font-extrabold text-indigo-600 tracking-widest">{roomCode || '...'}</p>
              <p className="text-gray-400 mt-2 text-sm">입장 학생: <span className="font-bold text-gray-700">{studentCount}명</span></p>
            </div>
            <Button onClick={handleStart} disabled={!roomCode}>테스트 시작</Button>
          </>
        )}

        {status === 'active' && (
          <>
            <div className="bg-gray-900 rounded-3xl p-8 text-center text-white min-h-48 flex flex-col justify-center">
              <p className="text-sm text-gray-400 mb-2">{wordIndex + 1} / {totalWords}</p>
              <p className="text-5xl font-extrabold">{currentWord ?? '준비 중...'}</p>
            </div>

            <div className="flex gap-4 text-center">
              <div className="flex-1 bg-gray-50 rounded-xl py-3">
                <p className="text-2xl font-bold">{studentCount}</p>
                <p className="text-xs text-gray-500">참여 학생</p>
              </div>
              <div className="flex-1 bg-emerald-50 rounded-xl py-3">
                <p className="text-2xl font-bold text-emerald-600">{submittedCount}</p>
                <p className="text-xs text-gray-500">제출 완료</p>
              </div>
            </div>

            <Button variant="danger" onClick={handleFinish}>테스트 종료 및 결과 보기</Button>
          </>
        )}
      </div>
    </Layout>
  );
}
