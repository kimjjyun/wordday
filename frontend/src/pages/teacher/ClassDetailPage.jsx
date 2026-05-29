import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClass, bulkCreateStudents } from '../../api/classes';
import { createWordBook } from '../../api/wordbooks';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddWb, setShowAddWb] = useState(false);
  const [wbForm, setWbForm] = useState({ title: '', week: '' });
  const [csvText, setCsvText] = useState('');
  const [bulkResult, setBulkResult] = useState(null);

  const load = () => getClass(id).then(r => setCls(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const handleAddWordBook = async () => {
    if (!wbForm.title || !wbForm.week) return;
    await createWordBook({ classId: id, title: wbForm.title, week: Number(wbForm.week) });
    setWbForm({ title: '', week: '' });
    setShowAddWb(false);
    load();
  };

  const handleBulkStudents = async () => {
    const lines = csvText.trim().split('\n').slice(1); // 헤더 제외
    const students = lines.map(line => {
      const [name, studentCode, password] = line.split(',').map(s => s.trim());
      return { name, studentCode, password: password || '1234' };
    }).filter(s => s.name && s.studentCode);
    if (students.length === 0) return;
    const res = await bulkCreateStudents(id, students);
    setBulkResult(res.data);
    load();
  };

  if (loading || !cls) return <Layout title="학급 상세" back><p className="text-center py-20 text-gray-400">불러오는 중...</p></Layout>;

  return (
    <Layout title={cls.name} back>
      <div className="space-y-4">
        {/* 학급 코드 */}
        <Card className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">학급 입장 코드</p>
            <p className="text-3xl font-extrabold text-indigo-600 tracking-widest">{cls.code}</p>
          </div>
          <button
            onClick={() => navigator.clipboard.writeText(cls.code)}
            className="text-xs bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg"
          >
            복사
          </button>
        </Card>

        {/* 학생 일괄 등록 */}
        <Card>
          <div className="flex justify-between items-center mb-2">
            <p className="font-semibold">학생 ({cls.students?.length ?? 0}명)</p>
          </div>
          <textarea
            className="w-full border border-gray-200 rounded-xl p-3 text-sm font-mono h-24 resize-none focus:border-indigo-400 outline-none"
            placeholder={"name,studentCode,password\n홍길동,2301,1234\n이영희,2302,1234"}
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
          />
          <Button className="mt-2" variant="outline" onClick={handleBulkStudents}>일괄 등록 (CSV)</Button>
          {bulkResult && (
            <p className="text-sm text-emerald-600 mt-2">{bulkResult.created}명 등록 완료 / 오류 {bulkResult.errors.length}건</p>
          )}
          {cls.students?.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto space-y-1">
              {cls.students.map(s => (
                <div key={s.id} className="flex justify-between text-sm">
                  <span>{s.name}</span><span className="text-gray-400">{s.studentCode}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 단어장 */}
        <Card>
          <div className="flex justify-between items-center mb-3">
            <p className="font-semibold">단어장</p>
            <button onClick={() => setShowAddWb(v => !v)} className="text-indigo-500 text-sm font-semibold">+ 추가</button>
          </div>
          {showAddWb && (
            <div className="space-y-2 mb-3">
              <input className="w-full border border-gray-200 rounded-xl p-3 focus:border-indigo-400 outline-none" placeholder="단어장 이름 (예: 1주차 수능 어휘)" value={wbForm.title} onChange={e => setWbForm(f => ({ ...f, title: e.target.value }))} />
              <input className="w-full border border-gray-200 rounded-xl p-3 focus:border-indigo-400 outline-none" type="number" placeholder="주차 번호 (예: 1)" value={wbForm.week} onChange={e => setWbForm(f => ({ ...f, week: e.target.value }))} />
              <div className="flex gap-2">
                <Button onClick={handleAddWordBook}>만들기</Button>
                <Button variant="secondary" onClick={() => setShowAddWb(false)}>취소</Button>
              </div>
            </div>
          )}
          {cls.wordBooks?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-3">단어장이 없습니다.</p>
          ) : (
            cls.wordBooks?.map(wb => (
              <div key={wb.id}
                className="flex justify-between items-center py-2 border-b last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2"
                onClick={() => navigate(`/teacher/wordbooks/${wb.id}`)}>
                <div>
                  <p className="font-medium">{wb.title}</p>
                  <p className="text-xs text-gray-400">{wb.week}주차</p>
                </div>
                <span className="text-gray-400 text-sm">→</span>
              </div>
            ))
          )}
        </Card>
      </div>
    </Layout>
  );
}
