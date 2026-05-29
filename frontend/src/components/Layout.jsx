import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Layout({ title, back, children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        {back && (
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-xl">
            ←
          </button>
        )}
        <h1 className="flex-1 font-bold text-lg text-indigo-600">{title ?? 'WordDay'}</h1>
        <span className="text-sm text-gray-500">{user?.name}</span>
        <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500">
          로그아웃
        </button>
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
