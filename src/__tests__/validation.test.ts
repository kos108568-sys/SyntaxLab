import test from 'node:test';
import assert from 'node:assert';
import { validateStudentOnboardingInput, isTeacherProfile, isMockStudent, calculateHonesty } from '../utils/studentFilters.ts';
import type { ClassroomStudentState } from '../types';

test('Validation: Valid student onboarding input passes', () => {
  const result = validateStudentOnboardingInput('Иванов Иван Иванович', 'ИТ-301');
  assert.strictEqual(result.valid, true);
});

test('Validation: Malformed full name is rejected', () => {
  assert.strictEqual(validateStudentOnboardingInput('', 'ИТ-301').valid, false);
  assert.strictEqual(validateStudentOnboardingInput('A', 'ИТ-301').valid, false);
  assert.strictEqual(validateStudentOnboardingInput('Student<script>', 'ИТ-301').valid, false);
});

test('Validation: Malformed group name is rejected', () => {
  assert.strictEqual(validateStudentOnboardingInput('Иван Иванов', '').valid, false);
  assert.strictEqual(validateStudentOnboardingInput('Иван Иванов', 'Group; DROP TABLE profiles;').valid, false);
});

test('Student Filters: Teacher detection works reliably', () => {
  assert.strictEqual(isTeacherProfile({ email: 'kos108568@gmail.com', role: 'student' }), true);
  assert.strictEqual(isTeacherProfile({ email: 'student@example.com', role: 'teacher' }), true);
  assert.strictEqual(isTeacherProfile({ email: 'student@example.com', groupName: 'Преподавательский состав' }), true);
  assert.strictEqual(isTeacherProfile({ email: 'student@example.com', role: 'student', groupName: 'ИТ-301' }), false);
});

test('Student Filters: Mock student detection', () => {
  assert.strictEqual(isMockStudent({ id: 'stud-123', email: 'test@example.com' }), true);
  assert.strictEqual(isMockStudent({ id: 'abc-uuid', email: 'a.smirnov@university.edu' }), true);
  assert.strictEqual(isMockStudent({ id: '550e8400-e29b-41d4-a716-446655440000', email: 'real@university.edu' }), false);
});

test('Telemetry: Honesty score calculations', () => {
  const baseStudent: ClassroomStudentState = {
    id: 'stud-1',
    fullName: 'Test Student',
    email: 'test@test.com',
    groupName: 'ИТ-301',
    currentTaskId: 't1',
    currentTaskTitle: 'Task 1',
    currentLessonTitle: 'Lesson 1',
    status: 'active',
    attemptsOnCurrentTask: 1,
    timeOnCurrentTaskMinutes: 5,
    needsHelp: false,
    totalXp: 100,
    streakDays: 1,
    lastActive: '12:00',
    tabSwitchCount: 0,
    totalAwaySeconds: 0,
    pasteCount: 0,
    pastedCharsTotal: 0,
    isCurrentlyAway: false,
    totalErrorsCount: 0,
    totalAttemptsCount: 0,
    completedTasksCount: 0
  };

  const honest = calculateHonesty(baseStudent);
  assert.strictEqual(honest.score, 100);
  assert.strictEqual(honest.badgeText, 'Честно');

  const suspicious = calculateHonesty({
    ...baseStudent,
    tabSwitchCount: 10,
    pasteCount: 5,
    totalAwaySeconds: 150
  });
  assert.ok(suspicious.score < 60);
  assert.strictEqual(suspicious.badgeText, 'Подозрение');
});
