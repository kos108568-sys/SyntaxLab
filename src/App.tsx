import React from 'react';
import { AppProvider, useApp, hasStoredAuthToken } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentView } from './components/student/StudentView';
import { GitBranchingLab } from './components/git/GitBranchingLab';
import { AuthScreen } from './components/AuthScreen';
import { StudentOnboarding } from './components/student/StudentOnboarding';
import { Terminal } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { 
    session, 
    currentUser, 
    role, 
    activeCourseId,
    userAllowedCourses,
    isSupabaseConnected, 
    isLoadingAuth 
  } = useApp();

  const hasToken = hasStoredAuthToken();

  // Если идет проверка авторизации или в браузере сохранен токен, но данные еще подгружаются — показываем чистый экран синхронизации
  if (isLoadingAuth || (hasToken && (!session || !currentUser))) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
          <Terminal className="w-5 h-5 animate-spin" />
        </div>
        <p className="text-xs font-mono">Синхронизация профиля и курсов...</p>
      </div>
    );
  }

  // Если точно не авторизован через GitHub -> Экран входа
  if (!session || !currentUser) {
    return <AuthScreen />;
  }

  // Если студент еще не одобрен -> Экран ожидания/онбординга
  if (currentUser.role === 'student' && !currentUser.isApproved) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/40">
        <StudentOnboarding />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600/40 selection:text-white">
      {/* Navigation Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {role === 'teacher' ? (
          <AdminDashboard />
        ) : userAllowedCourses.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center max-w-lg mx-auto space-y-3 my-12">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Terminal className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Курсы пока не открыты</h2>
            <p className="text-xs text-slate-400">
              Преподаватель еще не открыл курсы для группы{' '}
              <span className="font-mono text-indigo-400 font-bold">{currentUser?.groupName || 'не указана'}</span>. Дождитесь указания преподавателя на занятии.
            </p>
          </div>
        ) : activeCourseId === 'git-branching' ? (
          <GitBranchingLab />
        ) : (
          <StudentView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">SyntaxLab</span>
            <span>—</span>
            <span>Интерактивная среда обучения C# и .NET для аудиторных занятий</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              {isSupabaseConnected ? 'Supabase Sync: Active' : 'Supabase: Ready'}
            </span>
            <span>•</span>
            <span>GitHub Auth</span>
            <span>•</span>
            <span>C# 12 / .NET 8</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
