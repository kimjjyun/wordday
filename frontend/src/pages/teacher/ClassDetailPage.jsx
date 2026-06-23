import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClass, bulkCreateStudents, deleteStudent, updateStudent } from '../../api/classes';
import { createWordBook, bulkAddWords, deleteWordBook } from '../../api/wordbooks';
import { createTest, createTestWithWords, getClassTestHistory } from '../../api/tests';
import { RECOMMENDED_WORDS, WORDS_PER_DAY } from '../../data/recommendedWords';
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
const smallInputCls = 'border border-gray-200 rounded-xl px-2.5 py-2 text-[13px] font-medium outline-none focus:border-black bg-white placeholder:text-gray-200';

export default function ClassDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [cls,          setCls]          = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [showAddWb,    setShowAddWb]    = useState(false);
  const [showBulk,     setShowBulk]     = useState(false);
  const [bulkTab,      setBulkTab]      = useState('direct');
  const [wbForm,       setWbForm]       = useState({ title: '', week: '' });
  const [withDefault,  setWithDefault]  = useState(true);
  const [wbLoading,    setWbLoading]    = useState(false);
  const [confirmWbId,  setConfirmWbId]  = useState(null);
  const [deletingWbId, setDeletingWbId] = useState(null);
  const [studentSort,  setStudentSort]  = useState('code'); // 'code' | 'name'
  const [rows,         setRows]         = useState([{ name: '', studentCode: '', password: '' }]);
  const [directMsg,    setDirectMsg]    = useState('');
  const [directLoading, setDirectLoading] = useState(false);
  const [csvLoading,   setCsvLoading]   = useState(false);
  const [csvResult,    setCsvResult]    = useState(null);
  const [csvError,     setCsvError]     = useState('');
  const [testHistory,  setTestHistory]  = useState([]);

  // 학생 선택 / 수정
  const [selectedIds,  setSelectedIds]  = useState(new Set());
  const [editForm,     setEditForm]     = useState(null); // { id, name, studentCode, password }
  const [editLoading,  setEditLoading]  = useState(false);
  const [editMsg,      setEditMsg]      = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 함께하기 모달
  const DAY_SIZE   = WORDS_PER_DAY; // 하루 20개 (앱 전체 공통 기준)
  const TOTAL_DAYS = Math.ceil(RECOMMENDED_WORDS.length / DAY_SIZE);

  const [showTogether,        setShowTogether]        = useState(false);
  const [togetherStep,        setTogetherStep]        = useState(1); // 1=학생선택, 2=DAY선택
  const [togetherWbId,        setTogetherWbId]        = useState(null);
  const [usesDaySelect,       setUsesDaySelect]       = useState(true);
  const [dayRange,            setDayRange]            = useState({ start: 1, end: 1 });
  const [togetherStudentIds,  setTogetherStudentIds]  = useState(new Set());
  const [togetherLoading,     setTogetherLoading]     = useState(false);
  const [togetherError,       setTogetherError]       = useState('');

  const openTogether = () => {
    if (!cls) return;
    setTogetherStep(1);
    setUsesDaySelect(true);
    setTogetherWbId(cls.wordBooks?.[0]?.id ?? null);
    setDayRange({ start: 1, end: 1 });
    setTogetherStudentIds(new Set((cls.students ?? []).map(s => s.id)));
    setTogetherError('');
    setShowTogether(true);
  };

  const handleStartTogether = async () => {
    if (togetherStudentIds.size === 0) return;
    setTogetherLoading(true);
    setTogetherError('');
    try {
      let testRes;
      if (usesDaySelect) {
        // RECOMMENDED_WORDS에서 DAY 범위 단어 추출
        const sliceStart = (dayRange.start - 1) * DAY_SIZE;
        const sliceEnd   = dayRange.end * DAY_SIZE;
        const dayWords   = RECOMMENDED_WORDS.slice(sliceStart, sliceEnd).map(w => ({
          english: w.english, korean: w.korean,
          example: w.example || '', pronunciation: w.pronunciation || '',
        }));
        testRes = await createTestWithWords({
          classId: id, words: dayWords, targetStudentIds: [...togetherStudentIds],
        });
      } else {
        testRes = await createTest({
          classId: id, wordBookId: togetherWbId, targetStudentIds: [...togetherStudentIds],
        });
      }
      setShowTogether(false);
      navigate(`/teacher/test/${testRes.data.id}/run`, { state: { targetStudentIds: [...togetherStudentIds] } });
    } catch {
      setTogetherError('시작 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setTogetherLoading(false);
    }
  };

  const load = () => getClass(id).then(r => setCls(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);
  useEffect(() => {
    getClassTestHistory(id).then(r => setTestHistory(r.data)).catch(() => {});
  }, [id]);

  const handleAddWordBook = async () => {
    if (!wbForm.title || !wbForm.week) return;
    setWbLoading(true);
    try {
      const res = await createWordBook({ classId: id, title: wbForm.title, week: Number(wbForm.week) });
      if (withDefault) {
        const words = RECOMMENDED_WORDS.map(w => ({
          english: w.english, korean: w.korean,
          example: w.example || '', pronunciation: w.pronunciation || '',
        }));
        await bulkAddWords(res.data.id, words);
      }
      setWbForm({ title: '', week: '' });
      setWithDefault(true);
      setShowAddWb(false);
      load();
    } finally {
      setWbLoading(false);
    }
  };

  const handleDeleteWordBook = async (wbId) => {
    setDeletingWbId(wbId);
    setConfirmWbId(null);
    try { await deleteWordBook(wbId); load(); }
    catch { /* no-op */ }
    finally { setDeletingWbId(null); }
  };

  const updateRow = (i, f, v) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
  const addRow    = () => setRows(prev => [...prev, { name: '', studentCode: '', password: '' }]);
  const removeRow = (i) => setRows(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i));

  const handleDirectSubmit = async () => {
    const valid = rows.filter(r => r.name.trim() && r.studentCode.trim());
    if (!valid.length) { setDirectMsg('이름과 학번을 입력하세요.'); return; }
    setDirectLoading(true); setDirectMsg('');
    try {
      const res = await bulkCreateStudents(id, valid.map(r => ({
        name: r.name.trim(), studentCode: r.studentCode.trim(), password: r.password.trim() || '1234',
      })));
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

  // ── 선택 토글 ────────────────────────────────────────────────
  const toggleSelect = (sid) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid);
      else next.add(sid);
      return next;
    });
    setEditForm(null);
    setEditMsg('');
  };

  const clearSelection = () => { setSelectedIds(new Set()); setEditForm(null); setEditMsg(''); };

  // ── 선택 삭제 ────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    setActionLoading(true);
    try {
      await Promise.all([...selectedIds].map(sid => deleteStudent(id, sid)));
      clearSelection();
      load();
    } catch { /* no-op */ }
    finally { setActionLoading(false); }
  };

  // ── 수정 시작 ────────────────────────────────────────────────
  const handleEditStart = () => {
    const sid = [...selectedIds][0];
    const student = cls.students.find(s => s.id === sid);
    if (student) setEditForm({ id: student.id, name: student.name, studentCode: student.studentCode, password: '' });
    setEditMsg('');
  };

  // ── 수정 저장 ────────────────────────────────────────────────
  const handleEditSubmit = async () => {
    if (!editForm) return;
    setEditLoading(true); setEditMsg('');
    try {
      await updateStudent(id, editForm.id, {
        name: editForm.name,
        studentCode: editForm.studentCode,
        ...(editForm.password ? { password: editForm.password } : {}),
      });
      clearSelection();
      load();
    } catch { setEditMsg('수정 중 오류가 발생했습니다.'); }
    finally { setEditLoading(false); }
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

      {/* ── 함께하기 바텀시트 모달 ── */}
      {showTogether && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
          onClick={() => !togetherLoading && setShowTogether(false)}>
          <div className="bg-white w-full max-w-lg rounded-t-[28px] animate-slide-up flex flex-col"
            style={{ maxHeight: '85vh' }}
            onClick={e => e.stopPropagation()}>

            {/* 고정 헤더 */}
            <div className="px-6 pt-6 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              {/* 스텝 인디케이터 */}
              <div className="flex items-center gap-2 mb-4">
                <div className={`h-1 flex-1 rounded-full transition-all ${togetherStep >= 1 ? 'bg-black' : 'bg-gray-100'}`} />
                <div className={`h-1 flex-1 rounded-full transition-all ${togetherStep >= 2 ? 'bg-black' : 'bg-gray-100'}`} />
              </div>
              {togetherStep === 1 ? (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-0.5">Step 1 / 2</p>
                  <h2 className="text-2xl font-black tracking-tighter mb-4">학생 선택</h2>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-0.5">Step 2 / 2</p>
                  <h2 className="text-2xl font-black tracking-tighter mb-4">단어 범위 선택</h2>
                </>
              )}
            </div>

            {/* 스크롤 가능한 내용 */}
            <div className="flex-1 overflow-y-auto px-6">

              {/* ── STEP 1: 학생 선택 ── */}
              {togetherStep === 1 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-300">
                      선택 <span className="text-black">{togetherStudentIds.size}명</span>
                    </p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setTogetherStudentIds(new Set((cls.students ?? []).map(s => s.id)))}
                        className="text-[11px] font-bold text-black border border-gray-200 rounded-full px-2.5 py-1 hover:border-gray-400 transition"
                      >전체</button>
                      <button
                        onClick={() => setTogetherStudentIds(new Set())}
                        className="text-[11px] font-bold text-gray-400 border border-gray-200 rounded-full px-2.5 py-1 hover:border-gray-400 transition"
                      >해제</button>
                    </div>
                  </div>
                  {cls.students?.length === 0 ? (
                    <p className="text-[13px] text-gray-300 py-2">등록된 학생이 없습니다.</p>
                  ) : (
                    <div className="border border-gray-100 rounded-2xl overflow-hidden">
                      {[...(cls.students)].sort((a, b) =>
                        (parseInt(a.studentCode) || 0) - (parseInt(b.studentCode) || 0) || a.studentCode.localeCompare(b.studentCode)
                      ).map((s, i, arr) => {
                        const checked = togetherStudentIds.has(s.id);
                        return (
                          <div key={s.id}>
                            <button
                              onClick={() => setTogetherStudentIds(prev => {
                                const next = new Set(prev);
                                checked ? next.delete(s.id) : next.add(s.id);
                                return next;
                              })}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
                            >
                              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                                checked ? 'bg-black border-black' : 'border-gray-200'
                              }`}>
                                {checked && (
                                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                                    <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                )}
                              </div>
                              <span className="font-bold text-[14px] text-black flex-1">{s.name}</span>
                              <span className="text-[12px] text-gray-300 font-medium">{s.studentCode}</span>
                            </button>
                            {i < arr.length - 1 && <div className="h-px bg-gray-50" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: DAY 선택 ── */}
              {togetherStep === 2 && (
                <div className="mb-4">
                  {/* 단어장 선택 */}
                  <div className="space-y-1.5 mb-4">
                    <button
                      onClick={() => { setUsesDaySelect(true); setTogetherWbId(null); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition ${
                        usesDaySelect ? 'border-black bg-black/5' : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                        usesDaySelect ? 'border-black bg-black' : 'border-gray-300'
                      }`}>
                        {usesDaySelect && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="font-bold text-[14px] text-black">기본 단어 DAY별 선택</p>
                        <p className="text-[11px] text-gray-300 font-medium">{RECOMMENDED_WORDS.length.toLocaleString()}개 · 총 {TOTAL_DAYS}일</p>
                      </div>
                    </button>
                    {cls.wordBooks?.map(wb => (
                      <button key={wb.id}
                        onClick={() => { setUsesDaySelect(false); setTogetherWbId(wb.id); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition ${
                          !usesDaySelect && togetherWbId === wb.id ? 'border-black bg-black/5' : 'border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                          !usesDaySelect && togetherWbId === wb.id ? 'border-black bg-black' : 'border-gray-300'
                        }`}>
                          {!usesDaySelect && togetherWbId === wb.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <div>
                          <p className="font-bold text-[14px] text-black">{wb.title}</p>
                          <p className="text-[11px] text-gray-300 font-medium">{wb.week}주차 · {wb.wordCount ?? '?'}개</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* DAY 범위 선택 */}
                  {usesDaySelect && (
                    <div className="bg-gray-50 rounded-2xl px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-3">DAY 범위</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-300 text-center mb-1.5">시작</p>
                          <div className="flex items-center border border-gray-200 bg-white rounded-xl overflow-hidden">
                            <button onClick={() => setDayRange(r => ({ ...r, start: Math.max(1, r.start - 1) }))}
                              className="px-3 py-2.5 text-gray-400 hover:text-black font-bold text-lg transition">−</button>
                            <span className="flex-1 text-center font-black text-[13px]">DAY {dayRange.start}</span>
                            <button onClick={() => setDayRange(r => ({ ...r, start: Math.min(r.end, r.start + 1) }))}
                              className="px-3 py-2.5 text-gray-400 hover:text-black font-bold text-lg transition">+</button>
                          </div>
                        </div>
                        <span className="text-gray-300 font-bold text-lg mt-5">~</span>
                        <div className="flex-1">
                          <p className="text-[10px] text-gray-300 text-center mb-1.5">끝</p>
                          <div className="flex items-center border border-gray-200 bg-white rounded-xl overflow-hidden">
                            <button onClick={() => setDayRange(r => ({ ...r, end: Math.max(r.start, r.end - 1) }))}
                              className="px-3 py-2.5 text-gray-400 hover:text-black font-bold text-lg transition">−</button>
                            <span className="flex-1 text-center font-black text-[13px]">DAY {dayRange.end}</span>
                            <button onClick={() => setDayRange(r => ({ ...r, end: Math.min(TOTAL_DAYS, r.end + 1) }))}
                              className="px-3 py-2.5 text-gray-400 hover:text-black font-bold text-lg transition">+</button>
                          </div>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-400 text-center mt-2.5 font-medium">
                        DAY {dayRange.start}{dayRange.end > dayRange.start ? `~${dayRange.end}` : ''} ·&nbsp;
                        {Math.min((dayRange.end - dayRange.start + 1) * DAY_SIZE, RECOMMENDED_WORDS.length - (dayRange.start - 1) * DAY_SIZE)}개 단어
                      </p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* 고정 하단 버튼 */}
            <div className="px-6 pt-3 pb-8 flex-shrink-0 border-t border-gray-100 bg-white">
              {togetherError && (
                <p className="text-[12px] font-medium text-black text-center mb-2">{togetherError}</p>
              )}
              {togetherStep === 1 ? (
                <button
                  onClick={() => setTogetherStep(2)}
                  disabled={togetherStudentIds.size === 0}
                  className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition disabled:opacity-40"
                >
                  다음 · {togetherStudentIds.size}명 선택 →
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setTogetherStep(1)}
                    disabled={togetherLoading}
                    className="flex-none border border-gray-200 text-gray-600 font-bold py-4 px-5 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition hover:border-gray-400 disabled:opacity-40"
                  >←</button>
                  <button
                    onClick={handleStartTogether}
                    disabled={togetherLoading || (!usesDaySelect && !togetherWbId)}
                    className="flex-1 bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition disabled:opacity-40"
                  >
                    {togetherLoading ? '시작 중...' : '테스트 시작 →'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

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

        {/* 함께하기 시작 버튼 */}
        <button
          onClick={openTogether}
          className="w-full flex items-center justify-between bg-black text-white rounded-2xl px-5 py-4 mb-6 active:scale-[0.98] transition"
        >
          <div className="text-left">
            <p className="font-black text-[16px] tracking-tight">함께하기 시작</p>
            <p className="text-[11px] text-white/50 font-medium mt-0.5">단어장·학생 선택 후 즉시 초대</p>
          </div>
          <span className="text-2xl">→</span>
        </button>

        <div className="h-px bg-gray-100 mb-6" />

        {/* ── 학생 섹션 ─────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">
              Students · {cls.students?.length ?? 0}
            </p>
            <button
              onClick={() => {
                setShowBulk(v => !v);
                setDirectMsg(''); setCsvResult(null); setCsvError('');
                clearSelection();
              }}
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
                      <input className={`col-span-4 ${smallInputCls}`} placeholder="이름" value={row.name} onChange={e => updateRow(i, 'name', e.target.value)} />
                      <input className={`col-span-4 ${smallInputCls}`} placeholder="학번" value={row.studentCode} onChange={e => updateRow(i, 'studentCode', e.target.value)} />
                      <input className={`col-span-3 ${smallInputCls}`} placeholder="1234" value={row.password} onChange={e => updateRow(i, 'password', e.target.value)} />
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
            <div>
              {/* 정렬 토글 */}
              <div className="flex gap-1 mb-2">
                {[['code','번호순'], ['name','가나다순']].map(([k, l]) => (
                  <button key={k} onClick={() => setStudentSort(k)}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full transition ${
                      studentSort === k ? 'bg-black text-white' : 'border border-gray-200 text-gray-300 hover:border-gray-400'
                    }`}>{l}
                  </button>
                ))}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {[...(cls.students)].sort((a, b) => studentSort === 'name'
                  ? a.name.localeCompare(b.name, 'ko')
                  : (parseInt(a.studentCode) || 0) - (parseInt(b.studentCode) || 0) || a.studentCode.localeCompare(b.studentCode)
                ).map((s, i, arr) => {
                  const isSelected = selectedIds.has(s.id);
                  const isEditing  = editForm?.id === s.id;
                  return (
                    <div key={s.id}>
                      {/* 학생 행 */}
                      <div className="flex items-center gap-3 py-3">
                        {/* 동그라미 체크 버튼 */}
                        <button
                          onClick={() => toggleSelect(s.id)}
                          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-black border-black'
                              : 'border-gray-200 bg-white hover:border-gray-400'
                          }`}
                        >
                          {isSelected && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                        <span className={`font-bold text-[15px] tracking-tight transition ${isSelected ? 'text-black' : 'text-black'}`}>
                          {s.name}
                        </span>
                        <span className="text-[12px] text-gray-300 font-medium">{s.studentCode}</span>
                      </div>

                      {/* 수정 인라인 폼 */}
                      {isEditing && (
                        <div className="mb-2 ml-8 bg-gray-50 rounded-2xl p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1">이름</p>
                              <input
                                className={smallInputCls + ' w-full'}
                                value={editForm.name}
                                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                placeholder="이름"
                              />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1">학번</p>
                              <input
                                className={smallInputCls + ' w-full'}
                                value={editForm.studentCode}
                                onChange={e => setEditForm(f => ({ ...f, studentCode: e.target.value }))}
                                placeholder="학번"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1">새 비밀번호 (빈칸이면 유지)</p>
                            <input
                              className={smallInputCls + ' w-full'}
                              type="password"
                              value={editForm.password}
                              onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                              placeholder="변경 시에만 입력"
                            />
                          </div>
                          {editMsg && <p className="text-[11px] text-black text-center">{editMsg}</p>}
                          <div className="flex gap-1.5 pt-0.5">
                            <button
                              onClick={handleEditSubmit}
                              disabled={editLoading}
                              className="flex-1 bg-black text-white text-[12px] font-bold py-2 rounded-full transition disabled:opacity-40"
                            >
                              {editLoading ? '저장 중...' : '저장'}
                            </button>
                            <button
                              onClick={() => { setEditForm(null); setEditMsg(''); }}
                              className="flex-1 border border-gray-200 text-[12px] font-bold py-2 rounded-full transition hover:border-gray-400"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      )}

                      {i < arr.length - 1 && <div className="h-px bg-gray-50" />}
                    </div>
                  );
                })}
              </div>

              {/* 선택 시 액션 바 */}
              {selectedIds.size > 0 && !editForm && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleBulkDelete}
                    disabled={actionLoading}
                    className="flex-1 bg-black text-white text-[13px] font-bold py-2.5 rounded-full transition active:scale-[0.97] disabled:opacity-40"
                  >
                    {actionLoading ? '삭제 중...' : `삭제 (${selectedIds.size}명)`}
                  </button>
                  {selectedIds.size === 1 && (
                    <button
                      onClick={handleEditStart}
                      className="flex-1 border border-gray-200 text-[13px] font-bold py-2.5 rounded-full transition hover:border-gray-400 active:scale-[0.97]"
                    >
                      수정
                    </button>
                  )}
                  <button
                    onClick={clearSelection}
                    className="px-4 text-[13px] font-bold text-gray-300 hover:text-black transition"
                  >
                    취소
                  </button>
                </div>
              )}
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

              {/* 기본 단어 포함 옵션 */}
              <button
                type="button"
                onClick={() => setWithDefault(v => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border-2 transition ${
                  withDefault ? 'border-black bg-white' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="text-left">
                  <p className={`text-[13px] font-bold ${withDefault ? 'text-black' : 'text-gray-400'}`}>
                    기본 단어 {RECOMMENDED_WORDS.length.toLocaleString()}개 포함
                  </p>
                  <p className="text-[11px] text-gray-300 mt-0.5">수능/고교 필수 어휘 전체</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                  withDefault ? 'bg-black border-black' : 'border-gray-200'
                }`}>
                  {withDefault && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </button>
              {withDefault && (
                <p className="text-[11px] text-gray-300 text-center">
                  단어장 생성 후 자동으로 추가됩니다 (수 초 소요)
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={handleAddWordBook} disabled={wbLoading} className="flex-1 bg-black text-white font-bold py-3 rounded-full text-[14px] tracking-tight active:scale-[0.97] transition disabled:opacity-40">
                  {wbLoading ? (withDefault ? '단어 추가 중...' : '생성 중...') : '만들기'}
                </button>
                <button onClick={() => { setShowAddWb(false); setWithDefault(true); }} disabled={wbLoading} className="flex-1 border border-gray-200 text-black font-bold py-3 rounded-full text-[14px] tracking-tight active:scale-[0.97] transition disabled:opacity-40">취소</button>
              </div>
            </div>
          )}

          {cls.wordBooks?.length === 0 ? (
            <p className="text-[13px] text-gray-300 font-medium py-4">단어장을 추가해야 학생이 공부할 수 있어요</p>
          ) : (
            <div>
              {cls.wordBooks.map((wb, i) => (
                <div key={wb.id}>
                  <div className="flex items-center gap-2 py-2">
                    <button
                      className="flex-1 flex items-center justify-between py-2 text-left active:bg-gray-50 rounded-xl transition min-w-0"
                      onClick={() => navigate(`/teacher/wordbooks/${wb.id}`)}
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-[15px] tracking-tight text-black truncate">{wb.title}</p>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-300 mt-0.5">{wb.week}주차</p>
                      </div>
                      <span className="text-gray-200 text-lg ml-2">›</span>
                    </button>
                    {confirmWbId === wb.id ? (
                      <div className="flex items-center gap-2 shrink-0 pl-1">
                        <button
                          onClick={() => handleDeleteWordBook(wb.id)}
                          disabled={deletingWbId === wb.id}
                          className="text-[11px] font-bold text-white bg-black rounded-full px-3 py-1.5 transition disabled:opacity-40"
                        >{deletingWbId === wb.id ? '삭제 중' : '삭제'}</button>
                        <button
                          onClick={() => setConfirmWbId(null)}
                          className="text-[11px] font-bold text-gray-300 hover:text-black transition"
                        >취소</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmWbId(wb.id)}
                        disabled={deletingWbId === wb.id}
                        className="shrink-0 w-7 h-7 flex items-center justify-center text-gray-300 hover:text-black text-lg font-bold transition disabled:opacity-40"
                        aria-label="단어장 삭제"
                      >×</button>
                    )}
                  </div>
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
