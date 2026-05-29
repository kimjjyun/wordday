import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClasses, createClass } from '../../api/classes';
import Layout from '../../components/Layout';
import Card from '../../components/Card';
import Button from '../../components/Button';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => getClasses().then(r => setClasses(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createClass({ name: newName.trim() });
    setNewName('');
    setShowCreate(false);
    load();
  };

  return (
    <Layout title="교사 대시보드">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">내 학급</h2>
          <button onClick={() => setShowCreate(v => !v)} className="text-indigo-500 font-semibold text-sm">
            + 학급 추가
          </button>
        </div>

        {showCreate && (
          <Card>
            <input
              className="w-full border border-gray-200 rounded-xl p-3 mb-3 focus:border-indigo-400 outline-none"
              placeholder="학급 이름 (예: 2학년 3반)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <div className="flex gap-2">
              <Button onClick={handleCreate}>만들기</Button>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>취소</Button>
            </div>
          </Card>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-8">불러오는 중...</p>
        ) : classes.length === 0 ? (
          <Card><p className="text-center text-gray-400 py-6">학급이 없습니다. 학급을 추가하세요.</p></Card>
        ) : (
          classes.map(cls => (
            <Card key={cls.id}
              className="cursor-pointer hover:shadow-md transition"
              onClick={() => navigate(`/teacher/classes/${cls.id}`)}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{cls.name}</p>
                  <p className="text-sm text-gray-500">학생 {cls.studentCount}명</p>
                </div>
                <div className="text-right">
                  <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-1 rounded-lg">
                    {cls.code}
                  </span>
                  <p className="text-gray-400 text-xs mt-1">입장 코드</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
}
