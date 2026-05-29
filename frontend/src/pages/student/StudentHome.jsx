import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getTodayWords, getStats } from '../../api/study';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function StudentHome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [words, setWords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTodayWords(), getStats()])
      .then(([wr, sr]) => { setWords(wr.data); setStats(sr.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout title="WordDay">
      <div className="space-y-4">
        <Card>
          <p className="text-gray-500 text-sm">안녕하세요,</p>
          <p className="text-xl font-bold">{user?.name} 님</p>
          {stats && (
            <div className="flex gap-4 mt-3 text-center">
              <div className="flex-1 bg-indigo-50 rounded-xl py-2">
                <p className="text-2xl font-bold text-indigo-600">{stats.due}</p>
                <p className="text-xs text-gray-500">오늘 학습</p>
              </div>
              <div className="flex-1 bg-emerald-50 rounded-xl py-2">
                <p className="text-2xl font-bold text-emerald-600">{stats.mastered}</p>
                <p className="text-xs text-gray-500">완전 암기</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl py-2">
                <p className="text-2xl font-bold text-gray-600">{stats.totalWords}</p>
                <p className="text-xs text-gray-500">전체 단어</p>
              </div>
            </div>
          )}
        </Card>

        {loading ? (
          <p className="text-center text-gray-400 py-8">불러오는 중...</p>
        ) : words.length === 0 ? (
          <Card><p className="text-center text-gray-400 py-4">오늘 학습할 단어가 없습니다.</p></Card>
        ) : (
          <Card>
            <p className="font-semibold mb-1">오늘의 단어</p>
            <p className="text-indigo-500 font-bold text-lg mb-3">{words.length}개</p>
            <div className="max-h-40 overflow-y-auto space-y-1 mb-4">
              {words.slice(0, 5).map(w => (
                <div key={w.id} className="flex justify-between text-sm">
                  <span className="font-medium">{w.english}</span>
                  <span className="text-gray-400">{w.korean}</span>
                </div>
              ))}
              {words.length > 5 && <p className="text-xs text-gray-400 text-center">+ {words.length - 5}개 더</p>}
            </div>
            <div className="space-y-2">
              <Button onClick={() => navigate('/student/flashcard')}>암기하기 (플래시카드)</Button>
              <Button variant="outline" onClick={() => navigate('/student/quiz')}>퀴즈 풀기</Button>
            </div>
          </Card>
        )}

        <Card>
          <p className="font-semibold mb-2">조회 테스트 참여</p>
          <Button variant="secondary" onClick={() => navigate('/student/test/wait')}>
            방 코드 입력하기
          </Button>
        </Card>
      </div>
    </Layout>
  );
}
