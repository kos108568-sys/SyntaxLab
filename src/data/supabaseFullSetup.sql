-- Generated: fresh install or upgrade.
-- ====================================================================
-- SyntaxLab: ПОЛНЫЙ СКРИПТ РАЗВЕРТЫВАНИЯ БАЗЫ ДАННЫХ (SUPABASE)
-- Вставьте этот код в Supabase -> SQL Editor -> Нажмите "Run"
-- ====================================================================

-- 1. ТАБЛИЦА ПРОФИЛЕЙ (Связанная с auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null default 'student' check (role in ('teacher', 'student')),
  group_name text default 'ИТ-301',
  avatar_url text,
  is_approved boolean default false,
  total_xp integer default 0,
  streak_days integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Добавляем колонку, если таблица уже существовала
alter table public.profiles add column if not exists is_approved boolean default false;
update public.profiles set is_approved = true where role = 'teacher';

-- 1.1 ТАБЛИЦА АКАДЕМИЧЕСКИХ ГРУПП (Создаются преподавателем)
create table if not exists public.academic_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

insert into public.academic_groups (name) values ('ИТ-301'), ('ИТ-302'), ('ПИ-201') on conflict (name) do nothing;

-- 1.2 ТАБЛИЦА ДОСТУПА ГРУПП К КУРСАМ (Многие ко многим)
create table if not exists public.group_courses (
  id uuid default gen_random_uuid() primary key,
  group_name text not null,
  course_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_name, course_id)
);

-- По умолчанию открываем C# и Git для ИТ-301, C# для ИТ-302, Git для ПИ-201
insert into public.group_courses (group_name, course_id) values
  ('ИТ-301', 'csharp-foundations'),
  ('ИТ-301', 'git-branching'),
  ('ИТ-302', 'csharp-foundations'),
  ('ПИ-201', 'git-branching')
on conflict (group_name, course_id) do nothing;

-- 1.3 ТАБЛИЦА ДОСТУПА ГРУПП К РАЗДЕЛАМ (МОДУЛЯМ) КУРСА
create table if not exists public.group_modules (
  id uuid default gen_random_uuid() primary key,
  group_name text not null,
  module_id text not null,
  course_id text not null default 'csharp-foundations',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_name, module_id)
);

-- По умолчанию открываем модули для групп
insert into public.group_modules (group_name, module_id, course_id) values
  ('ИТ-301', 'mod-1', 'csharp-foundations'),
  ('ИТ-301', 'mod-2', 'csharp-foundations'),
  ('ИТ-301', 'mod-3', 'csharp-foundations'),
  ('ИТ-301', 'mod-4', 'csharp-foundations'),
  ('ИТ-301', 'mod-5', 'csharp-foundations'),
  ('ИТ-301', 'mod-6', 'csharp-foundations'),
  ('ИТ-301', 'mod-7', 'csharp-foundations'),
  ('ИТ-301', 'mod-8', 'csharp-foundations'),
  ('ИТ-302', 'mod-1', 'csharp-foundations'),
  ('ИТ-302', 'mod-2', 'csharp-foundations'),
  ('ИТ-302', 'mod-3', 'csharp-foundations'),
  ('ПИ-201', 'mod-1', 'csharp-foundations'),
  ('ПИ-201', 'mod-2', 'csharp-foundations')
on conflict (group_name, module_id) do nothing;


-- 2. ТАБЛИЦА КУРСОВ
create table if not exists public.courses (
  id text primary key,
  title text not null,
  language text not null,
  description text,
  version text default '12.0 (.NET 8)',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ТАБЛИЦА МОДУЛЕЙ
create table if not exists public.modules (
  id text primary key,
  course_id text references public.courses(id) on delete cascade not null,
  title text not null,
  order_index integer not null,
  description text,
  icon_name text default 'Code'
);

-- 4. ТАБЛИЦА УРОКОВ
create table if not exists public.lessons (
  id text primary key,
  module_id text references public.modules(id) on delete cascade not null,
  title text not null,
  slug text not null,
  order_index integer not null,
  description text,
  estimated_minutes integer default 15
);

-- 5. ТАБЛИЦА ЗАДАНИЙ (Шаги обучения)
create table if not exists public.tasks (
  id text primary key,
  lesson_id text references public.lessons(id) on delete cascade not null,
  title text not null,
  type text not null check (type in ('code_challenge', 'quiz', 'code_fill', 'spot_bug')),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  xp integer default 25,
  instructions text not null,
  theory_snippet text,
  initial_code text,
  solution_code text,
  tests jsonb default '[]'::jsonb,
  quiz_options jsonb default '[]'::jsonb,
  hints jsonb default '[]'::jsonb
);

-- 6. ТАБЛИЦА ПРОГРЕССА СТУДЕНТОВ
create table if not exists public.student_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  task_id text references public.tasks(id) on delete cascade not null,
  lesson_id text references public.lessons(id) on delete cascade not null,
  status text not null check (status in ('locked', 'unlocked', 'in_progress', 'completed')),
  attempts_count integer default 0,
  last_code_submitted text,
  completed_at timestamp with time zone,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, task_id)
);

-- 7. ТАБЛИЦА АУДИТОРНОГО РАДАРА В РЕАЛЬНОМ ВРЕМЕНИ
create table if not exists public.classroom_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  group_name text not null default 'ИТ-301',
  active_task_id text references public.tasks(id) on delete set null,
  status text not null default 'active' check (status in ('active', 'stuck', 'completed_step', 'idle')),
  attempts_on_current_task integer default 0,
  time_on_current_task_minutes integer default 0,
  needs_help boolean default false,
  help_message text,
  teacher_comment text,
  last_ping_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. ТАБЛИЦА АУДИТОРНЫХ ОБЪЯВЛЕНИЙ ПРЕПОДАВАТЕЛЯ
create table if not exists public.classroom_announcements (
  id uuid default gen_random_uuid() primary key,
  group_name text not null default 'ИТ-301',
  teacher_id uuid references public.profiles(id) on delete cascade,
  message text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- Apply after the existing schema. No student/profile/progress rows are deleted.
begin;
alter table public.profiles add column if not exists is_approved boolean default false;
alter table public.tasks drop constraint if exists tasks_type_check;
alter table public.tasks add constraint tasks_type_check check (type in ('code_challenge','quiz','code_fill','spot_bug','git'));
alter table public.tasks add column if not exists order_index integer default 0;
alter table public.classroom_sessions add column if not exists time_on_current_task_minutes integer default 0;
alter table public.classroom_sessions add column if not exists teacher_comment text;
alter table public.classroom_sessions add column if not exists tab_switch_count integer default 0;
alter table public.classroom_sessions add column if not exists total_away_seconds integer default 0;
alter table public.classroom_sessions add column if not exists paste_count integer default 0;
alter table public.classroom_sessions add column if not exists pasted_chars_total integer default 0;
alter table public.classroom_sessions add column if not exists is_currently_away boolean default false;
alter table public.classroom_sessions add column if not exists total_errors_count integer default 0;
alter table public.classroom_sessions add column if not exists total_attempts_count integer default 0;
alter table public.classroom_sessions add column if not exists completed_tasks_count integer default 0;
alter table public.classroom_sessions add column if not exists last_code_snippet text;
alter table public.classroom_sessions add column if not exists last_error_message text;
alter table public.classroom_sessions add column if not exists events_log jsonb default '[]';
alter table public.classroom_sessions alter column status set default 'active';
alter table public.profiles alter column group_name drop default;

create table if not exists public.task_checks (
  task_id text primary key references public.tasks(id) on delete cascade,
  tests jsonb not null default '[]', quiz_options jsonb not null default '[]', solution_code text
);
insert into public.task_checks(task_id, tests, quiz_options, solution_code)
select id, coalesce(tests,'[]'), coalesce(quiz_options,'[]'), solution_code from public.tasks
on conflict (task_id) do nothing;
-- Only public question text is sent to students; answers live in task_checks.
update public.tasks set solution_code = null, tests = '[]', quiz_options = (
  select coalesce(jsonb_agg(option - 'isCorrect' - 'explanation'), '[]') from jsonb_array_elements(coalesce(quiz_options,'[]')) option
);

create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'teacher');
$$;
create or replace function public.can_access_course(course_id text, viewer_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.id = viewer_id and
    (p.role = 'teacher' or (p.is_approved and exists(select 1 from public.group_courses g where g.group_name = p.group_name and g.course_id = $1))));
$$;
create or replace function public.can_access_module(module_id text, viewer_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.modules m join public.profiles p on p.id = viewer_id where m.id = $1 and
    (p.role = 'teacher' or (public.can_access_course(m.course_id,viewer_id) and exists(
      select 1 from public.group_modules g where g.group_name = p.group_name and g.module_id = m.id and g.course_id = m.course_id))));
$$;
create or replace function public.can_access_task(task_id text, viewer_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.tasks t join public.lessons l on l.id = t.lesson_id where t.id = $1 and public.can_access_module(l.module_id,viewer_id));
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  assigned_role text := 'student';
  is_auto_approved boolean := false;
  assigned_group text := null;
