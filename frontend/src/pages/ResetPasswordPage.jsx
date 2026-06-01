import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordApi } from '../api/auth';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  const inputCls = 'w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] font-medium outline-none focus:border-black transition placeholder:text-gray-300 placeholder:font-normal';

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('비밀번호는 6자 이상이어야 합니다.');
    if (password !== confirm) return setError('비밀번호가 일치하지 않습니다.');
    setLoading(true);
    try {
      await resetPasswordApi({ token, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error ?? '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="min-h-screen flex flex-col items-center justify-center max-w-lg mx-auto px-6 text-center">
      <p className="text-2xl font-black tracking-tighter mb-2">올바르지 않은 링크입니다</p>
      <button onClick={() => navigate('/login')} className="mt-6 text-[13px] text-gray-400 hover:text-black transition font-medium">로그인으로 돌아가기</button>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex flex-col items-center justify-center max-w-lg mx-auto px-6 text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-300 mb-4">Done</p>
      <h1 className="text-3xl font-black tracking-tighter mb-2">비밀번호가 변경됐어요</h1>
      <p className="text-[13px] text-gray-400 font-medium mb-8">새 비밀번호로 로그인하세요.</p>
      <button onClick={() => navigate('/login')}
        className="bg-black text-white font-bold py-4 px-10 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition">
        로그인하러 가기
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white px-6">
      <div className="pt-20 pb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-gray-300 mb-3">WordDay</p>
        <h1 className="text-4xl font-black tracking-tighter text-black leading-tight">새 비밀번호<br />설정</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className={inputCls}
          type="password"
          placeholder="새 비밀번호 (6자 이상)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
          className={inputCls}
          type="password"
          placeholder="비밀번호 확인"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
        />
        {error && (
          <p className="text-[13px] text-black bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-center font-medium">{error}</p>
        )}
        <div className="pt-2">
          <button type="submit" disabled={loading}
            className="w-full bg-black text-white font-bold py-4 rounded-full text-[15px] tracking-tight active:scale-[0.97] transition disabled:opacity-40">
            {loading ? '...' : '변경하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
