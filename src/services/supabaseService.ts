import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Course, Task } from '../types';
import type { ClassroomStudentState } from '../context/AppContext';

// 1. Загрузка курса из базы данных Supabase
export async function loadCourseFromSupabase(courseId = 'csharp-foundations'): Promise<Course | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError || !courseData) {
      console.warn('Course not found in Supabase:', courseError);
      return null;
    }

    const { data: modulesData, error: modError } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (modError) throw modError;

    const moduleIds = (modulesData || []).map(m => m.id);

    const { data: lessonsData, error: lesError } = await supabase
      .from('lessons')
      .select('*')
      .in('module_id', moduleIds)
      .order('order_index', { ascending: true });

    if (lesError) throw lesError;

    const lessonIds = (lessonsData || []).map(l => l.id);

    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .in('lesson_id', lessonIds);

    if (tasksError) throw tasksError;

    // Сборка иерархического объекта курса
    const modules = (modulesData || []).map(mod => {
      const lessons = (lessonsData || [])
        .filter(les => les.module_id === mod.id)
        .map(les => {
          const tasks: Task[] = (tasksData || [])
            .filter(t => t.lesson_id === les.id)
            .map(t => ({
              id: t.id,
              lessonId: t.lesson_id,
              title: t.title,
              type: t.type,
              difficulty: t.difficulty,
              xp: t.xp,
              instructions: t.instructions,
              theorySnippet: t.theory_snippet ? t.theory_snippet.replace(/\\n/g, '\n') : '',
              initialCode: t.initial_code ? t.initial_code.replace(/\\n/g, '\n').replace(/\\t/g, '    ') : '',
              solutionCode: t.solution_code ? t.solution_code.replace(/\\n/g, '\n').replace(/\\t/g, '    ') : '',
              tests: t.tests,
              quizOptions: t.quiz_options,
              hints: t.hints
            }));

          return {
            id: les.id,
            moduleId: les.module_id,
            title: les.title,
            slug: les.slug,
            orderIndex: les.order_index,
            description: les.description || '',
            estimatedMinutes: les.estimated_minutes || 15,
            tasks
          };
        });

      return {
        id: mod.id,
        courseId: mod.course_id,
        title: mod.title,
        orderIndex: mod.order_index,
        description: mod.description || '',
        iconName: mod.icon_name || 'Code',
        lessons
      };
    });

    return {
      id: courseData.id,
      title: courseData.title,
      language: courseData.language,
      description: courseData.description || '',
      version: courseData.version || '12.0 (.NET 8)',
      modules
    };
  } catch (err) {
    console.error('Error fetching course from Supabase:', err);
    return null;
  }
}

// 2. Получение активных аудиторных сессий из Supabase
export async function loadClassroomSessionsFromDb(groupName = 'ИТ-301'): Promise<ClassroomStudentState[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await supabase
      .from('classroom_sessions')
      .select(`
        id,
        user_id,
        group_name,
        active_task_id,
        status,
        attempts_on_current_task,
        time_on_current_task_minutes,
        needs_help,
        help_message,
        teacher_comment,
        last_ping_at,
        profiles (
          id,
          full_name,
          email,
          avatar_url,
          total_xp,
          streak_days
        ),
        tasks (
          id,
          title,
          lessons (
            id,
            title
          )
        )
      `)
      .eq('group_name', groupName);

    if (error) {
      console.warn('Error loading classroom sessions:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.user_id,
      fullName: row.profiles?.full_name || 'Студент',
      avatarUrl: row.profiles?.avatar_url,
      email: row.profiles?.email || '',
      groupName: row.group_name,
      currentTaskId: row.active_task_id || '',
      currentTaskTitle: row.tasks?.title || 'Практическое задание',
      currentLessonTitle: row.tasks?.lessons?.title || 'Текущий урок',
      status: row.status,
      attemptsOnCurrentTask: row.attempts_on_current_task || 0,
      timeOnCurrentTaskMinutes: row.time_on_current_task_minutes || 0,
      needsHelp: Boolean(row.needs_help),
      helpMessage: row.help_message,
      teacherComment: row.teacher_comment,
      totalXp: row.profiles?.total_xp || 0,
      streakDays: row.profiles?.streak_days || 0,
      lastActive: new Date(row.last_ping_at).toLocaleTimeString()
    }));
  } catch (err) {
    console.error('Error in loadClassroomSessionsFromDb:', err);
    return [];
  }
}

// 3. Сохранение прогресса решения задачи в Supabase
export async function saveProgressToDb(userId: string, taskId: string, lessonId: string, xpEarned: number) {
  if (!isSupabaseConfigured) return;

  try {
    await supabase.from('student_progress').upsert({
      user_id: userId,
      task_id: taskId,
      lesson_id: lessonId,
      status: 'completed',
      completed_at: new Date().toISOString()
    });

    // Добавляем XP в профиль студента
    try {
      await supabase.rpc('increment_xp', { user_id: userId, amount: xpEarned });
    } catch {
      // Игнорируем если RPC функция не создана
    }
  } catch (err) {
    console.error('Error saving progress:', err);
  }
}

