import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResults } from '../../api/tests';
import Layout from '../../components/Layout';

export default function TestResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResults(id).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <Layout title="테스트 결과" back>
      <div className="flex justify-center py-20">
        <div className="flex gap-1.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout title="테스트 결과" back>
      <div className="pb-8">
        {data && (
          <>
            {/* 요약 통계 */}
            <div className="pt-2 pb-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">Summary</p>
              <h1 className="text-4xl font-black tracking-tighter">결과 분석</h1>
            </div>

            <div className="h-px bg-gray-100 mb-5" />

            <div className="flex mb-8">
              <div className="flex-1 text-center">
                <p className="text-3xl font-black text-black">{data.avg}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">반 평균</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="flex-1 text-center">
                <p className="text-3xl font-black text-black">{data.topScore}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">최고점</p>
              </div>
              <div className="w-px bg-gray-100" />
              <div className="flex-1 text-center">
                <p className="text-3xl font-black text-black">{data.results.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">참여 학생</p>
              </div>
            </div>

            <div className="h-px bg-gray-100 mb-5" />

            {/* 학생별 결과 */}
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-3">
              Students · {data.results.length}
            </p>
            <div className="space-y-0">
              {data.results.map((r, i) => (
                <div key={r.studentCode}>
                  <div className="flex items-center gap-3 py-3.5">
                    <span className="text-[11px] font-bold text-gray-200 w-5 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-bold text-[15px] tracking-tight text-black">{r.studentName}</span>
                      <span className="text-[12px] text-gray-300 font-medium ml-2">{r.studentCode}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-black text-[17px] tracking-tight text-black">{r.score}</span>
                      <span className="text-[13px] text-gray-300 font-medium">/{r.total}</span>
                      <p className="text-[11px] text-gray-300 font-medium">{Math.round((r.score / r.total) * 100)}점</p>
                    </div>
                  </div>
                  {i < data.results.length - 1 && <div className="h-px bg-gray-50 ml-8" />}
                </div>
              ))}
            </div>

            <div className="pt-8">
              <button
                onClick={() => navigate('/teacher')}
                className="w-full border border-gray-200 text-black font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition hover:border-gray-400"
              >대시보드로</button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
