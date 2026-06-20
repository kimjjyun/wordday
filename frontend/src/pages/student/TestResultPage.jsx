import { useNavigate } from 'react-router-dom';

export default function TestResultPage() {
  const navigate = useNavigate();
  const myScore    = JSON.parse(sessionStorage.getItem('my_score')    || '{}');
  const classResult = JSON.parse(sessionStorage.getItem('test_result') || '{}');
  const pct = myScore.total ? Math.round((myScore.score / myScore.total) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-white max-w-lg mx-auto px-5">
      <div className="flex-1 pt-16 pb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-300 mb-4">Result</p>
        <h1 className="text-6xl font-black tracking-tighter leading-none mb-1">
          {myScore.score ?? 0}<span className="text-gray-200">/{myScore.total ?? '?'}</span>
        </h1>
        <p className="text-[13px] font-bold text-gray-300 mt-2">{pct}점</p>
        {myScore.answered !== undefined && myScore.answered < (myScore.total ?? 0) && (
          <p className="text-[12px] text-gray-400 font-medium mt-1">{myScore.answered}문제 풀음</p>
        )}

        {classResult.avg !== undefined && (
          <div className="mt-10">
            <div className="h-px bg-gray-100 mb-5" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-4">반 전체</p>
            <div className="flex gap-4">
              <div className="flex-1 text-center border border-gray-100 rounded-2xl py-4">
                <p className="text-2xl font-black text-black">{classResult.avg}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">반 평균</p>
              </div>
              <div className="flex-1 text-center border border-gray-100 rounded-2xl py-4">
                <p className="text-2xl font-black text-black">{classResult.topScore}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">최고점</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pb-10">
        <button
          onClick={() => navigate('/student')}
          className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition"
        >홈으로</button>
      </div>
    </div>
  );
}
