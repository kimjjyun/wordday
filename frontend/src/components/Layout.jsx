import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Layout({ title, back = true, children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white">
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur px-5 pt-4 pb-3 flex items-center gap-3">
        {back && (
          <button
            onClick={() => navigate(-1)}
            className="text-black font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
          >
            ←
          </button>
        )}
        <h1 className="flex-1 font-black text-[15px] tracking-tight text-black">{title ?? 'WORDDAY'}</h1>
        {user && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-400">{user.name}</span>
            <button
              onClick={() => { useAuthStore.getState().logout(); navigate('/login'); }}
              className="text-[11px] text-gray-300 hover:text-black transition font-medium"
            >
              로그아웃
            </button>
          </div>
        )}
      </header>
      <div className="h-px bg-gray-100" />
      <main className="flex-1 px-5 py-4">{children}</main>
    </div>
  );
}
