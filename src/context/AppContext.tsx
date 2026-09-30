import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Course, UserProfile, UserRole, Task, TelemetryEvent, ClassroomStudentState } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { initialCsharpCourse } from '../data/csharpCourse';
import {
  loadCourseFromSupabase,
  loadClassroomSessionsFromDb,
  subscribeToClassroomRealtime,
  saveProgressToDb,
  updateSessionInDb,
  updateSessionTelemetryInDb,
  sendTeacherHintToDb,
  loadGroupCourseAccess,
  toggleGroupCourseAccess,
  loadGroupModuleAccess,
  toggleGroupModuleAccess,
  toggleAllGroupModules,
  loadActiveAnnouncementFromDb,
  publishClassroomAnnouncement,
  subscribeToAnnouncementsRealtime,
  saveCustomTaskToDb
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

export type { ClassroomStudentState };

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

  // Course & Module Access & Switching
  activeCourseId: string;
  setActiveCourseId: (id: string) => void;
  availableCourses: CourseMeta[];
  groupCourseAccess: Record<string, string[]>;
  toggleCourseForGroup: (groupName: string, courseId: string, enabled: boolean) => Promise<void>;
  groupModuleAccess: Record<string, string[]>;
  toggleModuleForGroup: (groupName: string, moduleId: string, courseId: string, enabled: boolean) => Promise<void>;
  toggleAllModulesForGroup: (groupName: string, courseId: string, moduleIds: string[], enabled: boolean) => Promise<void>;
  userAllowedCourses: CourseMeta[];
  
  // Progress
  completedTaskIds: string[];
  completeTask: (taskId: string, xpEarned: number) => void;
  
  // Student Actions & Telemetry
  requestTeacherHelp: (message: string) => void;
  reportTaskAttempt: (taskId: string, success: boolean) => void;
  recordStudentTelemetry: (event: TelemetryEvent, dataUpdate?: Partial<ClassroomStudentState>) => void;
  
  // Teacher Actions
  sendHelpResponse: (studentId: string, comment: string) => void;
  clearStuckStatus: (studentId: string) => void;
  addNewTask: (lessonId: string, task: Task) => void;
  updateCourse: (course: Course) => void;
  broadcastMessage: string | null;
  setBroadcastMessage: (msg: string | null) => void;
  sendBroadcastMessage: (msg: string, targetGroup?: string) => Promise<boolean>;
  
  // Auth & Stats
  signOut: () => Promise<void>;
  isLoadingAuth: boolean;
  isSupabaseConnected: boolean;
  reloadFromDb: (explicitUserId?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const TEACHER_GITHUB_LOGINS = ['kos108568-sys', 'kos108568'];

export const hasStoredAuthToken = (): boolean => {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        (key.startsWith('sb-') && key.endsWith('-auth-token')) ||
        key === 'supabase.auth.token' ||
        key.includes('auth-token')
      )) {
        const raw = localStorage.getItem(key);
        if (raw && (raw.includes('access_token') || raw.includes('currentSession'))) {
          return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
};

const DEFAULT_GROUP_ACCESS: Record<string, string[]> = {
  'ИТ-301': ['csharp-foundations', 'git-branching'],
  'ИТ-302': ['csharp-foundations'],
  'ПИ-201': ['csharp-foundations', 'git-branching'],
  'ПО-43': ['git-branching', 'csharp-foundations']
};

export const ALL_MODULE_IDS = [
  'mod-1',
  'mod-2',
  'mod-3',
  'mod-4',
  'mod-5',
  'mod-6',
  'mod-7',
  'mod-8'
];

const DEFAULT_GROUP_MODULE_ACCESS: Record<string, string[]> = {
  'ИТ-301': [...ALL_MODULE_IDS],
  'ИТ-302': ['mod-1', 'mod-2', 'mod-3'],
  'ПИ-201': ['mod-1', 'mod-2'],
  'ПО-43': [...ALL_MODULE_IDS]
};

const getInitialSession = (): Session | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        (key.startsWith('sb-') && key.endsWith('-auth-token')) ||
        key === 'supabase.auth.token' ||
        key.includes('auth-token')
      )) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.access_token || parsed.currentSession?.access_token)) {
            return (parsed.currentSession || parsed) as Session;
          }
        }
      }
    }
  } catch {}
  return null;
};

