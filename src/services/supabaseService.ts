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
export async function loadClassroomSessionsFromDb(groupName?: string): Promise<ClassroomStudentState[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
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
        tab_switch_count,
        total_away_seconds,
        paste_count,
        pasted_chars_total,
        is_currently_away,
        total_errors_count,
        total_attempts_count,
        completed_tasks_count,
        last_code_snippet,
        last_error_message,
        events_log,
        profiles (
          id,
          full_name,
          email,
          avatar_url,
          total_xp,
          streak_days,
          group_name,
          role
        ),
        tasks (
          id,
          title,
          lessons (
            id,
            title
          )
        )
      `);

    if (groupName && groupName !== 'all') {
      query = query.eq('group_name', groupName);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Error loading classroom sessions:', error);
      return [];
    }

    return (data || [])
      // Исключаем преподавателя/админа из студенческих сессий
      .filter((row: any) => {
        if (!row.profiles) return false;
        if (row.profiles.role === 'teacher') return false;
        const email = (row.profiles.email || '').toLowerCase();
        if (email.includes('kos108568')) return false;
        return true;
      })
      .map((row: any) => ({
        id: row.user_id,
        fullName: row.profiles?.full_name || 'Студент',
        avatarUrl: row.profiles?.avatar_url,
        email: row.profiles?.email || '',
        // Первоисточник группы - всегда профиль студента
        groupName: row.profiles?.group_name || row.group_name || 'Без группы',
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
        lastActive: row.last_ping_at ? new Date(row.last_ping_at).toLocaleTimeString() : 'В сети',
        tabSwitchCount: row.tab_switch_count || 0,
        totalAwaySeconds: row.total_away_seconds || 0,
        pasteCount: row.paste_count || 0,
        pastedCharsTotal: row.pasted_chars_total || 0,
        isCurrentlyAway: Boolean(row.is_currently_away),
        totalErrorsCount: row.total_errors_count || 0,
        totalAttemptsCount: row.total_attempts_count || 0,
        completedTasksCount: row.completed_tasks_count || 0,
        lastCodeSnippet: row.last_code_snippet,
        lastErrorMessage: row.last_error_message,
        eventsLog: Array.isArray(row.events_log) ? row.events_log : []
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

// 4.1 Обновление расширенной телеметрии (сворачивание окон, вставки, ошибки)
export async function updateSessionTelemetryInDb(
  userId: string,
  _event?: any,
  dataUpdate?: any
) {
  if (!isSupabaseConfigured) return;
  try {
    const payload: any = {
      user_id: userId,
      last_ping_at: new Date().toISOString()
    };
    if (dataUpdate?.tabSwitchCount !== undefined) payload.tab_switch_count = dataUpdate.tabSwitchCount;
    if (dataUpdate?.totalAwaySeconds !== undefined) payload.total_away_seconds = dataUpdate.totalAwaySeconds;
    if (dataUpdate?.pasteCount !== undefined) payload.paste_count = dataUpdate.pasteCount;
    if (dataUpdate?.pastedCharsTotal !== undefined) payload.pasted_chars_total = dataUpdate.pastedCharsTotal;
    if (dataUpdate?.isCurrentlyAway !== undefined) payload.is_currently_away = dataUpdate.isCurrentlyAway;
    if (dataUpdate?.totalErrorsCount !== undefined) payload.total_errors_count = dataUpdate.totalErrorsCount;
    if (dataUpdate?.totalAttemptsCount !== undefined) payload.total_attempts_count = dataUpdate.totalAttemptsCount;
    if (dataUpdate?.completedTasksCount !== undefined) payload.completed_tasks_count = dataUpdate.completedTasksCount;
    if (dataUpdate?.lastCodeSnippet) payload.last_code_snippet = dataUpdate.lastCodeSnippet;
    if (dataUpdate?.lastErrorMessage) payload.last_error_message = dataUpdate.lastErrorMessage;

    await supabase.from('classroom_sessions').upsert(payload, { onConflict: 'user_id' });
  } catch (err) {
    console.warn('Error updating session telemetry in Supabase:', err);
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
    // 1. Попытка через безопасную RPC функцию approve_student (обходит RLS через security definer)
    if (isApproved) {
      const { data: rpcData, error: rpcError } = await supabase.rpc('approve_student', {
        student_id: userId,
        new_full_name: fullName.trim(),
        new_group_name: groupName.trim()
      });

      if (!rpcError && rpcData === true) {
        console.log('Студент успешно подтвержден через RPC approve_student:', userId);
        return true;
      }
      if (rpcError && rpcError.code !== 'PGRST202') {
        console.warn('RPC approve_student вернул ошибку:', rpcError);
      }
    }

    // 2. Прямой UPDATE таблицы profiles с проверкой возвращенных строк
    const { data, error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        group_name: groupName.trim(),
        is_approved: isApproved
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Ошибка прямого обновления профиля студента в Supabase:', error);
      return false;
    }

    if (!data || data.length === 0) {
      console.warn('Supabase не обновил ни одной строки для студента', userId, '— вероятно, блокируется политикой RLS.');
      return false;
    }

    console.log('Профиль студента успешно обновлен напрямую в profiles:', data);
    return true;
  } catch (err) {
    console.error('Исключение при обновлении профиля студента:', err);
    return false;
  }
}

// 11.1 Отклонение заявки студента преподавателем
export async function rejectStudentProfile(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('reject_student', {
      student_id: userId
    });

    if (!rpcError && rpcData === true) {
      console.log('Студент отклонен через RPC reject_student:', userId);
      return true;
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        is_approved: false,
        group_name: ''
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Ошибка при отклонении студента в Supabase:', error);
      return false;
    }

    return Boolean(data && data.length > 0);
  } catch (err) {
    console.error('Исключение при отклонении студента:', err);
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

// 15. Загрузка доступа групп к разделам (модулям)
export async function loadGroupModuleAccess(): Promise<Record<string, string[]>> {
  if (!isSupabaseConfigured) {
    return {
      'ИТ-301': ['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5', 'mod-6', 'mod-7', 'mod-8'],
      'ИТ-302': ['mod-1', 'mod-2', 'mod-3'],
      'ПИ-201': ['mod-1', 'mod-2'],
      'ПО-43': ['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5', 'mod-6', 'mod-7', 'mod-8']
    };
  }
  try {
    const { data, error } = await supabase
      .from('group_modules')
      .select('group_name, module_id');

    if (error || !data) {
      return {
        'ИТ-301': ['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5', 'mod-6', 'mod-7', 'mod-8'],
        'ИТ-302': ['mod-1', 'mod-2', 'mod-3'],
        'ПИ-201': ['mod-1', 'mod-2'],
        'ПО-43': ['mod-1', 'mod-2', 'mod-3', 'mod-4', 'mod-5', 'mod-6', 'mod-7', 'mod-8']
      };
    }

    const mapping: Record<string, string[]> = {};
    for (const item of data) {
      if (!mapping[item.group_name]) {
        mapping[item.group_name] = [];
      }
      mapping[item.group_name].push(item.module_id);
    }
    return mapping;
  } catch (err) {
    console.warn('Error loading group_modules:', err);
    return {};
  }
}

// 16. Переключение доступа группы к конкретному разделу (модулю)
export async function toggleGroupModuleAccess(
  groupName: string,
  moduleId: string,
  courseId = 'csharp-foundations',
  enabled: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    if (enabled) {
      const { error } = await supabase
        .from('group_modules')
        .upsert(
          { group_name: groupName, module_id: moduleId, course_id: courseId },
          { onConflict: 'group_name,module_id' }
        );
      return !error;
    } else {
      const { error } = await supabase
        .from('group_modules')
        .delete()
        .eq('group_name', groupName)
        .eq('module_id', moduleId);
      return !error;
    }
  } catch (err) {
    console.error('Error toggling group module access:', err);
    return false;
  }
}

// 17. Открытие или закрытие всех разделов для группы разом
export async function toggleAllGroupModules(
  groupName: string,
  courseId: string,
  moduleIds: string[],
  enabled: boolean
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    if (enabled) {
      const rows = moduleIds.map(mId => ({
        group_name: groupName,
        module_id: mId,
        course_id: courseId
      }));
      const { error } = await supabase
        .from('group_modules')
        .upsert(rows, { onConflict: 'group_name,module_id' });
      return !error;
    } else {
      const { error } = await supabase
        .from('group_modules')
        .delete()
        .eq('group_name', groupName)
        .in('module_id', moduleIds);
      return !error;
    }
  } catch (err) {
    console.error('Error toggling all group modules:', err);
    return false;
  }
}


