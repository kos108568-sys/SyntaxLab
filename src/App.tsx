import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { StudentView } from './components/student/StudentView';
import { AuthScreen } from './components/AuthScreen';
import { StudentOnboarding } from './components/student/StudentOnboarding';
import { Terminal } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { session, currentUser, role, isSupabaseConnected, isLoadingAuth } = useApp();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 animate-pulse">
          <Terminal className="w-5 h-5 animate-spin" />
        </div>
        <p className="text-xs font-mono">Проверка сессии GitHub...</p>
      </div>
    );
  }

  // If not authenticated via GitHub -> Show Login Screen
  if (!session || !currentUser) {
    return <AuthScreen />;
  }

  // If student is not yet approved -> Show Onboarding & Pending screen
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
        {role === 'teacher' ? <AdminDashboard /> : <StudentView />}
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
