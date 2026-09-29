import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Course, UserProfile, UserRole, Task } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  loadCourseFromSupabase,
  loadClassroomSessionsFromDb,
  subscribeToClassroomRealtime,
  saveProgressToDb,
  updateSessionInDb,
  sendTeacherHintToDb,
  loadGroupCourseAccess,
  toggleGroupCourseAccess
} from '../services/supabaseService';

export interface CourseMeta {
  id: string;
  title: string;
  description: string;
  badge: string;
}

export const ALL_COURSES: CourseMeta[] = [
  {
    id: 'csharp-foundations',
    title: 'C# Pro (.NET 8)',
    description: 'Академический курс: синтаксис, типы данных, ООП, коллекции и LINQ',
    badge: 'C# 12'
  },
  {
    id: 'git-branching',
    title: 'Git Branching Lab',
    description: 'Интерактивный тренажер по ветвлению, слиянию, rebase и cherry-pick',
    badge: 'Git DAG'
  }
];

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
  setCurrentUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  role: UserRole;
  setRole: (role: UserRole) => void;
  course: Course | null;
  studentsInClass: ClassroomStudentState[];
  selectedStudentId: string;
  setSelectedStudentId: (id: string) => void;

  // Course Access & Switching
  activeCourseId: string;
  setActiveCourseId: (id: string) => void;
  availableCourses: CourseMeta[];
  groupCourseAccess: Record<string, string[]>;
  toggleCourseForGroup: (groupName: string, courseId: string, enabled: boolean) => Promise<void>;
  userAllowedCourses: CourseMeta[];
  
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