// 4. Обновление статуса на аудиторном радаре в Supabase
export async function updateSessionInDb(
  userId: string,
  taskId: string,
  status: 'active' | 'stuck' | 'completed_step' | 'idle',
  needsHelp = false,
  helpMessage?: string
) {
  if (!isSupabaseConfigured) return;

  try {
    await supabase.from('classroom_sessions').upsert({
      user_id: userId,
      active_task_id: taskId,
      status,
      needs_help: needsHelp,
      help_message: helpMessage,
      last_ping_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error updating session:', err);
  }
}

// 5. Отправка подсказки преподавателя в базу
export async function sendTeacherHintToDb(studentId: string, comment: string) {
  if (!isSupabaseConfigured) return;

  try {
    await supabase
      .from('classroom_sessions')
      .update({
        teacher_comment: comment,
        needs_help: false
      })
      .eq('user_id', studentId);
  } catch (err) {
    console.error('Error sending teacher hint:', err);
  }
}

// 6. Подписка на Realtime аудиторный радар
export function subscribeToClassroomRealtime(
  groupName: string,
  onSessionChange: () => void
) {
  if (!isSupabaseConfigured) return () => {};

  const channel = supabase
    .channel(`classroom_${groupName}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'classroom_sessions' },
      () => {
        onSessionChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// 7. Загрузка академических групп
export async function loadAcademicGroups(): Promise<string[]> {
  if (!isSupabaseConfigured) return ['ИТ-301', 'ИТ-302', 'ПИ-201'];

  try {
    const { data, error } = await supabase
      .from('academic_groups')
      .select('name')
      .order('name');

    if (error || !data || data.length === 0) {
      return ['ИТ-301', 'ИТ-302', 'ПИ-201'];
    }

    return data.map(g => g.name);
  } catch {
    return ['ИТ-301', 'ИТ-302', 'ПИ-201'];
  }
}

// 8. Добавление новой учебной группы преподавателем
export async function createAcademicGroup(name: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('academic_groups').insert({ name: name.trim() });
    return !error;
  } catch {
    return false;
  }
}

// 9. Удаление учебной группы
export async function deleteAcademicGroup(name: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase.from('academic_groups').delete().eq('name', name);
    return !error;
  } catch {
    return false;
  }
}

// 10. Загрузка списка всех студентов (для подтверждения и модерации преподавателем)
export async function loadAllStudentsForTeacher() {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error loading students for moderation:', err);
    return [];
  }
}

// 11. Подтверждение студента и изменение ФИО / группы преподавателем
export async function updateAndApproveStudentProfile(
  userId: string,
  fullName: string,
  groupName: string,
  isApproved = true
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        group_name: groupName.trim(),
        is_approved: isApproved
      })
      .eq('id', userId);

    return !error;
  } catch (err) {
    console.error('Error updating student profile:', err);
    return false;
  }
}

// 12. Отправка студентом заявки с выбором группы и ФИО при первом входе
export async function submitStudentOnboarding(
  userId: string,
  fullName: string,
  groupName: string
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        group_name: groupName.trim(),
        is_approved: false
      })
      .eq('id', userId);

    return !error;
  } catch (err) {
    console.error('Error submitting student onboarding:', err);
    return false;
  }
}

// 13. Загрузка сопоставления курсов по группам (какой курс каким группам открыт)
export async function loadGroupCourseAccess(): Promise<Record<string, string[]>> {
  if (!isSupabaseConfigured) {
    return {
      'ИТ-301': ['csharp-foundations', 'git-branching'],
      'ИТ-302': ['csharp-foundations'],
      'ПИ-201': ['git-branching']
    };
  }
  try {
    const { data, error } = await supabase
      .from('group_courses')
      .select('group_name, course_id');

    if (error || !data) {
      // Таблица может еще не существовать, возвращаем базовое сопоставление
      return {
        'ИТ-301': ['csharp-foundations', 'git-branching'],
        'ИТ-302': ['csharp-foundations'],
        'ПИ-201': ['csharp-foundations', 'git-branching']
      };
    }

    const mapping: Record<string, string[]> = {};
    for (const item of data) {
      if (!mapping[item.group_name]) {
        mapping[item.group_name] = [];
      }
      mapping[item.group_name].push(item.course_id);
    }
    return mapping;
  } catch (err) {
    console.warn('Error loading group_courses:', err);
    return {};
  }
}

// 14. Переключение доступа группы к курсу преподавателем
export async function toggleGroupCourseAccess(
  groupName: string,
  courseId: string,
  enabled: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    if (enabled) {
      const { error } = await supabase
        .from('group_courses')
        .upsert(
          { group_name: groupName, course_id: courseId },
          { onConflict: 'group_name,course_id' }
        );
      return !error;
    } else {
      const { error } = await supabase
        .from('group_courses')
        .delete()
        .eq('group_name', groupName)
        .eq('course_id', courseId);
      return !error;
    }
  } catch (err) {
    console.error('Error toggling group course access:', err);
    return false;
  }
}

