import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWordBook, addWord, importCSV } from '../../api/wordbooks';
import { createTest } from '../../api/tests';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function WordBookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wb, setWb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ english: '', korean: '', example: '' });
  const [importResult, setImportResult] = useState(null);

  const load = () => getWordBook(id).then(r => setWb(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const handleAddWord = async () => {
    if (!form.english || !form.korean) return;
    await addWord(id, form);
    setForm({ english: '', korean: '', example: '' });
    load();
  };

  const handleCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const res = await importCSV(id, file);
    setImportResult(res.data);
    load();
  };

  const handleStartTest = async () => {
    if (!wb) return;
    const res = await createTest({ classId: wb.classId, wordBookId: id });
    navigate(`/teacher/test/${res.data.id}/run`);
  };

  if (loading || !wb) return <Layout title="단어장" back><p className="text-center py-20 text-gray-400">불러오는 중...</p></Layout>;

  return (
    <Layout title={wb.title} back>
      <div className="space-y-4">
        <Card>
          <p className="text-sm text-gray-500">{wb.week}주차 · 단어 {wb.words?.length ?? 0}개</p>
          <div className="mt-3 space-y-2">
            <Button onClick={handleStartTest}>조회 테스트 시작</Button>
          </div>
        </Card>

        {/* 단어 직접 추가 */}
        <Card>
          <p className="font-semibold mb-3">단어 추가</p>
          <div className="space-y-2">
            <input className="w-full border border-gray-200 rounded-xl p-3 focus:border-indigo-400 outline-none" placeholder="영단어 (예: ambiguous)" value={form.english} onChange={e => setForm(f => ({ ...f, english: e.target.value }))} />
            <input className="w-full border border-gray-200 rounded-xl p-3 focus:border-indigo-400 outline-none" placeholder="한국어 뜻 (예: 모호한)" value={form.korean} onChange={e => setForm(f => ({ ...f, korean: e.target.value }))} />
            <input className="w-full border border-gray-200 rounded-xl p-3 focus:border-indigo-400 outline-none" placeholder="예문 (선택)" value={form.example} onChange={e => setForm(f => ({ ...f, example: e.target.value }))} />
            <Button variant="outline" onClick={handleAddWord}>단어 추가</Button>
          </div>
        </Card>

        {/* CSV 업로드 */}
        <Card>
          <p className="font-semibold mb-1">CSV 일괄 업로드</p>
          <p className="text-xs text-gray-400 mb-3">형식: english,korean,example (UTF-8)</p>
          <label className="block w-full border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-300">
            <span className="text-gray-400 text-sm">파일 선택 (CSV)</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleCSV} />
          </label>
          {importResult && (
            <p className="text-sm text-emerald-600 mt-2">{importResult.imported}개 업로드 완료 / 오류 {importResult.errors.length}건</p>
          )}
        </Card>

        {/* 단어 목록 */}
        <Card>
          <p className="font-semibold mb-3">단어 목록 ({wb.words?.length ?? 0}개)</p>
          {wb.words?.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-3">단어를 추가하세요.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {wb.words?.map((w, i) => (
                <div key={w.id} className="flex gap-3 py-2 border-b last:border-0">
                  <span className="text-gray-300 text-sm w-6">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium">{w.english}</p>
                    <p className="text-sm text-gray-500">{w.korean}</p>
                    {w.example && <p className="text-xs text-gray-400 italic">{w.example}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
