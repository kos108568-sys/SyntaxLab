import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Terminal, CheckCircle2 } from 'lucide-react';


export const AuthScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error('GitHub login error:', err);
      setErrorMsg(err.message || 'Ошибка входа через GitHub');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        
        {/* Logo & Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-600/30 ring-1 ring-white/20">
            <Terminal className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">SyntaxLab</h1>
            <p className="text-xs text-indigo-400 font-medium mt-1">Академическая среда C# и .NET для аудиторий</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pt-1">
            Единый вход для студентов и преподавателя. Авторизация осуществляется исключительно через ваш аккаунт разработчика на GitHub.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300">
            {errorMsg}
          </div>
        )}

        {/* GitHub Sign In Button */}
        <div className="space-y-4 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleGithubLogin}
            className="w-full py-3.5 px-4 bg-slate-100 hover:bg-white text-slate-950 font-bold rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-white/10 disabled:opacity-50 cursor-pointer text-sm"
          >
            {/* GitHub SVG Icon */}
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span>{loading ? 'Перенаправление в GitHub...' : 'Войти через GitHub'}</span>
          </button>
        </div>

        {/* Feature List */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Автоматическая привязка профиля и аватара</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Синхронизация прогресса с базой данных Supabase</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Аудиторный радар преподавателя в реальном времени</span>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-center text-slate-500">
          Для доступа в роли преподавателя укажите почту преподавателя в таблице profiles в Supabase.
        </p>

      </div>
    </div>
  );
};
