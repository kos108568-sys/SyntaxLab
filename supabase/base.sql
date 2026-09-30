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

