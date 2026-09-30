import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { runCsharp } from './runner.mjs';
import { gradeOutput } from './grading.mjs';
import { GIT_LEVELS } from '../src/data/gitLevelsData.ts';
import { cloneGitState, executeGitCommand, isGitGoalReached } from '../src/services/gitEngine.ts';

export function replayGit(level, commands) {
  if (!Array.isArray(commands) || commands.length > 200 || commands.some(c => typeof c !== 'string' || c.length > 200)) throw new Error('Недопустимая история команд.');
  let state = cloneGitState(level.initialState);
  for (const command of commands) {
    const result = executeGitCommand(state, command);
    if (result.isError || Object.keys(result.nextState.commits).length > 500) return false;
    state = result.nextState;
  }
  return isGitGoalReached(state, level.goalState);
}

export function createApi({ db, execute = runCsharp, origin = process.env.APP_ORIGIN } = {}) {
  const busy = new Set();
  return createServer(async (req, res) => {
    const reply = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
    if (origin && req.headers.origin === origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.method !== 'POST' || !['/api/submit-code', '/api/submit-quiz', '/api/submit-git'].includes(req.url)) return reply(404, { error: 'Маршрут не найден.' });
    let userId;
    try {
      const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
      if (!token) return reply(401, { error: 'Требуется вход.' });
      const { data: auth, error: authError } = await db.auth.getUser(token);
      if (authError || !auth.user) return reply(401, { error: 'Сессия недействительна.' });
      const { data: profile, error: profileError } = await db.from('profiles').select('id,role,is_approved,group_name').eq('id', auth.user.id).single();
      if (profileError || !profile || (!profile.is_approved && profile.role !== 'teacher')) return reply(403, { error: 'Доступ ещё не одобрен.' });
      if (busy.has(profile.id) || busy.size >= 4) return reply(429, { error: 'Проверка уже выполняется. Повторите позже.' });
      userId = profile.id;
      busy.add(userId);
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 65536) return reply(413, { error: 'Решение слишком большое.' });
      }
      let body;
      try { body = JSON.parse(raw); } catch { return reply(400, { error: 'Некорректный JSON.' }); }
      if (!body || typeof body.taskId !== 'string') return reply(400, { error: 'Нужно указать задание.' });
      const { data: task, error: taskError } = await db.from('tasks').select('*,lessons!inner(module_id,modules!inner(course_id))').eq('id', body.taskId).single();
      if (taskError || !task) return reply(404, { error: 'Задание не найдено.' });
      const { data: allowed, error: accessError } = await db.rpc('can_access_task', { task_id: task.id, viewer_id: userId });
      if (accessError || !allowed) return reply(403, { error: 'Задание закрыто для вашей группы.' });
      let result;
      if (req.url === '/api/submit-git') {
        const level = GIT_LEVELS.find(l => l.id === task.id);
        if (task.type !== 'git' || !level) return reply(400, { error: 'Это не Git-задание.' });
        result = { success: replayGit(level, body.commands), output: '', details: [], testsPassed: 0, totalTests: 1 };
        if (!result.success) result.errorMessage = 'Цель Git-уровня не достигнута.';
      } else {
        const { data: checks, error } = await db.from('task_checks').select('*').eq('task_id', task.id).single();
        if (error || !checks) throw new Error('Для задания не настроена проверка.');
        if (req.url === '/api/submit-quiz') {
          if (task.type !== 'quiz') return reply(400, { error: 'Это не тестовый вопрос.' });
          const selected = checks.quiz_options.find(o => o.id === body.optionId);
          result = { success: selected?.isCorrect === true, output: '', details: [], testsPassed: selected?.isCorrect ? 1 : 0, totalTests: 1,
            errorMessage: selected?.isCorrect ? undefined : 'Неверный ответ. Попробуйте ещё раз.' };
        } else {
          if (!['code_challenge', 'code_fill', 'spot_bug'].includes(task.type) || typeof body.code !== 'string') return reply(400, { error: 'Ожидается код C#.' });
          if (!checks.tests?.length || checks.tests.some(t => typeof t.expectedOutput !== 'string')) throw new Error('Для задания не настроены тесты.');
          result = gradeOutput(await execute(body.code), checks.tests);
        }
      }
      if (result.success) {
        const { data: award, error } = await db.rpc('complete_verified_task', { student_id: userId, completed_task_id: task.id });
        if (error) throw new Error('Решение верное, но прогресс не сохранён. Повторите проверку.');
        result.xpAwarded = award;
      }
      reply(200, result);
    } catch (error) {
      reply(400, { error: error.message || 'Ошибка проверки.' });
    } finally { if (userId) busy.delete(userId); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Настройте серверные SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.');
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  createApi({ db }).listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1', () => console.log('SyntaxLab grading API ready'));
}
