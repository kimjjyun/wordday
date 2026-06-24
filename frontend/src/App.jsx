import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PrivacyPage       from './pages/PrivacyPage';
import GuidePage         from './pages/GuidePage';

// 솔로
import SoloHome      from './pages/solo/SoloHome';
import SoloFlashcard from './pages/solo/SoloFlashcard';
import SoloQuiz      from './pages/solo/SoloQuiz';

// 학생
import StudentHome         from './pages/student/StudentHome';
import FlashcardPage       from './pages/student/FlashcardPage';
import QuizPage            from './pages/student/QuizPage';
import TestWaitingPage     from './pages/student/TestWaitingPage';
import TestActivePage      from './pages/student/TestActivePage';
import TestResultPage      from './pages/student/TestResultPage';
import StudentSettingsPage from './pages/student/StudentSettingsPage';

// 교사
import TeacherDashboard   from './pages/teacher/TeacherDashboard';
import TeacherSettingsPage from './pages/teacher/TeacherSettingsPage';
import ClassDetailPage  from './pages/teacher/ClassDetailPage';
import WordBookPage     from './pages/teacher/WordBookPage';
import TestRunPage      from './pages/teacher/TestRunPage';
import TestResultsPage  from './pages/teacher/TestResultsPage';

function RequireAuth({ role, children }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy"        element={<PrivacyPage />} />
        <Route path="/guide"          element={<GuidePage />} />

        {/* 솔로 (로그인 불필요) */}
        <Route path="/solo"           element={<SoloHome />} />
        <Route path="/solo/flashcard" element={<SoloFlashcard />} />
        <Route path="/solo/quiz"      element={<SoloQuiz />} />

        {/* 학생 */}
        <Route path="/student"             element={<RequireAuth role="student"><StudentHome /></RequireAuth>} />
        <Route path="/student/flashcard"   element={<RequireAuth role="student"><FlashcardPage /></RequireAuth>} />
        <Route path="/student/quiz"        element={<RequireAuth role="student"><QuizPage /></RequireAuth>} />
        <Route path="/student/test/wait"   element={<RequireAuth role="student"><TestWaitingPage /></RequireAuth>} />
        <Route path="/student/test/active" element={<RequireAuth role="student"><TestActivePage /></RequireAuth>} />
        <Route path="/student/test/result"  element={<RequireAuth role="student"><TestResultPage /></RequireAuth>} />
        <Route path="/student/settings"     element={<RequireAuth role="student"><StudentSettingsPage /></RequireAuth>} />

        {/* 교사 */}
        <Route path="/teacher"                  element={<RequireAuth role="teacher"><TeacherDashboard /></RequireAuth>} />
        <Route path="/teacher/settings"         element={<RequireAuth role="teacher"><TeacherSettingsPage /></RequireAuth>} />
        <Route path="/teacher/classes/:id"      element={<RequireAuth role="teacher"><ClassDetailPage /></RequireAuth>} />
        <Route path="/teacher/wordbooks/:id"    element={<RequireAuth role="teacher"><WordBookPage /></RequireAuth>} />
        <Route path="/teacher/test/:id/run"     element={<RequireAuth role="teacher"><TestRunPage /></RequireAuth>} />
        <Route path="/teacher/test/:id/results" element={<RequireAuth role="teacher"><TestResultsPage /></RequireAuth>} />

        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function RootRedirect() {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/solo" replace />;
  if (user?.role === 'teacher') return <Navigate to="/teacher" replace />;
  return <Navigate to="/student" replace />;
}
