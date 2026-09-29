import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Course, UserProfile, UserRole, Task } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  loadCourseFromSupabase,
  loadClassroomSessionsFromDb,
  subscribeToClassroomRealtime,
  saveProgressToDb,
  updateSessionInDb,
  sendTeacherHintToDb
} from '../services/supabaseService';

export interface ClassroomStudentState {
  id: string;
  fullName: string;
  avatarUrl?: string;
  email: string;
  groupName: string;
  currentTaskId: string;
  currentTaskTitle: string;
  currentLessonTitle: string;
  status: 'active' | 'stuck' | 'completed_step' | 'idle';
  attemptsOnCurrentTask: number;
  timeOnCurrentTaskMinutes: number;
  needsHelp: boolean;
  helpMessage?: string;
  totalXp: number;
  streakDays: number;
  lastActive: string;
  teacherComment?: string;
}

interface AppContextType {
  session: Session | null;
  currentUser: UserProfile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  course: Course | null;
  studentsInClass: ClassroomStudentState[];
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;
  
  // Progress
  completedTaskIds: string[];
  completeTask: (taskId: string, xpEarned: number) => void;
  
  // Student Actions
  requestTeacherHelp: (message: string) => void;
  reportTaskAttempt: (taskId: string, success: boolean) => void;
  
  // Teacher Actions
  sendHelpResponse: (studentId: string, comment: string) => void;
  clearStuckStatus: (studentId: string) => void;
  addNewTask: (lessonId: string, task: Task) => void;
  updateCourse: (course: Course) => void;
  broadcastMessage: string | null;
  setBroadcastMessage: (msg: string | null) => void;
  
  // Auth & Stats
  signOut: () => Promise<void>;
  isLoadingAuth: boolean;
  isSupabaseConnected: boolean;
  reloadFromDb: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('student');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [course, setCourse] = useState<Course | null>(null);
  const [studentsInClass, setStudentsInClass] = useState<ClassroomStudentState[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);

  const TEACHER_GITHUB_LOGINS = ['kos108568-sys', 'kos108568'];

  // 1. Загрузка профиля пользователя из Supabase
  const syncUserProfile = async (user: User) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const githubMetadata = user.user_metadata || {};
      const githubLogin = (githubMetadata.user_name || githubMetadata.preferred_username || '').toLowerCase();
      const isTeacher = TEACHER_GITHUB_LOGINS.includes(githubLogin);
      
      const fullName = githubMetadata.full_name || githubMetadata.user_name || user.email?.split('@')[0] || 'Разработчик';
      const avatarUrl = githubMetadata.avatar_url;
      const resolvedRole: UserRole = isTeacher ? 'teacher' : ((data?.role as UserRole) || 'student');

