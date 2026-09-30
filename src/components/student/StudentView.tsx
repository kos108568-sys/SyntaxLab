import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Task, Lesson } from '../../types';
import { TaskPlayerModal } from './TaskPlayerModal';
import {
  CheckCircle2,
  Lock,
  Flame,
  Award,
  Terminal,
  Bell,
  Sparkles,
  ChevronRight,
  Code2,
  Layers,
  Cpu,
  GitBranch,
  Box
} from 'lucide-react';

export const StudentView: React.FC = () => {
  const {
    course,
    completedTaskIds,
    currentUser,
    role,
    groupModuleAccess,
    studentsInClass,
    broadcastMessage
  } = useApp();

  const [activeTask, setActiveTask] = useState<{ task: Task; lesson: Lesson } | null>(null);

  const currentStudentData = currentUser ? studentsInClass.find(s => s.id === currentUser.id) : null;

  // Icon selector helper
  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'Terminal': return <Terminal className="w-5 h-5" />;
      case 'GitBranch': return <GitBranch className="w-5 h-5" />;
      case 'Layers': return <Layers className="w-5 h-5" />;
      case 'Box': return <Box className="w-5 h-5" />;
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      default: return <Code2 className="w-5 h-5" />;
    }
  };

  // Find next task in curriculum (respecting unlocked modules)
  const handleOpenNextTask = () => {
    if (!activeTask || !course) return;
    const isTeacher = role === 'teacher' || currentUser?.role === 'teacher';
    const studentGroup = currentUser?.groupName || '';
    const groupAllowedModules = groupModuleAccess[studentGroup];

    const allTasksWithLessons = course.modules
      .filter(m => isTeacher || !studentGroup || (groupAllowedModules ? groupAllowedModules.includes(m.id) : m.orderIndex === 1))
      .flatMap(m =>
        m.lessons.flatMap(l => l.tasks.map(t => ({ task: t, lesson: l })))
      );
    const currentIndex = allTasksWithLessons.findIndex(item => item.task.id === activeTask.task.id);
    if (currentIndex >= 0 && currentIndex < allTasksWithLessons.length - 1) {
      setActiveTask(allTasksWithLessons[currentIndex + 1]);
    } else {
      setActiveTask(null);
    }
  };

  if (!course || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
        <Terminal className="w-7 h-7 animate-spin text-indigo-400" />
        <p className="text-xs font-mono">Курс пока не загружен. Проверьте подключение к Supabase и миграции учебной программы.</p>
      </div>
    );
  }

  // Calculate total course completion
  const allTasksCount = course.modules.reduce((acc, m) => acc + m.lessons.reduce((lacc, l) => lacc + l.tasks.length, 0), 0);
  const completedCount = completedTaskIds.length;
  const progressPercent = Math.round((completedCount / (allTasksCount || 1)) * 100);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Broadcast Banner from Teacher if active */}
      {broadcastMessage && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3 text-amber-200 shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Bell className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Объявление преподавателя в аудитории:
            </span>
            <p className="text-xs sm:text-sm font-medium mt-0.5">{broadcastMessage}</p>
          </div>
        </div>
      )}

      {/* Teacher's personal hint for this student */}
      {currentStudentData?.teacherComment && (
        <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-2xl p-4 flex items-center gap-3 text-indigo-200 shadow-lg">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Личная подсказка от преподавателя:
            </span>
            <p className="text-xs sm:text-sm font-medium mt-0.5">"{currentStudentData.teacherComment}"</p>
          </div>
        </div>
      )}

      {/* Student Overview Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={currentUser.fullName}
              className="w-12 h-12 rounded-2xl ring-2 ring-indigo-500/30 object-cover"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">{currentUser.fullName}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {currentUser.groupName || 'Без группы'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Курс: <strong className="text-slate-200">C# .NET 8 (Аудиторная практика)</strong>
              </p>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Серия</p>
                <p className="text-sm font-bold text-white font-mono">{currentUser.currentStreakDays} дней</p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-500" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Опыт</p>
                <p className="text-sm font-bold text-white font-mono">{currentUser.totalXp} XP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Прогресс курса: {completedCount} из {allTasksCount} шагов выполнено</span>
            <span className="font-bold text-indigo-400 font-mono">{progressPercent}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div
              className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-indigo-500/50"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Roadmap Tree: Modules & Lessons */}
      <div className="space-y-6">
        {course.modules.map((module) => {
          const isTeacher = role === 'teacher' || currentUser.role === 'teacher';
          const studentGroup = currentUser.groupName || '';
          const groupAllowedModules = groupModuleAccess[studentGroup];
          const isModuleUnlockedByTeacher = isTeacher || !studentGroup || (
            groupAllowedModules ? groupAllowedModules.includes(module.id) : module.orderIndex === 1
          );

          const moduleTasks = module.lessons.flatMap(l => l.tasks);
          const moduleCompletedTasks = moduleTasks.filter(t => completedTaskIds.includes(t.id));
          const modulePercent = Math.round((moduleCompletedTasks.length / (moduleTasks.length || 1)) * 100);
          const isModuleDone = modulePercent === 100;

          return (
            <div
              key={module.id}
              className={`border rounded-2xl overflow-hidden shadow-lg transition-all ${
                !isModuleUnlockedByTeacher
                  ? 'bg-slate-900/60 border-slate-800/60 opacity-80'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Module Header Bar */}
              <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    !isModuleUnlockedByTeacher
                      ? 'bg-slate-800/80 border border-slate-700/50 text-slate-400'
                      : isModuleDone
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                      : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400'
                  }`}>
                    {getModuleIcon(module.iconName)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-white">{module.title}</h2>
                      {!isModuleUnlockedByTeacher && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Закрыто преподавателем
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{module.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center">
                  {isModuleUnlockedByTeacher ? (
                    <>
                      <span className="text-xs font-mono font-medium text-slate-400">
                        {moduleCompletedTasks.length} / {moduleTasks.length} задач
                      </span>
                      <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all"
                          style={{ width: `${modulePercent}%` }}
                        ></div>
                      </div>
                    </>
                  ) : (
                    <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Недоступно для {studentGroup || 'группы'}
                    </span>
                  )}
                </div>
              </div>

              {/* Locked Module Banner or Lessons & Interactive Task Path */}
              {!isModuleUnlockedByTeacher ? (
                <div className="p-8 bg-slate-950/30 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="max-w-md">
                    <h3 className="text-sm font-bold text-white">Раздел закрыт преподавателем</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Преподаватель пока не открыл доступ к этому разделу для группы{' '}
                      <span className="text-amber-400 font-mono font-semibold">{studentGroup || 'вашей группы'}</span>.
                      Материалы станут доступны, когда преподаватель активирует раздел в панели управления.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-6 space-y-6">
                  {module.lessons.map((lesson) => (
                    <div key={lesson.id} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {lesson.title}
                        </h3>
                        <span className="text-[11px] text-slate-500 font-mono">
                          (~{lesson.estimatedMinutes} мин)
                        </span>
                      </div>

                      {/* Step Nodes: Duolingo Path layout */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {lesson.tasks.map((task, taskIdx) => {
                          const isCompleted = completedTaskIds.includes(task.id);
                          
                          // Check if unlocked (first task is always unlocked, or previous task is completed)
                          const prevTask = taskIdx > 0 ? lesson.tasks[taskIdx - 1] : null;
                          const isUnlocked = taskIdx === 0 || (prevTask && completedTaskIds.includes(prevTask.id)) || isCompleted;

                          return (
                            <div
                              key={task.id}
                              onClick={() => {
                                if (isUnlocked) {
                                  setActiveTask({ task, lesson });
                                }
                              }}
                              className={`group relative rounded-xl border p-4 transition-all duration-200 ${
                                isCompleted
                                  ? 'bg-emerald-950/15 border-emerald-500/30 hover:border-emerald-500/60 cursor-pointer'
                                  : isUnlocked
                                  ? 'bg-indigo-950/20 border-indigo-500/40 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer'
                                  : 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  task.type === 'code_challenge'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : task.type === 'quiz'
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                }`}>
                                  {task.type === 'code_challenge' ? 'Код' : task.type === 'quiz' ? 'Квиз' : 'Баг-хант'}
                                </span>

                                {isCompleted ? (
                                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Пройдено
                                  </span>
                                ) : isUnlocked ? (
                                  <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                                    <span>Решать</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                    <Lock className="w-3 h-3" />
                                    Закрыто
                                  </span>
                                )}
                              </div>

                              <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                                {task.title}
                              </h4>
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                {task.instructions}
                              </p>

                              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-mono">
                                  {task.difficulty === 'easy' ? '🟢 Базовый' : task.difficulty === 'medium' ? '🟡 Средний' : '🔴 Про'}
                                </span>
                                <span className="text-amber-400 font-bold font-mono">
                                  +{task.xp} XP
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Task Modal Runner */}
      {activeTask && (
        <TaskPlayerModal
          key={activeTask.task.id}
          task={activeTask.task}
          lesson={activeTask.lesson}
          onClose={() => setActiveTask(null)}
          onNextTask={handleOpenNextTask}
        />
      )}

    </div>
  );
};
