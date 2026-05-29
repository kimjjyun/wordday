import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResults } from '../../api/tests';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function TestResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResults(id).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout title="테스트 결과" back><p className="text-center py-20 text-gray-400">불러오는 중...</p></Layout>;

  return (
    <Layout title="테스트 결과" back>
      <div className="space-y-4">
        {data && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="text-center">
                <p className="text-3xl font-bold text-indigo-600">{data.avg}</p>
                <p className="text-xs text-gray-500 mt-1">반 평균</p>
              </Card>
              <Card className="text-center">
                <p className="text-3xl font-bold text-yellow-500">{data.topScore}</p>
                <p className="text-xs text-gray-500 mt-1">최고점</p>
              </Card>
            </div>

            <Card>
              <p className="font-semibold mb-3">학생별 결과 ({data.results.length}명)</p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.results.map((r, i) => (
                  <div key={r.studentCode} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <span className="text-gray-300 text-sm w-5">{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{r.studentName}</p>
                      <p className="text-xs text-gray-400">{r.studentCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{r.score}<span className="text-gray-400 text-sm font-normal">/{r.total}</span></p>
                      <p className="text-xs text-gray-400">{Math.round((r.score / r.total) * 100)}점</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Button variant="secondary" onClick={() => navigate('/teacher')}>대시보드로</Button>
          </>
        )}
      </div>
    </Layout>
  );
}
