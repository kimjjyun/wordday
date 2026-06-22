import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClass, bulkCreateStudents, deleteStudent } from '../../api/classes';
import { createWordBook } from '../../api/wordbooks';
import { getClassTestHistory } from '../../api/tests';
import Layout from '../../components/Layout';

function downloadStudentTemplate() {
  const content = '이름,학번,비밀번호\n홍길동,2301,1234\n이영희,2302,1234';
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = '학생등록_양식.csv'; a.click();
  URL.revokeObjectURL(url);
}

const inputCls = 'w-full border border-gray-200 rounded-2xl px-4 py-3 text-[14px] font-medium outline-none focus:border-black transition placeholder:text-gray-300 placeholder:font-normal bg-white';

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [cls,       setCls]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [showAddWb, setShowAddWb] = useState(false);
  const [showBulk,  setShowBulk]  = useState(false);
  const [bulkTab,   setBulkTab]   = useState('direct');
  const [wbForm,    setWbForm]    = useState({ title: '', week: '' });
  const [rows,      setRows]      = useState([{ name: '', studentCode: '', password: '' }]);
  const [directMsg, setDirectMsg] = useState('');
  const [directLoading, setDirectLoading] = useState(false);
  const [csvLoading,    setCsvLoading]    = useState(false);
  const [csvResult,     setCsvResult]     = useState(null);
  const [csvError,      setCsvError]      = useState('');
  const [deletingId,    setDeletingId]    = useState(null);
  const [confirmStudentId, setConfirmStudentId] = useState(null);
  const [testHistory,   setTestHistory]   = useState([]);

  const load = () => getClass(id).then(r => setCls(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    getClassTestHistory(id).then(r => setTestHistory(r.data)).catch(() => {});
  }, [id]);

  const handleAddWordBook = async () => {
    if (!wbForm.title || !wbForm.week) return;
    await createWordBook({ classId: id, title: wbForm.title, week: Number(wbForm.week) });
    setWbForm({ title: '', week: '' }); setShowAddWb(false); load();
  };

  const updateRow = (i, f, v) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
  const addRow    = () => setRows(prev => [...prev, { name: '', studentCode: '', password: '' }]);
  const removeRow = (i) => setRows(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i));

  const handleDirectSubmit = async () => {
    const valid = rows.filter(r => r.name.trim() && r.studentCode.trim());
    if (!valid.length) { setDirectMsg('이름과 학번을 입력하세요.'); return; }
    setDirectLoading(true); setDirectMsg('');
    try {
      const res = await bulkCreateStudents(id, valid.map(r => ({ name: r.name.trim(), studentCode: r.studentCode.trim(), password: r.password.trim() || '1234' })));
      setRows([{ name: '', studentCode: '', password: '' }]);
      setDirectMsg(`${res.data.created}명 등록 완료`);
      load();
    } catch { setDirectMsg('오류가 발생했습니다.'); }
    finally { setDirectLoading(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setCsvError(''); setCsvResult(null); setCsvLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // UTF-8 BOM(EF BB BF)이 있으면 UTF-8, 없으면 한국어 Excel 기본값인 EUC-KR로 읽기
      const hasUtf8Bom = bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
      const text = new TextDecoder(hasUtf8Bom ? 'utf-8' : 'euc-kr').decode(buffer).replace(/^﻿/, '');
      const lines = text.trim().split('\n');
      const headerLine = lines[0].toLowerCase().replace(/\s/g, '');
      const dataLines = (headerLine.includes('이름') || headerLine.includes('name')) ? lines.slice(1) : lines;
      const students = dataLines.map(line => {
        const [name, studentCode, password] = line.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        return { name, studentCode, password: password || '1234' };
      }).filter(s => s.name && s.studentCode);
      if (!students.length) { setCsvError('유효한 데이터가 없습니다.'); return; }
      const res = await bulkCreateStudents(id, students);
      setCsvResult(res.data); load();
    } catch { setCsvError('파일 처리 중 오류가 발생했습니다.'); }
    finally { setCsvLoading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleDeleteStudent = async (studentId) => {
    setDeletingId(studentId);
    setConfirmStudentId(null);
    try { await deleteStudent(id, studentId); load(); }
    catch { /* no-op */ }
    finally { setDeletingId(null); }
  };

  if (loading || !cls) return (
    <Layout title="WORDDAY" back>
      <div className="flex items-center justify-center py-20">
        <div className="flex gap-1.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200 animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout title="WORDDAY" back>
      <div className="pb-8">

        {/* 학급 이름 + 코드 */}
        <div className="pt-2 pb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">Class</p>
          <h1 className="text-4xl font-black tracking-tighter leading-none">{cls.name}</h1>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-3xl font-black tracking-[0.2em] text-black">{cls.code}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(cls.code); }}
              className="text-[11px] font-bold text-gray-400 border border-gray-200 rounded-full px-3 py-1 hover:border-gray-400 transition"
            >복사</button>
          </div>
        </div>

        <div className="h-px bg-gray-100 mb-6" />

        {/* ── 학생 섹션 ─────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">
              Students · {cls.students?.length ?? 0}
            </p>
            <button
              onClick={() => { setShowBulk(v => !v); setDirectMsg(''); setCsvResult(null); setCsvError(''); }}
              className="text-[12px] font-bold text-black border border-gray-200 rounded-full px-3 py-1 hover:border-gray-400 transition"
            >{showBulk ? '닫기' : '등록'}</button>
          </div>

          {showBulk && (
            <div className="mb-4 bg-gray-50 rounded-[20px] p-4 space-y-3">
              {/* 탭 */}
              <div className="flex gap-0 border-b border-gray-200">
                {[['direct','직접 입력'], ['csv','CSV 업로드']].map(([k, l]) => (
                  <button key={k} onClick={() => setBulkTab(k)}
                    className={`flex-1 pb-2.5 text-[12px] font-bold transition relative ${bulkTab === k ? 'text-black' : 'text-gray-300'}`}
                  >
                    {l}
                    {bulkTab === k && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-black rounded-full" />}
                  </button>
                ))}
              </div>

              {bulkTab === 'direct' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-300 px-1">
                    <span className="col-span-4">이름</span>
                    <span className="col-span-4">학번</span>
                    <span className="col-span-3">비밀번호</span>
                  </div>
                  {rows.map((row, i) => (
                    <div key={i} className="grid grid-cols-12 gap-1 items-center">
                      <input className="col-span-4 border border-gray-200 rounded-xl px-2.5 py-2 text-[13px] font-medium outline-none focus:border-black bg-white placeholder:text-gray-200" placeholder="이름" value={row.name} onChange={e => updateRow(i, 'name', e.target.value)} />
                      <input className="col-span-4 border border-gray-200 rounded-xl px-2.5 py-2 text-[13px] font-medium outline-none focus:border-black bg-white placeholder:text-gray-200" placeholder="학번" value={row.studentCode} onChange={e => updateRow(i, 'studentCode', e.target.value)} />
                      <input className="col-span-3 border border-gray-200 rounded-xl px-2.5 py-2 text-[13px] font-medium outline-none focus:border-black bg-white placeholder:text-gray-200" placeholder="1234" value={row.password} onChange={e => updateRow(i, 'password', e.target.value)} />
                      <button onClick={() => removeRow(i)} className="col-span-1 text-gray-300 hover:text-black text-xl font-bold text-center transition">×</button>
                    </div>
                  ))}
                  <button onClick={addRow} className="w-full border border-dashed border-gray-200 rounded-xl py-2 text-[12px] font-medium text-gray-300 hover:border-gray-400 hover:text-gray-500 transition">
                    + 행 추가
                  </button>
                  {directMsg && <p className={`text-[12px] font-medium text-center py-1 ${directMsg.includes('오류') ? 'text-black' : 'text-gray-500'}`}>{directMsg}</p>}
                  <button onClick={handleDirectSubmit} disabled={directLoading} className="w-full bg-black text-white font-bold py-3 rounded-full text-[14px] tracking-tight active:scale-[0.97] transition disabled:opacity-40">
                    {directLoading ? '등록 중...' : '학생 등록'}
                  </button>
                </div>
              )}

              {bulkTab === 'csv' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-medium text-gray-400">이름, 학번, 비밀번호 순서</p>
                    <button onClick={downloadStudentTemplate} className="text-[11px] font-bold text-black border border-gray-200 rounded-full px-2.5 py-1 hover:border-black transition">
                      양식 다운로드
                    </button>
                  </div>
                  <label className="flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-2xl py-6 cursor-pointer hover:border-gray-400 transition">
                    {csvLoading ? <p className="text-[13px] font-medium text-gray-400">업로드 중...</p> : (
                      <>
                        <p className="text-[13px] font-medium text-gray-400">CSV 파일 선택</p>
                        <p className="text-[11px] text-gray-300 mt-1">.csv 파일만 지원</p>
                      </>
                    )}
                    <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {csvError && <p className="text-[12px] font-medium text-black text-center">{csvError}</p>}
                  {csvResult && (
                    <p className="text-[12px] font-medium text-gray-500 text-center">
                      {csvResult.created}명 등록 완료{csvResult.errors.length > 0 ? ` · 오류 ${csvResult.errors.length}건` : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 학생 목록 */}
          {cls.students?.length === 0 ? (
            <p className="text-[13px] text-gray-300 font-medium py-4">등록된 학생이 없습니다</p>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              {cls.students.map((s, i) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border border-gray-200" />
                      <span className="font-bold text-[15px] tracking-tight">{s.name}</span>
                      <span className="text-[12px] text-gray-300 font-medium">{s.studentCode}</span>
                    </div>
                    {confirmStudentId === s.id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeleteStudent(s.id)}
                          disabled={deletingId === s.id}
                          className="text-[11px] font-bold text-black transition disabled:opacity-40"
                        >확인</button>
                        <button
                          onClick={() => setConfirmStudentId(null)}
                          className="text-[11px] font-bold text-gray-300 hover:text-black transition"
                        >취소</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmStudentId(s.id)}
                        disabled={deletingId === s.id}
                        className="text-[11px] font-bold text-gray-300 hover:text-black transition disabled:opacity-40 px-2 py-1"
                      >삭제</button>
                    )}
                  </div>
                  {i < cls.students.length - 1 && <div className="h-px bg-gray-50" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100 mb-6" />

        {/* ── 단어장 섹션 ───────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">Word Books</p>
            <button onClick={() => setShowAddWb(v => !v)}
              className="text-[12px] font-bold text-black border border-gray-200 rounded-full px-3 py-1 hover:border-gray-400 transition">
              {showAddWb ? '닫기' : '+ 추가'}
            </button>
          </div>

          {showAddWb && (
            <div className="mb-4 bg-gray-50 rounded-[20px] p-4 space-y-2.5">
              <input className={inputCls + ' bg-gray-50'} placeholder="단어장 이름" value={wbForm.title} onChange={e => setWbForm(f => ({ ...f, title: e.target.value }))} />
              <input className={inputCls + ' bg-gray-50'} type="number" placeholder="주차 번호" value={wbForm.week} onChange={e => setWbForm(f => ({ ...f, week: e.target.value }))} />
              <div className="flex gap-2 pt-1">
                <button onClick={handleAddWordBook} className="flex-1 bg-black text-white font-bold py-3 rounded-full text-[14px] tracking-tight active:scale-[0.97] transition">만들기</button>
                <button onClick={() => setShowAddWb(false)} className="flex-1 border border-gray-200 text-black font-bold py-3 rounded-full text-[14px] tracking-tight active:scale-[0.97] transition">취소</button>
              </div>
            </div>
          )}

          {cls.wordBooks?.length === 0 ? (
            <p className="text-[13px] text-gray-300 font-medium py-4">단어장을 추가해야 학생이 공부할 수 있어요</p>
          ) : (
            <div>
              {cls.wordBooks.map((wb, i) => (
                <div key={wb.id}>
                  <button
                    className="w-full flex items-center justify-between py-4 text-left active:bg-gray-50 rounded-xl transition"
                    onClick={() => navigate(`/teacher/wordbooks/${wb.id}`)}
                  >
                    <div>
                      <p className="font-bold text-[15px] tracking-tight text-black">{wb.title}</p>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">{wb.week}주차</p>
                    </div>
                    <span className="text-gray-200 text-lg">›</span>
                  </button>
                  {i < cls.wordBooks.length - 1 && <div className="h-px bg-gray-100" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 최근 시험 기록 ─────────────────────────── */}
        {testHistory.length > 0 && (
          <>
            <div className="h-px bg-gray-100 mt-6 mb-6" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-3">Recent Tests</p>
              <div className="space-y-0">
                {testHistory.map((t, i) => {
                  const date = new Date(t.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
                  return (
                    <div key={t.id}>
                      <button
                        className="w-full flex items-center justify-between py-3.5 text-left active:bg-gray-50 rounded-xl transition"
                        onClick={() => navigate(`/teacher/test/${t.id}/results`)}
                      >
                        <div>
                          <p className="font-bold text-[14px] tracking-tight text-black">{t.wordBookTitle}</p>
                          <p className="text-[11px] font-medium text-gray-300 mt-0.5">
                            {date} · {t.studentCount}명 참여
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-black text-[15px] text-black">{t.avg}<span className="text-[11px] text-gray-300 font-medium">/{t.total}</span></p>
                            <p className="text-[10px] text-gray-300 font-medium">평균</p>
                          </div>
                          <span className="text-gray-200 text-lg">›</span>
                        </div>
                      </button>
                      {i < testHistory.length - 1 && <div className="h-px bg-gray-50" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

      </div>
    </Layout>
  );
}
