import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getResults } from '../../api/tests';
import Layout from '../../components/Layout';

export default function TestResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(null);

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
            {/* 요약 */}
            <div className="pt-2 pb-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">
                {data.dayNumber > 0 ? `Day ${data.dayNumber} · ` : ''}Summary
              </p>
              <h1 className="text-4xl font-black tracking-tighter">결과 분석</h1>
            </div>

            <div className="h-px bg-gray-100 mb-5" />

            {/* 수치 요약 */}
            <div className="flex mb-6">
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
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">참여</p>
              </div>
            </div>

            {/* 단어별 정답률 */}
            {data.words?.length > 0 && (
              <>
                <div className="h-px bg-gray-100 mb-5" />
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-3">
                  단어별 정답률
                </p>
                <div className="space-y-0 mb-6">
                  {data.words.map((w, i) => {
                    const correctCount = data.results.filter(r => r.detail?.[i]?.correct).length;
                    const total        = data.results.length;
                    const pct          = total > 0 ? Math.round((correctCount / total) * 100) : 0;
                    return (
                      <div key={w.id}>
                        <div className="flex items-center gap-3 py-2.5">
                          <span className="text-[11px] font-bold text-gray-200 w-5 text-right shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <span className="font-bold text-[14px] text-black">{w.english}</span>
                              <span className="text-[12px] text-gray-400 font-medium">{w.korean}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-black rounded-full transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-bold text-gray-400 shrink-0 w-10 text-right">
                                {correctCount}/{total}
                              </span>
                            </div>
                          </div>
                        </div>
                        {i < data.words.length - 1 && <div className="h-px bg-gray-50 ml-8" />}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div className="h-px bg-gray-100 mb-5" />

            {/* 학생별 결과 — 탭하면 O/X 상세 */}
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-3">
              학생별 · {data.results.length}명
            </p>
            <p className="text-[11px] text-gray-300 font-medium mb-3">이름을 탭하면 단어별 O/X 확인</p>
            <div className="space-y-0">
              {data.results.map((r, i) => (
                <div key={r.studentCode}>
                  <button
                    className="w-full text-left active:bg-gray-50 rounded-xl transition"
                    onClick={() => setExpanded(expanded === r.studentCode ? null : r.studentCode)}
                  >
                    <div className="flex items-center gap-3 py-3.5">
                      <span className="text-[11px] font-bold text-gray-200 w-5 text-right shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-[15px] tracking-tight text-black">{r.studentName}</span>
                        <span className="text-[12px] text-gray-300 font-medium ml-2">{r.studentCode}</span>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <span className="font-black text-[17px] tracking-tight text-black">{r.score}</span>
                          <span className="text-[13px] text-gray-300 font-medium">/{r.total}</span>
                          <p className="text-[11px] text-gray-300 font-medium">
                            {r.total > 0 ? Math.round((r.score / r.total) * 100) : 0}점
                          </p>
                        </div>
                        <span className="text-gray-200 text-lg">{expanded === r.studentCode ? '∨' : '›'}</span>
                      </div>
                    </div>
                  </button>

                  {/* O/X 상세 */}
                  {expanded === r.studentCode && r.detail?.length > 0 && (
                    <div className="ml-8 pb-3 -mt-1">
                      <div className="flex flex-wrap gap-1.5">
                        {r.detail.map((d, di) => (
                          <span
                            key={d.wordId}
                            className={`inline-flex flex-col items-center px-2.5 py-1.5 rounded-xl text-[11px] font-bold ${
                              d.correct
                                ? 'bg-gray-50 text-gray-500'
                                : 'bg-black text-white'
                            }`}
                          >
                            <span>{d.correct ? '○' : '×'}</span>
                            <span className="text-[10px] mt-0.5 font-medium">{d.english}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {i < data.results.length - 1 && <div className="h-px bg-gray-50 ml-8" />}
                </div>
              ))}
            </div>

            <div className="pt-8">
              <button
                onClick={() => navigate(-1)}
                className="w-full border border-gray-200 text-black font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition hover:border-gray-400"
              >돌아가기</button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
