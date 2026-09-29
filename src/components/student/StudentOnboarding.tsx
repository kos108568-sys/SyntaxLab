import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { 
  loadAcademicGroups, 
  submitStudentOnboarding 
} from '../../services/supabaseService';
import { 
  GraduationCap, 
  Clock, 
  ArrowRight, 
  RefreshCw, 
  LogOut
} from 'lucide-react';

export const StudentOnboarding: React.FC = () => {
  const { currentUser, setCurrentUser, signOut, reloadFromDb } = useApp();

  const [groups, setGroups] = useState<string[]>(['ИТ-301', 'ИТ-302', 'ПИ-201']);
  const [selectedGroup, setSelectedGroup] = useState<string>('ИТ-301');
  const [realName, setRealName] = useState<string>(currentUser?.fullName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadAcademicGroups().then(loaded => {
      if (loaded.length > 0) {
        setGroups(loaded);
        setSelectedGroup(prev => (loaded.includes(prev) ? prev : loaded[0]));
      }
    });
  }, []);

  // Автоматическое отслеживание одобрения заявки преподавателем в реальном времени
  useEffect(() => {
    if (!currentUser?.id) return;

    // 1. Подписка через Supabase Realtime на изменение профиля
    const channel = supabase
      .channel(`profile_approval_${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUser.id}`
        },
        (payload: any) => {
          if (payload.new?.is_approved) {
            reloadFromDb();
          }
        }
      )
      .subscribe();

    // 2. Фоновый опрос (polling каждые 3 секунды) на случай задержки веб-сокетов
    const interval = setInterval(() => {
      if (Boolean(currentUser.groupName) && !currentUser.isApproved) {
        reloadFromDb();
      }
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [currentUser?.id, currentUser?.groupName, currentUser?.isApproved, reloadFromDb]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !realName.trim() || !selectedGroup) return;

    setIsSubmitting(true);
    const success = await submitStudentOnboarding(currentUser.id, realName.trim(), selectedGroup);
    setIsSubmitting(false);

    if (success) {
      setCurrentUser({
        ...currentUser,
        fullName: realName.trim(),
        groupName: selectedGroup,
        isApproved: false
      });
      setIsEditing(false);
    }
  };

  const handleCheckStatus = async () => {
    setIsChecking(true);
    await reloadFromDb();
    setIsChecking(false);
  };

  // Если студент уже выбрал группу, но еще ожидает подтверждения преподавателя
  const hasSubmitted = Boolean(currentUser?.groupName) && !isEditing;

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        
        {/* Header Badge */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt=""
              className="w-10 h-10 rounded-full ring-2 ring-indigo-500/40 object-cover"
            />
            <div>
              <p className="text-xs text-slate-400">GitHub аккаунт</p>
              <h2 className="text-sm font-bold text-white leading-tight">{currentUser?.fullName}</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            title="Выйти"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </div>

        {/* STATE 1: ОЖИДАНИЕ ОДОБРЕНИЯ ПРЕПОДАВАТЕЛЕМ */}
        {hasSubmitted ? (
          <div className="text-center space-y-5 py-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white tracking-tight">
                Ожидание подтверждения доступа
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                Вы подали заявку в учебную группу. Преподаватель в аудитории проверит ваши данные и откроет доступ к курсу.
              </p>
            </div>

            {/* Карточка заявки */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Учебная группа:</span>
                <span className="font-bold text-indigo-400 font-mono text-sm">{currentUser?.groupName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>ФИО для ведомости:</span>
                <span className="font-semibold text-white">{currentUser?.fullName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-slate-900">
                <span>Статус заявки:</span>
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  На рассмотрении преподавателем
                </span>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                disabled={isChecking}
                onClick={handleCheckStatus}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Проверяем статус...' : 'Обновить статус проверки'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRealName(currentUser?.fullName || '');
                  setSelectedGroup(currentUser?.groupName || groups[0]);
                  setIsEditing(true);
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer pt-1"
              >
                Ошиблись группой или ФИО? Изменить данные
              </button>
            </div>
          </div>
        ) : (
          /* STATE 2: ФОРМА ПЕРВИЧНОГО ВЫБОРА ГРУППЫ */
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold">
                <GraduationCap className="w-4 h-4" />
                <span>Шаг 1 из 1: Регистрация в аудитории</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Выберите вашу группу</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                Пожалуйста, укажите настоящее имя и выберите вашу академическую группу, чтобы преподаватель мог идентифицировать вас в журнале и на радаре.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Ваши Фамилия и Имя (для ведомости преподавателя):
                </label>
                <input
                  type="text"
                  required
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  placeholder="Например: Иванов Иван"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Преподаватель сможет скорректировать ФИО при подтверждении, если потребуется.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Академическая группа:</span>
                  <span className="text-slate-500 font-normal">Созданы преподавателем</span>
                </label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  {groups.map((group) => (
                    <option key={group} value={group} className="bg-slate-900 text-slate-200">
                      {group}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !realName.trim()}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <span>{isSubmitting ? 'Отправка...' : 'Отправить заявку в группу'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
