import type { ClassroomStudentState } from '../types';
import { HONESTY_PENALTY_WEIGHTS } from '../constants/telemetryWeights.ts';

/**
 * Список логинов и email адресов преподавателей/администраторов.
 */
export const TEACHER_IDENTIFIERS = ['kos108568-sys', 'kos108568', 'kos108568@gmail.com'];

/**
 * Проверка, относится ли профиль к преподавателю/администратору.
 */
export function isTeacherProfile(profile: any, currentUserId?: string, currentUserRole?: string): boolean {
  if (!profile) return false;
  if (profile.role === 'teacher') return true;
  if (currentUserRole === 'teacher' && currentUserId && profile.id === currentUserId) return true;

  const email = (profile.email || '').toLowerCase();
  if (TEACHER_IDENTIFIERS.some(id => email.includes(id))) return true;

  const group = profile.groupName || profile.group_name;
  if (group === 'Преподавательский состав') return true;

  return false;
}

/**
 * Проверка, является ли запись моковым студентом из устаревших шаблонов.
 */
export function isMockStudent(student: any): boolean {
  if (!student || !student.id) return true;
  const idStr = String(student.id);
  return idStr.startsWith('stud-') || student.email === 'a.smirnov@university.edu';
}

/**
 * Валидация входных данных регистрации/онбординга студента.
 */
export function validateStudentOnboardingInput(fullName: string, groupName: string): { valid: boolean; error?: string } {
  const cleanName = fullName.trim();
  const cleanGroup = groupName.trim();

  if (cleanName.length < 2 || cleanName.length > 100) {
    return { valid: false, error: 'ФИО должно содержать от 2 до 100 символов' };
  }
  const nameRegex = /^[a-zA-Zа-яА-ЯёЁ\s\-'.]+$/u;
  if (!nameRegex.test(cleanName)) {
    return { valid: false, error: 'ФИО может содержать только буквы, пробелы и дефисы' };
  }

  if (cleanGroup.length < 2 || cleanGroup.length > 50) {
    return { valid: false, error: 'Название группы должно содержать от 2 до 50 символов' };
  }
  const groupRegex = /^[a-zA-Zа-яА-ЯёЁ0-9\-_]+$/u;
  if (!groupRegex.test(cleanGroup)) {
    return { valid: false, error: 'Название группы содержит недопустимые символы' };
  }

  return { valid: true };
}

/**
 * Приведение сырого профиля студента к унифицированному состоянию ClassroomStudentState.
 */
export function formatUnifiedStudent(raw: any): ClassroomStudentState {
  return {
    id: raw.id || raw.user_id,
    fullName: raw.full_name || raw.fullName || 'Студент',
    avatarUrl: raw.avatar_url || raw.avatarUrl,
    email: raw.email || '',
    groupName: raw.group_name || raw.groupName || 'Без группы',
    currentTaskId: raw.active_task_id || raw.currentTaskId || '',
    currentTaskTitle: raw.tasks?.title || raw.currentTaskTitle || 'Практическое задание',
    currentLessonTitle: raw.tasks?.lessons?.title || raw.currentLessonTitle || 'Текущий урок',
    status: raw.status || 'active',
    attemptsOnCurrentTask: raw.attempts_on_current_task || raw.attemptsOnCurrentTask || 0,
    timeOnCurrentTaskMinutes: raw.time_on_current_task_minutes || raw.timeOnCurrentTaskMinutes || 0,
    needsHelp: Boolean(raw.needs_help || raw.needsHelp),
    helpMessage: raw.help_message || raw.helpMessage,
    teacherComment: raw.teacher_comment || raw.teacherComment,
    totalXp: raw.total_xp || raw.totalXp || 0,
    streakDays: raw.streak_days || raw.streakDays || 1,
    lastActive: raw.last_ping_at ? new Date(raw.last_ping_at).toLocaleTimeString() : (raw.lastActive || 'В сети'),
    tabSwitchCount: raw.tab_switch_count || raw.tabSwitchCount || 0,
    totalAwaySeconds: raw.total_away_seconds || raw.totalAwaySeconds || 0,
    pasteCount: raw.paste_count || raw.pasteCount || 0,
    pastedCharsTotal: raw.pasted_chars_total || raw.pastedCharsTotal || 0,
    isCurrentlyAway: Boolean(raw.is_currently_away || raw.isCurrentlyAway),
    totalErrorsCount: raw.total_errors_count || raw.totalErrorsCount || 0,
    totalAttemptsCount: raw.total_attempts_count || raw.totalAttemptsCount || 0,
    completedTasksCount: raw.completed_tasks_count || raw.completedTasksCount || 0,
    lastCodeSnippet: raw.last_code_snippet || raw.lastCodeSnippet,
    lastErrorMessage: raw.last_error_message || raw.lastErrorMessage,
    eventsLog: Array.isArray(raw.events_log) ? raw.events_log : (Array.isArray(raw.eventsLog) ? raw.eventsLog : [])
  };
}

/**
 * Расчет индекса честности студента на основе собранной телеметрии.
 */
export function calculateHonesty(student: ClassroomStudentState) {
  const switches = student.tabSwitchCount || 0;
  const pastes = student.pasteCount || 0;
  const awaySec = student.totalAwaySeconds || 0;
  const awayPenalty = awaySec > HONESTY_PENALTY_WEIGHTS.AWAY_HIGH_THRESHOLD_SEC
    ? HONESTY_PENALTY_WEIGHTS.AWAY_HIGH_PENALTY
    : awaySec > HONESTY_PENALTY_WEIGHTS.AWAY_MEDIUM_THRESHOLD_SEC
    ? HONESTY_PENALTY_WEIGHTS.AWAY_MEDIUM_PENALTY
    : 0;

  const penalty = switches * HONESTY_PENALTY_WEIGHTS.TAB_SWITCH + pastes * HONESTY_PENALTY_WEIGHTS.PASTE + awayPenalty;
  const score = Math.max(HONESTY_PENALTY_WEIGHTS.MIN_SCORE, Math.min(HONESTY_PENALTY_WEIGHTS.MAX_SCORE, HONESTY_PENALTY_WEIGHTS.MAX_SCORE - penalty));
  let label = 'Высокая (Самостоятельно)';
  let color = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  let badgeText = 'Честно';
  if (score < HONESTY_PENALTY_WEIGHTS.MEDIUM_THRESHOLD) {
    label = 'Низкая (Риск списывания / AI)';
    color = 'text-red-400 bg-red-500/10 border-red-500/20';
    badgeText = 'Подозрение';
  } else if (score < HONESTY_PENALTY_WEIGHTS.HIGH_THRESHOLD) {
    label = 'Средняя (Частые смены окон)';
    color = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    badgeText = 'Внимание';
  }

  return { score, label, color, badgeText, switches, pastes, awaySec };
}