const TEACHER_GITHUB_LOGINS = ['kos108568-sys', 'kos108568'];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>('student');
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Active course and group access state
  const [activeCourseId, setActiveCourseId] = useState<string>('csharp-foundations');
  const [groupCourseAccess, setGroupCourseAccess] = useState<Record<string, string[]>>({
    'ИТ-301': ['csharp-foundations', 'git-branching'],
    'ИТ-302': ['csharp-foundations'],
    'ПИ-201': ['csharp-foundations', 'git-branching']
  });

  const [course, setCourse] = useState<Course | null>(null);
  const [studentsInClass, setStudentsInClass] = useState<ClassroomStudentState[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);

  // Toggle course access per group
  const toggleCourseForGroup = async (groupName: string, courseId: string, enabled: boolean) => {
    setGroupCourseAccess(prev => {
      const current = prev[groupName] || [];
      const updated = enabled 
        ? (current.includes(courseId) ? current : [...current, courseId])
        : current.filter(id => id !== courseId);
      return { ...prev, [groupName]: updated };
    });
    await toggleGroupCourseAccess(groupName, courseId, enabled);
  };

  // Determine allowed courses for current user
  const userAllowedCourses = useMemo(() => {
    if (role === 'teacher' || currentUser?.role === 'teacher') {
      return ALL_COURSES;
    }
    const studentGroup = currentUser?.groupName || '';
    const allowedIds = groupCourseAccess[studentGroup] || [];
    return ALL_COURSES.filter(c => allowedIds.includes(c.id));
  }, [role, currentUser, groupCourseAccess]);

  // Auto-switch to an allowed course if current activeCourseId is not permitted for the student
  useEffect(() => {
    if (userAllowedCourses.length > 0 && !userAllowedCourses.some(c => c.id === activeCourseId)) {
      setActiveCourseId(userAllowedCourses[0].id);
    }
  }, [userAllowedCourses, activeCourseId]);

  // 1. Загрузка профиля пользователя из Supabase
  const syncUserProfile = useCallback(async (user: User) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      const githubMetadata = user.user_metadata || {};
      const githubLogin = (githubMetadata.user_name || githubMetadata.preferred_username || '').toLowerCase();
      const isTeacher = TEACHER_GITHUB_LOGINS.includes(githubLogin);
      
      const fullName = githubMetadata.full_name || githubMetadata.user_name || user.email?.split('@')[0] || 'Студент';
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
          groupName: isTeacher ? 'Преподавательский состав' : '',
          isApproved: isTeacher ? true : false,
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
          group_name: isTeacher ? 'Преподавательский состав' : null,
          is_approved: isTeacher ? true : false
        });

        setCurrentUser(newProfile);
        setRole(resolvedRole);
      } else {
        // Если пользователь преподаватель, но в БД еще значился студентом — обновляем в БД
        if (isTeacher && data.role !== 'teacher') {
          await supabase.from('profiles').update({ role: 'teacher', is_approved: true }).eq('id', user.id);
        }

        const existingProfile: UserProfile = {
          id: data.id,
          email: data.email,
          fullName: data.full_name || fullName,
          avatarUrl: data.avatar_url || avatarUrl,
          role: resolvedRole,
          groupName: data.group_name || (isTeacher ? 'Преподавательский состав' : ''),
          isApproved: isTeacher ? true : (data.is_approved ?? false),
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
  }, []);

  // 2. Загрузка данных курса и прогресса из базы
  const reloadFromDb = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const dbCourse = await loadCourseFromSupabase('csharp-foundations');
      if (dbCourse) {
        setCourse(dbCourse);
      }

      const dbSessions = await loadClassroomSessionsFromDb('ИТ-301');
      setStudentsInClass(dbSessions);

      // Проверяем актуальный статус профиля (например, подтверждение учителем или смену имени)
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      const activeUserId = activeSession?.user?.id;
      if (activeUserId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', activeUserId)
          .maybeSingle();

        if (prof) {
          const githubLogin = (activeSession?.user?.user_metadata?.user_name || activeSession?.user?.user_metadata?.preferred_username || '').toLowerCase();
          const isTeacher = TEACHER_GITHUB_LOGINS.includes(githubLogin);
          setCurrentUser(prev => ({
            id: prof.id,
            email: prof.email || prev?.email || '',
            fullName: prof.full_name || prev?.fullName || '',
            avatarUrl: prof.avatar_url || prev?.avatarUrl,
            role: isTeacher ? 'teacher' : ((prof.role as UserRole) || 'student'),
            groupName: prof.group_name || (isTeacher ? 'Преподавательский состав' : ''),
            isApproved: isTeacher ? true : (prof.is_approved ?? false),
            currentStreakDays: prof.streak_days || 1,
            totalXp: prof.total_xp || 0,
            isOnline: true
          }));
        }
      }

      // Загрузка решенных задач для текущего пользователя
      if (activeUserId) {
        const { data: progressData } = await supabase
          .from('student_progress')
          .select('task_id')
          .eq('user_id', activeUserId)
          .eq('status', 'completed');

        if (progressData) {
          setCompletedTaskIds(progressData.map(p => p.task_id));
        }
      }

      // Загрузка прав доступа групп к курсам
      const groupAccess = await loadGroupCourseAccess();
      if (groupAccess && Object.keys(groupAccess).length > 0) {
        setGroupCourseAccess(groupAccess);
      }
    } catch (err) {
      console.error('Error loading data from Supabase:', err);
    }
  }, []);

  // 3. Отслеживание авторизации Supabase (GitHub OAuth)
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setSession(session);
        if (session?.user) {
          await syncUserProfile(session.user);
          await reloadFromDb();
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        if (isMounted) {
          setIsLoadingAuth(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      if (event === 'INITIAL_SESSION') return;

      setSession(newSession);
      if (newSession?.user) {
        setIsLoadingAuth(true);
        await syncUserProfile(newSession.user);
        await reloadFromDb();
        if (isMounted) setIsLoadingAuth(false);
      } else {
        setCurrentUser(null);
        if (isMounted) setIsLoadingAuth(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [syncUserProfile, reloadFromDb]);

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
  }, [session, reloadFromDb]);

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
        setCurrentUser,
        role,
        setRole,
        course,
        studentsInClass,
        selectedStudentId,
        setSelectedStudentId,
        activeCourseId,
        setActiveCourseId,
        availableCourses: ALL_COURSES,
        groupCourseAccess,
        toggleCourseForGroup,
        userAllowedCourses,
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
