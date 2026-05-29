import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { teacherLogin, teacherRegister, studentLogin } from '../api/auth';
import Button from '../components/Button';

export default function LoginPage() {
  const [tab, setTab] = useState('student'); // 'student' | 'teacher' | 'register'
  const [form, setForm] = useState({ email: '', password: '', name: '', studentCode: '', classCode: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-white p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-indigo-600">WordDay</h1>
          <p className="text-gray-500 mt-1 text-sm">매일 아침 10분, 단어 하나씩</p>
        </div>

        {/* 탭 */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-6 gap-1">
          {[['student','학생'], ['teacher','교사 로그인'], ['register','교사 가입']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => { setTab(v); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${tab === v ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
            >
              {l}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <input className="input" placeholder="이름" value={form.name} onChange={set('name')} required />
          )}
          {(tab === 'teacher' || tab === 'register') && (
            <input className="input" type="email" placeholder="이메일" value={form.email} onChange={set('email')} required />
          )}
          {tab === 'student' && (
            <>
              <input className="input" placeholder="학급 코드 (6자리)" value={form.classCode} onChange={set('classCode')} />
              <input className="input" placeholder="학번" value={form.studentCode} onChange={set('studentCode')} required />
            </>
          )}
          <input className="input" type="password" placeholder="비밀번호" value={form.password} onChange={set('password')} required />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? '처리 중...' : tab === 'register' ? '가입하기' : '로그인'}
          </Button>
        </form>
      </div>

      <style>{`.input { width:100%; border:1px solid #e5e7eb; border-radius:0.75rem; padding:0.75rem 1rem; font-size:1rem; outline:none; } .input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,0.1); }`}</style>
    </div>
  );
}
