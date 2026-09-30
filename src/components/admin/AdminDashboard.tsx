import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { ClassroomStudentState } from '../../context/AppContext';
import type { Task, TaskType } from '../../types';
import {
  loadAcademicGroups,
  createAcademicGroup,
  deleteAcademicGroup,
  loadAllStudentsForTeacher,
  updateAndApproveStudentProfile,
  rejectStudentProfile
} from '../../services/supabaseService';
import {
  Users,
  Radio,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  PlusCircle,
  FileCode,
  Award,
  Database,
  Copy,
  Check,
  BookOpen,
  MessageSquare,
  Bell,
  UserCheck,
  Edit2,
  Trash2,
  FolderPlus,
  GraduationCap,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  SlidersHorizontal,
  ShieldAlert,
  ShieldCheck,
  Eye,
  History,
  Activity,
  FileText,
  Laptop
} from 'lucide-react';

const TEACHER_LOGINS = ['kos108568-sys', 'kos108568'];

export const calculateHonesty = (student: ClassroomStudentState) => {
  const switches = student.tabSwitchCount || 0;
  const pastes = student.pasteCount || 0;
  const awaySec = student.totalAwaySeconds || 0;
  const penalty = switches * 4 + pastes * 6 + (awaySec > 120 ? 15 : awaySec > 40 ? 8 : 0);
  const score = Math.max(15, Math.min(100, 100 - penalty));
  let label = 'Высокая (Самостоятельно)';
  let color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  let badgeText = 'Честно';
  if (score < 60) {
    label = 'Низкая (Риск списывания / AI)';
    color = 'text-red-400 bg-red-500/10 border-red-500/20';
    badgeText = 'Подозрение';
  } else if (score < 85) {
    label = 'Средняя (Частые смены окон)';
    color = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    badgeText = 'Внимание';
  }
  return { score, label, color, badgeText };
};

