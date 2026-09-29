import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { ClassroomStudentState } from '../../context/AppContext';
import type { Task, TaskType } from '../../types';
import {
  loadAcademicGroups,
  createAcademicGroup,
  deleteAcademicGroup,
  loadAllStudentsForTeacher,
  updateAndApproveStudentProfile
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
  Flame,
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
  GraduationCap
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    studentsInClass,
    course,
    sendHelpResponse,
    clearStuckStatus,
    addNewTask,
    broadcastMessage,
    setBroadcastMessage,
    isSupabaseConnected
  } = useApp();

  const [activeTab, setActiveTab] = useState<'radar' | 'students' | 'curriculum' | 'gradebook' | 'database'>('radar');
  const [selectedStudentForHelp, setSelectedStudentForHelp] = useState<ClassroomStudentState | null>(null);
  const [helpCommentInput, setHelpCommentInput] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [sqlCopied, setSqlCopied] = useState(false);

  // Groups and Students Moderation state
  const [academicGroups, setAcademicGroups] = useState<string[]>(['ИТ-301', 'ИТ-302', 'ПИ-201']);
  const [newGroupInput, setNewGroupInput] = useState('');
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [isProcessingStudent, setIsProcessingStudent] = useState(false);

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

  // New task modal
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string>(course?.modules[0]?.lessons[0]?.id || '');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskType, setNewTaskType] = useState<TaskType>('code_challenge');
  const [newTaskInstructions, setNewTaskInstructions] = useState('');
  const [newTaskStarterCode, setNewTaskStarterCode] = useState('using System;\n\nclass Program\n{\n    static void Main()\n    {\n        // Ваш код здесь\n    }\n}');
  const [newTaskXp, setNewTaskXp] = useState(30);

  const stuckStudents = studentsInClass.filter(s => s.status === 'stuck' || s.needsHelp);
  const pendingStudents = allStudents.filter(s => !s.is_approved);

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
    await updateAndApproveStudentProfile(studentId, fullName, groupName, true);
    await refreshStudentsAndGroups();
    setIsProcessingStudent(false);
  };

  const handleRejectStudent = async (studentId: string) => {
    if (confirm('Отклонить заявку студента? Ему потребуется отправить заявку заново.')) {
      setIsProcessingStudent(true);
      await updateAndApproveStudentProfile(studentId, 'Не подтвержден', '', false);
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
    await updateAndApproveStudentProfile(
      editingStudent.id,
      editFullName.trim(),
      editGroupName,
      editingStudent.is_approved
    );
    setEditingStudent(null);
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

  const copySqlToClipboard = () => {
    const sqlText = `-- Supabase Schema for SyntaxLab
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('teacher', 'student')),
  group_name text default 'ИТ-301',
  total_xp integer default 0
);
-- Включить Realtime
alter publication supabase_realtime add table public.classroom_sessions;`;

    navigator.clipboard.writeText(sqlText);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Студентов в аудитории</p>
                <p className="text-2xl font-bold text-white mt-1">{studentsInClass.length}</p>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Группа ИТ-301
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Требуют внимания / Застряли</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{stuckStudents.length}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {stuckStudents.length > 0 ? 'Нужна подсказка преподавателя' : 'Все справляются сами'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Средний прогресс группы</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">68%</p>
                <p className="text-[11px] text-slate-400 mt-1">Модуль 2: Управляющие конструкции</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Сложный рубеж пары</p>
                <p className="text-sm font-semibold text-purple-300 mt-1 truncate max-w-[150px]">
                  Целочисленное деление
                </p>
                <p className="text-[11px] text-purple-400 mt-1">В среднем 2.8 попытки</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <FileCode className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* The Live Matrix of Students */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Мониторинг аудитории (Парты / Рабочие места)</span>
                <span className="text-xs font-mono font-normal text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Live sync
                </span>
              </h2>
              <span className="text-xs text-slate-400">
                Кликните на студента, чтобы отправить персональную подсказку
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentsInClass.length === 0 ? (
                <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Аудиторный радар активен (Ожидание студентов)</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Когда студенты группы <strong>ИТ-301</strong> войдут через свой GitHub и откроют практические задания, их карточки с кодом, таймером и статусом появятся здесь автоматически в реальном времени.
                  </p>
                </div>
              ) : (
                studentsInClass.map((student) => {
                  const isStuck = student.status === 'stuck' || student.needsHelp;
                  const isCompleted = student.status === 'completed_step';

                  return (
                    <div
                      key={student.id}
                      className={`relative rounded-xl border p-4 transition-all duration-200 ${
                        isStuck
                          ? 'bg-amber-950/20 border-amber-500/40 shadow-lg shadow-amber-500/10'
                          : isCompleted
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                    {/* Status Badge Tag */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                          alt={student.fullName}
                          className="w-9 h-9 rounded-full ring-2 ring-slate-700 object-cover"
                        />
                        <div>
                          <h3 className="text-sm font-semibold text-white leading-tight">{student.fullName}</h3>
                          <span className="text-[11px] text-slate-400">{student.groupName}</span>
                        </div>
                      </div>

                      {isStuck ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          {student.needsHelp ? 'Поднял руку!' : 'Застрял'}
                        </span>
                      ) : isCompleted ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Сдал шаг
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          В коде
                        </span>
                      )}
                    </div>

                    {/* Current Task Info */}
                    <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/60 space-y-1.5">
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Текущее задание:</span>
                        <span className="font-mono text-slate-300">
                          {student.attemptsOnCurrentTask > 0 ? `${student.attemptsOnCurrentTask} попытки` : '1 попытка'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {student.currentTaskTitle}
                      </p>
                      <p className="text-[11px] text-indigo-400">
                        {student.currentLessonTitle}
                      </p>
                    </div>

                    {/* Student Request Message if stuck */}
                    {student.helpMessage && (
                      <div className="mt-2.5 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-200">
                        <span className="font-semibold block text-[10px] text-amber-400 uppercase tracking-wide">
                          Вопрос студента:
                        </span>
                        "{student.helpMessage}"
                      </div>
                    )}

                    {/* Teacher's sent comment preview */}
                    {student.teacherComment && (
                      <div className="mt-2.5 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-300">
                        <span className="font-semibold block text-[10px] text-indigo-400 uppercase tracking-wide">
                          Ваша подсказка:
                        </span>
                        "{student.teacherComment}"
                      </div>
                    )}

                    {/* Quick Action Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>{student.totalXp} XP</span>
                      </div>

                      <div className="flex items-center gap-1.5">
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

            {/* Existing groups list */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              {academicGroups.map((group) => {
                const countInGroup = allStudents.filter(s => s.group_name === group && s.is_approved).length;

                return (
                  <div
                    key={group}
                    className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-xs"
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-400" />
                    <span className="font-bold text-white font-mono">{group}</span>
                    <span className="text-slate-500 text-[11px]">({countInGroup} студ.)</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group)}
                      title="Удалить группу"
                      className="text-slate-500 hover:text-red-400 transition-colors ml-1 p-0.5 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                  <option value="all">Все группы ({allStudents.filter(s => s.is_approved).length})</option>
                  {academicGroups.map((g) => (
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
                    <th className="px-4 py-3">GitHub Email</th>
                    <th className="px-4 py-3">Опыт (XP)</th>
                    <th className="px-4 py-3 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                  {allStudents
                    .filter(s => s.is_approved && (filterGroup === 'all' || s.group_name === filterGroup))
                    .map((student) => (
                      <tr key={student.id} className="hover:bg-slate-950/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-white flex items-center gap-2.5">
                          <img
                            src={student.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <span>{student.full_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-slate-800 text-indigo-400 rounded font-mono font-medium">
                            {student.group_name || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-400">{student.email}</td>
                        <td className="px-4 py-3 font-bold text-amber-400 font-mono">{student.total_xp || 0} XP</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEditStudent(student)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                          >
                            <Edit2 className="w-3 h-3 text-indigo-400" />
                            <span>Редактировать</span>
                          </button>
                        </td>
                      </tr>
                    ))}
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
                  {academicGroups.map((g) => (
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
                  <span className="text-xs text-slate-400 font-mono">
                    {mod.lessons.length} {mod.lessons.length === 1 ? 'урок' : 'урока'}
                  </span>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Журнал успеваемости группы ИТ-301</h2>
              <p className="text-xs text-slate-400">
                Сводные показатели, набранные баллы (XP), количество попыток и активность.
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert('Экспорт ведомости в формате CSV / Excel сформирован')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-all"
            >
              Экспорт ведомости (CSV)
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Студент</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Серия дней</th>
                  <th className="px-4 py-3">Всего XP</th>
                  <th className="px-4 py-3">Текущий рубеж</th>
                  <th className="px-4 py-3">Статус в аудитории</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {studentsInClass.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-950/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                      <img
                        src={student.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      {student.fullName}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{student.email}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        {student.streakDays} дн.
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-white">{student.totalXp} XP</td>
                    <td className="px-4 py-3 text-slate-300">{student.currentTaskTitle}</td>
                    <td className="px-4 py-3">
                      {student.status === 'stuck' ? (
                        <span className="text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          Застрял ({student.attemptsOnCurrentTask} поп.)
                        </span>
                      ) : student.status === 'completed_step' ? (
                        <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Сдал последний шаг
                        </span>
                      ) : (
                        <span className="text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                          В процессе
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Полный SQL-скрипт схемы, RLS и C# заданий:
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copySqlToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-600/30 transition-all"
                  >
                    {sqlCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{sqlCopied ? 'Скопировано!' : 'Скопировать полный SQL'}</span>
                  </button>
                </div>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 overflow-x-auto max-h-60">
{`-- Создание таблиц платформы SyntaxLab
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('teacher', 'student')),
  group_name text default 'ИТ-301',
  total_xp integer default 0
);

create table if not exists public.classroom_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  group_name text not null,
  active_task_id text,
  status text not null check (status in ('active', 'stuck', 'completed_step', 'idle')),
  needs_help boolean default false,
  help_message text
);

alter publication supabase_realtime add table public.classroom_sessions;`}
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

    </div>
  );
};
