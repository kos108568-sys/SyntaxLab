import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Terminal, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle,
  ShieldCheck,
  LogOut,
  GitBranch,
  FileCode
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    role, 
    setRole, 
    currentUser, 
    studentsInClass, 
    activeCourseId,
    setActiveCourseId,
    userAllowedCourses,
    signOut 
  } = useApp();

  const stuckCount = studentsInClass.filter(s => s.status === 'stuck' || s.needsHelp).length;
  const onlineCount = studentsInClass.length;

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                SyntaxLab
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Академическая платформа для аудиторных занятий</p>
          </div>
        </div>

        {/* Active Course Switcher */}
        {userAllowedCourses.length > 1 ? (
          <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            {userAllowedCourses.map((c) => {
              const isActive = activeCourseId === c.id;
              const Icon = c.id === 'git-branching' ? GitBranch : FileCode;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveCourseId(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? c.id === 'git-branching'
                        ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md shadow-orange-600/25'
                        : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{c.title}</span>
                </button>
              );
            })}
          </div>
        ) : userAllowedCourses.length === 1 ? (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300">
            {userAllowedCourses[0].id === 'git-branching' ? (
              <GitBranch className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span>{userAllowedCourses[0].title}</span>
          </div>
        ) : (
          <span className="hidden sm:inline text-xs text-amber-400/80 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            Курсы не назначены
          </span>
        )}

        {/* Live Classroom Radar Badge - Only visible to Teacher */}
        {role === 'teacher' && (
          <div className="hidden md:flex items-center gap-2 bg-slate-950/60 border border-slate-800/80 rounded-full px-3 py-1.5 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              {onlineCount} {onlineCount === 1 ? 'студент' : 'студентов'} на радаре
            </span>
            <span className="text-slate-600">•</span>
            {stuckCount > 0 ? (
              <span className="flex items-center gap-1 text-amber-400 font-semibold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                {stuckCount} {stuckCount === 1 ? 'застрял' : 'застряли'}
              </span>
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Все в процессе
              </span>
            )}
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 font-mono">Группа ИТ-301</span>
          </div>
        )}

        {/* Right Section: Role Switcher & User Profile */}
        <div className="flex items-center gap-3">
          
          {/* Quick Role Switcher Button - Only accessible to Teachers */}
          {currentUser?.role === 'teacher' ? (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  role === 'teacher'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Админка</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  role === 'student'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Демо студента</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded-xl text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
              <span>Студент ({currentUser?.groupName || 'ИТ-301'})</span>
            </div>
          )}

          {/* User Status / Profile info */}
          {currentUser && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-white leading-tight">{currentUser.fullName}</span>
                <span className="text-[10px] text-slate-400 font-mono">{currentUser.email}</span>
              </div>

              {/* Avatar */}
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={currentUser.fullName}
                className="w-8 h-8 rounded-full ring-2 ring-indigo-500/40 object-cover"
              />

              {/* Logout button */}
              <button
                type="button"
                onClick={signOut}
                title="Выйти из аккаунта GitHub"
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};
