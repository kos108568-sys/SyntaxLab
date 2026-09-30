import type { Task } from '../types';
import { submitSolution } from './gradingApi';

export interface RunResult {
  success: boolean;
  output: string;
  errorMessage?: string;
  testsPassed: number;
  totalTests: number;
  xpAwarded?: number;
  details: { testId: string; description: string; passed: boolean; message?: string }[];
}

/** Code is compiled and tested by the isolated grading service, never in the browser. */
export function evaluateCsharpCode(code: string, task: Task): Promise<RunResult> {
  return submitSolution('code', { taskId: task.id, code });
}

export function submitQuizAnswer(taskId: string, optionId: string): Promise<RunResult> {
  return submitSolution('quiz', { taskId, optionId });
}

export function submitGitCommands(taskId: string, commands: string[]): Promise<RunResult> {
  return submitSolution('git', { taskId, commands });
}
