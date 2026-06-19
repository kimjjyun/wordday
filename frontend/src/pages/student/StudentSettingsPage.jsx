import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { changeStudentPassword } from '../../api/auth';
import Layout from '../../components/Layout';

const inputCls = 'w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] font-medium outline-none focus:border-black transition placeholder:text-gray-300 placeholder:font-normal';

export default function StudentSettingsPage() {
  const navigate        = useNavigate();
  const { user, logout } = useAuthStore();
  const [form,    setForm]    = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg,     setMsg]     = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg('');
    if (form.newPassword !== form.confirm) {
      setIsError(true); setMsg('새 비밀번호가 일치하지 않습니다.'); return;
    }
    setLoading(true);
    try {
      await changeStudentPassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setIsError(false);
      setMsg('비밀번호가 변경되었습니다.');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      setIsError(true);
      setMsg(err.response?.data?.error ?? '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="WORDDAY" back>
      <div className="pb-8">

        <div className="pt-2 pb-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">Settings</p>
          <h1 className="text-4xl font-black tracking-tighter">내 설정</h1>
          {user?.class?.name && (
            <p className="text-[13px] font-medium text-gray-300 mt-1">{user.class.name} · {user.name}</p>
          )}
        </div>

        <div className="h-px bg-gray-100 mb-6" />

        {/* 비밀번호 변경 */}
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-4">비밀번호 변경</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            className={inputCls}
            type="password"
            placeholder="현재 비밀번호"
            value={form.currentPassword}
            onChange={set('currentPassword')}
            required
          />
          <input
            className={inputCls}
            type="password"
            placeholder="새 비밀번호 (4자 이상)"
            value={form.newPassword}
            onChange={set('newPassword')}
            required
          />
          <input
            className={inputCls}
            type="password"
            placeholder="새 비밀번호 확인"
            value={form.confirm}
            onChange={set('confirm')}
            required
          />
          {msg && (
            <p className={`text-[13px] font-medium text-center px-4 py-3 rounded-2xl ${
              isError ? 'bg-gray-50 border border-gray-100 text-black' : 'text-gray-500'
            }`}>{msg}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition disabled:opacity-40"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>

        <div className="h-px bg-gray-100 mt-8 mb-6" />

        {/* 로그아웃 */}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full border border-gray-200 text-gray-400 font-bold py-4 rounded-full text-[14px] tracking-tight hover:border-gray-400 hover:text-black transition"
        >
          로그아웃
        </button>
      </div>
    </Layout>
  );
}
