import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import Button from '../../components/Button';
import Card from '../../components/Card';

export default function TestResultPage() {
  const navigate = useNavigate();
  const myScore = JSON.parse(sessionStorage.getItem('my_score') || '{}');
  const classResult = JSON.parse(sessionStorage.getItem('test_result') || '{}');

  const pct = myScore.total ? Math.round((myScore.score / myScore.total) * 100) : 0;

  return (
    <Layout title="테스트 결과">
      <div className="space-y-4 mt-4">
        <Card className="text-center">
          <p className="text-5xl mb-2">{pct >= 90 ? '🏆' : pct >= 70 ? '👍' : '📚'}</p>
          <p className="text-3xl font-extrabold text-indigo-600">{myScore.score ?? '-'} / {myScore.total ?? '-'}</p>
          <p className="text-gray-500 mt-1">{pct}점</p>
        </Card>

        {classResult.avg !== undefined && (
          <Card>
            <p className="font-semibold mb-3">반 전체 결과</p>
            <div className="flex gap-4 text-center">
              <div className="flex-1 bg-gray-50 rounded-xl py-3">
                <p className="text-2xl font-bold">{classResult.avg}</p>
                <p className="text-xs text-gray-500">반 평균</p>
              </div>
              <div className="flex-1 bg-yellow-50 rounded-xl py-3">
                <p className="text-2xl font-bold text-yellow-600">{classResult.topScore}</p>
                <p className="text-xs text-gray-500">최고점</p>
              </div>
            </div>
          </Card>
        )}

        <Button onClick={() => navigate('/student')}>홈으로</Button>
      </div>
    </Layout>
  );
}