const getInitialUser = (): UserProfile | null => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem('syntaxlab_cached_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getInitialGroupAccess = (): Record<string, string[]> => {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_GROUP_ACCESS;
  try {
    const raw = localStorage.getItem('syntaxlab_cached_group_access');
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_GROUP_ACCESS;
};

const getInitialGroupModuleAccess = (): Record<string, string[]> => {
  if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_GROUP_MODULE_ACCESS;
  try {
    const raw = localStorage.getItem('syntaxlab_cached_group_module_access');
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_GROUP_MODULE_ACCESS;
};

const getInitialClassroomStudents = (): ClassroomStudentState[] => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = localStorage.getItem('syntaxlab_cached_classroom_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Исключаем старые моковые данные и преподавателя
          const realOnly = parsed.filter((s: any) => 
            s && s.id &&
            !s.id.startsWith('stud-') &&
            s.email !== 'a.smirnov@university.edu' &&
            s.groupName !== 'Преподавательский состав' &&
            !TEACHER_GITHUB_LOGINS.some(t => (s.email || '').toLowerCase().includes(t))
          );
          return realOnly;
        }
      }
    } catch {}
  }
  return [];
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(() => getInitialSession());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getInitialUser());
  const [role, setRole] = useState<UserRole>(() => getInitialUser()?.role || 'student');
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(() => {
    // Если есть токен, но профиль еще ни разу не сохранялся в кэш — короткая начальная загрузка
    const hasToken = hasStoredAuthToken();
    const hasUser = Boolean(getInitialUser());
    return hasToken && !hasUser;
  });

  // Active course and group access state
  const [activeCourseId, setActiveCourseIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('syntaxlab_active_course_id');
      if (saved) return saved;
      const initialUser = getInitialUser();
      if (initialUser?.groupName === 'ПО-43') return 'git-branching';
    } catch {}
    return 'csharp-foundations';
  });

  const setActiveCourseId = useCallback((id: string) => {
    setActiveCourseIdState(id);
    try {
      localStorage.setItem('syntaxlab_active_course_id', id);
    } catch {}
  }, []);

  const [groupCourseAccess, setGroupCourseAccess] = useState<Record<string, string[]>>(() => getInitialGroupAccess());
  const [course, setCourse] = useState<Course | null>(initialCsharpCourse);
  const [studentsInClass, setStudentsInClass] = useState<ClassroomStudentState[]>(() => getInitialClassroomStudents());
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
      const next = { ...prev, [groupName]: updated };
      try {
        localStorage.setItem('syntaxlab_cached_group_access', JSON.stringify(next));
      } catch {}
      return next;
    });
    await toggleGroupCourseAccess(groupName, courseId, enabled);
  };

  const [groupModuleAccess, setGroupModuleAccess] = useState<Record<string, string[]>>(() => getInitialGroupModuleAccess());

  // Toggle module access per group
  const toggleModuleForGroup = async (groupName: string, moduleId: string, courseId: string, enabled: boolean) => {
    setGroupModuleAccess(prev => {
      const current = prev[groupName] || [];
      const updated = enabled 
        ? (current.includes(moduleId) ? current : [...current, moduleId])
        : current.filter(id => id !== moduleId);
      const next = { ...prev, [groupName]: updated };
      try {
        localStorage.setItem('syntaxlab_cached_group_module_access', JSON.stringify(next));
      } catch {}
      return next;
    });
    await toggleGroupModuleAccess(groupName, moduleId, courseId, enabled);
  };

  // Toggle all modules for group
  const toggleAllModulesForGroup = async (groupName: string, courseId: string, moduleIds: string[], enabled: boolean) => {
    setGroupModuleAccess(prev => {
      const current = prev[groupName] || [];
      const updated = enabled
        ? Array.from(new Set([...current, ...moduleIds]))
        : current.filter(id => !moduleIds.includes(id));
      const next = { ...prev, [groupName]: updated };
      try {
        localStorage.setItem('syntaxlab_cached_group_module_access', JSON.stringify(next));
      } catch {}
      return next;
    });
    await toggleAllGroupModules(groupName, courseId, moduleIds, enabled);
  };

  // Determine allowed courses for current user
  const userAllowedCourses = useMemo(() => {
    if (role === 'teacher' || currentUser?.role === 'teacher') {
      return ALL_COURSES;
    }
    const studentGroup = currentUser?.groupName || '';
    if (!studentGroup) return ALL_COURSES;

    // Если для группы права уже загружены или заданы в объекте доступа
    if (studentGroup in groupCourseAccess) {
      const allowedIds = groupCourseAccess[studentGroup] || [];
      // Если все курсы закрыты преподавателем, возвращаем пустой список (доступ закрыт)
      return ALL_COURSES.filter(c => allowedIds.includes(c.id));
    }
    // Если группа новая или права еще не инициализированы
    return ALL_COURSES;
  }, [role, currentUser, groupCourseAccess]);

  // Auto-switch to an allowed course if current activeCourseId is not permitted for the student
  useEffect(() => {
    if (userAllowedCourses.length > 0 && !userAllowedCourses.some(c => c.id === activeCourseId)) {
      setActiveCourseId(userAllowedCourses[0].id);
    }
  }, [userAllowedCourses, activeCourseId, setActiveCourseId]);

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
        try {
          localStorage.setItem('syntaxlab_cached_user', JSON.stringify(newProfile));
        } catch {}
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
        try {
          localStorage.setItem('syntaxlab_cached_user', JSON.stringify(existingProfile));
        } catch {}
      }
    } catch (err) {
      console.error('Error syncing profile:', err);
    }
  }, []);

  // 2. Загрузка данных курса и прогресса из базы
  const reloadFromDb = useCallback(async (explicitUserId?: string) => {
    if (!isSupabaseConfigured) return;
    try {
      let activeUserId = explicitUserId;
      if (!activeUserId) {
        const { data: sessData } = await supabase.auth.getSession();
        activeUserId = sessData.session?.user?.id;
      }

      // Параллельная загрузка всех данных для мгновенного отклика
      const [dbCourse, dbSessions, profRes, progressRes, groupAccess, groupModules] = await Promise.all([
        loadCourseFromSupabase('csharp-foundations').catch(err => {
          console.warn('Error loading course:', err);
          return null;
        }),
        loadClassroomSessionsFromDb().catch(err => {
          console.warn('Error loading sessions:', err);
          return [];
        }),
        activeUserId 
          ? supabase.from('profiles').select('*').eq('id', activeUserId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        activeUserId
          ? supabase.from('student_progress').select('task_id').eq('user_id', activeUserId).eq('status', 'completed')
          : Promise.resolve({ data: null, error: null }),
        loadGroupCourseAccess().catch(err => {
          console.warn('Error loading group access:', err);
          return null;
        }),
        loadGroupModuleAccess().catch(err => {
          console.warn('Error loading group modules:', err);
          return null;
        })
      ]);

      const dbTaskCount = (dbCourse?.modules || []).reduce((acc: number, m: any) => acc + (m.lessons || []).reduce((lacc: number, l: any) => lacc + (l.tasks?.length || 0), 0), 0);
      const localTaskCount = initialCsharpCourse.modules.reduce((acc, m) => acc + m.lessons.reduce((lacc, l) => lacc + l.tasks.length, 0), 0);

      if (dbCourse && dbTaskCount >= localTaskCount) {
        setCourse(dbCourse);
      } else {
        setCourse(initialCsharpCourse);
      }

      if (dbSessions && dbSessions.length > 0) {
        setStudentsInClass(dbSessions.filter(s => 
          !s.id.startsWith('stud-') &&
          s.email !== 'a.smirnov@university.edu' &&
          !TEACHER_GITHUB_LOGINS.some(t => (s.email || '').toLowerCase().includes(t))
        ));
      } else {
        setStudentsInClass(prev => prev.filter(s => 
          !s.id.startsWith('stud-') &&
          s.email !== 'a.smirnov@university.edu' &&
          !TEACHER_GITHUB_LOGINS.some(t => (s.email || '').toLowerCase().includes(t))
        ));
      }

      // Проверяем актуальный статус профиля
      if (profRes && 'data' in profRes && profRes.data) {
        const prof = profRes.data;
        const { data: currentSessData } = await supabase.auth.getSession();
        const githubMetadata = currentSessData.session?.user?.user_metadata || {};
        const githubLogin = (githubMetadata.user_name || githubMetadata.preferred_username || '').toLowerCase();
        const isTeacher = TEACHER_GITHUB_LOGINS.includes(githubLogin);
        const updatedProfile: UserProfile = {
          id: prof.id,
          email: prof.email || currentSessData.session?.user?.email || '',
          fullName: prof.full_name || githubMetadata.full_name || 'Студент',
          avatarUrl: prof.avatar_url || githubMetadata.avatar_url,
          role: isTeacher ? 'teacher' : ((prof.role as UserRole) || 'student'),
          groupName: prof.group_name || (isTeacher ? 'Преподавательский состав' : ''),
          isApproved: isTeacher ? true : (prof.is_approved ?? false),
          currentStreakDays: prof.streak_days || 1,
          totalXp: prof.total_xp || 0,
          isOnline: true
        };
        setCurrentUser(updatedProfile);
        try {
          localStorage.setItem('syntaxlab_cached_user', JSON.stringify(updatedProfile));
        } catch {}
      }

      // Загрузка решенных задач для текущего пользователя
      if (progressRes && 'data' in progressRes && progressRes.data) {
        setCompletedTaskIds(progressRes.data.map((p: any) => p.task_id));
      }

      // Загрузка прав доступа групп к курсам
      if (groupAccess && typeof groupAccess === 'object') {
        setGroupCourseAccess(groupAccess);
        try {
          localStorage.setItem('syntaxlab_cached_group_access', JSON.stringify(groupAccess));
        } catch {}
      }

      // Загрузка прав доступа групп к разделам (модулям)
      if (groupModules && typeof groupModules === 'object') {
        setGroupModuleAccess(groupModules);
        try {
          localStorage.setItem('syntaxlab_cached_group_module_access', JSON.stringify(groupModules));
        } catch {}
      }
    } catch (err) {
      console.error('Error loading data from Supabase:', err);
    }
  }, []);

  // 3. Отслеживание авторизации Supabase (GitHub OAuth)
  useEffect(() => {
    let isMounted = true;
    let authDone = false;

    const finishLoading = () => {
      if (!authDone && isMounted) {
        authDone = true;
        setIsLoadingAuth(false);
      }
    };

    // Гарантированный таймаут разблокировки экрана
    const safetyTimeout = setTimeout(() => {
      finishLoading();
    }, 600);

    const handleAuth = async (currentSession: Session | null) => {
      try {
        setSession(currentSession);
        if (currentSession?.user) {
          // Если профиль уже восстановлен из кэша, разблокируем интерфейс мгновенно
          finishLoading();
          await syncUserProfile(currentSession.user);
          await reloadFromDb(currentSession.user.id);
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Error in handleAuth:', err);
      } finally {
        finishLoading();
      }
    };

    // Проверяем сессию при инициализации
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!isMounted || authDone) return;
      if (initialSession) {
        handleAuth(initialSession);
      } else {
        finishLoading();
      }
    }).catch(err => {
      console.error('Error fetching session:', err);
      finishLoading();
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (event === 'INITIAL_SESSION') {
        if (newSession) {
          await handleAuth(newSession);
        } else {
          finishLoading();
        }
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (newSession) {
          await handleAuth(newSession);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setCurrentUser(null);
        try {
          localStorage.removeItem('syntaxlab_cached_user');
          localStorage.removeItem('syntaxlab_cached_group_access');
          localStorage.removeItem('syntaxlab_active_course_id');
        } catch {}
        finishLoading();
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [syncUserProfile, reloadFromDb]);

  // 4. Подписка на Realtime аудиторный радар
  useEffect(() => {
    if (session && isSupabaseConfigured) {
      const unsubscribe = subscribeToClassroomRealtime('global', () => {
        reloadFromDb();
      });
      return () => {
        unsubscribe();
      };
    }
  }, [session, reloadFromDb]);

  const signOut = async () => {
    try {
      localStorage.removeItem('syntaxlab_cached_user');
      localStorage.removeItem('syntaxlab_cached_group_access');
      localStorage.removeItem('syntaxlab_active_course_id');
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setSession(null);
      setCurrentUser(null);
      setRole('student');
      setIsLoadingAuth(false);
    }
  };

  const completeTask = (taskId: string, xpEarned: number) => {
    const isAlreadyCompleted = completedTaskIds.includes(taskId);
    if (!isAlreadyCompleted) {
      setCompletedTaskIds(prev => [...prev, taskId]);
    }

    if (currentUser?.id && currentUser.role !== 'teacher') {
      let lessonId = course?.modules.flatMap(m => m.lessons).find(l => l.tasks.some(t => t.id === taskId))?.id;
      if (!lessonId && (taskId.startsWith('intro') || taskId.startsWith('ramp') || taskId.startsWith('move') || taskId.startsWith('mixed') || taskId.startsWith('adv') || taskId.startsWith('rem'))) {
        lessonId = 'git-lessons';
      }
      const xpToAward = isAlreadyCompleted ? 0 : xpEarned;
      saveProgressToDb(currentUser.id, taskId, lessonId || null, xpToAward);
      updateSessionInDb(currentUser.id, taskId, 'completed_step', false, undefined, currentUser.groupName);
    }
  };

  const reportTaskAttempt = (taskId: string, success: boolean) => {
    if (currentUser?.id && currentUser.role !== 'teacher') {
      const isStuck = !success;
      updateSessionInDb(currentUser.id, taskId, isStuck ? 'stuck' : 'active', false, undefined, currentUser.groupName);
    }
  };

  const recordStudentTelemetry = useCallback((event: TelemetryEvent, dataUpdate?: Partial<ClassroomStudentState>) => {
    // Преподаватель/админ не является студентом и не регистрируется в телеметрии
    if (!currentUser || currentUser.role === 'teacher') return;
    const userEmail = (currentUser.email || '').toLowerCase();
    if (TEACHER_GITHUB_LOGINS.some(t => userEmail.includes(t))) return;

    const studentId = currentUser.id;

    setStudentsInClass(prev => {
      const idx = prev.findIndex(s => s.id === studentId);
      const student = idx >= 0 ? prev[idx] : null;

      const updatedStudent: ClassroomStudentState = student ? {
        ...student,
        ...dataUpdate,
        eventsLog: [event, ...(student.eventsLog || [])].slice(0, 50),
        tabSwitchCount: (dataUpdate?.tabSwitchCount !== undefined) ? dataUpdate.tabSwitchCount : student.tabSwitchCount,
        totalAwaySeconds: (dataUpdate?.totalAwaySeconds !== undefined) ? dataUpdate.totalAwaySeconds : student.totalAwaySeconds,
        pasteCount: (dataUpdate?.pasteCount !== undefined) ? dataUpdate.pasteCount : student.pasteCount,
        pastedCharsTotal: (dataUpdate?.pastedCharsTotal !== undefined) ? dataUpdate.pastedCharsTotal : student.pastedCharsTotal,
        isCurrentlyAway: (dataUpdate?.isCurrentlyAway !== undefined) ? dataUpdate.isCurrentlyAway : student.isCurrentlyAway,
        totalErrorsCount: (dataUpdate?.totalErrorsCount !== undefined) ? dataUpdate.totalErrorsCount : student.totalErrorsCount,
        totalAttemptsCount: (dataUpdate?.totalAttemptsCount !== undefined) ? dataUpdate.totalAttemptsCount : student.totalAttemptsCount,
        completedTasksCount: (dataUpdate?.completedTasksCount !== undefined) ? dataUpdate.completedTasksCount : student.completedTasksCount,
        lastCodeSnippet: dataUpdate?.lastCodeSnippet || student.lastCodeSnippet,
        lastErrorMessage: dataUpdate?.lastErrorMessage || student.lastErrorMessage,
        lastActive: new Date().toLocaleTimeString()
      } : {
        id: studentId,
        fullName: currentUser.fullName || 'Студент',
        avatarUrl: currentUser.avatarUrl,
        email: currentUser.email || '',
        groupName: currentUser.groupName || 'Без группы',
        currentTaskId: event.taskId || '',
        currentTaskTitle: event.taskTitle || '',
        currentLessonTitle: '',
        status: dataUpdate?.status || 'active',
        attemptsOnCurrentTask: 1,
        timeOnCurrentTaskMinutes: 1,
        needsHelp: false,
        totalXp: currentUser.totalXp || 0,
        streakDays: currentUser.currentStreakDays || 1,
        lastActive: new Date().toLocaleTimeString(),
        tabSwitchCount: dataUpdate?.tabSwitchCount || 0,
        totalAwaySeconds: dataUpdate?.totalAwaySeconds || 0,
        pasteCount: dataUpdate?.pasteCount || 0,
        pastedCharsTotal: dataUpdate?.pastedCharsTotal || 0,
        isCurrentlyAway: dataUpdate?.isCurrentlyAway || false,
        totalErrorsCount: dataUpdate?.totalErrorsCount || 0,
        totalAttemptsCount: dataUpdate?.totalAttemptsCount || 0,
        completedTasksCount: dataUpdate?.completedTasksCount || 0,
        lastCodeSnippet: dataUpdate?.lastCodeSnippet,
        lastErrorMessage: dataUpdate?.lastErrorMessage,
        eventsLog: [event]
      };

      const next = idx >= 0
        ? [...prev.slice(0, idx), updatedStudent, ...prev.slice(idx + 1)]
        : [...prev, updatedStudent];

      try {
        localStorage.setItem('syntaxlab_cached_classroom_sessions', JSON.stringify(next));
      } catch {}

      return next;
    });

    if (isSupabaseConfigured && currentUser?.id) {
      updateSessionTelemetryInDb(currentUser.id, event, dataUpdate);
    }
  }, [currentUser]);

  const requestTeacherHelp = (message: string) => {
    if (currentUser?.id && currentUser.role !== 'teacher') {
      updateSessionInDb(currentUser.id, currentUser.currentTaskId || 'task-1-1-1', 'stuck', true, message, currentUser.groupName);
    }
  };

  const sendHelpResponse = (studentId: string, comment: string) => {
    sendTeacherHintToDb(studentId, comment);
  };

  const clearStuckStatus = (studentId: string) => {
    const student = studentsInClass.find(s => s.id === studentId);
    updateSessionInDb(studentId, 'task-1-1-1', 'active', false, undefined, student?.groupName);
  };

  const addNewTask = async (lessonId: string, newTask: Task) => {
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

    if (isSupabaseConfigured) {
      await saveCustomTaskToDb(newTask, lessonId);
    }
  };

  // Подписка на объявления преподавателя
  useEffect(() => {
    if (!session || !isSupabaseConfigured) return;
    const group = currentUser?.groupName || 'all';
    loadActiveAnnouncementFromDb(group).then(msg => {
      if (msg) setBroadcastMessage(msg);
    });

    const unsubscribe = subscribeToAnnouncementsRealtime(group, (msg) => {
      setBroadcastMessage(msg);
    });

    return () => {
      unsubscribe();
    };
  }, [session, currentUser?.groupName]);

  const sendBroadcastMessage = async (message: string, targetGroup?: string): Promise<boolean> => {
    const group = targetGroup || currentUser?.groupName || 'all';
    setBroadcastMessage(message.trim() || null);
    if (isSupabaseConfigured) {
      return await publishClassroomAnnouncement(group, message, currentUser?.id);
    }
    return true;
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
        groupModuleAccess,
        toggleModuleForGroup,
        toggleAllModulesForGroup,
        userAllowedCourses,
        completedTaskIds,
        completeTask,
        requestTeacherHelp,
        reportTaskAttempt,
        recordStudentTelemetry,
        sendHelpResponse,
        clearStuckStatus,
        addNewTask,
        updateCourse,
        broadcastMessage,
        setBroadcastMessage,
        sendBroadcastMessage,
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
