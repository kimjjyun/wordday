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
  const [status, setStatus] = useState('waiting');
  const [roomCode, setRoomCode] = useState('');
  const [studentCount, setStudentCount] = useState(0);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [words, setWords] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL);
    socketRef.current = socket;

    socket.emit('teacher:create_room', { testId: id });
    socket.on('room:created', ({ roomCode: rc, classId }) => {
      setRoomCode(rc);
      // 학급 전체에 초대 자동 발송
      socket.emit('teacher:invite_class', { classId, testId: id, roomCode: rc });
    });
    socket.on('room:student_joined', ({ count }) => setStudentCount(count));
    socket.on('room:submission_update', ({ submittedCount: sc }) => setSubmittedCount(sc));
    socket.on('test:started', ({ words: w }) => setWords(w));
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
      <div className="space-y-5">
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
            {/* 진행 현황 */}
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-50 rounded-2xl py-4 text-center">
                <p className="text-2xl font-black text-black">{studentCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">참여 학생</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-2xl py-4 text-center">
                <p className="text-2xl font-black text-black">{submittedCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">제출 완료</p>
              </div>
              <div className="flex-1 bg-black rounded-2xl py-4 text-center">
                <p className="text-2xl font-black text-white">{words.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mt-0.5">총 단어</p>
              </div>
            </div>

            {/* 단어 전체 목록 */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-3">Words</p>
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                {words.map((w, i) => (
                  <div key={w.id}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <span className="text-[11px] font-bold text-gray-200 w-5 text-right shrink-0">{i + 1}</span>
                      <span className="font-bold text-[15px] text-black tracking-tight flex-1">{w.english}</span>
                      <span className="text-[13px] text-gray-400 font-medium shrink-0">{w.answer}</span>
                    </div>
                    {i < words.length - 1 && <div className="h-px bg-gray-50 ml-12" />}
                  </div>
                ))}
              </div>
            </div>

            <Button variant="danger" onClick={handleFinish}>테스트 종료 및 결과 보기</Button>
          </>
        )}
      </div>
    </Layout>
  );
}
