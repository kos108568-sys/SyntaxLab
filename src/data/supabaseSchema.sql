-- ====================================================================
-- SyntaxLab / DevPath - Академическая платформа C# для аудиторий
-- PostgreSQL / Supabase Schema + Row Level Security (RLS)
-- ====================================================================

-- 1. ТАБЛИЦА ПРОФИЛЕЙ (Студенты и Преподаватели)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('teacher', 'student')),
  group_name text default 'ИТ-301',
  avatar_url text,
  total_xp integer default 0,
  streak_days integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. КУРСЫ
create table if not exists public.courses (
  id text primary key,
  title text not null,
  language text not null,
  description text,
  version text default '12.0 (.NET 8)',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. МОДУЛИ
create table if not exists public.modules (
  id text primary key,
  course_id text references public.courses(id) on delete cascade not null,
  title text not null,
  order_index integer not null,
  description text,
  icon_name text default 'Code'
);

-- 4. УРОКИ
create table if not exists public.lessons (
  id text primary key,
  module_id text references public.modules(id) on delete cascade not null,
  title text not null,
  slug text not null,
  order_index integer not null,
  description text,
  estimated_minutes integer default 15
);

-- 5. ЗАДАНИЯ (Шаги в стиле интерактивного обучения)
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

-- 6. ПРОГРЕСС СТУДЕНТОВ
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

-- 7. АУДИТОРНЫЙ МОНИТОРИНГ В РЕАЛЬНОМ ВРЕМЕНИ (Live Classroom Radar)
create table if not exists public.classroom_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  group_name text not null,
  active_task_id text references public.tasks(id),
  status text not null check (status in ('active', 'stuck', 'completed_step', 'idle')),
  attempts_on_current_task integer default 0,
  stuck_minutes integer default 0,
  needs_help boolean default false,
  help_message text,
  last_ping_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) ПОЛИТИКИ
-- ====================================================================

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.tasks enable row level security;
alter table public.student_progress enable row level security;
alter table public.classroom_sessions enable row level security;

-- Профили: каждый видит всех в своей группе, обновляет свой
create policy "Profiles visible to authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Учебный контент: виден всем авторизованным пользователям
create policy "Courses are readable by everyone" on public.courses for select to authenticated using (true);
create policy "Modules are readable by everyone" on public.modules for select to authenticated using (true);
create policy "Lessons are readable by everyone" on public.lessons for select to authenticated using (true);
create policy "Tasks are readable by everyone" on public.tasks for select to authenticated using (true);

-- Преподаватель может редактировать контент (роль 'teacher')
create policy "Teachers can manage tasks"
  on public.tasks for all
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

-- Прогресс: студенты обновляют свой, преподаватели видят прогресс всех
create policy "Students can view and update own progress"
  on public.student_progress for all
  to authenticated
  using (auth.uid() = user_id);

create policy "Teachers can view all student progress"
  on public.student_progress for select
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

-- Аудиторный сеанс: студент шлет свой статус, учитель видит всё в реальном времени
create policy "Students update own session"
  on public.classroom_sessions for all
  to authenticated
  using (auth.uid() = user_id);

create policy "Teachers monitor all classroom sessions"
  on public.classroom_sessions for select
  to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher'));

-- Включение Realtime для аудиторного радара
alter publication supabase_realtime add table public.classroom_sessions;
alter publication supabase_realtime add table public.student_progress;
