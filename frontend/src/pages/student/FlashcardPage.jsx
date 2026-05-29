import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTodayWords, submitReview } from '../../api/study';
import Layout from '../../components/Layout';
import Button from '../../components/Button';

export default function FlashcardPage() {
  const navigate = useNavigate();
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [wrongWords, setWrongWords] = useState([]);

  useEffect(() => {
    getTodayWords()
      .then(r => setWords(r.data))
      .finally(() => setLoading(false));
  }, []);

  const current = words[index];

  const handleRate = async (rating) => {
    if (rating === 1) setWrongWords(w => [...w, current]);
    await submitReview({ wordId: current.id, rating });
    if (index + 1 >= words.length) {
      setDone(true);
    } else {
      setIndex(i => i + 1);
      setFlipped(false);
    }
  };

  if (loading) return <Layout title="플래시카드" back><p className="text-center py-20 text-gray-400">불러오는 중...</p></Layout>;

  if (words.length === 0) return (
    <Layout title="플래시카드" back>
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">오늘 학습할 단어가 없습니다.</p>
        <Button onClick={() => navigate('/student')}>홈으로</Button>
      </div>
    </Layout>
  );

  if (done) return (
    <Layout title="학습 완료!" back>
      <div className="text-center py-12 space-y-4">
        <p className="text-5xl">🎉</p>
        <p className="text-xl font-bold">오늘 학습 완료!</p>
        <p className="text-gray-500">{words.length}개 중 <span className="text-red-500 font-semibold">{wrongWords.length}개</span> 틀렸어요</p>
        {wrongWords.length > 0 && (
          <div className="bg-red-50 rounded-xl p-4 text-left space-y-2">
            <p className="font-semibold text-red-600 text-sm">틀린 단어</p>
            {wrongWords.map(w => (
              <div key={w.id} className="flex justify-between text-sm">
                <span>{w.english}</span><span className="text-gray-500">{w.korean}</span>
              </div>
            ))}
          </div>
        )}
        <Button onClick={() => navigate('/student')}>홈으로</Button>
      </div>
    </Layout>
  );

  return (
    <Layout title="플래시카드" back>
      {/* 진행률 */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-1">
          <span>{index + 1} / {words.length}</span>
          <span>{Math.round(((index) / words.length) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all"
            style={{ width: `${(index / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* 카드 */}
      <div
        className="bg-white rounded-3xl shadow-md border border-gray-100 min-h-56 flex flex-col items-center justify-center p-8 cursor-pointer active:scale-95 transition mb-6"
        onClick={() => setFlipped(f => !f)}
      >
        {!flipped ? (
          <>
            <p className="text-3xl font-bold text-gray-800 mb-2">{current.english}</p>
            <p className="text-gray-400 text-sm">탭하여 뜻 확인</p>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-indigo-600 mb-2">{current.korean}</p>
            {current.example && <p className="text-gray-500 text-sm text-center mt-2 italic">"{current.example}"</p>}
          </>
        )}
      </div>

      {flipped && (
        <div className="grid grid-cols-2 gap-3">
          <Button variant="danger" onClick={() => handleRate(1)}>몰랐어 😅</Button>
          <Button variant="success" onClick={() => handleRate(3)}>알았어 😊</Button>
        </div>
      )}
    </Layout>
  );
}
