import { createClient } from '@supabase/supabase-js';
import { gradeOutput } from '../server/grading.mjs';

function reply(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body);
}

function getBody(req) {
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return req.body || {};
}

async function authenticatedStudent(req) {
  const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error('Требуется вход.');
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth.user) throw new Error('Сессия недействительна.');
  const { data: profile } = await db.from('profiles').select('id,role,is_approved').eq('id', auth.user.id).single();
  if (!profile || (!profile.is_approved && profile.role !== 'teacher')) throw new Error('Доступ ещё не одобрен.');
  return { db, studentId: profile.id };
}

async function loadAccessibleTask(db, studentId, taskId) {
  const { data: task } = await db.from('tasks').select('id,type').eq('id', taskId).single();
  if (!task) throw new Error('Задание не найдено.');
  const { data: allowed, error } = await db.rpc('can_access_task', { task_id: task.id, viewer_id: studentId });
  if (error || !allowed) throw new Error('Задание закрыто для вашей группы.');
  return task;
}

async function complete(db, studentId, taskId) {
  const { data, error } = await db.rpc('complete_verified_task', {
    student_id: studentId,
    completed_task_id: taskId
  });
  if (error) throw new Error('Решение верное, но прогресс не сохранён.');
  return data;
}

async function runCsharp(code) {
  const response = await fetch('https://api.jdoodle.com/v1/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: process.env.JDOODLE_CLIENT_ID,
      clientSecret: process.env.JDOODLE_CLIENT_SECRET,
      script: code,
      language: 'csharp',
      versionIndex: '6'
    }),
    signal: AbortSignal.timeout(30_000)
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result || result.statusCode !== 200) {
    return { exitCode: 1, output: result?.output || '', error: result?.error || 'JDoodle не выполнил программу.' };
  }
  const output = result.output || '';
  const buildLogEnd = /Time Elapsed[^\r\n]*\r?\n?/m.exec(output);
  return { exitCode: 0, output: buildLogEnd ? output.slice(buildLogEnd.index + buildLogEnd[0].length) : output, error: '' };
}

export async function submitCode(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed.' });
  try {
    const body = getBody(req);
    if (typeof body.taskId !== 'string' || typeof body.code !== 'string' || body.code.length > 32_000) throw new Error('Некорректный код или идентификатор задания.');
    const { db, studentId } = await authenticatedStudent(req);
    const task = await loadAccessibleTask(db, studentId, body.taskId);
    if (!['code_challenge', 'code_fill', 'spot_bug'].includes(task.type)) throw new Error('Это не C#-задание.');
    const { data: checks } = await db.from('task_checks').select('tests').eq('task_id', task.id).single();
    const result = gradeOutput(await runCsharp(body.code), checks?.tests);
    if (result.success) result.xpAwarded = await complete(db, studentId, task.id);
    return reply(res, 200, result);
  } catch (error) {
    return reply(res, 400, { error: error instanceof Error ? error.message : 'Ошибка проверки.' });
  }
}

export async function submitQuiz(req, res) {
  if (req.method !== 'POST') return reply(res, 405, { error: 'Method not allowed.' });
  try {
    const body = getBody(req);
    if (typeof body.taskId !== 'string' || typeof body.optionId !== 'string') throw new Error('Некорректный ответ.');
    const { db, studentId } = await authenticatedStudent(req);
    const task = await loadAccessibleTask(db, studentId, body.taskId);
    if (task.type !== 'quiz') throw new Error('Это не тестовый вопрос.');
    const { data: checks } = await db.from('task_checks').select('quiz_options').eq('task_id', task.id).single();
    const selected = checks?.quiz_options?.find(option => option.id === body.optionId);
    const success = selected?.isCorrect === true;
    const result = { success, output: '', details: [], testsPassed: success ? 1 : 0, totalTests: 1,
      errorMessage: success ? undefined : 'Неверный ответ. Попробуйте ещё раз.' };
    if (success) result.xpAwarded = await complete(db, studentId, task.id);
    return reply(res, 200, result);
  } catch (error) {
    return reply(res, 400, { error: error instanceof Error ? error.message : 'Ошибка проверки.' });
  }
}
