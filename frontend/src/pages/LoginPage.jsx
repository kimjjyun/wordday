import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { teacherLogin, teacherRegister, studentLogin } from '../api/auth';
import { useGuestStore } from '../store/guestStore';

const TABS = [
  { key: 'student',  label: '학생' },
  { key: 'teacher',  label: '교사' },
  { key: 'register', label: '교사 가입' },
];

export default function LoginPage() {
  const [tab,  setTab]  = useState('student');
  const [form, setForm] = useState({ email: '', password: '', name: '', studentCode: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const { enter }  = useGuestStore();
  const navigate  = useNavigate();
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (tab === 'student') {
        const res = await studentLogin({ studentCode: form.studentCode, password: form.password });
        login(res.data.token, { ...res.data.student, role: 'student' });
        navigate('/student');
      } else if (tab === 'teacher') {
        const res = await teacherLogin({ email: form.email, password: form.password });
        login(res.data.token, { ...res.data.teacher, role: 'teacher' });
        navigate('/teacher');
      } else {
        const res = await teacherRegister({ email: form.email, password: form.password, name: form.name });
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

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white px-6">

      {/* 브랜드 */}
      <div className="pt-20 pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-300 mb-3">Vocabulary App</p>
        <h1 className="text-6xl font-black tracking-tighter text-black leading-none">Word<br />Day.</h1>
        <p className="text-sm text-gray-400 mt-4 font-medium">매일 10분, 단어 하나씩</p>
      </div>

      {/* 탭 */}
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

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="flex-1 space-y-3">
        {tab === 'register' && (
          <input className={inputCls} placeholder="이름" value={form.name} onChange={set('name')} required />
        )}
        {(tab === 'teacher' || tab === 'register') && (
          <input className={inputCls} type="email" placeholder="이메일" value={form.email} onChange={set('email')} required />
        )}
        {tab === 'student' && (
          <input className={inputCls} placeholder="학번" value={form.studentCode} onChange={set('studentCode')} required />
        )}
        <input className={inputCls} type="password" placeholder="비밀번호" value={form.password} onChange={set('password')} required />

        {error && (
          <p className="text-[13px] text-black bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-center font-medium">
            {error}
          </p>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition disabled:opacity-40"
          >
            {loading ? '...' : tab === 'register' ? '가입하기' : '로그인'}
          </button>
        </div>
      </form>

      <div className="pb-10 pt-6 text-center space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[11px] font-bold text-gray-200 uppercase tracking-widest">또는</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <button
          onClick={() => { enter(null); navigate('/solo'); }}
          className="w-full border border-gray-200 text-gray-400 font-bold py-3.5 rounded-full text-[14px] tracking-tight hover:border-gray-400 hover:text-black transition"
        >
          로그인 없이 혼자 공부하기
        </button>
        <p className="text-[11px] text-gray-200">WordDay © 2026</p>
      </div>
    </div>
  );
}