      if (!data) {
        // Создаем профиль в базе данных
        const newProfile: UserProfile = {
          id: user.id,
          email: user.email || '',
          fullName,
          avatarUrl,
          role: resolvedRole,
          groupName: isTeacher ? 'Преподавательский состав' : 'ИТ-301',
          currentStreakDays: 1,
          totalXp: isTeacher ? 1000 : 0,
          isOnline: true
        };

        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          avatar_url: avatarUrl,
          role: resolvedRole,
          groupName: isTeacher ? 'Преподавательский состав' : 'ИТ-301'
        });

        setCurrentUser(newProfile);
        setRole(resolvedRole);
      } else {
        // Если пользователь преподаватель, но в БД еще значился студентом — обновляем в БД
        if (isTeacher && data.role !== 'teacher') {
          await supabase.from('profiles').update({ role: 'teacher' }).eq('id', user.id);
        }

        const existingProfile: UserProfile = {
          id: data.id,
          email: data.email,
          fullName: data.full_name || fullName,
          avatarUrl: data.avatar_url || avatarUrl,
          role: resolvedRole,
          groupName: data.group_name || (isTeacher ? 'Преподавательский состав' : 'ИТ-301'),
          currentStreakDays: data.streak_days || 1,
          totalXp: data.total_xp || 0,
          isOnline: true
        };

        setCurrentUser(existingProfile);
        setRole(resolvedRole);
      }
    } catch (err) {
      console.error('Error syncing profile:', err);
    }
  };

  // 2. Загрузка данных курса и прогресса из базы
  const reloadFromDb = async () => {
    if (!isSupabaseConfigured) return;
    try {
      const dbCourse = await loadCourseFromSupabase('csharp-foundations');
      if (dbCourse) {
        setCourse(dbCourse);
      }

      const dbSessions = await loadClassroomSessionsFromDb('ИТ-301');
      setStudentsInClass(dbSessions);

      // Загрузка решенных задач для текущего пользователя
      if (currentUser?.id) {
        const { data: progressData } = await supabase
          .from('student_progress')
          .select('task_id')
          .eq('user_id', currentUser.id)
          .eq('status', 'completed');

        if (progressData) {
          setCompletedTaskIds(progressData.map(p => p.task_id));
        }
      }
    } catch (err) {
      console.error('Error loading data from Supabase:', err);
    }
  };

  // 3. Отслеживание авторизации Supabase (GitHub OAuth)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        syncUserProfile(session.user).then(() => {
          reloadFromDb();
        });
      }
      setIsLoadingAuth(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        syncUserProfile(session.user).then(() => {
          reloadFromDb();
        });
      } else {
        setCurrentUser(null);
      }
      setIsLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 4. Подписка на Realtime аудиторный радар
  useEffect(() => {
    if (session && isSupabaseConfigured) {
      reloadFromDb();
      const unsubscribe = subscribeToClassroomRealtime('ИТ-301', () => {
        reloadFromDb();
      });
      return () => {
        unsubscribe();
      };
    }
  }, [session]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUser(null);
  };

  const completeTask = (taskId: string, xpEarned: number) => {
    if (!completedTaskIds.includes(taskId)) {
      setCompletedTaskIds(prev => [...prev, taskId]);
    }

    if (currentUser?.id) {
      const activeLesson = course?.modules.flatMap(m => m.lessons).find(l => l.tasks.some(t => t.id === taskId));
      saveProgressToDb(currentUser.id, taskId, activeLesson?.id || '', xpEarned);
      updateSessionInDb(currentUser.id, taskId, 'completed_step', false);
    }
  };

  const reportTaskAttempt = (taskId: string, success: boolean) => {
    if (currentUser?.id) {
      const isStuck = !success;
      updateSessionInDb(currentUser.id, taskId, isStuck ? 'stuck' : 'active', false);
    }
  };

  const requestTeacherHelp = (message: string) => {
    if (currentUser?.id) {
      updateSessionInDb(currentUser.id, currentUser.currentTaskId || 'task-1-1-1', 'stuck', true, message);
    }
  };

  const sendHelpResponse = (studentId: string, comment: string) => {
    sendTeacherHintToDb(studentId, comment);
  };

  const clearStuckStatus = (studentId: string) => {
    updateSessionInDb(studentId, 'task-1-1-1', 'active', false);
  };

  const addNewTask = (lessonId: string, newTask: Task) => {
    if (!course) return;
    setCourse(prev => {
      if (!prev) return null;
      const newModules = prev.modules.map(mod => {
        const newLessons = mod.lessons.map(les => {
          if (les.id === lessonId) {
            return {
              ...les,
              tasks: [...les.tasks, newTask]
            };
          }
          return les;
        });
        return { ...mod, lessons: newLessons };
      });
      return { ...prev, modules: newModules };
    });
  };

  const updateCourse = (newCourse: Course) => {
    setCourse(newCourse);
  };

  return (
    <AppContext.Provider
      value={{
        session,
        currentUser,
        role,
        setRole,
        course,
        studentsInClass,
        selectedStudentId,
        setSelectedStudentId,
        completedTaskIds,
        completeTask,
        requestTeacherHelp,
        reportTaskAttempt,
        sendHelpResponse,
        clearStuckStatus,
        addNewTask,
        updateCourse,
        broadcastMessage,
        setBroadcastMessage,
        signOut,
        isLoadingAuth,
        isSupabaseConnected: isSupabaseConfigured,
        reloadFromDb
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
