export type UserRole = 'teacher' | 'student';

export interface AcademicGroup {
  id: string;
  name: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  groupName?: string;
  avatarUrl?: string;
  isApproved?: boolean;
  currentStreakDays: number;
  totalXp: number;
  isOnline?: boolean;
  currentTaskId?: string;
  stuckMinutes?: number;
  lastActiveAt?: string;
}

export type TaskType = 'code_challenge' | 'quiz' | 'code_fill' | 'spot_bug';

export interface CodeTest {
  id: string;
  description: string;
  expectedOutput?: string;
  hidden?: boolean;
}

export interface Task {
  id: string;
  lessonId: string;
  title: string;
  type: TaskType;
  difficulty: 'easy' | 'medium' | 'hard';
  xp: number;
  instructions: string;
  theorySnippet?: string;
  initialCode?: string;
  solutionCode?: string;
  tests?: CodeTest[];
  quizOptions?: { id: string; text: string; isCorrect: boolean; explanation?: string }[];
  fillBlanksTemplate?: string; // e.g. "for (int i = 0; i < __BLANK_1__; i++)"
  fillBlanksAnswers?: string[]; // e.g. ["10"]
  hints: string[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  slug: string;
  orderIndex: number;
  description: string;
  estimatedMinutes: number;
  tasks: Task[];
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  orderIndex: number;
  description: string;
  iconName: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  language: string;
  description: string;
  version: string;
  modules: Module[];
}

export interface StudentProgress {
  userId: string;
  taskId: string;
  lessonId: string;
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed';
  completedAt?: string;
  attemptsCount: number;
  lastCodeSubmitted?: string;
  scorePercent?: number;
}

export interface TelemetryEvent {
  id: string;
  type: 'tab_switch_away' | 'tab_switch_back' | 'window_blur' | 'window_focus' | 'code_paste' | 'error' | 'success' | 'task_completed' | 'code_error' | 'quiz_error';
  timestamp: string;
  details?: string;
  durationSeconds?: number;
  charsPasted?: number;
  pastedChars?: number;
  errorMessage?: string;
  taskId?: string;
  taskTitle?: string;
}

export interface StudentLiveSession {
  student: UserProfile;
  activeLessonTitle: string;
  activeTaskTitle: string;
  activeTaskId: string;
  status: 'active' | 'stuck' | 'completed_step' | 'idle';
  attemptsOnCurrentTask: number;
  timeOnCurrentTaskMinutes: number;
  needsHelp: boolean;
  helpMessage?: string;
  lastUpdate: string;
  // Full Telemetry & Anti-cheat
  tabSwitchCount?: number;
  totalAwaySeconds?: number;
  pasteCount?: number;
  pastedCharsTotal?: number;
  isCurrentlyAway?: boolean;
  totalErrorsCount?: number;
  totalAttemptsCount?: number;
  completedTasksCount?: number;
  lastCodeSnippet?: string;
  lastErrorMessage?: string;
  eventsLog?: TelemetryEvent[];
}