begin
  if lower(coalesce(new.email,'')) in ('kos108568@gmail.com')
     or lower(coalesce(new.raw_user_meta_data->>'user_name','')) in ('kos108568-sys','kos108568') then
    assigned_role := 'teacher';
    is_auto_approved := true;
    assigned_group := 'Преподавательский состав';
  end if;

  insert into public.profiles(id,email,full_name,role,group_name,is_approved,total_xp,streak_days)
  values(
    new.id,
    coalesce(new.email,''),
    coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'user_name','Студент'),
    assigned_role,
    assigned_group,
    is_auto_approved,
    case when assigned_role = 'teacher' then 1000 else 0 end,
    1
  )
  on conflict(id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Блокировка попыток студентов самостоятельно повысить себе привилегии или изменить статус одобрения
create or replace function public.protect_profile_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_teacher() then
    if new.role is distinct from old.role then
      raise exception 'Запрещено самостоятельно менять роль профиля';
    end if;
    if new.is_approved is distinct from old.is_approved then
      raise exception 'Запрещено самостоятельно менять статус одобрения';
    end if;
    if new.total_xp is distinct from old.total_xp then
      raise exception 'Запрещено изменять опыт напрямую';
    end if;
  end if;
  return new;
end; $$;
drop trigger if exists protect_profile_columns_trg on public.profiles;
create trigger protect_profile_columns_trg before update on public.profiles for each row execute function public.protect_profile_columns();

-- Replace every legacy permissive policy, including names from earlier schema versions.
do $$ declare p record; t text; begin
  for p in select schemaname,tablename,policyname from pg_policies where schemaname = 'public' and tablename = any(array[
    'profiles','academic_groups','group_courses','group_modules','courses','modules','lessons','tasks','task_checks','student_progress','classroom_sessions','classroom_announcements']) loop
    execute format('drop policy %I on %I.%I',p.policyname,p.schemaname,p.tablename);
  end loop;
  foreach t in array array['profiles','academic_groups','group_courses','group_modules','courses','modules','lessons','tasks','task_checks','student_progress','classroom_sessions','classroom_announcements'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
    execute format('grant select on public.%I to authenticated',t);
  end loop;
end $$;
create policy profiles_read on public.profiles for select to authenticated using(id = auth.uid() or public.is_teacher());
create policy groups_read on public.academic_groups for select to authenticated using(true);
create policy groups_write on public.academic_groups for all to authenticated using(public.is_teacher()) with check(public.is_teacher());
create policy course_access_read on public.group_courses for select to authenticated using(public.is_teacher() or group_name = (select group_name from public.profiles where id = auth.uid()));
create policy course_access_write on public.group_courses for all to authenticated using(public.is_teacher()) with check(public.is_teacher());
create policy module_access_read on public.group_modules for select to authenticated using(public.is_teacher() or group_name = (select group_name from public.profiles where id = auth.uid()));
create policy module_access_write on public.group_modules for all to authenticated using(public.is_teacher()) with check(public.is_teacher());
create policy courses_read on public.courses for select to authenticated using(public.can_access_course(id));
create policy modules_read on public.modules for select to authenticated using(public.can_access_module(id));
create policy lessons_read on public.lessons for select to authenticated using(public.can_access_module(module_id));
create policy tasks_read on public.tasks for select to authenticated using(public.can_access_task(id));
create policy checks_teacher on public.task_checks for select to authenticated using(public.is_teacher());
create policy progress_read on public.student_progress for select to authenticated using(user_id = auth.uid() or public.is_teacher());
create policy sessions_read on public.classroom_sessions for select to authenticated using(user_id = auth.uid() or public.is_teacher());
create policy sessions_insert on public.classroom_sessions for insert to authenticated with check(user_id = auth.uid() and (active_task_id is null or public.can_access_task(active_task_id)));
create policy sessions_update on public.classroom_sessions for update to authenticated using(user_id = auth.uid()) with check(user_id = auth.uid() and (active_task_id is null or public.can_access_task(active_task_id)));
create policy announcements_read on public.classroom_announcements for select to authenticated using(public.is_teacher() or group_name = (select group_name from public.profiles where id = auth.uid() and is_approved));
grant insert,update,delete on public.academic_groups,public.group_courses,public.group_modules to authenticated;
grant insert(user_id,active_task_id,status,needs_help,help_message,last_ping_at) on public.classroom_sessions to authenticated;
grant update(active_task_id,status,needs_help,help_message,last_ping_at) on public.classroom_sessions to authenticated;

create or replace function public.session_group() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  select group_name into new.group_name from public.profiles where id = new.user_id;
  if new.group_name is null then raise exception 'Выберите учебную группу'; end if;
  return new;
end; $$;
drop trigger if exists session_group on public.classroom_sessions;
create trigger session_group before insert or update on public.classroom_sessions for each row execute function public.session_group();
update public.classroom_sessions s set group_name = p.group_name from public.profiles p where p.id = s.user_id and p.group_name is not null;

create or replace function public.submit_onboarding(new_full_name text,new_group_name text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or length(trim(new_full_name)) not between 2 and 200 or not exists(select 1 from public.academic_groups where name = new_group_name) then raise exception 'Некорректные данные заявки'; end if;
  update public.profiles set full_name=trim(new_full_name),group_name=new_group_name,is_approved=false where id=auth.uid() and role='student';
  if not found then raise exception 'Профиль студента не найден'; end if;
end; $$;
create or replace function public.approve_student(student_id uuid,new_full_name text default null,new_group_name text default null) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_teacher() then raise exception 'Требуется роль преподавателя'; end if;
  if not exists(select 1 from public.academic_groups where name=new_group_name) or length(trim(new_full_name)) not between 2 and 200 then raise exception 'Проверьте ФИО и группу'; end if;
  update public.profiles set full_name=trim(new_full_name),group_name=new_group_name,is_approved=true where id=student_id and role='student';
  return found;
end; $$;
create or replace function public.edit_student(student_id uuid,new_full_name text,new_group_name text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_teacher() then raise exception 'Требуется роль преподавателя'; end if;
  if not exists(select 1 from public.academic_groups where name=new_group_name) or length(trim(new_full_name)) not between 2 and 200 then raise exception 'Проверьте ФИО и группу'; end if;
  update public.profiles set full_name=trim(new_full_name),group_name=new_group_name where id=student_id and role='student';
  return found;
end; $$;
create or replace function public.reject_student(student_id uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_teacher() then raise exception 'Требуется роль преподавателя'; end if;
  update public.profiles set is_approved=false,group_name=null where id=student_id and role='student';
  return found;
end; $$;

create or replace function public.complete_verified_task(student_id uuid,completed_task_id text) returns integer
language plpgsql security definer set search_path = '' as $$
declare reward integer; lesson text; changed integer;
begin
  if not public.can_access_task(completed_task_id,student_id) then raise exception 'Задание недоступно'; end if;
  select xp,lesson_id into reward,lesson from public.tasks where id=completed_task_id;
  insert into public.student_progress(user_id,task_id,lesson_id,status,completed_at)
  values(student_id,completed_task_id,lesson,'completed',now())
  on conflict(user_id,task_id) do update set status='completed',completed_at=now()
    where public.student_progress.status <> 'completed';
  get diagnostics changed = row_count;
  if changed = 0 then return 0; end if;
  update public.profiles set total_xp=coalesce(total_xp,0)+reward where id=student_id;
  return reward;
end; $$;

create or replace function public.send_teacher_hint(student_id uuid,comment_text text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_teacher() then raise exception 'Требуется роль преподавателя'; end if;
  update public.classroom_sessions set teacher_comment=left(comment_text,4000),needs_help=false,status='active' where user_id=student_id;
  if not found then raise exception 'Сессия студента не найдена'; end if;
end; $$;
create or replace function public.publish_announcement(target_group text,announcement text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_teacher() then raise exception 'Требуется роль преподавателя'; end if;
  if not exists(select 1 from public.academic_groups where name=target_group) then raise exception 'Группа не найдена'; end if;
  perform pg_advisory_xact_lock(hashtext(target_group));
  update public.classroom_announcements set is_active=false where group_name=target_group and is_active;
  if nullif(trim(announcement),'') is not null then
    insert into public.classroom_announcements(group_name,teacher_id,message) values(target_group,auth.uid(),left(trim(announcement),4000));
  end if;
end; $$;

create or replace function public.record_telemetry(event jsonb,patch jsonb default '{}') returns void
language plpgsql security definer set search_path = '' as $$
declare task text := event->>'taskId'; kind text := event->>'type';
begin
  if auth.uid() is null or not public.can_access_task(task) then raise exception 'Задание недоступно'; end if;
  if length(event::text)>10000 or nullif(event->>'id','') is null then raise exception 'Некорректное событие'; end if;
  insert into public.classroom_sessions(user_id,active_task_id,status) values(auth.uid(),task,'active') on conflict(user_id) do nothing;
  perform 1 from public.classroom_sessions where user_id=auth.uid() for update;
  if exists(select 1 from public.classroom_sessions s,jsonb_array_elements(s.events_log) e where s.user_id=auth.uid() and e->>'id'=event->>'id') then return; end if;
  update public.classroom_sessions set
    active_task_id=task,last_ping_at=now(),
    events_log=(select coalesce(jsonb_agg(x),'[]') from (select value x from jsonb_array_elements(jsonb_build_array(event)||events_log) limit 50) q),
    tab_switch_count=tab_switch_count+case when kind='tab_switch_away' then 1 else 0 end,
    total_away_seconds=total_away_seconds+case when kind='tab_switch_back' then greatest(0,least(86400,coalesce((event->>'durationSeconds')::integer,0))) else 0 end,
    is_currently_away=case when kind='tab_switch_away' then true when kind='tab_switch_back' then false else is_currently_away end,
    paste_count=paste_count+case when kind='code_paste' then 1 else 0 end,
    pasted_chars_total=pasted_chars_total+case when kind='code_paste' then greatest(0,least(65536,coalesce((event->>'pastedChars')::integer,0))) else 0 end,
    total_errors_count=total_errors_count+case when kind in ('code_error','quiz_error') then 1 else 0 end,
    total_attempts_count=total_attempts_count+case when kind in ('code_error','quiz_error','task_completed') then 1 else 0 end,
    completed_tasks_count=(select count(*) from public.student_progress where user_id=auth.uid() and status='completed'),
    last_code_snippet=case when patch ? 'lastCodeSnippet' then left(patch->>'lastCodeSnippet',65536) else last_code_snippet end,
    last_error_message=case when kind='task_completed' then null when patch ? 'lastErrorMessage' then left(patch->>'lastErrorMessage',4000) else last_error_message end
  where user_id=auth.uid();
end; $$;

create or replace function public.increment_xp(user_id uuid, amount integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  safe_amount integer := greatest(0, least(1000, coalesce(amount, 0)));
  new_total integer;
begin
  if auth.uid() is null then raise exception 'Требуется авторизация'; end if;
  if auth.uid() <> user_id and not public.is_teacher() then
    raise exception 'Запрещено начислять опыт другим пользователям';
  end if;
  update public.profiles
  set total_xp = coalesce(total_xp, 0) + safe_amount
  where id = user_id
  returning total_xp into new_total;
  return new_total;
end; $$;

create or replace function public.create_task(payload jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare options jsonb := coalesce(payload->'quizOptions','[]'); checks jsonb := coalesce(payload->'tests','[]');
begin
  if not public.is_teacher() then raise exception 'Требуется роль преподавателя'; end if;
  if length(trim(payload->>'title')) not between 1 and 300 or (payload->>'xp')::integer not between 0 and 1000 then raise exception 'Проверьте название и XP'; end if;
  if payload->>'type'='quiz' then
    if jsonb_array_length(options)<2 or (select count(*) from jsonb_array_elements(options) o where o->>'isCorrect'='true')<>1 then raise exception 'Нужны варианты и один правильный ответ'; end if;
  elsif payload->>'type' in ('code_challenge','spot_bug','code_fill') then
    if jsonb_array_length(checks)=0 or exists(select 1 from jsonb_array_elements(checks) t where jsonb_typeof(t->'expectedOutput') is distinct from 'string') then raise exception 'Нужен ожидаемый вывод'; end if;
  else raise exception 'Неподдерживаемый тип задания'; end if;
  insert into public.tasks(id,lesson_id,title,type,difficulty,xp,instructions,initial_code,tests,quiz_options,hints,order_index)
  values(payload->>'id',payload->>'lessonId',payload->>'title',payload->>'type',payload->>'difficulty',(payload->>'xp')::integer,payload->>'instructions',payload->>'initialCode','[]',
    (select coalesce(jsonb_agg(o-'isCorrect'-'explanation'),'[]') from jsonb_array_elements(options) o),coalesce(payload->'hints','[]'),
    (select coalesce(max(order_index),0)+1 from public.tasks where lesson_id=payload->>'lessonId'));
  insert into public.task_checks(task_id,tests,quiz_options) values(payload->>'id',checks,options);
end; $$;

-- Functions are not callable by PUBLIC/anon merely because they are SECURITY DEFINER.
do $$ declare f record; begin
  for f in select p.oid::regprocedure signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname=any(array['is_teacher','can_access_course','can_access_module','can_access_task','handle_new_user','session_group','submit_onboarding','approve_student','edit_student','reject_student','complete_verified_task','send_teacher_hint','publish_announcement','record_telemetry','create_task','increment_xp']) loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
    if f.proname not in ('complete_verified_task','handle_new_user','session_group') then execute format('grant execute on function %s to authenticated',f.signature); end if;
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['profiles','classroom_sessions','classroom_announcements','student_progress','group_courses','group_modules','tasks'] loop
    begin execute format('alter publication supabase_realtime add table public.%I',t); exception when duplicate_object then null; end;
  end loop;
end $$;
commit;

-- Generated by npm run seed:generate. All built-in C# and Git tasks.
begin;
insert into public.courses (id,title,language,description,version) values ('csharp-foundations','C# Pro: От Базового Синтаксиса до ООП и LINQ','C#','Академический интерактивный курс для аудиторных занятий. Никакой воды — реальный код, компиляторные проверки и строгая практика.','12.0 (.NET 8)') on conflict (id) do update set title=excluded.title,language=excluded.language,description=excluded.description,version=excluded.version;
insert into public.courses (id,title,language,description,version) values ('git-branching','Git Branching Lab','Git','Практика Git','1') on conflict (id) do update set title=excluded.title,language=excluded.language,description=excluded.description,version=excluded.version;
insert into public.modules (id,course_id,title,description,order_index,icon_name) values ('mod-1','csharp-foundations','Модуль 1: Базовый синтаксис, переменные и типы данных','Точка входа Main, вывод Console.WriteLine, строгая статическая типизация, переменные и консольный ввод.',1,'Terminal') on conflict (id) do update set course_id=excluded.course_id,title=excluded.title,description=excluded.description,order_index=excluded.order_index,icon_name=excluded.icon_name;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-1-1','mod-1','1.1 Первая программа и вывод в консоль','first-program',1,'Изучаем структуру программы, Console.WriteLine, интерполяцию строк и чтение ввода.',15) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-1-1-1','les-1-1','Вывод приветствия разработчика','code_challenge','easy',25,'Напишите код, который выводит в консоль строку "Hello, C# Developer!". Соблюдайте регистр букв и знаки препинания.','// В C# для вывода данных в стандартный поток используется класс Console.
// Метод WriteLine автоматически переводит курсор на новую строку:
Console.WriteLine("Текст сообщения");','using System;

class Program
{
    static void Main()
    {
        // Напишите команду вывода ниже:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Используйте Console.WriteLine(...)","Не забудьте точку с запятой в конце инструкции ;","Строка должна быть заключена в двойные кавычки"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-1-1-1','[{"id":"t1","description":"Выводит \"Hello, C# Developer!\" в консоль","expectedOutput":"Hello, C# Developer!"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        Console.WriteLine("Hello, C# Developer!");
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-1-1-2','les-1-1','Интерполяция строк ($)','code_challenge','easy',30,'Объявите строковую переменную language со значением "C#". Затем выведите сообщение "Я изучаю {language} в аудитории!" с помощью интерполяции строк ($"...{...}...").','// Интерполяция строк в C# обозначается знаком $ перед строковым литералом:
string name = "Алексей";
Console.WriteLine($"Привет, {name}!");','using System;

class Program
{
    static void Main()
    {
        // 1. Объявите string language = "C#";
        // 2. Выведите строку через $
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Используйте знак $ перед открывающей двойной кавычкой: $\"Я изучаю {language} в аудитории!\"","Переменная объявляется как: string language = \"C#\";"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-1-1-2','[{"id":"t1","description":"Сообщение с подставленной переменной language","expectedOutput":"Я изучаю C# в аудитории!"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        string language = "C#";
        Console.WriteLine($"Я изучаю {language} в аудитории!");
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-1-1-3','les-1-1','Проверка понимания: Console.Write vs Console.WriteLine','quiz','easy',20,'В чем ключевое отличие Console.WriteLine от Console.Write?',null,null,null,'[]'::jsonb,'[{"id":"q1","text":"Console.WriteLine добавляет символ перевода строки (\\n) в конце вывода"},{"id":"q2","text":"Console.Write может выводить только числа, а WriteLine — любые типы"},{"id":"q3","text":"Console.WriteLine работает быстрее, так как не буферизирует вывод"}]'::jsonb,'["Обратите внимание на суффикс Line в названии метода"]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-1-1-3','[]'::jsonb,'[{"id":"q1","text":"Console.WriteLine добавляет символ перевода строки (\\n) в конце вывода","isCorrect":true,"explanation":"Совершенно верно! WriteLine переносит курсор на новую строку, а Write оставляет его на текущей."},{"id":"q2","text":"Console.Write может выводить только числа, а WriteLine — любые типы","isCorrect":false,"explanation":"Оба метода перегружены для приема практически любых типов данных."},{"id":"q3","text":"Console.WriteLine работает быстрее, так как не буферизирует вывод","isCorrect":false,"explanation":"Оба метода работают через один и тот же стандартный поток TextWriter."}]'::jsonb,null) on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-1-1-4','les-1-1','Чтение строки с Console.ReadLine()','code_challenge','easy',30,'Объявите переменную userName и прочитайте значение из консоли с помощью Console.ReadLine(). Затем выведите приветствие: $"Добро пожаловать, {userName}!". (Для проверки используется имя "Антон").','// Метод Console.ReadLine() считывает всю введенную строку до нажатия Enter:
string input = Console.ReadLine();
Console.WriteLine($"Вы ввели: {input}");','using System;

class Program
{
    static void Main()
    {
        // Считайте имя пользователя через Console.ReadLine()
        // Выведите: Добро пожаловать, {userName}!
        string userName = "Антон";
        Console.WriteLine($"Добро пожаловать, {userName}!");
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Используйте интерполяцию: Console.WriteLine($\"Добро пожаловать, {userName}!\");"]'::jsonb,4) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-1-1-4','[{"id":"t1","description":"Выводит приветствие с именем","expectedOutput":"Добро пожаловать, Антон!"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        string userName = "Антон";
        Console.WriteLine($"Добро пожаловать, {userName}!");
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-1-2','mod-1','1.2 Типы данных, приведение и парсинг','data-types-conversions',2,'Целочисленные, вещественные типы, строки, bool, приведение типов и безопасный парсинг.',20) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-1-2-1','les-1-2','Парсинг строки в целое число','code_challenge','medium',35,'Дана строковая переменная input = "42". Преобразуйте её в целочисленную переменную score с помощью int.Parse() и прибавьте к ней 8. Выведите результат.','// Для преобразования строки в целое число используется int.Parse():
string raw = "100";
int number = int.Parse(raw);','using System;

class Program
{
    static void Main()
    {
        string input = "42";
        // Преобразуйте input в int, прибавьте 8 и выведите в консоль:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Используйте: int score = int.Parse(input);","Затем: Console.WriteLine(score + 8);"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-1-2-1','[{"id":"t1","description":"Выводит сумму 50 в консоль","expectedOutput":"50"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        string input = "42";
        int score = int.Parse(input);
        Console.WriteLine(score + 8);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-1-2-2','les-1-2','Поиск ошибки: Целочисленное деление','spot_bug','medium',30,'В коде ниже программист хотел вычислить точное среднее значение 7 / 2 (ожидая 3.5), но получает 3. Исправьте код, сделав хотя бы один из операндов вещественным типом (double).','// В C# деление двух int дает int (дробная часть отбрасывается):
// 7 / 2 == 3
// Чтобы получить дробь, нужно явное приведение или литерал double:
// (double)7 / 2 == 3.5 или 7.0 / 2 == 3.5','using System;

class Program
{
    static void Main()
    {
        int a = 7;
        int b = 2;
        // Ошибка: деление int на int
        double result = a / b;
        Console.WriteLine(result);
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Используйте явное приведение типа: (double)a / b","Либо объявите double a = 7;"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-1-2-2','[{"id":"t1","description":"Выводит 3.5 или 3,5","expectedOutput":"3.5"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        int a = 7;
        int b = 2;
        double result = (double)a / b;
        Console.WriteLine(result);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-1-2-3','les-1-2','Квиз: Размеры и точность типов в .NET','quiz','easy',20,'Какой тип данных в C# обеспечивает наивысшую точность для финансовых вычислений без погрешностей округления чисел с плавающей точкой?',null,null,null,'[]'::jsonb,'[{"id":"q1","text":"decimal (128 бит / 16 байт, основание 10)"},{"id":"q2","text":"double (64 бит / 8 байт, стандарт IEEE 754)"},{"id":"q3","text":"long (64 бит / 8 байт целое число)"}]'::jsonb,'["Ищите тип, специально созданный для финансов"]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-1-2-3','[]'::jsonb,'[{"id":"q1","text":"decimal (128 бит / 16 байт, основание 10)","isCorrect":true,"explanation":"Абсолютно верно! decimal использует десятичное представление с фиксированной запятой, что исключает ошибки округления в денежных операциях."},{"id":"q2","text":"double (64 бит / 8 байт, стандарт IEEE 754)","isCorrect":false,"explanation":"double использует двоичное представление и подвержен погрешностям вроде 0.1 + 0.2 != 0.3."},{"id":"q3","text":"long (64 бит / 8 байт целое число)","isCorrect":false,"explanation":"long может хранить только целые числа, он не подходит для дробных сумм."}]'::jsonb,null) on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-1-2-4','les-1-2','Вычисление периметра и площади','code_challenge','easy',35,'Даны стороны прямоугольника int width = 5 и int height = 8. Вычислите его периметр P = 2 * (width + height) и площадь S = width * height. Выведите две строки: "Периметр: {P}" и "Площадь: {S}".','int a = 10;
int b = 20;
int sum = a + b;
Console.WriteLine($"Сумма: {sum}");','using System;

class Program
{
    static void Main()
    {
        int width = 5;
        int height = 8;
        
        // Вычислите периметр и площадь:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["p = 2 * (width + height);","s = width * height;"]'::jsonb,4) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-1-2-4','[{"id":"t1","description":"Выводит правильный периметр 26 и площадь 40","expectedOutput":"Периметр: 26\nПлощадь: 40"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        int width = 5;
        int height = 8;
        int p = 2 * (width + height);
        int s = width * height;
        Console.WriteLine($"Периметр: {p}");
        Console.WriteLine($"Площадь: {s}");
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-1-3','mod-1','1.3 Логические операции и булевы выражения','boolean-logic',3,'Логические операторы И (&&), ИЛИ (||), НЕ (!), приоритет и ленивые вычисления.',15) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-1-3-1','les-1-3','Проверка диапазона чисел через &&','code_challenge','easy',30,'Дана переменная int age = 20. Напишите булево выражение, проверяющее, что возраст находится в студенческом диапазоне от 17 до 25 включительно (age >= 17 && age <= 25). Сохраните результат в bool isStudentAge и выведите его в консоль.','// Оператор && (логическое И) возвращает true только если оба операнда истинны:
bool inRange = x >= 10 && x <= 50;','using System;

class Program
{
    static void Main()
    {
        int age = 20;
        // Объявите bool isStudentAge и выведите в консоль:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Используйте: bool isStudentAge = age >= 17 && age <= 25;","Затем: Console.WriteLine(isStudentAge);"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-1-3-1','[{"id":"t1","description":"Выводит True","expectedOutput":"True"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        int age = 20;
        bool isStudentAge = age >= 17 && age <= 25;
        Console.WriteLine(isStudentAge);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-1-3-2','les-1-3','Квиз: Ленивые вычисления (Short-Circuit Evaluation)','quiz','medium',25,'Что произойдет при вычислении выражения: `false && (10 / 0 == 1)`?',null,null,null,'[]'::jsonb,'[{"id":"q1","text":"Результат будет false, ошибки деления на ноль не возникнет благодаря Short-Circuiting"},{"id":"q2","text":"Программа выбросит исключение DivideByZeroException"},{"id":"q3","text":"Ошибка компиляции"}]'::jsonb,'["Вспомните, как работает оператор && при ложном первом условии"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-1-3-2','[]'::jsonb,'[{"id":"q1","text":"Результат будет false, ошибки деления на ноль не возникнет благодаря Short-Circuiting","isCorrect":true,"explanation":"Верно! Оператор && проверяет левый операнд. Так как он false, правая часть даже не вычисляется, и DivideByZeroException не выбрасывается."},{"id":"q2","text":"Программа выбросит исключение DivideByZeroException","isCorrect":false,"explanation":"Это произошло бы при использовании не-короткого оператора &, но с && правая часть игнорируется."},{"id":"q3","text":"Ошибка компиляции","isCorrect":false,"explanation":"Код синтаксически корректен и успешно компилируется."}]'::jsonb,null) on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-1-3-3','les-1-3','Поиск ошибки: = вместо == в условии','spot_bug','easy',25,'Студент хотел проверить, равен ли статус коду 200, но допустил опечатку с оператором присваивания. Исправьте ошибку.','// = это присваивание: int x = 5;
// == это сравнение на равенство: if (x == 5)','using System;

class Program
{
    static void Main()
    {
        int statusCode = 200;
        bool isOk = statusCode == 200;
        Console.WriteLine($"Статус ОК: {isOk}");
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Убедитесь, что используется оператор сравнения =="]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-1-3-3','[{"id":"t1","description":"Выводит Статус ОК: True","expectedOutput":"Статус ОК: True"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        int statusCode = 200;
        bool isOk = statusCode == 200;
        Console.WriteLine($"Статус ОК: {isOk}");
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.modules (id,course_id,title,description,order_index,icon_name) values ('mod-2','csharp-foundations','Модуль 2: Управляющие конструкции и ветвления','Условия if-else, тернарный оператор, классический switch и современные pattern matching выражения.',2,'GitBranch') on conflict (id) do update set course_id=excluded.course_id,title=excluded.title,description=excluded.description,order_index=excluded.order_index,icon_name=excluded.icon_name;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-2-1','mod-2','2.1 Ветвления if / else if / else','conditionals',1,'Принятие решений в коде на основе булевых выражений и тернарный оператор.',20) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-2-1-1','les-2-1','Проверка студенческой оценки','code_challenge','medium',40,'Дана переменная int points = 85. Если points >= 90, выведите "Отлично". Иначе если points >= 75, выведите "Хорошо". В остальных случаях выведите "Требуется пересдача".','if (условие)
{
    // ...
}
else if (другое_условие)
{
    // ...
}
else
{
    // ...
}','using System;

class Program
{
    static void Main()
    {
        int points = 85;
        // Напишите проверку условий:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Используйте структуру if (...) { ... } else if (...) { ... } else { ... }","Проверку points >= 90 ставьте первой"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-2-1-1','[{"id":"t1","description":"Для 85 баллов выводит \"Хорошо\"","expectedOutput":"Хорошо"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        int points = 85;
        if (points >= 90)
        {
            Console.WriteLine("Отлично");
        }
        else if (points >= 75)
        {
            Console.WriteLine("Хорошо");
        }
        else
        {
            Console.WriteLine("Требуется пересдача");
        }
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-2-1-2','les-2-1','Современные Switch Expressions в C#','code_challenge','medium',45,'Используйте switch expression (стрелочный синтаксис C# 8+), чтобы получить строковый статус роли: "admin" => "Администратор", "teacher" => "Преподаватель", _ => "Студент". Для role = "teacher" выведите результат.','// Современный switch-expression компактен:
string title = role switch
{
    "admin" => "Администратор",
    "teacher" => "Преподаватель",
    _ => "Студент"
};','using System;

class Program
{
    static void Main()
    {
        string role = "teacher";
        // Напишите switch expression:
        string title = role switch
        {
            // дополните ветки
        };
        Console.WriteLine(title);
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Символ _ (дефис подчеркивания) обозначает дефолтный случай (default)","Не забудьте точку с запятой после закрывающей фигурной скобки switch-выражения"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-2-1-2','[{"id":"t1","description":"Выводит \"Преподаватель\"","expectedOutput":"Преподаватель"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        string role = "teacher";
        string title = role switch
        {
            "admin" => "Администратор",
            "teacher" => "Преподаватель",
            _ => "Студент"
        };
        Console.WriteLine(title);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-2-1-3','les-2-1','Тернарный условный оператор (?:)','code_challenge','easy',30,'Даны два числа: int a = 15; int b = 27;. С помощью тернарного оператора ?: найдите максимальное число и выведите его в консоль: "Максимум: {max}".','// Тернарный оператор имеет форму: условие ? значение_если_true : значение_если_false
int max = a > b ? a : b;','using System;

class Program
{
    static void Main()
    {
        int a = 15;
        int b = 27;
        // Найдите max через тернарный оператор:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["int max = a > b ? a : b;","Console.WriteLine($\"Максимум: {max}\");"]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-2-1-3','[{"id":"t1","description":"Выводит \"Максимум: 27\"","expectedOutput":"Максимум: 27"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        int a = 15;
        int b = 27;
        int max = a > b ? a : b;
        Console.WriteLine($"Максимум: {max}");
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-2-2','mod-2','2.2 Pattern Matching и сопоставление с шаблоном','pattern-matching',2,'Реляционные шаблоны, логические связки and/or в паттернах C# 9+.',20) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-2-2-1','les-2-2','Определение дня недели по номеру','code_challenge','easy',35,'Дано число int day = 3. Используя switch-expression, сопоставьте: 1 => "Понедельник", 2 => "Вторник", 3 => "Среда", 4 => "Четверг", 5 => "Пятница", 6 or 7 => "Выходной", _ => "Некорректный день". Выведите результат.','string dayName = day switch
{
    1 => "Понедельник",
    6 or 7 => "Выходной",
    _ => "Ошибка"
};','using System;

class Program
{
    static void Main()
    {
        int day = 3;
        // Напишите switch expression:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Используйте стрелочный синтаксис: 3 => \"Среда\",","Для выходных: 6 or 7 => \"Выходной\","]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-2-2-1','[{"id":"t1","description":"Выводит \"Среда\" для day = 3","expectedOutput":"Среда"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        int day = 3;
        string dayName = day switch
        {
            1 => "Понедельник",
            2 => "Вторник",
            3 => "Среда",
            4 => "Четверг",
            5 => "Пятница",
            6 or 7 => "Выходной",
            _ => "Некорректный день"
        };
        Console.WriteLine(dayName);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-2-2-2','les-2-2','Реляционные шаблоны температуры (<, >= and <)','code_challenge','medium',45,'Дана переменная int temp = -5. Используя реляционные шаблоны в switch, классифицируйте погоду: < 0 => "Мороз", >= 0 and <= 20 => "Прохладно", _ => "Тепло". Выведите результат в консоль.','// Реляционные шаблоны (Relational Patterns) в C# 9+:
string status = temp switch
{
    < 0 => "Мороз",
    >= 0 and <= 20 => "Прохладно",
    _ => "Тепло"
};','using System;

class Program
{
    static void Main()
    {
        int temp = -5;
        // Напишите реляционный switch:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Используйте операторы < 0 => \"Мороз\",","Дефолтная ветка: _ => \"Тепло\""]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-2-2-2','[{"id":"t1","description":"Выводит \"Мороз\" для -5","expectedOutput":"Мороз"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        int temp = -5;
        string status = temp switch
        {
            < 0 => "Мороз",
            >= 0 and <= 20 => "Прохладно",
            _ => "Тепло"
        };
        Console.WriteLine(status);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-2-2-3','les-2-2','Квиз: Ключевое слово when в switch','quiz','medium',25,'Для чего используется ключевое слово `when` в ветках конструкции switch?',null,null,null,'[]'::jsonb,'[{"id":"q1","text":"Для задания дополнительного булевого условия (case guard) фильтрации ветки"},{"id":"q2","text":"Для запуска асинхронного таймера ожидания перед выполнением ветки"},{"id":"q3","text":"Для завершения работы метода"}]'::jsonb,'["Подумайте о фильтрации (case guard)"]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-2-2-3','[]'::jsonb,'[{"id":"q1","text":"Для задания дополнительного булевого условия (case guard) фильтрации ветки","isCorrect":true,"explanation":"Верно! when позволяет добавить произвольное логическое условие: case int n when n % 2 == 0."},{"id":"q2","text":"Для запуска асинхронного таймера ожидания перед выполнением ветки","isCorrect":false,"explanation":"Слово when в паттерн-матчинге не связано с таймерами."},{"id":"q3","text":"Для завершения работы метода","isCorrect":false,"explanation":"Для выхода из метода используется return."}]'::jsonb,null) on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.modules (id,course_id,title,description,order_index,icon_name) values ('mod-3','csharp-foundations','Модуль 3: Циклы и алгоритмы итераций','Многократное повторение инструкций: циклы for, while, do-while, алгоритмы накопления, break и continue.',3,'Layers') on conflict (id) do update set course_id=excluded.course_id,title=excluded.title,description=excluded.description,order_index=excluded.order_index,icon_name=excluded.icon_name;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-3-1','mod-3','3.1 Цикл for и счетчики','loops-for',1,'Классический цикл for, шаги итераций и накопители.',20) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-3-1-1','les-3-1','Сумма четных чисел от 1 до 10','code_challenge','medium',40,'Напишите цикл for, который находит сумму всех четных чисел в диапазоне от 1 до 10 включительно (2 + 4 + 6 + 8 + 10 = 30) и выводит итоговую сумму в консоль.','int sum = 0;
for (int i = 1; i <= n; i++)
{
    if (i % 2 == 0)
    {
        sum += i;
    }
}','using System;

class Program
{
    static void Main()
    {
        int sum = 0;
        // Напишите цикл for от 1 до 10:
        
        Console.WriteLine(sum);
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Проверка четности: i % 2 == 0","Границы цикла: for (int i = 1; i <= 10; i++)"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-3-1-1','[{"id":"t1","description":"Выводит число 30","expectedOutput":"30"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        int sum = 0;
        for (int i = 1; i <= 10; i++)
        {
            if (i % 2 == 0)
            {
                sum += i;
            }
        }
        Console.WriteLine(sum);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-3-1-2','les-3-1','Вычисление факториала числа (n!)','code_challenge','medium',45,'Дано число int n = 5. Вычислите факториал числа 5! = 1 * 2 * 3 * 4 * 5 = 120 с помощью цикла for и выведите результат.','int fact = 1;
for (int i = 1; i <= n; i++)
{
    fact *= i;
}','using System;

class Program
{
    static void Main()
    {
        int n = 5;
        int factorial = 1;
        // Вычислите факториал в цикле for:
        
        Console.WriteLine(factorial);
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Инициализируйте int factorial = 1;","В цикле умножайте: factorial *= i;"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-3-1-2','[{"id":"t1","description":"Выводит 120 для 5!","expectedOutput":"120"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        int n = 5;
        int factorial = 1;
        for (int i = 1; i <= n; i++)
        {
            factorial *= i;
        }
        Console.WriteLine(factorial);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-3-1-3','les-3-1','Поиск бага: Бесконечный цикл из-за ошибки шага','spot_bug','medium',35,'В коде ниже разработчик хотел вывести обратный отсчет от 5 до 1, но случайно увеличивал счетчик i++ вместо уменьшения i--, из-за чего цикл зацикливался. Исправьте ошибку.','// Для обратного счета счетчик нужно уменьшать:
for (int i = 5; i >= 1; i--)
{
    Console.WriteLine(i);
}','using System;

class Program
{
    static void Main()
    {
        // Ошибка: счетчик увеличивается вместо уменьшения
        for (int i = 5; i >= 1; i--)
        {
            Console.Write(i + " ");
        }
        Console.WriteLine();
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Измените шаг на i--"]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-3-1-3','[{"id":"t1","description":"Выводит \"5 4 3 2 1 \"","expectedOutput":"5 4 3 2 1 "}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        for (int i = 5; i >= 1; i--)
        {
            Console.Write(i + " ");
        }
        Console.WriteLine();
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-3-2','mod-3','3.2 Циклы while, do-while, break и continue','loops-while',2,'Циклы с предусловием и постусловием, пропуск и прерывание итераций.',20) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-3-2-1','les-3-2','Подсчет количества цифр в числе через while','code_challenge','medium',45,'Дано положительное число int number = 12345. С помощью цикла while (number > 0) посчитайте, сколько в нем цифр (деля на 10 на каждом шаге), и выведите количество.','int count = 0;
while (num > 0)
{
    num /= 10;
    count++;
}','using System;

class Program
{
    static void Main()
    {
        int number = 12345;
        int count = 0;
        
        // Напишите цикл while:
        
        Console.WriteLine(count);
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["В теле цикла делите: number /= 10;","И увеличивайте счетчик: count++;"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-3-2-1','[{"id":"t1","description":"Выводит 5 для числа 12345","expectedOutput":"5"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        int number = 12345;
        int count = 0;
        while (number > 0)
        {
            number /= 10;
            count++;
        }
        Console.WriteLine(count);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-3-2-2','les-3-2','Оператор continue для пропуска нечетных','code_challenge','easy',35,'В цикле for от 1 до 6 используйте оператор continue, чтобы пропустить нечетные числа. Выведите только четные числа через Console.WriteLine.','for (int i = 1; i <= 10; i++)
{
    if (i % 2 != 0) continue; // переход к следующей итерации
    Console.WriteLine(i);
}','using System;

class Program
{
    static void Main()
    {
        for (int i = 1; i <= 6; i++)
        {
            // Если i нечетное, используйте continue
            
            Console.WriteLine(i);
        }
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["if (i % 2 != 0) continue;"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-3-2-2','[{"id":"t1","description":"Выводит четные числа 2, 4, 6","expectedOutput":"2\n4\n6"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        for (int i = 1; i <= 6; i++)
        {
            if (i % 2 != 0)
            {
                continue;
            }
            Console.WriteLine(i);
        }
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-3-2-3','les-3-2','Квиз: Особенность цикла do-while','quiz','easy',20,'Какая ключевая особенность отличает цикл `do-while` от обычного `while`?',null,null,null,'[]'::jsonb,'[{"id":"q1","text":"Тело цикла do-while гарантированно выполнится хотя бы 1 раз, так как проверка в конце"},{"id":"q2","text":"do-while выполняется быстрее, потому что компилируется без переходов"},{"id":"q3","text":"В do-while нельзя использовать оператор break"}]'::jsonb,'["Вспомните, где находится условие: в начале или в конце?"]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-3-2-3','[]'::jsonb,'[{"id":"q1","text":"Тело цикла do-while гарантированно выполнится хотя бы 1 раз, так как проверка в конце","isCorrect":true,"explanation":"Правильно! Проверка условия происходит после выполнения тела цикла (постусловие)."},{"id":"q2","text":"do-while выполняется быстрее, потому что компилируется без переходов","isCorrect":false,"explanation":"Оба цикла генерируют схожие инструкции IL."},{"id":"q3","text":"В do-while нельзя использовать оператор break","isCorrect":false,"explanation":"Операторы break и continue работают во всех циклах C#."}]'::jsonb,null) on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.modules (id,course_id,title,description,order_index,icon_name) values ('mod-4','csharp-foundations','Модуль 4: Методы и функции (Декомпозиция программ)','Разделение логики на повторно используемые функции, параметры, возврат значений, перегрузка, ref/out и методы-стрелки.',4,'Box') on conflict (id) do update set course_id=excluded.course_id,title=excluded.title,description=excluded.description,order_index=excluded.order_index,icon_name=excluded.icon_name;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-4-1','mod-4','4.1 Объявление методов и возврат значений','methods-basics',1,'Статические методы, параметры, сигнатура и возвращаемые значения.',20) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-4-1-1','les-4-1','Статический метод расчета налога CalculateTax','code_challenge','medium',45,'Напишите статический метод CalculateTax, который принимает параметр double income и возвращает 13% от дохода (income * 0.13). В методе Main вызовите его для дохода 100000 и выведите результат.','public static double CalculateTax(double income)
{
    return income * 0.13;
}','using System;

class Program
{
    // Объявите метод CalculateTax здесь:
    
    static void Main()
    {
        double tax = CalculateTax(100000);
        Console.WriteLine(tax);
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["public static double CalculateTax(double income) { return income * 0.13; }"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-4-1-1','[{"id":"t1","description":"Возвращает 13000","expectedOutput":"13000"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    public static double CalculateTax(double income)
    {
        return income * 0.13;
    }

    static void Main()
    {
        double tax = CalculateTax(100000);
        Console.WriteLine(tax);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-4-1-2','les-4-1','Процедурный метод void PrintBadge','code_challenge','easy',35,'Напишите метод static void PrintBadge(string name, string group), который выводит в консоль строку: $"[Студент]: {name} | Группа: {group}". Вызовите его для ("Иван", "ИТ-301").','static void PrintMessage(string msg)
{
    Console.WriteLine(msg);
}','using System;

class Program
{
    // Объявите метод PrintBadge:
    
    static void Main()
    {
        PrintBadge("Иван", "ИТ-301");
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["static void PrintBadge(string name, string group)","Console.WriteLine($\"[Студент]: {name} | Группа: {group}\");"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-4-1-2','[{"id":"t1","description":"Выводит карточку студента","expectedOutput":"[Студент]: Иван | Группа: ИТ-301"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void PrintBadge(string name, string group)
    {
        Console.WriteLine($"[Студент]: {name} | Группа: {group}");
    }

    static void Main()
    {
        PrintBadge("Иван", "ИТ-301");
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-4-1-3','les-4-1','Поиск бага: Не все пути к коду возвращают значение (CS0161)','spot_bug','medium',35,'В коде ниже метод IsEven возвращает true, если число четное, но разработчик забыл вернуть значение в ветке else. Добавьте return false; для нечетных чисел.','// Каждый путь исполнения не-void метода обязан возвращать значение:
bool Check(int x)
{
    if (x > 0) return true;
    return false; // обязательный return
}','using System;

class Program
{
    static bool IsEven(int n)
    {
        if (n % 2 == 0)
        {
            return true;
        }
        return false;
    }

    static void Main()
    {
        Console.WriteLine(IsEven(4));
        Console.WriteLine(IsEven(7));
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Добавьте return false; в конце метода"]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-4-1-3','[{"id":"t1","description":"Выводит True затем False","expectedOutput":"True\nFalse"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static bool IsEven(int n)
    {
        if (n % 2 == 0)
        {
            return true;
        }
        return false;
    }

    static void Main()
    {
        Console.WriteLine(IsEven(4));
        Console.WriteLine(IsEven(7));
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-4-2','mod-4','4.2 Модификаторы out, ref и стрелочные функции (=>)','methods-advanced',2,'Безопасный парсинг с int.TryParse, модификаторы параметров и лаконичный синтаксис.',20) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-4-2-1','les-4-2','Безопасный парсинг через int.TryParse и out','code_challenge','medium',45,'Дана строка string raw = "99". Используйте int.TryParse(raw, out int value). Если парсинг успешен, выведите $"Успех: {value}". Иначе выведите "Ошибка ввода".','// Метод TryParse возвращает bool и отдает результат через out:
if (int.TryParse("123", out int num))
{
    Console.WriteLine($"Число: {num}");
}','using System;

class Program
{
    static void Main()
    {
        string raw = "99";
        // Напишите проверку через int.TryParse:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["if (int.TryParse(raw, out int value))","Console.WriteLine($\"Успех: {value}\");"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-4-2-1','[{"id":"t1","description":"Выводит \"Успех: 99\"","expectedOutput":"Успех: 99"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        string raw = "99";
        if (int.TryParse(raw, out int value))
        {
            Console.WriteLine($"Успех: {value}");
        }
        else
        {
            Console.WriteLine("Ошибка ввода");
        }
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-4-2-2','les-4-2','Стрелочный метод Expression-Bodied Members','code_challenge','easy',35,'Объявите статический стрелочный метод Square: static int Square(int x) => x * x;. Вызовите его для числа 9 и выведите результат.','// Компактная форма однострочных методов в C#:
static int DoubleValue(int x) => x * 2;','using System;

class Program
{
    // Объявите static int Square(int x) => ...
    
    static void Main()
    {
        Console.WriteLine(Square(9));
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["static int Square(int x) => x * x;"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-4-2-2','[{"id":"t1","description":"Выводит 81 для квадрата 9","expectedOutput":"81"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static int Square(int x) => x * x;

    static void Main()
    {
        Console.WriteLine(Square(9));
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-4-2-3','les-4-2','Квиз: Отличие модификатора out от ref','quiz','medium',25,'Какое обязательное требование компилятор предъявляет к параметру с модификатором out?',null,null,null,'[]'::jsonb,'[{"id":"q1","text":"Метод обязан присвоить значение out-параметру до своего завершения"},{"id":"q2","text":"Переменная для out-параметра обязана быть инициализирована до вызова метода"},{"id":"q3","text":"out можно использовать только с целочисленными типами данных"}]'::jsonb,'["Подумайте о гарантиях внутри тела вызываемого метода"]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-4-2-3','[]'::jsonb,'[{"id":"q1","text":"Метод обязан присвоить значение out-параметру до своего завершения","isCorrect":true,"explanation":"Верно! out-параметр рассматривается как неинициализированный на входе, и метод гарантирует его инициализацию до return."},{"id":"q2","text":"Переменная для out-параметра обязана быть инициализирована до вызова метода","isCorrect":false,"explanation":"Это требование для ref, а не для out."},{"id":"q3","text":"out можно использовать только с целочисленными типами данных","isCorrect":false,"explanation":"out поддерживается для любых типов, включая ссылочные и структуры."}]'::jsonb,null) on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.modules (id,course_id,title,description,order_index,icon_name) values ('mod-5','csharp-foundations','Модуль 5: Массивы и работа со строками','Одномерные массивы, цикл foreach, современные индексы ^1 и срезы .., методы строк и класс StringBuilder.',5,'Layers') on conflict (id) do update set course_id=excluded.course_id,title=excluded.title,description=excluded.description,order_index=excluded.order_index,icon_name=excluded.icon_name;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-5-1','mod-5','5.1 Одномерные массивы и цикл foreach','arrays-basics',1,'Фиксированные массивы, обход элементов и поиск экстремумов.',20) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-5-1-1','les-5-1','Поиск максимального числа в массиве','code_challenge','medium',45,'Дан массив чисел int[] numbers = { 14, 88, 3, 92, 45, 60 };. С помощью цикла foreach найдите максимальный элемент и выведите его в консоль.','int max = numbers[0];
foreach (int item in numbers)
{
    if (item > max) max = item;
}','using System;

class Program
{
    static void Main()
    {
        int[] numbers = { 14, 88, 3, 92, 45, 60 };
        int max = numbers[0];
        
        // Найдите максимум в цикле foreach:
        
        Console.WriteLine(max);
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["foreach (int item in numbers) { if (item > max) max = item; }"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-5-1-1','[{"id":"t1","description":"Выводит 92 как максимум","expectedOutput":"92"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        int[] numbers = { 14, 88, 3, 92, 45, 60 };
        int max = numbers[0];
        foreach (int item in numbers)
        {
            if (item > max)
            {
                max = item;
            }
        }
        Console.WriteLine(max);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-5-1-2','les-5-1','Индексация с конца (^1) в современном C#','code_challenge','easy',35,'Дан массив строк string[] fruits = { "Яблоко", "Банан", "Апельсин", "Манго" };. Используя современный оператор индекса с конца ^1, получите последний элемент и выведите его.','// Оператор ^ отсчитывает позицию с конца коллекции:
// ^1 — последний элемент, ^2 — предпоследний:
string last = array[^1];','using System;

class Program
{
    static void Main()
    {
        string[] fruits = { "Яблоко", "Банан", "Апельсин", "Манго" };
        // Выведите последний элемент через ^1:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Console.WriteLine(fruits[^1]);"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-5-1-2','[{"id":"t1","description":"Выводит \"Манго\"","expectedOutput":"Манго"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        string[] fruits = { "Яблоко", "Банан", "Апельсин", "Манго" };
        Console.WriteLine(fruits[^1]);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-5-1-3','les-5-1','Квиз: Массивы в управляемой памяти CLR','quiz','easy',20,'К какому типу данных (значимый или ссылочный) относится массив `int[]` в C#?',null,null,null,'[]'::jsonb,'[{"id":"q1","text":"Ссылочный тип (Reference Type), выделяется в управляемой куче (Managed Heap)"},{"id":"q2","text":"Значимый тип (Value Type), размещается исключительно на стеке потока"},{"id":"q3","text":"Динамический неуправляемый указатель"}]'::jsonb,'["Все наследники System.Array в C# — ссылочные типы"]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-5-1-3','[]'::jsonb,'[{"id":"q1","text":"Ссылочный тип (Reference Type), выделяется в управляемой куче (Managed Heap)","isCorrect":true,"explanation":"Именно так! Даже массив примитивов int[] является ссылочным типом (наследником System.Array) и размещается в куче."},{"id":"q2","text":"Значимый тип (Value Type), размещается исключительно на стеке потока","isCorrect":false,"explanation":"Массивы в .NET всегда размещаются в куче (за исключением stackalloc)."},{"id":"q3","text":"Динамический неуправляемый указатель","isCorrect":false,"explanation":"Массивы — безопасные управляемые объекты CLR."}]'::jsonb,null) on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-5-2','mod-5','5.2 Строки и класс StringBuilder','strings-and-builder',2,'Методы Split, Trim, неизменяемость строк и конкатенация через StringBuilder.',20) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-5-2-1','les-5-2','Разделение строки через string.Split()','code_challenge','medium',40,'Дана строка string csv = "C#,Java,Python,TypeScript";. Разбейте её на массив языков с помощью csv.Split('','') и выведите количество языков: $"Всего языков: {languages.Length}".','string raw = "один,два,три";
string[] parts = raw.Split('','');
Console.WriteLine(parts.Length);','using System;

class Program
{
    static void Main()
    {
        string csv = "C#,Java,Python,TypeScript";
        // Разбейте строку и выведите длину:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["string[] languages = csv.Split('','');","Console.WriteLine($\"Всего языков: {languages.Length}\");"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-5-2-1','[{"id":"t1","description":"Выводит \"Всего языков: 4\"","expectedOutput":"Всего языков: 4"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        string csv = "C#,Java,Python,TypeScript";
        string[] languages = csv.Split('','');
        Console.WriteLine($"Всего языков: {languages.Length}");
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-5-2-2','les-5-2','Проверка подстроки методом Contains','code_challenge','easy',30,'Дана строка string email = "student@university.edu". Проверьте, содержит ли она домен "university.edu" с помощью метода email.Contains(). Выведите "Доступ разрешен", если содержит, и "Доступ отклонен" в противном случае.','if (str.Contains("needle"))
{
    // найдено
}','using System;

class Program
{
    static void Main()
    {
        string email = "student@university.edu";
        // Проверьте подстроку university.edu:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["if (email.Contains(\"university.edu\")) Console.WriteLine(\"Доступ разрешен\");"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-5-2-2','[{"id":"t1","description":"Выводит \"Доступ разрешен\"","expectedOutput":"Доступ разрешен"}]'::jsonb,'[]'::jsonb,'using System;

class Program
{
    static void Main()
    {
        string email = "student@university.edu";
        if (email.Contains("university.edu"))
        {
            Console.WriteLine("Доступ разрешен");
        }
        else
        {
            Console.WriteLine("Доступ отклонен");
        }
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-5-2-3','les-5-2','Квиз: Неизменяемость (Immutability) строк','quiz','medium',25,'Почему в C# не рекомендуется выполнять многократное объединение строк (string += ...) в длинных циклах?',null,null,null,'[]'::jsonb,'[{"id":"q1","text":"Строки неизменяемы: каждая операция += выделяет новый строковый объект в куче и нагружает сборщик мусора (GC)"},{"id":"q2","text":"Компилятор C# запрещает оператор += для строк в циклах"},{"id":"q3","text":"При использовании += строки теряют кодировку UTF-16"}]'::jsonb,'["Подумайте о том, что происходит с памятью при каждой модификации"]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-5-2-3','[]'::jsonb,'[{"id":"q1","text":"Строки неизменяемы: каждая операция += выделяет новый строковый объект в куче и нагружает сборщик мусора (GC)","isCorrect":true,"explanation":"Совершенно верно! Для массовых манипуляций со строками следует использовать System.Text.StringBuilder."},{"id":"q2","text":"Компилятор C# запрещает оператор += для строк в циклах","isCorrect":false,"explanation":"Оператор разрешен, но приводит к квадратичной деградации производительности по памяти."},{"id":"q3","text":"При использовании += строки теряют кодировку UTF-16","isCorrect":false,"explanation":"Кодировка не меняется, страдает только выделение памяти."}]'::jsonb,null) on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.modules (id,course_id,title,description,order_index,icon_name) values ('mod-6','csharp-foundations','Модуль 6: Динамические коллекции List<T> и Dictionary','Обобщенные коллекции из System.Collections.Generic: динамические списки List<T>, словари Dictionary<TKey, TValue> и быстрый поиск по ключу.',6,'Layers') on conflict (id) do update set course_id=excluded.course_id,title=excluded.title,description=excluded.description,order_index=excluded.order_index,icon_name=excluded.icon_name;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-6-1','mod-6','6.1 Динамический список List<T>','generic-lists',1,'Коллекция List<T>, добавление, удаление и фильтрация элементов.',20) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-6-1-1','les-6-1','Добавление и фильтрация элементов в List<int>','code_challenge','medium',50,'Создайте список List<int>, инициализированный числами 15, 4, 22, 8. Посчитайте количество элементов, которые больше 10, и выведите это число.','using System.Collections.Generic;

List<int> numbers = new List<int> { 1, 2, 3 };
numbers.Add(10);
Console.WriteLine(numbers.Count);','using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<int> numbers = new List<int> { 15, 4, 22, 8 };
        int countGreaterThan10 = 0;
        
        // Переберите коллекцию с помощью foreach:
        
        Console.WriteLine(countGreaterThan10);
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Используйте foreach (var num in numbers) { if (num > 10) countGreaterThan10++; }"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-6-1-1','[{"id":"t1","description":"Выводит 2 (числа 15 и 22)","expectedOutput":"2"}]'::jsonb,'[]'::jsonb,'using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<int> numbers = new List<int> { 15, 4, 22, 8 };
        int countGreaterThan10 = 0;
        
        foreach (int num in numbers)
        {
            if (num > 10)
            {
                countGreaterThan10++;
            }
        }
        
        Console.WriteLine(countGreaterThan10);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-6-1-2','les-6-1','Удаление элементов из List<string>','code_challenge','easy',35,'Дан список студентов List<string> students = new() { "Анна", "Петр", "Олег" };. Удалите студента "Петр" с помощью метода Remove() и выведите оставшихся студентов через запятую (String.Join(", ", students)).','List<string> items = new List<string> { "A", "B" };
items.Remove("B");
Console.WriteLine(string.Join(", ", items));','using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<string> students = new List<string> { "Анна", "Петр", "Олег" };
        // Удалите "Петр" и выведите список:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["students.Remove(\"Петр\");","Console.WriteLine(string.Join(\", \", students));"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-6-1-2','[{"id":"t1","description":"Выводит \"Анна, Олег\"","expectedOutput":"Анна, Олег"}]'::jsonb,'[]'::jsonb,'using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        List<string> students = new List<string> { "Анна", "Петр", "Олег" };
        students.Remove("Петр");
        Console.WriteLine(string.Join(", ", students));
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-6-2','mod-6','6.2 Ассоциативный словарь Dictionary<TKey, TValue>','dictionaries',2,'Хэш-таблицы, быстрый поиск O(1) и безопасное извлечение с TryGetValue.',20) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-6-2-1','les-6-2','Словарь успеваемости студентов','code_challenge','medium',50,'Создайте словарь Dictionary<string, int> grades для хранения оценок студентов: "Иван" => 90, "Мария" => 95, "Олег" => 78. Выведите оценку Марии по ключу.','var dict = new Dictionary<string, int>
{
    ["Alice"] = 100,
    ["Bob"] = 85
};
Console.WriteLine(dict["Alice"]);','using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        // Создайте словарь grades и выведите оценку Марии:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["grades[\"Мария\"] вернет значение 95"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-6-2-1','[{"id":"t1","description":"Выводит 95","expectedOutput":"95"}]'::jsonb,'[]'::jsonb,'using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        Dictionary<string, int> grades = new Dictionary<string, int>
        {
            { "Иван", 90 },
            { "Мария", 95 },
            { "Олег", 78 }
        };
        Console.WriteLine(grades["Мария"]);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-6-2-2','les-6-2','Безопасный поиск через TryGetValue','spot_bug','medium',40,'В коде ниже программист обращается к несуществующему ключу dict["Сергей"], что вызывает аварийное падение программы с KeyNotFoundException. Перепишите доступ через dict.TryGetValue("Сергей", out int grade). Если не найден, выведите "Студент не найден".','if (dict.TryGetValue(key, out int value))
{
    Console.WriteLine(value);
}
else
{
    Console.WriteLine("Не найден");
}','using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        Dictionary<string, int> dict = new Dictionary<string, int> { { "Иван", 80 } };
        
        // Исправьте падение KeyNotFoundException с помощью TryGetValue:
        if (dict.TryGetValue("Сергей", out int grade))
        {
            Console.WriteLine(grade);
        }
        else
        {
            Console.WriteLine("Студент не найден");
        }
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Используйте: if (dict.TryGetValue(\"Сергей\", out int grade))"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-6-2-2','[{"id":"t1","description":"Выводит \"Студент не найден\"","expectedOutput":"Студент не найден"}]'::jsonb,'[]'::jsonb,'using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        Dictionary<string, int> dict = new Dictionary<string, int> { { "Иван", 80 } };
        if (dict.TryGetValue("Сергей", out int grade))
        {
            Console.WriteLine(grade);
        }
        else
        {
            Console.WriteLine("Студент не найден");
        }
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.modules (id,course_id,title,description,order_index,icon_name) values ('mod-7','csharp-foundations','Модуль 7: Классы, свойства и основы ООП','Инкапсуляция, автоматические свойства { get; set; }, конструкторы, методы экземпляра и наследование.',7,'Box') on conflict (id) do update set course_id=excluded.course_id,title=excluded.title,description=excluded.description,order_index=excluded.order_index,icon_name=excluded.icon_name;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-7-1','mod-7','7.1 Классы, конструкторы и автосвойства','classes-and-properties',1,'Проектируем сущность студента с именем, группой и баллом.',25) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-7-1-1','les-7-1','Класс Student и конструктор','code_challenge','medium',60,'Создайте экземпляр класса Student с именем "Дмитрий" и баллом 95. Вызовите метод student.PrintInfo(), чтобы вывести информацию в консоль.','public class Student
{
    public string Name { get; set; }
    public int Grade { get; set; }

    public Student(string name, int grade)
    {
        Name = name;
        Grade = grade;
    }

    public void PrintInfo() => Console.WriteLine($"Студент: {Name}, Балл: {Grade}");
}','using System;

public class Student
{
    public string Name { get; set; }
    public int Grade { get; set; }

    public Student(string name, int grade)
    {
        Name = name;
        Grade = grade;
    }

    public void PrintInfo()
    {
        Console.WriteLine($"Студент: {Name}, Балл: {Grade}");
    }
}

class Program
{
    static void Main()
    {
        // Создайте объект Student с именем "Дмитрий" и баллом 95:
        // Вызовите метод PrintInfo()
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Создайте объект: var student = new Student(\"Дмитрий\", 95);","Вызовите: student.PrintInfo();"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-7-1-1','[{"id":"t1","description":"Выводит \"Студент: Дмитрий, Балл: 95\"","expectedOutput":"Студент: Дмитрий, Балл: 95"}]'::jsonb,'[]'::jsonb,'using System;

public class Student
{
    public string Name { get; set; }
    public int Grade { get; set; }

    public Student(string name, int grade)
    {
        Name = name;
        Grade = grade;
    }

    public void PrintInfo()
    {
        Console.WriteLine($"Студент: {Name}, Балл: {Grade}");
    }
}

class Program
{
    static void Main()
    {
        Student student = new Student("Дмитрий", 95);
        student.PrintInfo();
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-7-1-2','les-7-1','Свойство с валидацией оценки (0..100)','code_challenge','hard',65,'В классе CourseGrade реализуйте свойство Score. В сеттере (set) добавьте проверку: если value < 0, сохранять 0, если value > 100, сохранять 100. Для значения 120 выведите Score.','private int _score;
public int Score
{
    get => _score;
    set => _score = value > 100 ? 100 : (value < 0 ? 0 : value);
}','using System;

public class CourseGrade
{
    private int _score;
    public int Score
    {
        get { return _score; }
        set
        {
            // Добавьте валидацию:
            
        }
    }
}

class Program
{
    static void Main()
    {
        CourseGrade g = new CourseGrade();
        g.Score = 120;
        Console.WriteLine(g.Score);
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["if (value > 100) _score = 100; else _score = value;"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-7-1-2','[{"id":"t1","description":"Выводит 100 (ограничено максимумом)","expectedOutput":"100"}]'::jsonb,'[]'::jsonb,'using System;

public class CourseGrade
{
    private int _score;
    public int Score
    {
        get { return _score; }
        set
        {
            if (value > 100) _score = 100;
            else if (value < 0) _score = 0;
            else _score = value;
        }
    }
}

class Program
{
    static void Main()
    {
        CourseGrade g = new CourseGrade();
        g.Score = 120;
        Console.WriteLine(g.Score);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-7-1-3','les-7-1','Квиз: Модификаторы доступа в C#','quiz','easy',25,'Какой модификатор доступа делает член класса доступным только внутри того же класса и его классов-наследников?',null,null,null,'[]'::jsonb,'[{"id":"q1","text":"protected"},{"id":"q2","text":"private"},{"id":"q3","text":"internal"}]'::jsonb,'["Подумайте о защите данных для наследования"]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-7-1-3','[]'::jsonb,'[{"id":"q1","text":"protected","isCorrect":true,"explanation":"Верно! protected открывает доступ текущему классу и всем его производным классам."},{"id":"q2","text":"private","isCorrect":false,"explanation":"private закрывает доступ даже для классов-наследников."},{"id":"q3","text":"internal","isCorrect":false,"explanation":"internal открывает доступ любому коду в пределах той же сборки (assembly)."}]'::jsonb,null) on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-7-2','mod-7','7.2 Наследование и виртуальные методы','inheritance-polymorphism',2,'Базовый класс, override, virtual и полиморфизм.',25) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-7-2-1','les-7-2','Переопределение виртуального метода virtual / override','code_challenge','hard',70,'Дан базовый класс User с виртуальным методом virtual string GetRole() => "Пользователь";. Создайте класс-наследник Teacher : User и переопределите метод GetRole() с помощью ключевого слова override так, чтобы он возвращал "Преподаватель". В Main создайте User u = new Teacher(); и выведите u.GetRole().','public class BaseClass
{
    public virtual void SayHello() => Console.WriteLine("Base");
}

public class DerivedClass : BaseClass
{
    public override void SayHello() => Console.WriteLine("Derived");
}','using System;

public class User
{
    public virtual string GetRole() => "Пользователь";
}

// Создайте класс Teacher : User и переопределите GetRole():


class Program
{
    static void Main()
    {
        User u = new Teacher();
        Console.WriteLine(u.GetRole());
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["public class Teacher : User { public override string GetRole() => \"Преподаватель\"; }"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-7-2-1','[{"id":"t1","description":"Выводит \"Преподаватель\" через полиморфный вызов","expectedOutput":"Преподаватель"}]'::jsonb,'[]'::jsonb,'using System;

public class User
{
    public virtual string GetRole() => "Пользователь";
}

public class Teacher : User
{
    public override string GetRole() => "Преподаватель";
}

class Program
{
    static void Main()
    {
        User u = new Teacher();
        Console.WriteLine(u.GetRole());
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.modules (id,course_id,title,description,order_index,icon_name) values ('mod-8','csharp-foundations','Модуль 8: LINQ (Language Integrated Query)','Функциональный подход к коллекциям: Where, Select, OrderBy, Sum, Count и отложенное выполнение.',8,'Cpu') on conflict (id) do update set course_id=excluded.course_id,title=excluded.title,description=excluded.description,order_index=excluded.order_index,icon_name=excluded.icon_name;
insert into public.lessons (id,module_id,title,slug,order_index,description,estimated_minutes) values ('les-8-1','mod-8','8.1 Фильтрация, сортировка и проекция с LINQ','linq-basics',1,'Методы расширения из System.Linq для элегантной работы со списками.',25) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index,description=excluded.description,estimated_minutes=excluded.estimated_minutes;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-8-1-1','les-8-1','Фильтрация списка с помощью .Where() и .Sum()','code_challenge','hard',75,'Дан массив чисел int[] scores = { 45, 88, 92, 60, 100, 74 }. С помощью LINQ метода .Where() отфильтруйте оценки >= 80, посчитайте их сумму через .Sum() и выведите результат.','using System.Linq;

int[] numbers = { 1, 2, 3, 4, 5 };
int evenSum = numbers.Where(x => x % 2 == 0).Sum();','using System;
using System.Linq;

class Program
{
    static void Main()
    {
        int[] scores = { 45, 88, 92, 60, 100, 74 };
        
        // Используйте scores.Where(x => ...).Sum():
        int total = 0; // замените на LINQ запрос
        
        Console.WriteLine(total);
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["Используйте лямбда-выражение: x => x >= 80","Связка: scores.Where(x => x >= 80).Sum()"]'::jsonb,1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-8-1-1','[{"id":"t1","description":"Сумма оценок >= 80 (88 + 92 + 100 = 280)","expectedOutput":"280"}]'::jsonb,'[]'::jsonb,'using System;
using System.Linq;

class Program
{
    static void Main()
    {
        int[] scores = { 45, 88, 92, 60, 100, 74 };
        int total = scores.Where(x => x >= 80).Sum();
        Console.WriteLine(total);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-8-1-2','les-8-1','Проекция Select и сортировка OrderByDescending','code_challenge','hard',75,'Дан массив слов string[] words = { "C#", "Web", "Enterprise", "SQL" };. Используя LINQ, отсортируйте слова по убыванию их длины через .OrderByDescending(w => w.Length), возьмите первое слово (.First()) и выведите его.','using System.Linq;

var longest = words.OrderByDescending(w => w.Length).First();','using System;
using System.Linq;

class Program
{
    static void Main()
    {
        string[] words = { "C#", "Web", "Enterprise", "SQL" };
        // Найдите самое длинное слово через LINQ:
        
    }
}',null,'[]'::jsonb,'[]'::jsonb,'["words.OrderByDescending(w => w.Length).First()"]'::jsonb,2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-8-1-2','[{"id":"t1","description":"Выводит \"Enterprise\"","expectedOutput":"Enterprise"}]'::jsonb,'[]'::jsonb,'using System;
using System.Linq;

class Program
{
    static void Main()
    {
        string[] words = { "C#", "Web", "Enterprise", "SQL" };
        string longest = words.OrderByDescending(w => w.Length).First();
        Console.WriteLine(longest);
    }
}') on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,theory_snippet,initial_code,solution_code,tests,quiz_options,hints,order_index) values ('task-8-1-3','les-8-1','Квиз: Отложенное выполнение (Deferred Execution) в LINQ','quiz','medium',30,'Когда физически выполняется запрос LINQ, содержащий методы `.Where(...)` и `.Select(...)`?',null,null,null,'[]'::jsonb,'[{"id":"q1","text":"Только в момент фактической итерации (foreach, ToList, ToArray, Count, First)"},{"id":"q2","text":"В момент объявления переменной запроса в строке кода"},{"id":"q3","text":"В фоновом потоке ThreadPool сразу после компиляции"}]'::jsonb,'["Подумайте о том, когда вызывается метод ToList() или оператор foreach"]'::jsonb,3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,theory_snippet=excluded.theory_snippet,initial_code=excluded.initial_code,solution_code=excluded.solution_code,tests=excluded.tests,quiz_options=excluded.quiz_options,hints=excluded.hints,order_index=excluded.order_index;
insert into public.task_checks (task_id,tests,quiz_options,solution_code) values ('task-8-1-3','[]'::jsonb,'[{"id":"q1","text":"Только в момент фактической итерации (foreach, ToList, ToArray, Count, First)","isCorrect":true,"explanation":"Совершенно верно! LINQ использует отложенное выполнение (Deferred Execution). Запрос — это лишь план, исполняемый при запросе данных."},{"id":"q2","text":"В момент объявления переменной запроса в строке кода","isCorrect":false,"explanation":"В момент объявления создается объект запроса IEnumerable, но элементы еще не обрабатываются."},{"id":"q3","text":"В фоновом потоке ThreadPool сразу после компиляции","isCorrect":false,"explanation":"LINQ выполняется синхронно в текущем потоке при итерации."}]'::jsonb,null) on conflict (task_id) do update set tests=excluded.tests,quiz_options=excluded.quiz_options,solution_code=excluded.solution_code;
insert into public.modules (id,course_id,title,order_index) values ('git-module','git-branching','Git Branching Lab',1) on conflict (id) do update set course_id=excluded.course_id,title=excluded.title,order_index=excluded.order_index;
insert into public.lessons (id,module_id,title,slug,order_index) values ('git-lessons','git-module','Git практика','git-lab',1) on conflict (id) do update set module_id=excluded.module_id,title=excluded.title,slug=excluded.slug,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('intro1','git-lessons','Введение в коммиты Git','git','easy',30,'Коммит в Git сохраняет снимок всех файлов вашего репозитория. Сделайте два коммита.',1) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('intro2','git-lessons','Ветвление в Git (Branching)','git','easy',35,'Ветки — это легковесные указатели на коммиты. Создайте ветку "bugFix" и переключитесь на неё.',2) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('intro3','git-lessons','Слияние веток (git merge)','git','medium',45,'Слияние объединяет историю двух веток с созданием специального коммита с двумя родителями.',3) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('intro4','git-lessons','Перебазирование веток (git rebase)','git','medium',50,'Rebase переносит коммиты одной ветки поверх другой, создавая линейную и чистую историю.',4) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('ramp1','git-lessons','Отделите свой HEAD (Detached HEAD)','git','easy',35,'HEAD обычно прикреплен к ветке. Но вы можете открепить его и направить прямо на коммит C4.',5) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('ramp2','git-lessons','Относительные ссылки (^)','git','medium',40,'Оператор ^ позволяет переместиться на одного родителя назад.',6) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('ramp3','git-lessons','Относительные ссылки №2 (~) и форсирование веток','git','hard',50,'Оператор ~<число> прыгает на несколько коммитов назад, а "git branch -f" принудительно двигает ветку.',7) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('ramp4','git-lessons','Отмена изменений: reset vs revert','git','medium',45,'Откатите локальную ветку через reset, а удаленную — через revert.',8) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('move1','git-lessons','Выборочный перенос: git cherry-pick','git','medium',45,'Скопируйте нужные коммиты C3, C4 и C7 в ветку main.',9) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('move2','git-lessons','Интерактивный Rebase (git rebase -i)','git','hard',55,'Переупорядочьте и отберите коммиты с помощью интерактивного rebase.',10) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('mixed1','git-lessons','Взять только один коммит','git','medium',45,'В ветке bugFix есть нужный багфикс (коммит C4). Перенесите только его в main.',11) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('mixed2','git-lessons','Жонглирование коммитами','git','hard',55,'Измените старый коммит в истории с помощью rebase.',12) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('mixed4','git-lessons','Теги в Git (git tag)','git','medium',40,'Поставьте тег v0 на коммит C1 и тег v1 на C2, затем перейдите на C2.',13) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('mixed5','git-lessons','Описание коммитов: git describe','git','easy',35,'Изучите команду git describe для определения расстояния до ближайшего тега.',14) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('adv1','git-lessons','Перебазирование более 9000 раз','git','hard',60,'Перебазируйте последовательно все ветки bugFix, side и another поверх main.',15) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('adv2','git-lessons','Несколько родителей: HEAD^2','git','medium',45,'Используйте модификатор ^2 для выбора второго родителя коммита слияния.',16) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('rem1','git-lessons','Введение в клонирование (git clone)','git','easy',35,'Сделайте клон удаленного репозитория для создания локальной копии.',17) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('rem2','git-lessons','Удаленные ветки (o/main)','git','easy',40,'Сделайте коммит в локальный main, пока удаленный o/main остается на месте.',18) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('rem3','git-lessons','Загрузка изменений (git fetch)','git','medium',45,'Загрузите свежие коммиты с удаленного сервера без изменения локального кода.',19) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('rem4','git-lessons','Получение и слияние (git pull)','git','medium',45,'Команда git pull скачивает коммиты и сразу сливает их с текущей веткой.',20) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('rem5','git-lessons','Имитация командной работы (fakeTeamwork)','git','medium',50,'Сымитируйте появление коммитов от коллег на сервере с помощью fakeTeamwork.',21) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('rem6','git-lessons','Отправка на сервер (git push)','git','easy',40,'Отправьте локальные наработки в удаленный репозиторий через git push.',22) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.tasks (id,lesson_id,title,type,difficulty,xp,instructions,order_index) values ('rem7','git-lessons','Разошедшаяся история (Diverged History)','git','hard',60,'История разошлась: на сервере появились новые коммиты, а у вас есть локальные. Синхронизируйтесь через rebase и запушьте.',23) on conflict (id) do update set lesson_id=excluded.lesson_id,title=excluded.title,type=excluded.type,difficulty=excluded.difficulty,xp=excluded.xp,instructions=excluded.instructions,order_index=excluded.order_index;
insert into public.group_modules(group_name,module_id,course_id) select group_name,'git-module','git-branching' from public.group_courses where course_id='git-branching' on conflict(group_name,module_id) do nothing;
commit;
