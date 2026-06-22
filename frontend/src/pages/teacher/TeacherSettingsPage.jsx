import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { setSecurityQuestion as setSecurityQuestionApi } from '../../api/auth';
import { SECURITY_QUESTIONS } from '../../data/securityQuestions';
import Layout from '../../components/Layout';

const inputCls = 'w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] font-medium outline-none focus:border-black transition placeholder:text-gray-300 placeholder:font-normal';

export default function TeacherSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [answer,   setAnswer]   = useState('');
  const [msg,      setMsg]      = useState('');
  const [isError,  setIsError]  = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg(''); setLoading(true);
    try {
      await setSecurityQuestionApi({ securityQuestion: question, securityAnswer: answer });
      updateUser({ hasSecurityQuestion: true });
      setIsError(false);
      setMsg('보안 질문이 저장되었습니다. 이제 비밀번호 찾기에서 이 질문으로 본인 확인을 합니다.');
      setAnswer('');
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
          <h1 className="text-4xl font-black tracking-tighter">보안 질문</h1>
          <p className="text-[13px] font-medium text-gray-300 mt-1">{user?.name}</p>
        </div>

        <div className="h-px bg-gray-100 mb-6" />

        <p className="text-[13px] text-gray-400 font-medium mb-4 leading-relaxed">
          비밀번호를 잊었을 때 본인 확인에 사용됩니다.{' '}
          {user?.hasSecurityQuestion
            ? '이미 설정되어 있어요. 변경하려면 아래에서 다시 저장하세요.'
            : '아직 설정되지 않았어요. 지금 설정해 두면 비밀번호를 안전하게 재설정할 수 있습니다.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <select className={inputCls} value={question} onChange={e => setQuestion(e.target.value)}>
            {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <input
            className={inputCls}
            placeholder="답변"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
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
            {loading ? '저장 중...' : '보안 질문 저장'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
