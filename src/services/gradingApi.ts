import { supabase } from '../lib/supabase';
import type { RunResult } from './csharpRunner';

type SubmissionKind = 'code' | 'quiz' | 'git';

export async function submitSolution(kind: SubmissionKind, payload: Record<string, unknown>): Promise<RunResult> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error('Войдите в аккаунт, чтобы проверить решение.');

  const response = await fetch(`${import.meta.env.VITE_GRADING_API_URL || ''}/api/submit-${kind}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000)
  });

  let body: { error?: string } & Partial<RunResult>;
  try { body = await response.json(); } catch { throw new Error('Сервис проверки вернул некорректный ответ.'); }
  if (!response.ok) throw new Error(body.error || 'Не удалось проверить решение.');
  return body as RunResult;
}
