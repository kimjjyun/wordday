import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWordBook, addWord, bulkAddWords, importCSV, deleteWord } from '../../api/wordbooks';
import { createTest, createTestWithWords } from '../../api/tests';
import Layout from '../../components/Layout';
import { CATEGORIES, RECOMMENDED_WORDS, TOTAL_DAYS } from '../../data/recommendedWords';

function downloadWordTemplate() {
  const content = 'english,korean,example,pronunciation\nambiguous,모호한,The answer was ambiguous.,/æmˈbɪɡjuəs/\ndiligent,근면한,She is a diligent student.,/ˈdɪlɪdʒənt/';
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = '단어장_양식.csv'; a.click();
  URL.revokeObjectURL(url);
}

const TABS = [
  { key: 'direct',  label: '직접 입력' },
  { key: 'suggest', label: '추천 단어' },
  { key: 'csv',     label: 'CSV' },
];

const inputCls = 'w-full border border-gray-200 rounded-2xl px-4 py-3 text-[14px] font-medium outline-none focus:border-black transition placeholder:text-gray-300 placeholder:font-normal bg-white';

export default function WordBookPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [wb,      setWb]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('direct');

  const [rows, setRows] = useState([{ english: '', korean: '', example: '' }]);
  const [directLoading, setDirectLoading] = useState(false);
  const [directMsg,     setDirectMsg]     = useState('');

  const [catFilter, setCatFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState(0);
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(new Set());
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestMsg,     setSuggestMsg]     = useState('');

  const [importLoading, setImportLoading] = useState(false);
  const [importResult,  setImportResult]  = useState(null);
  const [importError,   setImportError]   = useState('');

  const [deletingId, setDeletingId] = useState(null);
  const [confirmWordId, setConfirmWordId] = useState(null);
  const [showAddWords, setShowAddWords] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testDayFilter, setTestDayFilter] = useState(0);

  const [listSearch, setListSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => { setVisibleCount(50); }, [listSearch]);
  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const load = () => getWordBook(id).then(r => setWb(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const updateRow = (i, f, v) => setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
  const addRow    = () => setRows(prev => [...prev, { english: '', korean: '', example: '' }]);
  const removeRow = (i) => setRows(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i));

  const handleDirectSubmit = async () => {
    const valid = rows.filter(r => r.english.trim() && r.korean.trim());
    if (!valid.length) { setDirectMsg('영단어와 뜻을 입력하세요.'); return; }
    setDirectLoading(true); setDirectMsg('');
    try {
      await bulkAddWords(id, valid);
      setRows([{ english: '', korean: '', example: '' }]);
      setDirectMsg(`${valid.length}개 단어 추가 완료`); load();
    } catch { setDirectMsg('오류가 발생했습니다.'); }
    finally { setDirectLoading(false); }
  };

  const filteredWords = RECOMMENDED_WORDS.filter(w => {
    const matchCat = catFilter === 'all' || w.category === catFilter;
    const matchDay = dayFilter === 0 || w.day === dayFilter;
    const q = search.trim().toLowerCase();
    return matchCat && matchDay && (!q || w.english.toLowerCase().includes(q) || w.korean.includes(q));
  });
  const toggleWord = (eng) => setSelected(prev => { const n = new Set(prev); n.has(eng) ? n.delete(eng) : n.add(eng); return n; });
  const toggleAll  = () => {
    const allSel = filteredWords.every(w => selected.has(w.english));
    setSelected(prev => { const n = new Set(prev); filteredWords.forEach(w => allSel ? n.delete(w.english) : n.add(w.english)); return n; });
  };

  const handleAddSelected = async () => {
    const words = RECOMMENDED_WORDS.filter(w => selected.has(w.english));
    if (!words.length) return;
    setSuggestLoading(true); setSuggestMsg('');
    try { await bulkAddWords(id, words); setSelected(new Set()); setSuggestMsg(`${words.length}개 추가 완료`); load(); }
    catch { setSuggestMsg('오류가 발생했습니다.'); }
    finally { setSuggestLoading(false); }
  };

  const handleCSV = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImportError(''); setImportResult(null); setImportLoading(true);
    try { const res = await importCSV(id, file); setImportResult(res.data); load(); }
    catch (err) { setImportError(err.response?.data?.error ?? '업로드 오류'); }
    finally { setImportLoading(false); if (fileRef.current) fileRef.current.value = ''; }
  };

  const handleDeleteWord = async (wordId) => {
    setDeletingId(wordId);
    setConfirmWordId(null);
    try { await deleteWord(id, wordId); load(); }
    catch { /* no-op */ }
    finally { setDeletingId(null); }
  };

  const handleStartTest = async (day) => {
    let res;
    if (day && day !== 0) {
      const dayWords = RECOMMENDED_WORDS.filter(w => w.day === day);
      res = await createTestWithWords({ classId: wb.classId, words: dayWords });
    } else {
      res = await createTest({ classId: wb.classId, wordBookId: id });
    }
    setShowTestModal(false);
    navigate(`/teacher/test/${res.data.id}/run`);
  };

  if (loading || !wb) return (
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

  const allFilteredSelected = filteredWords.length > 0 && filteredWords.every(w => selected.has(w.english));

  return (
    <>
    <Layout title="WORDDAY" back>
      <div className="pb-8">

        {/* 헤더 */}
        <div className="pt-2 pb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">
            Word Book · {wb.week}주차
          </p>
          <h1 className="text-3xl font-black tracking-tighter leading-tight">{wb.title}</h1>
          <p className="text-[12px] font-medium text-gray-300 mt-1">단어 {wb.words?.length ?? 0}개</p>
        </div>

        <div className="h-px bg-gray-100 mb-5" />

        {/* 테스트 시작 */}
        <button
          onClick={() => setShowTestModal(true)}
          disabled={!wb.words?.length}
          className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition mb-6 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          조회 테스트 시작
        </button>

        {/* ── 단어 추가 ─────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300">Add Words</p>
            <button
              onClick={() => setShowAddWords(v => !v)}
              className="text-[12px] font-bold text-black border border-gray-200 rounded-full px-3 py-1 hover:border-gray-400 transition"
            >{showAddWords ? '닫기' : '+ 추가'}</button>
          </div>

          {showAddWords && <>
          {/* 탭 */}
          <div className="flex gap-0 border-b border-gray-100 mb-4">
            {TABS.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 pb-2.5 text-[12px] font-bold transition relative ${tab === key ? 'text-black' : 'text-gray-300 hover:text-gray-500'}`}
              >
                {label}
                {tab === key && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-black rounded-full" />}
              </button>
            ))}
          </div>

          {/* 직접 입력 */}
          {tab === 'direct' && (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-300 px-1">
                <span className="col-span-4">영단어 *</span>
                <span className="col-span-4">한국어 뜻 *</span>
                <span className="col-span-3">예문</span>
              </div>
              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-12 gap-1 items-center">
                  <input className="col-span-4 border border-gray-200 rounded-xl px-2.5 py-2 text-[13px] font-medium outline-none focus:border-black placeholder:text-gray-200" placeholder="ambiguous" value={row.english} onChange={e => updateRow(i, 'english', e.target.value)} />
                  <input className="col-span-4 border border-gray-200 rounded-xl px-2.5 py-2 text-[13px] font-medium outline-none focus:border-black placeholder:text-gray-200" placeholder="모호한" value={row.korean} onChange={e => updateRow(i, 'korean', e.target.value)} />
                  <input className="col-span-3 border border-gray-200 rounded-xl px-2.5 py-2 text-[13px] font-medium outline-none focus:border-black placeholder:text-gray-200" placeholder="예문..." value={row.example} onChange={e => updateRow(i, 'example', e.target.value)} />
                  <button onClick={() => removeRow(i)} className="col-span-1 text-gray-300 hover:text-black text-xl font-bold text-center transition">×</button>
                </div>
              ))}
              <button onClick={addRow} className="w-full border border-dashed border-gray-200 rounded-xl py-2 text-[12px] font-medium text-gray-300 hover:border-gray-400 hover:text-gray-500 transition">
                + 행 추가
              </button>
              {directMsg && <p className={`text-[12px] font-medium text-center ${directMsg.includes('오류') ? 'text-black' : 'text-gray-400'}`}>{directMsg}</p>}
              <button onClick={handleDirectSubmit} disabled={directLoading} className="w-full bg-black text-white font-bold py-3 rounded-full text-[14px] tracking-tight active:scale-[0.97] transition disabled:opacity-40 mt-1">
                {directLoading ? '추가 중...' : '단어 추가'}
              </button>
            </div>
          )}

          {/* 추천 단어 */}
          {tab === 'suggest' && (
            <div className="space-y-3">
              {/* 카테고리 필터 */}
              <div className="flex flex-wrap gap-1.5">
                {[{ key: 'all', label: '전체' }, ...CATEGORIES].map(c => (
                  <button key={c.key} onClick={() => setCatFilter(c.key)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition ${
                      catFilter === c.key ? 'bg-black text-white' : 'border border-gray-200 text-gray-400 hover:border-gray-400'
                    }`}
                  >{c.label}</button>
                ))}
              </div>
              {/* Day 필터 */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 shrink-0">DAY</span>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                  <button
                    onClick={() => setDayFilter(0)}
                    className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                      dayFilter === 0 ? 'bg-black text-white' : 'border border-gray-200 text-gray-400 hover:border-gray-400'
                    }`}
                  >전체</button>
                  {[...Array(TOTAL_DAYS)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setDayFilter(i + 1)}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                        dayFilter === i + 1 ? 'bg-black text-white' : 'border border-gray-200 text-gray-400 hover:border-gray-400'
                      }`}
                    >{i + 1}</button>
                  ))}
                </div>
              </div>
              {/* 검색 */}
              <input
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-[13px] font-medium outline-none focus:border-black transition placeholder:text-gray-300"
                placeholder="검색..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {/* 전체 선택 */}
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={toggleAll}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-pointer transition ${
                      allFilteredSelected ? 'bg-[#FF6600] border-[#FF6600]' : 'border-gray-300'
                    }`}
                  >
                    {allFilteredSelected && (
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 8 8">
                        <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-[12px] font-medium text-gray-400">전체 선택 ({filteredWords.length})</span>
                </label>
                {selected.size > 0 && <span className="text-[12px] font-bold text-black">{selected.size}개 선택</span>}
              </div>
              {/* 단어 목록 */}
              <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-2xl">
                {filteredWords.length === 0 ? (
                  <p className="text-[13px] text-gray-300 font-medium text-center py-8">검색 결과 없음</p>
                ) : filteredWords.map((w, i) => (
                  <div key={w.english}>
                    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition">
                      <div
                        onClick={() => toggleWord(w.english)}
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition ${
                          selected.has(w.english) ? 'bg-[#FF6600] border-[#FF6600]' : 'border-gray-200'
                        }`}
                      >
                        {selected.has(w.english) && (
                          <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 8 8">
                            <path d="M1 4l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex justify-between items-baseline">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[9px] font-bold text-gray-300 tracking-wider shrink-0">#{w.no}·D{w.day}</span>
                          <span className="font-bold text-[14px] text-black">{w.english}</span>
                        </div>
                        <span className="text-[12px] text-gray-400 ml-3 shrink-0">{w.korean}</span>
                      </div>
                    </label>
                    {i < filteredWords.length - 1 && <div className="h-px bg-gray-50 mx-4" />}
                  </div>
                ))}
              </div>
              {suggestMsg && <p className={`text-[12px] font-medium text-center ${suggestMsg.includes('오류') ? 'text-black' : 'text-gray-400'}`}>{suggestMsg}</p>}
              <button onClick={handleAddSelected} disabled={selected.size === 0 || suggestLoading}
                className="w-full bg-black text-white font-bold py-3 rounded-full text-[14px] tracking-tight active:scale-[0.97] transition disabled:opacity-40">
                {suggestLoading ? '추가 중...' : `선택한 ${selected.size}개 추가`}
              </button>
            </div>
          )}

          {/* CSV */}
          {tab === 'csv' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-[11px] font-medium text-gray-400">english, korean, example 순서</p>
                <button onClick={downloadWordTemplate} className="text-[11px] font-bold text-black border border-gray-200 rounded-full px-2.5 py-1 hover:border-black transition">
                  양식 다운로드
                </button>
              </div>
              <label className="flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-2xl py-6 cursor-pointer hover:border-gray-400 transition">
                {importLoading ? <p className="text-[13px] font-medium text-gray-400">업로드 중...</p> : (
                  <>
                    <p className="text-[13px] font-medium text-gray-400">CSV 파일 선택</p>
                    <p className="text-[11px] text-gray-300 mt-1">.csv 파일만 지원</p>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleCSV} />
              </label>
              {importError && <p className="text-[12px] font-medium text-black text-center">{importError}</p>}
              {importResult && <p className="text-[12px] font-medium text-gray-400 text-center">{importResult.imported}개 업로드 완료{importResult.errors.length > 0 ? ` · 오류 ${importResult.errors.length}건` : ''}</p>}
            </div>
          )}
          </>}
        </div>

        <div className="h-px bg-gray-100 mb-5" />

        {/* ── 단어 목록 ─────────────────────────────── */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-3">
            Word List · {wb.words?.length ?? 0}
          </p>

          {wb.words?.length === 0 ? (
            <p className="text-[13px] text-gray-300 font-medium py-4">단어를 추가하세요</p>
          ) : (() => {
            const q = listSearch.trim().toLowerCase();
            const matched = q
              ? wb.words.filter(w => w.english.toLowerCase().includes(q) || w.korean.includes(q))
              : wb.words;
            const shown = matched.slice(0, visibleCount);
            return (
            <div>
              {/* 검색 */}
              <input
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-[13px] font-medium outline-none focus:border-black transition placeholder:text-gray-300 mb-2"
                placeholder="단어 검색 (영어·뜻)..."
                value={listSearch}
                onChange={e => setListSearch(e.target.value)}
              />
              {matched.length === 0 ? (
                <p className="text-[13px] text-gray-300 font-medium text-center py-8">검색 결과 없음</p>
              ) : <>
              {shown.map((w, i) => (
                <div key={w.id}>
                  <div className="flex items-center gap-3 py-3.5">
                    <span className="text-[11px] font-bold text-gray-200 w-7 text-right shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0 flex justify-between items-start">
                      <div>
                        <span className="font-bold text-[15px] text-black tracking-tight">{w.english}</span>
                        {w.pronunciation && (
                          <p className="text-[11px] text-gray-300 font-medium mt-0.5">{w.pronunciation}</p>
                        )}
                      </div>
                      <span className="text-[13px] text-gray-400 font-medium ml-3 shrink-0">{w.korean}</span>
                    </div>
                    {confirmWordId === w.id ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDeleteWord(w.id)}
                          disabled={deletingId === w.id}
                          className="text-[11px] font-bold text-black transition disabled:opacity-40"
                        >확인</button>
                        <button
                          onClick={() => setConfirmWordId(null)}
                          className="text-[11px] font-bold text-gray-300 hover:text-black transition"
                        >취소</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmWordId(w.id)}
                        disabled={deletingId === w.id}
                        className="text-[11px] font-bold text-gray-300 hover:text-black transition disabled:opacity-40 px-1 shrink-0"
                      >×</button>
                    )}
                  </div>
                  {i < shown.length - 1 && <div className="h-px bg-gray-50 ml-10" />}
                </div>
              ))}
              {matched.length > shown.length && (
                <button
                  onClick={() => setVisibleCount(c => c + 100)}
                  className="w-full border border-gray-200 rounded-full py-2.5 mt-3 text-[12px] font-bold text-gray-500 hover:border-gray-400 transition"
                >
                  더 보기 ({shown.length} / {matched.length})
                </button>
              )}
              </>}
            </div>
            );
          })()}
        </div>
      </div>
    </Layout>

    {/* 맨 위로 버튼 */}
    {showTopBtn && (
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-black text-white shadow-lg flex items-center justify-center text-xl active:scale-90 transition"
        aria-label="맨 위로"
      >↑</button>
    )}

    {/* Day 선택 모달 */}

    {showTestModal && (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
        onClick={() => setShowTestModal(false)}>
        <div className="bg-white w-full max-w-lg rounded-t-[28px] px-5 pt-5 pb-10"
          onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-4">조회 테스트 — 범위 선택</p>
          <div className="space-y-2">
            <button
              onClick={() => handleStartTest(0)}
              className="w-full text-left px-4 py-3.5 rounded-2xl bg-black text-white font-bold text-[14px] tracking-tight"
            >
              단어장 전체 ({wb.words?.length ?? 0}개)
            </button>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 pt-2 pb-1">추천 단어 DAY별</p>
            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {[...Array(TOTAL_DAYS)].map((_, i) => {
                const d = i + 1;
                const cnt = RECOMMENDED_WORDS.filter(w => w.day === d).length;
                if (cnt === 0) return null;
                return (
                  <button key={d}
                    onClick={() => handleStartTest(d)}
                    className={`py-3 rounded-2xl border-2 font-bold text-[13px] transition text-center ${
                      testDayFilter === d ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-gray-400 text-black'
                    }`}
                    onMouseEnter={() => setTestDayFilter(d)}
                    onMouseLeave={() => setTestDayFilter(0)}
                  >
                    <span className="block">DAY {d}</span>
                    <span className="block text-[10px] font-medium opacity-60">{cnt}개</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
