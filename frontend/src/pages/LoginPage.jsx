import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { teacherLogin, teacherRegister, studentLogin, forgotPassword, verifySecurity } from '../api/auth';
import { SECURITY_QUESTIONS } from '../data/securityQuestions';

const TABS = [
  { key: 'student',  label: '학생' },
  { key: 'teacher',  label: '교사' },
  { key: 'register', label: '교사 가입' },
];

export default function LoginPage() {
  const [tab,  setTab]  = useState('student');
  const [form, setForm] = useState({
    email: '', password: '', name: '', studentCode: '', classCode: '',
    securityQuestion: SECURITY_QUESTIONS[0], securityAnswer: '',
  });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // 비밀번호 찾기 (이메일 → 보안 질문 답변 2단계)
  const [showForgot, setShowForgot]     = useState(false);
  const [forgotStep, setForgotStep]     = useState('email'); // 'email' | 'answer'
  const [forgotEmail, setForgotEmail]   = useState('');
  const [forgotQuestion, setForgotQuestion] = useState('');
  const [forgotAnswer, setForgotAnswer] = useState('');

  const { login } = useAuthStore();
  const navigate  = useNavigate();
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const resetForgot = () => {
    setShowForgot(false); setForgotStep('email');
    setForgotEmail(''); setForgotQuestion(''); setForgotAnswer('');
    setError(''); setSuccess('');
  };

  // 1단계: 이메일 제출 → 보안 질문 조회(없으면 바로 재설정 화면으로)
  const handleForgotEmail = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await forgotPassword({ email: forgotEmail });
      if (res.data?.resetUrl) {
        // 보안 질문이 아직 없는 기존 계정 → 바로 재설정 화면으로
        const url = new URL(res.data.resetUrl);
        navigate(url.pathname + url.search);
        return;
      }
      if (res.data?.securityQuestion) {
        setForgotQuestion(res.data.securityQuestion);
        setForgotStep('answer');
      }
    } catch (err) {
      setError(err.response?.data?.error ?? '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2단계: 보안 질문 답 제출 → 통과 시 재설정 화면으로
  const handleForgotAnswer = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await verifySecurity({ email: forgotEmail, answer: forgotAnswer });
      const url = new URL(res.data.resetUrl);
      navigate(url.pathname + url.search);
    } catch (err) {
      setError(err.response?.data?.error ?? '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (tab === 'student') {
        const res = await studentLogin({ studentCode: form.studentCode, password: form.password, classCode: form.classCode });
        login(res.data.token, { ...res.data.student, role: 'student' });
        navigate('/student');
      } else if (tab === 'teacher') {
        const res = await teacherLogin({ email: form.email, password: form.password });
        login(res.data.token, { ...res.data.teacher, role: 'teacher' });
        navigate('/teacher');
      } else {
        const res = await teacherRegister({
          email: form.email, password: form.password, name: form.name,
          securityQuestion: form.securityQuestion, securityAnswer: form.securityAnswer,
        });
        login(res.data.token, { ...res.data.teacher, role: 'teacher' });
        navigate('/teacher');
      }
    } catch (err) {
      setError(err.response?.data?.error ?? '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] font-medium outline-none focus:border-black transition placeholder:text-gray-300 placeholder:font-normal';
  const waitNotice = loading && (
    <p className="text-[12px] text-gray-400 text-center font-medium pt-1 leading-relaxed">
      처음 접속 시 서버가 켜지는 데 최대 1분 정도 걸릴 수 있어요.<br />잠시만 기다려 주세요.
    </p>
  );

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white px-6">

      {/* 브랜드 */}
      <div className="pt-20 pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-300 mb-3">Vocabulary App</p>
        <h1 className="text-6xl font-black tracking-tighter text-black leading-none">Word<br />Day.</h1>
        <p className="text-sm text-gray-400 mt-4 font-medium">매일 10분, 단어 하나씩</p>
      </div>

      {/* 탭 */}
      {!showForgot && (
        <div className="flex gap-0 border-b border-gray-100 mb-6">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setError(''); }}
              className={`flex-1 pb-3 text-[12px] font-bold transition relative ${
                tab === key ? 'text-black' : 'text-gray-300 hover:text-gray-500'
              }`}
            >
              {label}
              {tab === key && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-black rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* 비밀번호 찾기 폼 */}
      {showForgot ? (
        forgotStep === 'email' ? (
          <form onSubmit={handleForgotEmail} className="flex-1 space-y-3">
            <p className="text-[13px] text-gray-400 font-medium pb-1">
              가입한 이메일을 입력하세요. 보안 질문 확인 후 비밀번호를 재설정합니다.
            </p>
            <input
              className={inputCls}
              type="email"
              placeholder="이메일"
              value={forgotEmail}
              onChange={e => setForgotEmail(e.target.value)}
              required
            />
            {error && (
              <p className="text-[13px] text-black bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-center font-medium">{error}</p>
            )}
            <div className="pt-2 space-y-2">
              <button type="submit" disabled={loading}
                className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition disabled:opacity-40">
                {loading ? '...' : '다음'}
              </button>
              <button type="button" onClick={resetForgot}
                className="w-full border border-gray-200 text-gray-400 font-bold py-4 rounded-full text-[14px] tracking-tight hover:border-gray-400 hover:text-black transition">
                돌아가기
              </button>
            </div>
            {waitNotice}
          </form>
        ) : (
          <form onSubmit={handleForgotAnswer} className="flex-1 space-y-3">
            <p className="text-[13px] text-gray-400 font-medium pb-1">보안 질문에 답해주세요.</p>
            <p className="text-[15px] font-bold text-black bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5">{forgotQuestion}</p>
            <input
              className={inputCls}
              placeholder="답변"
              value={forgotAnswer}
              onChange={e => setForgotAnswer(e.target.value)}
              required
            />
            {error && (
              <p className="text-[13px] text-black bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-center font-medium">{error}</p>
            )}
            <div className="pt-2 space-y-2">
              <button type="submit" disabled={loading}
                className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition disabled:opacity-40">
                {loading ? '...' : '확인'}
              </button>
              <button type="button" onClick={resetForgot}
                className="w-full border border-gray-200 text-gray-400 font-bold py-4 rounded-full text-[14px] tracking-tight hover:border-gray-400 hover:text-black transition">
                돌아가기
              </button>
            </div>
            {waitNotice}
          </form>
        )
      ) : (
      /* 일반 로그인 폼 */
      <form onSubmit={handleSubmit} className="flex-1 space-y-3">
        {tab === 'register' && (
          <input className={inputCls} placeholder="이름" value={form.name} onChange={set('name')} required />
        )}
        {(tab === 'teacher' || tab === 'register') && (
          <input className={inputCls} type="email" placeholder="이메일" value={form.email} onChange={set('email')} required />
        )}
        {tab === 'student' && (
          <>
            <input className={inputCls} placeholder="학급 코드 (예: TEST01)" value={form.classCode} onChange={set('classCode')} required />
            <input className={inputCls} placeholder="학번" value={form.studentCode} onChange={set('studentCode')} required />
          </>
        )}
        <input className={inputCls} type="password" placeholder="비밀번호" value={form.password} onChange={set('password')} required />

        {tab === 'register' && (
          <>
            <p className="text-[12px] text-gray-400 font-medium pt-1">비밀번호를 잊었을 때 본인 확인에 쓰입니다.</p>
            <select className={inputCls} value={form.securityQuestion} onChange={set('securityQuestion')}>
              {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <input className={inputCls} placeholder="보안 질문 답변" value={form.securityAnswer} onChange={set('securityAnswer')} required />
          </>
        )}

        {error && (
          <p className="text-[13px] text-black bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-center font-medium">
            {error}
          </p>
        )}

        <div className="pt-2 space-y-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition disabled:opacity-40"
          >
            {loading ? '...' : tab === 'register' ? '가입하기' : '로그인'}
          </button>
          {tab === 'teacher' && (
            <button type="button" onClick={() => { setShowForgot(true); setForgotStep('email'); setError(''); }}
              className="w-full text-[12px] text-gray-300 hover:text-gray-500 transition font-medium py-1">
              비밀번호를 잊으셨나요?
            </button>
          )}
        </div>
        {waitNotice}
      </form>
      )}

      <div className="pb-10 pt-6 text-center space-y-3">
        <Link
          to="/solo"
          className="block text-[12px] text-gray-300 hover:text-black transition font-medium"
        >
          로그인 없이 혼자 공부하기 →
        </Link>
        <p className="text-[11px] text-gray-200">WordDay © 2026</p>
      </div>
    </div>
  );
}
