import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTodayWords, getStats } from '../../api/study';
import Layout from '../../components/Layout';

const DAYS_EN = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const PREVIEW = 5;

function WordRow({ word, index: i }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        className="w-full flex items-baseline gap-3 py-3.5 text-left active:bg-gray-50 rounded-xl transition"
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-[11px] font-bold text-gray-200 w-5 text-right shrink-0">{i + 1}</span>
        <span className="font-bold text-[15px] text-black tracking-tight flex-1">{word.english}</span>
        <span className="text-[13px] text-gray-400 font-medium shrink-0">{word.korean}</span>
      </button>
      {open && (
        <div className="ml-8 pb-3 -mt-1">
          {word.example && (
            <p className="text-[12px] text-gray-300 font-medium leading-relaxed">"{word.example}"</p>
          )}
        </div>
      )}
      <div className="h-px bg-gray-50 ml-8" />
    </div>
  );
}

export default function StudentHome() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [words,   setWords]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const now     = new Date();
  const dayEn   = DAYS_EN[now.getDay()];
  const dateStr = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  useEffect(() => {
    setLoading(true);
    Promise.all([getTodayWords(), getStats()])
      .then(([wr, sr]) => { setWords(wr.data); setStats(sr.data); })
      .finally(() => setLoading(false));
  }, [location.key]);

  const remaining = Math.max(0, words.length - PREVIEW);
  const allDone   = !loading && stats && stats.due === 0 && stats.totalWords > 0;

  return (
    <Layout title="WORDDAY">
      <div className="pb-8">

        {/* 날짜 헤더 */}
        <div className="pt-2 pb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">{dateStr}</p>
          <h1 className="text-5xl font-black tracking-tighter text-black leading-none">{dayEn}</h1>
          {stats && stats.totalWords > 0 && (
            <div className="flex items-center gap-1.5 mt-4">
              {[...Array(8)].map((_, i) => {
                const total  = Math.max(stats.totalWords, 1);
                const filled = Math.round(((stats.totalWords - stats.due) / total) * 8);
                return <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < filled ? 'bg-black' : 'bg-gray-200'}`} />;
              })}
              <span className="text-[11px] text-gray-300 ml-1 font-medium">
                {allDone ? '오늘 완료' : `${stats.due}개 남음`}
              </span>
            </div>
          )}
        </div>

        {/* 통계 */}
        {stats && stats.totalWords > 0 && (
          <>
            <div className="h-px bg-gray-100" />
            <div className="flex py-4">
              {[
                { label: '남은 단어', value: stats.due },
                { label: '완전 암기', value: stats.mastered },
                { label: '전체 단어', value: stats.totalWords },
              ].map((s, i) => (
                <div key={i} className={`flex-1 text-center ${i > 0 ? 'border-l border-gray-100' : ''}`}>
                  <p className="text-2xl font-black text-black">{s.value}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="h-px bg-gray-100" />
          </>
        )}

        {/* 오늘의 단어 */}
        {!loading && (
          <div className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">Today's Words</p>
              <span className="text-[11px] font-bold text-gray-300">{words.length}개</span>
            </div>

            {allDone ? (
              <div className="py-10 text-center">
                <p className="text-3xl font-black tracking-tighter mb-2">오늘 완료.</p>
                <p className="text-[13px] text-gray-300 font-medium">내일 새 단어가 준비돼요</p>
              </div>
            ) : words.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl font-black tracking-tighter mb-1">단어가 없어요</p>
                <p className="text-sm text-gray-300">선생님이 단어장을 배정하면 표시돼요</p>
              </div>
            ) : (
              <>
                {words.slice(0, PREVIEW).map((w, i) => (
                  <WordRow key={w.id} word={w} index={i} />
                ))}

                {remaining > 0 && (
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className="w-full flex items-center justify-between border border-gray-100 rounded-full px-5 py-3 mt-2 mb-1 hover:border-gray-300 transition"
                  >
                    <span className="text-[13px] font-medium text-gray-400">
                      {showAll ? '접기' : `+${remaining}개 더 보기`}
                    </span>
                    <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 text-sm">
                      {showAll ? '−' : '+'}
                    </div>
                  </button>
                )}

                {showAll && remaining > 0 && (
                  <div>
                    {words.slice(PREVIEW).map((w, i) => (
                      <WordRow key={w.id} word={w} index={PREVIEW + i} />
                    ))}
                  </div>
                )}

                <div className="space-y-2.5 mt-5">
                  <button
                    onClick={() => navigate('/student/flashcard')}
                    className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition"
                  >암기하기</button>
                  <button
                    onClick={() => navigate('/student/quiz')}
                    className="w-full bg-white text-black border-2 border-black font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition"
                  >퀴즈 풀기</button>
                </div>
              </>
            )}
          </div>
        )}

        {loading && (
          <div className="pt-10 space-y-0">
            {[...Array(5)].map((_, i) => (
              <div key={i}>
                <div className="flex items-baseline gap-3 py-3.5">
                  <div className="w-5 h-3 bg-gray-100 rounded-full animate-pulse shrink-0" />
                  <div className="h-4 bg-gray-100 rounded-full animate-pulse flex-1" />
                  <div className="h-3 bg-gray-100 rounded-full animate-pulse w-16 shrink-0" />
                </div>
                <div className="h-px bg-gray-50" />
              </div>
            ))}
          </div>
        )}

        {/* 함께하기 */}
        {!loading && (
          <div className="pt-8">
            <div className="h-px bg-gray-100 mb-5" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-2">Together</p>
            <p className="text-[12px] text-gray-300 font-medium mb-3">선생님이 시작한 테스트에 코드로 참여해요</p>
            <button
              onClick={() => navigate('/student/test/wait')}
              className="w-full border border-gray-200 text-black font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition hover:border-gray-400"
            >
              함께하기
            </button>
          </div>
        )}

      </div>
    </Layout>
  );
}