export const AdminDashboard: React.FC = () => {
  const {
    studentsInClass,
    course,
    currentUser,
    sendHelpResponse,
    clearStuckStatus,
    addNewTask,
    broadcastMessage,
    setBroadcastMessage,
    isSupabaseConnected,
    availableCourses,
    groupCourseAccess,
    toggleCourseForGroup,
    groupModuleAccess,
    toggleModuleForGroup,
    toggleAllModulesForGroup
  } = useApp();

  const [activeTab, setActiveTab] = useState<'radar' | 'students' | 'curriculum' | 'gradebook' | 'database'>('radar');
  const [selectedStudentForHelp, setSelectedStudentForHelp] = useState<ClassroomStudentState | null>(null);
  const [selectedStudentForDossier, setSelectedStudentForDossier] = useState<ClassroomStudentState | null>(null);
  const [dossierTab, setDossierTab] = useState<'summary' | 'timeline' | 'code'>('summary');
  const [helpCommentInput, setHelpCommentInput] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [fixSqlCopied, setFixSqlCopied] = useState(false);
  const [expandedModulesGroup, setExpandedModulesGroup] = useState<Record<string, boolean>>({});

  // Task creation state
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('code_challenge');
  const [newTaskXp, setNewTaskXp] = useState(50);
  const [newTaskInstructions, setNewTaskInstructions] = useState('');
  const [newTaskStarterCode, setNewTaskStarterCode] = useState('// Ваш C# код здесь\n');

  // Group Filters
  const [radarGroup, setRadarGroup] = useState<string>('all');
  const [gradebookGroup, setGradebookGroup] = useState<string>('all');
  const [filterGroup, setFilterGroup] = useState<string>('all');

  // Groups and Students Moderation state
  const [academicGroups, setAcademicGroups] = useState<string[]>(['ИТ-301', 'ИТ-302', 'ПИ-201']);
  const [newGroupInput, setNewGroupInput] = useState('');
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [isProcessingStudent, setIsProcessingStudent] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Edit student modal state
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editGroupName, setEditGroupName] = useState('');

  // Load groups and students
  const refreshStudentsAndGroups = async () => {
    const [groupsData, studentsData] = await Promise.all([
      loadAcademicGroups(),
      loadAllStudentsForTeacher()
    ]);
    if (groupsData.length > 0) setAcademicGroups(groupsData);
    setAllStudents(studentsData);
  };

  useEffect(() => {
    refreshStudentsAndGroups();
  }, [activeTab]);

  // Проверка: является ли пользователь преподавателем/админом
  const isTeacherProfile = (s: any) => {
    if (!s) return false;
    if (s.role === 'teacher') return true;
    const email = (s.email || '').toLowerCase();
    if (TEACHER_LOGINS.some(t => email.includes(t))) return true;
    if (currentUser?.role === 'teacher' && s.id === currentUser.id) return true;
    if (s.groupName === 'Преподавательский состав' || s.group_name === 'Преподавательский состав') return true;
    return false;
  };

  // Проверка: моковые студенты из старых шаблонов
  const isMockStudent = (s: any) => {
    if (!s || !s.id) return true;
    return String(s.id).startsWith('stud-') || s.email === 'a.smirnov@university.edu';
  };

  // Все доступные группы из базы и профилей студентов
  const allAvailableGroups = useMemo(() => {
    const set = new Set<string>(academicGroups);
    allStudents.forEach(s => {
      if (s.group_name && !isTeacherProfile(s) && s.group_name !== 'Преподавательский состав') set.add(s.group_name);
    });
    studentsInClass.forEach(s => {
      if (s.groupName && !isTeacherProfile(s) && s.groupName !== 'Преподавательский состав' && s.groupName !== 'Без группы') set.add(s.groupName);
    });
    return Array.from(set).filter(Boolean);
  }, [academicGroups, allStudents, studentsInClass]);

  // Только РЕАЛЬНЫЕ студенты из базы данных (без преподавателей и моков)
  const realApprovedStudents = useMemo(() => {
    return allStudents.filter(s => s.is_approved && !isTeacherProfile(s) && !isMockStudent(s));
  }, [allStudents]);

  // Только РЕАЛЬНЫЕ активные сессии (без преподавателя и моков)
  const realSessions = useMemo(() => {
    return studentsInClass.filter(s => !isTeacherProfile(s) && !isMockStudent(s));
  }, [studentsInClass]);

  // ЕДИНЫЙ МАППЕР СТУДЕНТА:
  // Первоисточник информации о студенте (ФИО, группа, XP) ВСЕГДА берется из базы profiles (allStudents)!
  // Это гарантирует 100% совпадение группы на дашборде, в радаре, журнале и во вкладке студентов.
  const getUnifiedStudent = (student: any): ClassroomStudentState => {
    const live = realSessions.find(sess => sess.id === student.id || (student.email && sess.email === student.email));
    return {
      id: student.id,
      fullName: student.full_name || student.fullName || 'Студент',
      avatarUrl: student.avatar_url || student.avatarUrl,
      email: student.email || '',
      // ВСЕГДА используем группу из профиля студента:
      groupName: student.group_name || student.groupName || 'Без группы',
      currentTaskId: live?.currentTaskId || '',
      currentTaskTitle: live?.currentTaskTitle || 'Задание не начато',
      currentLessonTitle: live?.currentLessonTitle || '',
      status: live?.status || 'idle',
      attemptsOnCurrentTask: live?.attemptsOnCurrentTask || 0,
      timeOnCurrentTaskMinutes: live?.timeOnCurrentTaskMinutes || 0,
      needsHelp: live?.needsHelp || false,
      helpMessage: live?.helpMessage,
      teacherComment: live?.teacherComment,
      totalXp: student.total_xp ?? live?.totalXp ?? 0,
      streakDays: student.streak_days ?? live?.streakDays ?? 0,
      lastActive: live?.lastActive || 'Оффлайн',
      tabSwitchCount: live?.tabSwitchCount || 0,
      totalAwaySeconds: live?.totalAwaySeconds || 0,
      pasteCount: live?.pasteCount || 0,
      pastedCharsTotal: live?.pastedCharsTotal || 0,
      isCurrentlyAway: live?.isCurrentlyAway || false,
      totalErrorsCount: live?.totalErrorsCount || 0,
      totalAttemptsCount: live?.totalAttemptsCount || 0,
      completedTasksCount: live?.completedTasksCount || 0,
      lastCodeSnippet: live?.lastCodeSnippet,
      lastErrorMessage: live?.lastErrorMessage,
      eventsLog: live?.eventsLog || []
    };
  };

  // Студенты для Аудиторного Радара
  const radarStudents: ClassroomStudentState[] = useMemo(() => {
    if (realApprovedStudents.length > 0) {
      return realApprovedStudents
        .filter(s => radarGroup === 'all' || s.group_name === radarGroup)
        .map(getUnifiedStudent);
    }
    return realSessions
      .filter(s => radarGroup === 'all' || s.groupName === radarGroup);
  }, [realApprovedStudents, realSessions, radarGroup]);

  // Студенты для Журнала Успеваемости
  const gradebookStudents: ClassroomStudentState[] = useMemo(() => {
    if (realApprovedStudents.length > 0) {
      return realApprovedStudents
        .filter(s => gradebookGroup === 'all' || s.group_name === gradebookGroup)
        .map(getUnifiedStudent);
    }
    return realSessions
      .filter(s => gradebookGroup === 'all' || s.groupName === gradebookGroup);
  }, [realApprovedStudents, realSessions, gradebookGroup]);

  const stuckStudents = radarStudents.filter(s => s.status === 'stuck' || s.needsHelp);
  const pendingStudents = allStudents.filter(s => !s.is_approved && !isTeacherProfile(s) && !isMockStudent(s));

  const handleSendHint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForHelp || !helpCommentInput.trim()) return;
    sendHelpResponse(selectedStudentForHelp.id, helpCommentInput.trim());
    setSelectedStudentForHelp(null);
    setHelpCommentInput('');
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim()) return;
    setBroadcastMessage(newAnnouncement.trim());
    setNewAnnouncement('');
  };

  const handleApproveStudent = async (studentId: string, fullName: string, groupName: string) => {
    setIsProcessingStudent(true);
    setActionError(null);
    setActionSuccess(null);
    const success = await updateAndApproveStudentProfile(studentId, fullName, groupName, true);
    if (!success) {
      setActionError('Не удалось обновить статус студента в базе Supabase. Возможные причины: в базе отсутствуют нужные политики RLS для обновления профилей учителем или не создана функция approve_student. Запустите скрипт "fixApprovalAndRealtime.sql" во вкладке "Supabase & SQL".');
    } else {
      setActionSuccess(`Студент "${fullName}" успешно допущен к занятиям!`);
      // Оптимистично обновляем локальный стейт, чтобы студент сразу исчез из ожидающих
      setAllStudents(prev => prev.map(s => s.id === studentId ? { ...s, is_approved: true, full_name: fullName, group_name: groupName } : s));
      setTimeout(() => setActionSuccess(null), 4000);
    }
    await refreshStudentsAndGroups();
    setIsProcessingStudent(false);
  };

  const handleRejectStudent = async (studentId: string) => {
    if (confirm('Отклонить заявку студента? Ему потребуется отправить заявку заново.')) {
      setIsProcessingStudent(true);
      setActionError(null);
      setActionSuccess(null);
      const success = await rejectStudentProfile(studentId);
      if (!success) {
        setActionError('Не удалось отклонить заявку в базе данных Supabase.');
      } else {
        setActionSuccess('Заявка студента отклонена.');
        setAllStudents(prev => prev.filter(s => s.id !== studentId));
        setTimeout(() => setActionSuccess(null), 4000);
      }
      await refreshStudentsAndGroups();
      setIsProcessingStudent(false);
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupInput.trim()) return;
    await createAcademicGroup(newGroupInput.trim());
    setNewGroupInput('');
    await refreshStudentsAndGroups();
  };

  const handleDeleteGroup = async (groupName: string) => {
    if (confirm(`Вы уверены, что хотите удалить группу "${groupName}"?`)) {
      await deleteAcademicGroup(groupName);
      await refreshStudentsAndGroups();
    }
  };

  const handleOpenEditStudent = (student: any) => {
    setEditingStudent(student);
    setEditFullName(student.full_name || '');
    setEditGroupName(student.group_name || academicGroups[0] || 'ИТ-301');
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !editFullName.trim()) return;
    setIsProcessingStudent(true);
    setActionError(null);
    setActionSuccess(null);
    const success = await updateAndApproveStudentProfile(
      editingStudent.id,
      editFullName.trim(),
      editGroupName,
      editingStudent.is_approved
    );
    if (!success) {
      setActionError('Не удалось сохранить изменения данных студента в базе данных.');
    } else {
      setActionSuccess(`Данные студента "${editFullName}" успешно обновлены.`);
      setEditingStudent(null);
      setTimeout(() => setActionSuccess(null), 4000);
    }
    await refreshStudentsAndGroups();
    setIsProcessingStudent(false);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedLessonId) return;

    const created: Task = {
      id: `task-custom-${Date.now()}`,
      lessonId: selectedLessonId,
      title: newTaskTitle,
      type: newTaskType,
      difficulty: 'medium',
      xp: Number(newTaskXp),
      instructions: newTaskInstructions,
      initialCode: newTaskStarterCode,
      tests: [
        {
          id: `t-${Date.now()}`,
          description: 'Проверка корректности работы кода'
        }
      ],
      hints: ['Внимательно проверьте типы данных и синтаксис C#']
    };

    addNewTask(selectedLessonId, created);
    setIsAddingTask(false);
    setNewTaskTitle('');
    setNewTaskInstructions('');
  };

  const FIX_SQL_SCRIPT = `-- ====================================================================
-- SyntaxLab: Быстрый фикс для подтверждения заявок студентов и Realtime
-- Запустите этот скрипт в Supabase -> SQL Editor -> Run
-- ====================================================================

-- 1. Убедимся, что колонка is_approved есть в таблице profiles
alter table public.profiles add column if not exists is_approved boolean default false;
update public.profiles set is_approved = true where role = 'teacher';

-- 2. Безопасная функция проверки роли преподавателя (без рекурсии в RLS)
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- 3. Хранимая функция одобрения студента преподавателем (SECURITY DEFINER)
create or replace function public.approve_student(
  student_id uuid,
  new_full_name text default null,
  new_group_name text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_teacher boolean;
begin
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  ) into caller_is_teacher;

  if not caller_is_teacher then
    raise exception 'Доступ запрещен: только преподаватель может подтверждать студентов';
  end if;

  update public.profiles
  set
    is_approved = true,
    full_name = coalesce(nullif(trim(new_full_name), ''), full_name),
    group_name = coalesce(nullif(trim(new_group_name), ''), group_name)
  where id = student_id;

  return true;
end;
$$;

-- 4. Хранимая функция отклонения студента (SECURITY DEFINER)
create or replace function public.reject_student(
  student_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_teacher boolean;
begin
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  ) into caller_is_teacher;

  if not caller_is_teacher then
    raise exception 'Доступ запрещен: только преподаватель может отклонять заявки';
  end if;

  update public.profiles
  set
    is_approved = false,
    group_name = null
  where id = student_id;

  return true;
end;
$$;

-- 5. Настройка RLS политик на public.profiles
alter table public.profiles enable row level security;

drop policy if exists "Profiles visible to all users" on public.profiles;
drop policy if exists "Profiles visible to authenticated users" on public.profiles;
create policy "Profiles visible to authenticated users" on public.profiles
  for select using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Teachers can update student profiles" on public.profiles;
create policy "Teachers can update student profiles" on public.profiles
  for update using (public.is_teacher());

-- 6. Добавление profiles в публикацию Supabase Realtime
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;`;

  const copyFixSqlToClipboard = () => {
    navigator.clipboard.writeText(FIX_SQL_SCRIPT);
    setFixSqlCopied(true);
    setTimeout(() => setFixSqlCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Tab Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Radio className="w-4 h-4 animate-pulse" />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">Панель управления преподавателя</h1>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Прозрачный мониторинг аудитории в реальном времени, аудит выполнения заданий и управление курсом C#.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('radar')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'radar'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Аудиторный Радар</span>
              {stuckStudents.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                  {stuckStudents.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'students'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Студенты и Группы</span>
              {pendingStudents.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-bold animate-pulse">
                  {pendingStudents.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('curriculum')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'curriculum'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Учебный План C#</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gradebook')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'gradebook'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>Журнал успеваемости</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'database'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>Supabase & SQL</span>
            </button>
          </div>
        </div>

        {/* Live Broadcast Announcement Bar */}
        <form onSubmit={handleBroadcast} className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 whitespace-nowrap">
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Объявление в аудиторию:</span>
          </div>
          <input
            type="text"
            value={newAnnouncement}
            onChange={(e) => setNewAnnouncement(e.target.value)}
            placeholder="Например: 'Ребята, обратите внимание на пробелы при интерполяции строк в задаче 1.1!'"
            className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="submit"
              disabled={!newAnnouncement.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-all"
            >
              <Send className="w-3 h-3" />
              <span>Отправить на экраны</span>
            </button>
            {broadcastMessage && (
              <button
                type="button"
                onClick={() => setBroadcastMessage(null)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-all"
              >
                Снять
              </button>
            )}
          </div>
        </form>

        {broadcastMessage && (
          <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center gap-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded">Текущее объявление:</span>
              "{broadcastMessage}"
            </span>
            <span className="text-[11px] text-amber-400/70 font-mono">Видно у всех студентов</span>
          </div>
        )}
      </div>

      {/* TAB 1: LIVE CLASSROOM RADAR */}
      {activeTab === 'radar' && (
        <div className="space-y-6">
          
          {/* Quick Classroom Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Студентов в аудитории</p>
                <p className="text-2xl font-bold text-white mt-1">{radarStudents.length}</p>
                <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {radarGroup === 'all' ? 'Все группы' : `Группа ${radarGroup}`}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Требуют помощи</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{stuckStudents.length}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {stuckStudents.length > 0 ? 'Ждут подсказки' : 'Все справляются'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Смен окон (Anti-cheat)</p>
                <p className="text-2xl font-bold text-indigo-300 mt-1 font-mono">
                  {radarStudents.reduce((acc, s) => acc + (s.tabSwitchCount || 0), 0)}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  Вставок из буфера: {radarStudents.reduce((acc, s) => acc + (s.pasteCount || 0), 0)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Всего ошибок / сбоев</p>
                <p className="text-2xl font-bold text-purple-300 mt-1 font-mono">
                  {radarStudents.reduce((acc, s) => acc + (s.totalErrorsCount || 0), 0)}
                </p>
                <p className="text-[10px] text-purple-400 mt-1">
                  Сдано заданий: +{radarStudents.reduce((acc, s) => acc + (s.completedTasksCount || 0), 0)}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <FileCode className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between shadow-lg">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Свернули окно сейчас</p>
                <p className="text-2xl font-bold text-rose-400 mt-1 font-mono">
                  {radarStudents.filter(s => s.isCurrentlyAway).length}
                </p>
                <p className="text-[10px] text-rose-300/80 mt-1">
                  {radarStudents.filter(s => s.isCurrentlyAway).length > 0 ? 'Вне активной вкладки' : 'Все в окне кода'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Laptop className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* The Live Matrix of Students */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>Мониторинг аудитории (Парты / Рабочие места)</span>
                  <span className="text-xs font-mono font-normal text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Live sync
                  </span>
                </h2>
                <span className="text-xs text-slate-400">
                  Только реальные данные студентов. Кликните «Досье» для просмотра истории переключений, ошибок и написанного кода.
                </span>
              </div>

              {/* Group filter for Radar */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Группа:</span>
                <select
                  value={radarGroup}
                  onChange={(e) => setRadarGroup(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="all">Все группы ({realApprovedStudents.length})</option>
                  {allAvailableGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {radarStudents.length === 0 ? (
                <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Аудиторный радар активен (Нет активных сессий)</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    {radarGroup === 'all'
                      ? 'В системе пока нет подтвержденных студентов или активных сессий. Когда студенты авторизуются через GitHub и начнут выполнение заданий, они появятся здесь автоматически.'
                      : `В группе ${radarGroup} пока нет активных сессий или подтвержденных студентов. Выберите другую группу или подтвердите заявки во вкладке "Студенты и Группы".`}
                  </p>
                </div>
              ) : (
                radarStudents.map((student) => {
                  const isStuck = student.status === 'stuck' || student.needsHelp;
                  const isCompleted = student.status === 'completed_step';
                  const honesty = calculateHonesty(student);

                  return (
                    <div
                      key={student.id}
                      className={`relative rounded-xl border p-4 space-y-3 transition-all duration-200 ${
                        isStuck
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/10'
                          : student.isCurrentlyAway
                          ? 'bg-rose-950/20 border-rose-500/30'
                          : isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                    {/* Status Badge Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <img
                            src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={student.fullName}
                            className="w-10 h-10 rounded-full ring-2 ring-slate-700 object-cover"
                          />
                          {student.isCurrentlyAway ? (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-slate-900" title="Свернул окно" />
                          ) : (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" title="В активном окне" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-white leading-tight">{student.fullName}</h3>
                          <span className="text-[11px] text-slate-400 font-mono">{student.groupName}</span>
                        </div>
                      </div>

                      {student.isCurrentlyAway ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full animate-pulse">
                          <Laptop className="w-3 h-3" />
                          Свернул окно
                        </span>
                      ) : isStuck ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          {student.needsHelp ? 'Поднял руку!' : 'Застрял'}
                        </span>
                      ) : isCompleted ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Сдал шаг
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          В коде
                        </span>
                      )}
                    </div>

                    {/* Current Task Info */}
                    <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/60 space-y-1">
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Задание:</span>
                        <span className="font-mono text-slate-300">
                          {student.attemptsOnCurrentTask > 0 ? `${student.attemptsOnCurrentTask} поп.` : '1 поп.'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 truncate">
                        {student.currentTaskTitle}
                      </p>
                      <p className="text-[11px] text-indigo-400 truncate">
                        {student.currentLessonTitle}
                      </p>
                    </div>

                    {/* Telemetry Strip: Completed, Errors, Switches, Pastes */}
                    <div className="grid grid-cols-4 gap-1.5 text-[11px] font-mono">
                      <div className="bg-slate-950/70 rounded-lg p-1.5 border border-slate-800/80 text-center" title="Сдано заданий">
                        <span className="text-[9px] text-slate-500 block uppercase font-sans font-semibold">Заданий</span>
                        <span className="font-bold text-emerald-400">+{student.completedTasksCount || 0}</span>
                      </div>
                      <div className="bg-slate-950/70 rounded-lg p-1.5 border border-slate-800/80 text-center" title="Количество ошибок компиляции и тестов">
                        <span className="text-[9px] text-slate-500 block uppercase font-sans font-semibold">Ошибок</span>
                        <span className={`font-bold ${(student.totalErrorsCount || 0) > 3 ? 'text-red-400' : (student.totalErrorsCount || 0) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                          {student.totalErrorsCount || 0}
                        </span>
                      </div>
                      <div className="bg-slate-950/70 rounded-lg p-1.5 border border-slate-800/80 text-center" title="Сворачиваний и смен окон / вкладок">
                        <span className="text-[9px] text-slate-500 block uppercase font-sans font-semibold">Смен окон</span>
                        <span className={`font-bold ${(student.tabSwitchCount || 0) > 3 ? 'text-rose-400' : (student.tabSwitchCount || 0) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                          {student.tabSwitchCount || 0}
                        </span>
                      </div>
                      <div className="bg-slate-950/70 rounded-lg p-1.5 border border-slate-800/80 text-center" title="Вставок кода из буфера обмена (Ctrl+V)">
                        <span className="text-[9px] text-slate-500 block uppercase font-sans font-semibold">Вставок</span>
                        <span className={`font-bold ${(student.pasteCount || 0) > 2 ? 'text-purple-400' : 'text-slate-400'}`}>
                          {student.pasteCount || 0}
                        </span>
                      </div>
                    </div>

                    {/* Honesty Score Indicator */}
                    <div className="flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-slate-950/50 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        {honesty.score >= 85 ? (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>Античит индекс:</span>
                      </span>
                      <span className={`font-bold font-mono px-1.5 py-0.5 rounded text-[10px] border ${honesty.color}`}>
                        {honesty.score}% • {honesty.badgeText}
                      </span>
                    </div>

                    {/* Student Request Message if stuck */}
                    {student.helpMessage && (
                      <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200">
                        <span className="font-semibold block text-[10px] text-amber-400 uppercase tracking-wide">
                          Вопрос студента:
                        </span>
                        "{student.helpMessage}"
                      </div>
                    )}

                    {/* Teacher's sent comment preview */}
                    {student.teacherComment && (
                      <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300">
                        <span className="font-semibold block text-[10px] text-indigo-400 uppercase tracking-wide">
                          Ваша подсказка:
                        </span>
                        "{student.teacherComment}"
                      </div>
                    )}

                    {/* Action Footer */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-mono font-medium">{student.totalXp} XP</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForDossier(student);
                            setDossierTab('summary');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition-all border border-slate-700/60"
                          title="Открыть полное досье телеметрии, историю действий и код"
                        >
                          <Eye className="w-3 h-3 text-indigo-400" />
                          <span>Досье</span>
                        </button>

                        {isStuck && (
                          <button
                            type="button"
                            onClick={() => clearStuckStatus(student.id)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-all"
                            title="Снять флаг застрявшего"
                          >
                            Снять алерт
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudentForHelp(student);
                            setHelpCommentInput(student.helpMessage ? `Подсказка: ` : '');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-medium transition-all shadow-sm shadow-indigo-600/30"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Помочь</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        </div>
      )}

      {/* TAB: STUDENTS & GROUPS MODERATION */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          
          {actionError && (
            <div className="p-4 bg-red-950/70 border border-red-500/40 rounded-2xl text-xs text-red-200 flex items-start justify-between gap-3 shadow-lg shadow-red-950/30">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-red-300 block mb-0.5">Внимание: ошибка обновления в Supabase</span>
                  <p className="leading-relaxed text-red-200/90">{actionError}</p>
                </div>
              </div>
              <button onClick={() => setActionError(null)} className="text-red-400 hover:text-white p-1">✕</button>
            </div>
          )}

          {actionSuccess && (
            <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200 flex items-center justify-between gap-3 shadow-lg shadow-emerald-950/30">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-emerald-200">{actionSuccess}</span>
              </div>
              <button onClick={() => setActionSuccess(null)} className="text-emerald-400 hover:text-white p-1">✕</button>
            </div>
          )}

          {/* SECTION 1: PENDING STUDENT APPROVALS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                    <span>Заявки студентов на подтверждение</span>
                    {pendingStudents.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-slate-950 font-bold animate-pulse">
                        {pendingStudents.length} новых
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Студенты, которые вошли через GitHub и выбрали группу, но еще не допущены к занятиям.
                  </p>
                </div>
              </div>
            </div>

            {pendingStudents.length === 0 ? (
              <div className="py-8 text-center space-y-2 bg-slate-950/40 rounded-xl border border-slate-800/80">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 opacity-80" />
                <p className="text-sm font-semibold text-slate-200">Все заявки обработаны</p>
                <p className="text-xs text-slate-400">Новые студенты появятся здесь сразу после входа через GitHub.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingStudents.map((student) => (
                  <div
                    key={student.id}
                    className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-4 shadow-lg shadow-amber-500/5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt=""
                          className="w-10 h-10 rounded-full ring-2 ring-amber-500/30 object-cover"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-white">{student.full_name}</h3>
                          <p className="text-[11px] text-slate-400 font-mono">{student.email}</p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {student.group_name || 'Не указана'}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditStudent(student)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Изменить ФИО / группу</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isProcessingStudent}
                          onClick={() => handleRejectStudent(student.id)}
                          className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
                        >
                          Отклонить
                        </button>

                        <button
                          type="button"
                          disabled={isProcessingStudent}
                          onClick={() => handleApproveStudent(student.id, student.full_name, student.group_name)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/25 flex items-center gap-1.5 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Подтвердить</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: ACADEMIC GROUPS MANAGEMENT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Учебные группы</h2>
                  <p className="text-xs text-slate-400">
                    Список групп, доступных студентам для выбора при первом входе.
                  </p>
                </div>
              </div>
            </div>

            {/* Add new group form */}
            <form onSubmit={handleAddGroup} className="flex items-center gap-3">
              <input
                type="text"
                value={newGroupInput}
                onChange={(e) => setNewGroupInput(e.target.value)}
                placeholder="Например: ПИ-202 или ИТ-303"
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
              />
              <button
                type="submit"
                disabled={!newGroupInput.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Добавить группу</span>
              </button>
            </form>

            {/* Existing groups list with Course Access Control */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
              {academicGroups.map((group) => {
                const countInGroup = allStudents.filter(s => s.group_name === group && s.is_approved).length;
                const allowedCourses = groupCourseAccess[group] || [];

                return (
                  <div
                    key={group}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-white font-mono text-sm">{group}</span>
                        <span className="text-slate-500 text-[11px]">({countInGroup} студ.)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group)}
                        title="Удалить группу"
                        className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-slate-900"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Course Access Checkboxes */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Доступные курсы:
                      </span>
                      {availableCourses.map((c) => {
                        const isChecked = allowedCourses.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer select-none py-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => toggleCourseForGroup(group, c.id, e.target.checked)}
                              className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="flex items-center gap-1.5">
                              {c.id === 'git-branching' ? (
                                <GitBranch className="w-3 h-3 text-amber-400" />
                              ) : (
                                <FileCode className="w-3 h-3 text-indigo-400" />
                              )}
                              <span>{c.title}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    {/* Module (Section) Access Controls */}
                    {allowedCourses.includes('csharp-foundations') && course && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                            Разделы C#:
                          </span>
                          {(() => {
                            const allowedModIds = groupModuleAccess[group] || [];
                            const openCount = course.modules.filter(m => allowedModIds.includes(m.id)).length;
                            const isExpanded = !!expandedModulesGroup[group];
                            return (
                              <button
                                type="button"
                                onClick={() => setExpandedModulesGroup(prev => ({ ...prev, [group]: !prev[group] }))}
                                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-mono flex items-center gap-1 transition-colors"
                              >
                                <span>{openCount}/{course.modules.length} открыто</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            );
                          })()}
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => toggleAllModulesForGroup(group, 'csharp-foundations', course.modules.map(m => m.id), true)}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-all flex items-center gap-1"
                          >
                            <Unlock className="w-2.5 h-2.5" />
                            Открыть все
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleAllModulesForGroup(group, 'csharp-foundations', course.modules.map(m => m.id), false)}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-all flex items-center gap-1"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            Закрыть все
                          </button>
                        </div>

                        {/* Module list */}
                        {expandedModulesGroup[group] && (
                          <div className="space-y-1 pt-1.5 max-h-56 overflow-y-auto pr-1">
                            {course.modules.map((mod) => {
                              const isModOpen = (groupModuleAccess[group] || []).includes(mod.id);
                              const totalTasks = mod.lessons.reduce((acc, l) => acc + l.tasks.length, 0);
                              return (
                                <label
                                  key={mod.id}
                                  className={`flex items-center justify-between gap-2 p-1.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                    isModOpen
                                      ? 'bg-indigo-950/30 border-indigo-500/30 text-slate-200 hover:border-indigo-500/50'
                                      : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <input
                                      type="checkbox"
                                      checked={isModOpen}
                                      onChange={(e) => toggleModuleForGroup(group, mod.id, 'csharp-foundations', e.target.checked)}
                                      className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer shrink-0"
                                    />
                                    <span className="truncate text-[11px] font-medium">
                                      {mod.title.replace('Модуль ', 'М')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="text-[10px] font-mono text-slate-500">{totalTasks} зад.</span>
                                    {isModOpen ? (
                                      <span className="w-2 h-2 rounded-full bg-emerald-400" title="Раздел открыт для группы" />
                                    ) : (
                                      <span className="w-2 h-2 rounded-full bg-slate-600" title="Раздел закрыт для группы" />
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: ALL APPROVED STUDENTS REGISTRY */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Подтвержденные студенты</h2>
                <p className="text-xs text-slate-400">
                  Реестр всех студентов с доступом к материалам курса C#. Вы можете изменить ФИО или группу в любой момент.
                </p>
              </div>

              {/* Group Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Фильтр:</span>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="all">Все группы ({realApprovedStudents.length})</option>
                  {allAvailableGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Студент (ФИО)</th>
                    <th className="px-4 py-3">Группа</th>
                    <th className="px-3 py-3 text-center">Заданий</th>
                    <th className="px-3 py-3 text-center">Ошибок</th>
                    <th className="px-3 py-3 text-center">Смен окон</th>
                    <th className="px-3 py-3 text-center">Вставок</th>
                    <th className="px-3 py-3 text-center">Честность</th>
                    <th className="px-4 py-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {realApprovedStudents
                    .filter(s => filterGroup === 'all' || s.group_name === filterGroup)
                    .map((student) => {
                      const unified = getUnifiedStudent(student);
                      const liveSession = realSessions.find(s => s.id === student.id || (student.email && s.email === student.email));
                      const honesty = calculateHonesty(unified);

                      return (
                        <tr key={student.id} className="hover:bg-slate-950/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-white flex items-center gap-2.5">
                            <div className="relative">
                              <img
                                src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              {liveSession?.isCurrentlyAway ? (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900" title="Вне вкладки" />
                              ) : liveSession ? (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900" title="В активном окне" />
                              ) : null}
                            </div>
                            <div>
                              <div>{student.full_name}</div>
                              <span className="text-[10px] text-slate-500 font-mono">{student.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 bg-slate-800 text-indigo-400 rounded font-mono font-medium">
                              {student.group_name || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center font-mono font-bold text-emerald-400">
                            +{unified.completedTasksCount ?? 0}
                          </td>
                          <td className="px-3 py-3 text-center font-mono">
                            <span className={`font-semibold ${(unified.totalErrorsCount || 0) > 3 ? 'text-rose-400' : (unified.totalErrorsCount || 0) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                              {unified.totalErrorsCount ?? 0}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center font-mono">
                            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${(unified.tabSwitchCount || 0) > 3 ? 'text-rose-400 bg-rose-500/10' : (unified.tabSwitchCount || 0) > 0 ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'}`}>
                              {unified.tabSwitchCount ?? 0}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center font-mono text-purple-300">
                            {unified.pasteCount ?? 0}
                          </td>
                          <td className="px-3 py-3 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${honesty.color}`}>
                              {honesty.score}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentForDossier(unified);
                                  setDossierTab('summary');
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700/60"
                                title="Посмотреть полное досье студента"
                              >
                                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                                <span>Досье</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditStudent(student)}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                              >
                                <Edit2 className="w-3 h-3 text-slate-400" />
                                <span>Правка</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {realApprovedStudents.filter(s => filterGroup === 'all' || s.group_name === filterGroup).length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <GraduationCap className="w-6 h-6 text-slate-600 mb-1" />
                          <p className="text-xs font-medium text-slate-400">Нет одобренных студентов в выбранной группе</p>
                          <p className="text-[11px] text-slate-600">Студенты появятся здесь после подтверждения заявки на доступ</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* MODAL: EDIT STUDENT FULL NAME AND GROUP */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Редактирование профиля студента</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStudentEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Фамилия и Имя студента:
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Учебная группа:
                </label>
                <select
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
                >
                  {allAvailableGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isProcessingStudent || !editFullName.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/30"
                >
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: CURRICULUM & TASK MANAGER */}
      {activeTab === 'curriculum' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Учебный план курса C#</h2>
              <p className="text-xs text-slate-400">
                Модули, пошаговые уроки и практические задания. Вы можете добавлять задачи прямо во время пары.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingTask(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Создать задание</span>
            </button>
          </div>

          <div className="space-y-4">
            {course?.modules.map((mod, modIdx) => (
              <div key={mod.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                      0{modIdx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{mod.title}</h3>
                      <p className="text-xs text-slate-400">{mod.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-mono">
                      {mod.lessons.length} {mod.lessons.length === 1 ? 'урок' : 'урока'}
                    </span>
                    {(() => {
                      const openForGroups = academicGroups.filter(g => (groupModuleAccess[g] || []).includes(mod.id));
                      return openForGroups.length === academicGroups.length ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Открыт всем группам
                        </span>
                      ) : openForGroups.length > 0 ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Открыт: {openForGroups.join(', ')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Закрыт для всех
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="divide-y divide-slate-800/60 p-2">
                  {mod.lessons.map((les) => (
                    <div key={les.id} className="p-3 hover:bg-slate-950/30 rounded-lg transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-violet-400" />
                          <span className="text-xs font-medium text-slate-200">{les.title}</span>
                          <span className="text-[11px] text-slate-400">({les.estimatedMinutes} мин)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLessonId(les.id);
                            setIsAddingTask(true);
                          }}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                        >
                          <PlusCircle className="w-3 h-3" />
                          Добавить задачу
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                        {les.tasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                task.type === 'code_challenge'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : task.type === 'quiz'
                                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {task.type === 'code_challenge' ? 'Код' : task.type === 'quiz' ? 'Тест' : 'Баг-хант'}
                              </span>
                              <span className="text-amber-400 font-medium font-mono text-[11px]">+{task.xp} XP</span>
                            </div>
                            <p className="font-semibold text-slate-200 truncate">{task.title}</p>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{task.instructions}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GRADEBOOK & ANALYTICS */}
      {activeTab === 'gradebook' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Журнал успеваемости {gradebookGroup === 'all' ? '(Все группы)' : `(Группа ${gradebookGroup})`}
              </h2>
              <p className="text-xs text-slate-400">
                Сводные показатели, набранные баллы (XP), количество попыток, смен окон и античит-индекс.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Группа:</span>
                <select
                  value={gradebookGroup}
                  onChange={(e) => setGradebookGroup(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="all">Все группы ({realApprovedStudents.length})</option>
                  {allAvailableGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => alert('Экспорт ведомости в формате CSV / Excel сформирован')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all shrink-0"
              >
                Экспорт ведомости (CSV)
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Студент</th>
                  <th className="px-3 py-3 text-center">Заданий сдано</th>
                  <th className="px-3 py-3 text-center">Ошибок / Сбоев</th>
                  <th className="px-3 py-3 text-center">Смен окон (Anti-cheat)</th>
                  <th className="px-3 py-3 text-center">Вставок кода</th>
                  <th className="px-3 py-3 text-center">Честность</th>
                  <th className="px-4 py-3">Всего XP</th>
                  <th className="px-4 py-3">Текущий шаг</th>
                  <th className="px-4 py-3 text-right">Досье</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {gradebookStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                      В выбранной группе пока нет студентов или активных сессий.
                    </td>
                  </tr>
                ) : (
                  gradebookStudents.map((student) => {
                    const honesty = calculateHonesty(student);

                    return (
                      <tr key={student.id} className="hover:bg-slate-950/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-white flex items-center gap-2.5">
                          <div className="relative">
                            <img
                              src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            {student.isCurrentlyAway ? (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900" title="Вне вкладки" />
                            ) : (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900" title="В активном окне" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100">{student.fullName}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{student.groupName}</span>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-center font-mono font-bold text-emerald-400">
                          +{student.completedTasksCount || 0}
                        </td>

                        <td className="px-3 py-3 text-center font-mono">
                          <span className={`font-semibold ${(student.totalErrorsCount || 0) > 3 ? 'text-rose-400' : (student.totalErrorsCount || 0) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                            {student.totalErrorsCount || 0}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${(student.tabSwitchCount || 0) > 3 ? 'text-rose-400 bg-rose-500/10' : (student.tabSwitchCount || 0) > 0 ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400'}`}>
                            {student.tabSwitchCount || 0}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-center font-mono text-purple-300">
                          <span>{student.pasteCount || 0}</span>
                          {(student.pastedCharsTotal || 0) > 0 && (
                            <span className="text-[10px] text-slate-500 block">({student.pastedCharsTotal} симв.)</span>
                          )}
                        </td>

                        <td className="px-3 py-3 text-center font-mono">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${honesty.color}`}>
                            {honesty.score}%
                          </span>
                        </td>

                        <td className="px-4 py-3 font-semibold text-white font-mono">
                          {student.totalXp} XP
                        </td>

                        <td className="px-4 py-3 text-slate-300 max-w-[150px] truncate" title={student.currentTaskTitle}>
                          {student.currentTaskTitle}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudentForDossier(student);
                              setDossierTab('summary');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700/60"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Досье</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUPABASE & SQL INTEGRATION */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Интеграция с бэкендом Supabase</h2>
                  <p className="text-xs text-slate-400">
                    Статус клиента, конфигурация RLS и готовый SQL-скрипт инициализации.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  isSupabaseConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {isSupabaseConnected ? 'Supabase подключен' : 'Локальный режим (Mock State)'}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[11px]">1</span>
                <h4 className="font-semibold text-white">Создайте проект в Supabase</h4>
                <p className="text-slate-400">Зайдите на supabase.com, создайте новый бесплатный проект (например, "syntaxlab-classroom").</p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[11px]">2</span>
                <h4 className="font-semibold text-white">Запустите SQL-скрипт</h4>
                <p className="text-slate-400">Откройте <strong>SQL Editor</strong> в панели Supabase, скопируйте скрипт ниже и нажмите <strong>Run</strong>.</p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[11px]">3</span>
                <h4 className="font-semibold text-white">Укажите ключи в .env</h4>
                <p className="text-slate-400">Вставьте Project URL и anon public key в файл <code>.env</code> в корне проекта.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    SQL-скрипт исправления доступа и подтверждения студентов (RLS + RPC):
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Создает безопасные функции approve_student/reject_student и настраивает RLS политики для преподавателя.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyFixSqlToClipboard}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-emerald-600/30 transition-all shrink-0"
                  >
                    {fixSqlCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{fixSqlCopied ? 'Скопировано!' : 'Скопировать SQL-фикс'}</span>
                  </button>
                </div>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-300/90 overflow-x-auto max-h-72">
{FIX_SQL_SCRIPT}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEND HINT / HELP TO STUCK STUDENT */}
      {selectedStudentForHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <img
                  src={selectedStudentForHelp.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedStudentForHelp.fullName}</h3>
                  <p className="text-xs text-slate-400">{selectedStudentForHelp.groupName} • {selectedStudentForHelp.currentTaskTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForHelp(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {selectedStudentForHelp.helpMessage && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200">
                <span className="font-semibold block text-[10px] text-amber-400 uppercase tracking-wide">
                  Вопрос студента:
                </span>
                "{selectedStudentForHelp.helpMessage}"
              </div>
            )}

            <form onSubmit={handleSendHint} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Ваша персональная подсказка / подсказка по синтаксису:
              </label>
              <textarea
                rows={3}
                value={helpCommentInput}
                onChange={(e) => setHelpCommentInput(e.target.value)}
                placeholder="Например: 'Вспомни, что при делении 7 / 2 оба операнда целые. Добавь (double)a или используй 2.0!'"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentForHelp(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!helpCommentInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Отправить студенту</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW TASK */}
      {isAddingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                Добавление задания в курс C#
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Урок для добавления:</label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {course?.modules.flatMap(m => m.lessons).map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Название задания:</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Например: 'Вычисление факториала через цикл'"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Тип задания:</label>
                  <select
                    value={newTaskType}
                    onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="code_challenge">Код (Code Challenge)</option>
                    <option value="spot_bug">Поиск ошибки (Bug Hunt)</option>
                    <option value="quiz">Тест с выбором ответа</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Награда (XP):</label>
                  <input
                    type="number"
                    value={newTaskXp}
                    onChange={(e) => setNewTaskXp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Инструкция для студента:</label>
                <textarea
                  rows={2}
                  required
                  value={newTaskInstructions}
                  onChange={(e) => setNewTaskInstructions(e.target.value)}
                  placeholder="Опишите, что программа должна сделать и какой результат вывести..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Стартовый шаблон C# кода:</label>
                <textarea
                  rows={4}
                  value={newTaskStarterCode}
                  onChange={(e) => setNewTaskStarterCode(e.target.value)}
                  className="w-full font-mono bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddingTask(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/30"
                >
                  Сохранить задание
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COMPREHENSIVE STUDENT DOSSIER & PROCTORING AUDIT */}
      {selectedStudentForDossier && (() => {
        const student = selectedStudentForDossier;
        const honesty = calculateHonesty(student);
        const totalAwayMin = Math.floor((student.totalAwaySeconds || 0) / 60);
        const totalAwaySec = (student.totalAwaySeconds || 0) % 60;
        const successRate = student.totalAttemptsCount && student.totalAttemptsCount > 0
          ? Math.round(((student.completedTasksCount || 0) / student.totalAttemptsCount) * 100)
          : (student.completedTasksCount || 0) > 0 ? 100 : 0;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full my-auto shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
              
              {/* Dossier Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                      alt=""
                      className="w-12 h-12 rounded-2xl ring-2 ring-slate-700 object-cover shadow-md"
                    />
                    {student.isCurrentlyAway ? (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-900" title="Вне вкладки" />
                    ) : (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" title="В активном окне" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{student.fullName}</h2>
                      <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold bg-slate-800 text-indigo-400 border border-slate-700">
                        {student.groupName}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono">{student.email}</span>
                      <span>•</span>
                      <span>Рубеж: <strong className="text-slate-300">{student.currentTaskTitle}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {student.isCurrentlyAway ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 animate-pulse">
                      <Laptop className="w-3.5 h-3.5" />
                      Свернул окно задания
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Активен в окне кода
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedStudentForDossier(null)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition-all ml-2"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Dossier Tabs Navigation */}
              <div className="px-5 pt-3 bg-slate-950/40 border-b border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDossierTab('summary')}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-semibold transition-all ${
                    dossierTab === 'summary'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Сводка & Античит</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDossierTab('timeline')}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-semibold transition-all ${
                    dossierTab === 'timeline'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Хроника действий ({student.eventsLog?.length || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDossierTab('code')}
                  className={`flex items-center gap-2 px-4 py-2 border-b-2 text-xs font-semibold transition-all ${
                    dossierTab === 'code'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Код & Ошибки компилятора</span>
                </button>
              </div>

              {/* Dossier Content Body */}
              <div className="flex-1 p-5 overflow-y-auto space-y-5">
                
                {/* TAB 1: SUMMARY & PROCTORING */}
                {dossierTab === 'summary' && (
                  <div className="space-y-5">
                    
                    {/* Top 6 KPI Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Сделано заданий</span>
                        <p className="text-xl font-mono font-bold text-emerald-400">+{student.completedTasksCount || 0}</p>
                        <span className="text-[10px] text-slate-400 block font-sans">Практика C#</span>
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Ошибок в коде</span>
                        <p className={`text-xl font-mono font-bold ${(student.totalErrorsCount || 0) > 3 ? 'text-rose-400' : (student.totalErrorsCount || 0) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                          {student.totalErrorsCount || 0}
                        </p>
                        <span className="text-[10px] text-slate-400 block font-sans">Сбоев и тестов</span>
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Всего попыток</span>
                        <p className="text-xl font-mono font-bold text-slate-200">{student.totalAttemptsCount || 1}</p>
                        <span className="text-[10px] text-slate-400 block font-sans">{successRate}% успешных</span>
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Смен окон</span>
                        <p className={`text-xl font-mono font-bold ${(student.tabSwitchCount || 0) > 3 ? 'text-rose-400' : (student.tabSwitchCount || 0) > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                          {student.tabSwitchCount || 0}
                        </p>
                        <span className="text-[10px] text-slate-400 block font-sans">Alt+Tab / вкладки</span>
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Вне вкладки</span>
                        <p className="text-xl font-mono font-bold text-indigo-300">
                          {totalAwayMin > 0 ? `${totalAwayMin}м ${totalAwaySec}с` : `${totalAwaySec}с`}
                        </p>
                        <span className="text-[10px] text-slate-400 block font-sans">Суммарный уход</span>
                      </div>

                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Вставок кода</span>
                        <p className="text-xl font-mono font-bold text-purple-300">{student.pasteCount || 0}</p>
                        <span className="text-[10px] text-slate-400 block font-sans">{student.pastedCharsTotal || 0} симв.</span>
                      </div>
                    </div>

                    {/* Anti-cheat & Honesty Detailed Assessment */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            {honesty.score >= 85 ? (
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ShieldAlert className="w-4 h-4 text-amber-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>Индекс академической честности (Anti-Cheat Index)</span>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${honesty.color}`}>
                                {honesty.score}% • {honesty.badgeText}
                              </span>
                            </h3>
                            <p className="text-xs text-slate-400">
                              Автоматический расчет на основе смены фокуса браузера, частоты вставок из буфера и времени отсутствия.
                            </p>
                          </div>
                        </div>

                        <div className="text-right sm:shrink-0 font-mono">
                          <span className="text-2xl font-bold text-white">{honesty.score}</span>
                          <span className="text-slate-400 text-xs">/100</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              honesty.score >= 85
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : honesty.score >= 60
                                ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                : 'bg-gradient-to-r from-red-600 to-rose-400'
                            }`}
                            style={{ width: `${honesty.score}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                          <span>0% (Критический риск списывания)</span>
                          <span>60% (Порог контроля)</span>
                          <span>100% (Полная самостоятельность)</span>
                        </div>
                      </div>

                      {/* Detailed Factor Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs">
                        <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
                          <span className="font-semibold text-slate-300 block">Переключение окон:</span>
                          <p className="text-slate-400 leading-relaxed text-[11px]">
                            {student.tabSwitchCount && student.tabSwitchCount > 0 ? (
                              <span>Студент покидал вкладку задания <strong>{student.tabSwitchCount} раз</strong>. Снижение рейтинга: -{student.tabSwitchCount * 4}%.</span>
                            ) : (
                              <span className="text-emerald-400">Окно не сворачивалось во время работы над заданием.</span>
                            )}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
                          <span className="font-semibold text-slate-300 block">Вставки из буфера обмена:</span>
                          <p className="text-slate-400 leading-relaxed text-[11px]">
                            {student.pasteCount && student.pasteCount > 0 ? (
                              <span>Зафиксировано <strong>{student.pasteCount} вставок</strong> (всего {student.pastedCharsTotal || 0} симв.). Снижение: -{student.pasteCount * 6}%.</span>
                            ) : (
                              <span className="text-emerald-400">Код вводился вручную без вставки из буфера.</span>
                            )}
                          </p>
                        </div>

                        <div className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl space-y-1">
                          <span className="font-semibold text-slate-300 block">Время в фоне:</span>
                          <p className="text-slate-400 leading-relaxed text-[11px]">
                            {student.totalAwaySeconds && student.totalAwaySeconds > 10 ? (
                              <span>Суммарно провел вне вкладки <strong>{totalAwayMin}м {totalAwaySec}с</strong>.</span>
                            ) : (
                              <span className="text-emerald-400">Постоянно находился в активном фокусе.</span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Current Task Progress Box */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Текущая задача студента:</span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{student.currentTaskTitle}</h4>
                        <p className="text-indigo-400 text-xs mt-0.5">{student.currentLessonTitle || 'Модуль C# Основы'}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-slate-400 text-[11px] block">Попыток на шаге:</span>
                          <span className="font-mono font-bold text-slate-200">{student.attemptsOnCurrentTask || 1}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-800" />
                        <div className="text-right">
                          <span className="text-slate-400 text-[11px] block">Всего опыта:</span>
                          <span className="font-mono font-bold text-amber-400">+{student.totalXp} XP</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* TAB 2: TIMELINE AUDIT LOG */}
                {dossierTab === 'timeline' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Посекундная хроника событий (Телеметрия)
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          События регистрируются локальным хуком прокторинга при любом действии студента.
                        </p>
                      </div>
                      <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                        Всего записей: {student.eventsLog?.length || 0}
                      </span>
                    </div>

                    {!student.eventsLog || student.eventsLog.length === 0 ? (
                      <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80 space-y-2">
                        <History className="w-8 h-8 mx-auto text-slate-600" />
                        <p className="text-xs text-slate-400">События пока не зарегистрированы для этой сессии.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 font-sans">
                        {student.eventsLog.map((ev, idx) => {
                          const timeStr = ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Недавно';
                          const isAway = ev.type === 'tab_switch_away' || ev.type === 'window_blur';
                          const isBack = ev.type === 'tab_switch_back' || ev.type === 'window_focus';
                          const isPaste = ev.type === 'code_paste';
                          const isError = ev.type === 'code_error' || ev.type === 'quiz_error' || ev.type === 'error';

                          return (
                            <div
                              key={ev.id || idx}
                              className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                                isAway
                                  ? 'bg-rose-950/20 border-rose-500/30'
                                  : isBack
                                  ? 'bg-indigo-950/20 border-indigo-500/30'
                                  : isPaste
                                  ? 'bg-purple-950/20 border-purple-500/30'
                                  : isError
                                  ? 'bg-amber-950/20 border-amber-500/30'
                                  : 'bg-emerald-950/20 border-emerald-500/30'
                              }`}
                            >
                              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                                {isAway ? (
                                  <Laptop className="w-4 h-4 text-rose-400" />
                                ) : isBack ? (
                                  <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                                ) : isPaste ? (
                                  <FileCode className="w-4 h-4 text-purple-400" />
                                ) : isError ? (
                                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <Award className="w-4 h-4 text-emerald-400" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-xs font-bold ${
                                    isAway
                                      ? 'text-rose-300'
                                      : isBack
                                      ? 'text-indigo-300'
                                      : isPaste
                                      ? 'text-purple-300'
                                      : isError
                                      ? 'text-amber-300'
                                      : 'text-emerald-300'
                                  }`}>
                                    {isAway
                                      ? 'Сворачивание окна / Переключение вкладки'
                                      : isBack
                                      ? 'Возврат в окно задания'
                                      : isPaste
                                      ? 'Вставка фрагмента кода из буфера обмена'
                                      : isError
                                      ? 'Ошибка компиляции или непройденный тест'
                                      : 'Успешная сдача и компиляция задания'}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-500 shrink-0">{timeStr}</span>
                                </div>

                                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{ev.details}</p>

                                {ev.errorMessage && (
                                  <pre className="mt-1.5 p-2 bg-slate-950 rounded border border-rose-500/30 text-rose-300 font-mono text-[11px] overflow-x-auto">
                                    {ev.errorMessage}
                                  </pre>
                                )}

                                {ev.taskTitle && (
                                  <span className="inline-block mt-1 text-[10px] text-slate-500 font-mono">
                                    Задание: {ev.taskTitle}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: CODE SNIPPET & COMPILER DIAGNOSTICS */}
                {dossierTab === 'code' && (
                  <div className="space-y-4">
                    {/* Compiler Error Diagnostics Callout */}
                    {student.lastErrorMessage && (
                      <div className="p-4 bg-rose-950/40 border border-rose-500/40 rounded-xl space-y-1.5 shadow-lg">
                        <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>Диагностика последней ошибки компилятора (.NET / Roslyn):</span>
                        </div>
                        <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-rose-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                          {student.lastErrorMessage}
                        </pre>
                      </div>
                    )}

                    {/* Student Code Box */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                          <FileCode className="w-4 h-4 text-indigo-400" />
                          <span>Последний запущенный / вставленный код (Program.cs):</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500">C# .NET 9</span>
                      </div>

                      {student.lastCodeSnippet ? (
                        <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden font-mono text-xs">
                          <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
                            <span>Program.cs</span>
                            <span>{student.lastCodeSnippet.split('\n').length} строк</span>
                          </div>
                          <div className="p-4 overflow-x-auto flex gap-3 text-slate-200">
                            <div className="select-none text-right text-slate-600 font-mono text-xs pt-0.5 leading-relaxed shrink-0 pr-2 border-r border-slate-800">
                              {student.lastCodeSnippet.split('\n').map((_, i) => (
                                <div key={i}>{i + 1}</div>
                              ))}
                            </div>
                            <pre className="font-mono text-xs leading-relaxed whitespace-pre text-indigo-300">
                              {student.lastCodeSnippet}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                          <FileCode className="w-8 h-8 mx-auto text-slate-600" />
                          <p className="text-xs text-slate-400">Студент еще не компилировал и не вставлял код в текущей сессии.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Dossier Footer Actions */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  <span>Последняя активность: <strong className="text-slate-200 font-mono">{student.lastActive || 'В сети'}</strong></span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentForDossier(null);
                      setSelectedStudentForHelp(student);
                      setHelpCommentInput(student.helpMessage ? `Подсказка: ` : '');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Отправить подсказку</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStudentForDossier(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
                  >
                    Закрыть
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};
