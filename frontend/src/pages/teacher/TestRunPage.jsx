import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { startTest, finishTest } from '../../api/tests';
import Layout from '../../components/Layout';
import Button from '../../components/Button';

function CopyableCode({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <p
        onClick={handleCopy}
        className="text-6xl font-black text-black tracking-widest cursor-pointer select-all"
      >{code}</p>
      <span className="text-[11px] font-bold text-gray-300 tracking-wider">
        {copied ? '복사됨' : '탭하면 복사'}
      </span>
    </div>
  );
}

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
            <div className="border border-gray-100 rounded-2xl p-6 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-4">Room Code</p>
              {roomCode ? <CopyableCode code={roomCode} /> : <p className="text-6xl font-black text-gray-200 tracking-widest">...</p>}
              <div className="h-px bg-gray-100 my-4" />
              <p className="text-[13px] font-medium text-gray-400">입장 학생 <span className="font-black text-black">{studentCount}명</span></p>
            </div>
            <Button onClick={handleStart} disabled={!roomCode}>테스트 시작</Button>
          </>
        )}

        {status === 'active' && (
          <>
            <div className="bg-black rounded-[28px] p-8 text-center text-white min-h-48 flex flex-col justify-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/30 mb-4">{wordIndex + 1} / {totalWords}</p>
              <p className="text-5xl font-black tracking-tighter">{currentWord ?? '준비 중...'}</p>
            </div>

            <div className="flex gap-4 text-center">
              <div className="flex-1 bg-gray-50 rounded-xl py-3">
                <p className="text-2xl font-black text-black">{studentCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">참여 학생</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl py-3">
                <p className="text-2xl font-black text-black">{submittedCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">제출 완료</p>
              </div>
            </div>

            <Button variant="danger" onClick={handleFinish}>테스트 종료 및 결과 보기</Button>
          </>
        )}
      </div>
    </Layout>
  );
}
