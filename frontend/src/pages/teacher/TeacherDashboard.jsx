import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClasses, createClass } from '../../api/classes';
import { useAuthStore } from '../../store/authStore';
import Layout from '../../components/Layout';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [classes,    setClasses]    = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName,    setNewName]    = useState('');
  const [loading,    setLoading]    = useState(true);

  const load = () => getClasses().then(r => setClasses(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createClass({ name: newName.trim() });
    setNewName(''); setShowCreate(false); load();
  };

  return (
    <Layout title="WORDDAY" back={false}>
      <div className="pb-8">

        {/* 섹션 헤더 */}
        <div className="pt-2 pb-5 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-300 mb-1">Teacher</p>
            <h1 className="text-4xl font-black tracking-tighter">내 학급</h1>
          </div>
          <button
            onClick={() => navigate('/teacher/settings')}
            className="text-[12px] font-bold text-gray-400 hover:text-black transition pb-1"
          >
            보안 질문 설정
          </button>
        </div>

        {/* 보안 질문 미설정 안내 */}
        {user && user.hasSecurityQuestion === false && (
          <button
            onClick={() => navigate('/teacher/settings')}
            className="w-full text-left bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 mb-5 hover:border-gray-400 transition"
          >
            <p className="text-[13px] font-bold text-black">🔒 보안 질문을 설정하세요</p>
            <p className="text-[12px] text-gray-400 font-medium mt-0.5">설정해 두면 비밀번호를 잊어도 안전하게 재설정할 수 있어요. →</p>
          </button>
        )}

        <div className="h-px bg-gray-100 mb-5" />

        {/* 학급 추가 버튼 */}
        {!showCreate ? (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-between border border-gray-100 rounded-full px-5 py-3 mb-5 hover:border-gray-300 transition"
          >
            <span className="text-[13px] font-medium text-gray-400">새 학급 추가...</span>
            <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm leading-none">+</span>
            </div>
          </button>
        ) : (
          <div className="mb-5 space-y-2.5">
            <input
              autoFocus
              className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 text-[15px] font-medium outline-none focus:border-black transition placeholder:text-gray-300 placeholder:font-normal"
              placeholder="학급 이름 (예: 2학년 3반)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 bg-black text-white font-bold py-3.5 rounded-full text-[14px] tracking-tight active:scale-[0.97] transition"
              >만들기</button>
              <button
                onClick={() => { setShowCreate(false); setNewName(''); }}
                className="flex-1 bg-white text-black border border-gray-200 font-bold py-3.5 rounded-full text-[14px] tracking-tight active:scale-[0.97] transition"
              >취소</button>
            </div>
          </div>
        )}

        {/* 학급 목록 */}
        {loading ? (
          <div className="space-y-0">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="flex justify-between items-center py-4">
                  <div className="space-y-2">
                    <div className="w-28 h-4 bg-gray-100 rounded-full animate-pulse" />
                    <div className="w-16 h-3 bg-gray-100 rounded-full animate-pulse" />
                  </div>
                  <div className="w-16 h-8 bg-gray-100 rounded-full animate-pulse" />
                </div>
                <div className="h-px bg-gray-100" />
              </div>
            ))}
          </div>
        ) : classes.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-200 mb-3">Empty</p>
            <p className="text-2xl font-black tracking-tighter text-black">학급이 없어요</p>
            <p className="text-sm text-gray-300 mt-1">위에서 학급을 추가하세요</p>
          </div>
        ) : (
          <div>
            {classes.map((cls, i) => (
              <div key={cls.id}>
                <button
                  className="w-full flex items-center justify-between py-4 text-left active:bg-gray-50 rounded-xl transition"
                  onClick={() => navigate(`/teacher/classes/${cls.id}`)}
                >
                  <div>
                    <p className="font-bold text-[17px] tracking-tight text-black">{cls.name}</p>
                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">학생 {cls.studentCount}명</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-black text-black tracking-widest bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-full">
                      {cls.code}
                    </span>
                    <span className="text-gray-200 text-lg">›</span>
                  </div>
                </button>
                {i < classes.length - 1 && <div className="h-px bg-gray-100" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
