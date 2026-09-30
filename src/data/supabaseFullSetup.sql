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

-- ====================================================================
-- АВТОМАТИЧЕСКИЙ ТРИГГЕР: Создание профиля при регистрации в Auth
-- ====================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, group_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'group_name', 'ИТ-301')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====================================================================
-- ВКЛЮЧЕНИЕ ROW LEVEL SECURITY (RLS)
-- ====================================================================
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.modules enable row level security;
alter table public.lessons enable row level security;
alter table public.tasks enable row level security;
alter table public.student_progress enable row level security;
alter table public.classroom_sessions enable row level security;
alter table public.classroom_announcements enable row level security;

-- Политики безопасности (удаляем старые, если уже есть, и пересоздаем)
drop policy if exists "Profiles visible to all users" on public.profiles;
create policy "Profiles visible to all users" on public.profiles for select using (true);

drop policy if exists "Profiles insertable" on public.profiles;
create policy "Profiles insertable" on public.profiles for insert with check (true);

-- Функция проверки роли преподавателя без рекурсии в RLS
create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

-- Функция одобрения студента с обходом RLS
create or replace function public.approve_student(
  student_id uuid,
  new_full_name text default null,
  new_group_name text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_teacher boolean;
begin
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  ) into caller_is_teacher;

  if not caller_is_teacher then
    raise exception 'Доступ запрещен: только преподаватель может подтверждать студентов';
  end if;

  update public.profiles
  set
    is_approved = true,
    full_name = coalesce(nullif(trim(new_full_name), ''), full_name),
    group_name = coalesce(nullif(trim(new_group_name), ''), group_name)
  where id = student_id;

  return true;
end;
$$;

-- Функция отклонения студента
create or replace function public.reject_student(
  student_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_teacher boolean;
begin
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  ) into caller_is_teacher;

  if not caller_is_teacher then
    raise exception 'Доступ запрещен: только преподаватель может отклонять заявки';
  end if;

  update public.profiles
  set
    is_approved = false,
    group_name = null
  where id = student_id;

  return true;
end;
$$;

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Teachers can update student profiles" on public.profiles;
create policy "Teachers can update student profiles" on public.profiles for update using (
  public.is_teacher()
);

-- Группы
alter table public.academic_groups enable row level security;
drop policy if exists "Groups readable by all" on public.academic_groups;
create policy "Groups readable by all" on public.academic_groups for select using (true);

drop policy if exists "Groups editable by teachers" on public.academic_groups;
create policy "Groups editable by teachers" on public.academic_groups for all using (true);

-- Доступ групп к курсам
alter table public.group_courses enable row level security;
drop policy if exists "Group courses readable by all" on public.group_courses;
create policy "Group courses readable by all" on public.group_courses for select using (true);

drop policy if exists "Group courses editable by teachers" on public.group_courses;
create policy "Group courses editable by teachers" on public.group_courses for all using (true);

-- Доступ групп к разделам (модулям)
alter table public.group_modules enable row level security;
drop policy if exists "Group modules readable by all" on public.group_modules;
create policy "Group modules readable by all" on public.group_modules for select using (true);

drop policy if exists "Group modules editable by teachers" on public.group_modules;
create policy "Group modules editable by teachers" on public.group_modules for all using (true);

drop policy if exists "Courses are readable by everyone" on public.courses;
create policy "Courses are readable by everyone" on public.courses for select using (true);

drop policy if exists "Modules are readable by everyone" on public.modules;
create policy "Modules are readable by everyone" on public.modules for select using (true);

drop policy if exists "Lessons are readable by everyone" on public.lessons;
create policy "Lessons are readable by everyone" on public.lessons for select using (true);

drop policy if exists "Tasks are readable by everyone" on public.tasks;
create policy "Tasks are readable by everyone" on public.tasks for select using (true);

drop policy if exists "Student progress readable" on public.student_progress;
create policy "Student progress readable" on public.student_progress for select using (true);

drop policy if exists "Student progress editable by owner" on public.student_progress;
create policy "Student progress editable by owner" on public.student_progress for all using (auth.uid() = user_id);

drop policy if exists "Classroom sessions readable by all" on public.classroom_sessions;
create policy "Classroom sessions readable by all" on public.classroom_sessions for select using (true);

drop policy if exists "Classroom sessions editable by owner" on public.classroom_sessions;
create policy "Classroom sessions editable by owner" on public.classroom_sessions for all using (auth.uid() = user_id);

drop policy if exists "Teachers update student sessions" on public.classroom_sessions;
create policy "Teachers update student sessions" on public.classroom_sessions for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
);

drop policy if exists "Announcements readable by all" on public.classroom_announcements;
create policy "Announcements readable by all" on public.classroom_announcements for select using (true);

drop policy if exists "Announcements editable by teachers" on public.classroom_announcements;
create policy "Announcements editable by teachers" on public.classroom_announcements for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'teacher')
);

-- Безопасное включение Realtime (игнорирует, если таблицы уже в публикации)
do $$
begin
  begin
    alter publication supabase_realtime add table public.classroom_sessions;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.classroom_announcements;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.student_progress;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.profiles;
  exception when duplicate_object then null;
  end;
end $$;

-- ====================================================================
-- SEED DATA: ПЕРВОНАЧАЛЬНЫЙ КУРС C# В БАЗУ ДАННЫХ
-- ====================================================================

insert into public.courses (id, title, language, description, version)
values (
  'csharp-foundations',
  'C# Pro: От Базового Синтаксиса до ООП и LINQ',
  'C#',
  'Академический интерактивный курс для аудиторных занятий. Никакой воды — реальный код, компиляторные проверки и строгая практика.',
  '12.0 (.NET 8)'
) on conflict (id) do nothing;

-- Все 8 модулей курса C#
insert into public.modules (id, course_id, title, order_index, description, icon_name)
values
  ('mod-1', 'csharp-foundations', 'Модуль 1: Базовый синтаксис, переменные и типы данных', 1, 'Точка входа в программу, строгая типизация, консольный ввод/вывод и интерполяция строк.', 'Terminal'),
  ('mod-2', 'csharp-foundations', 'Модуль 2: Управляющие конструкции и ветвления', 2, 'Условия if-else, switch выражения в C# 9+, реляционные паттерны и тернарный оператор.', 'GitBranch'),
  ('mod-3', 'csharp-foundations', 'Модуль 3: Циклы и алгоритмы итераций', 3, 'Циклы for, while, do-while, алгоритмы накопления, break и continue.', 'Layers'),
  ('mod-4', 'csharp-foundations', 'Модуль 4: Методы и функции (Декомпозиция программ)', 4, 'Статические методы, параметры, возврат значений, перегрузка и модификаторы out/ref.', 'Box'),
  ('mod-5', 'csharp-foundations', 'Модуль 5: Массивы и работа со строками', 5, 'Одномерные массивы, foreach, индексы ^1, срезы диапазонов .., методы string и StringBuilder.', 'Layers'),
  ('mod-6', 'csharp-foundations', 'Модуль 6: Динамические коллекции List<T> и Dictionary', 6, 'Обобщенные коллекции System.Collections.Generic: динамические списки и быстрый поиск по ключу.', 'Layers'),
  ('mod-7', 'csharp-foundations', 'Модуль 7: Классы, свойства и основы ООП', 7, 'Инкапсуляция, автоматические свойства { get; set; }, валидация, конструкторы и наследование.', 'Box'),
  ('mod-8', 'csharp-foundations', 'Модуль 8: LINQ (Language Integrated Query)', 8, 'Функциональный подход к коллекциям: Where, Select, OrderBy, Sum и Count.', 'Cpu')
on conflict (id) do nothing;

-- Уроки
insert into public.lessons (id, module_id, title, slug, order_index, description, estimated_minutes)
values
  ('les-1-1', 'mod-1', '1.1 Первая программа и вывод в консоль', 'first-program', 1, 'Изучаем структуру программы, Console.WriteLine и интерполяцию строк ($"...").', 10),
  ('les-1-2', 'mod-1', '1.2 Типы данных и преобразования', 'data-types-conversions', 2, 'Целочисленные, вещественные типы, строки, bool, приведение типов и безопасный парсинг.', 15),
  ('les-2-1', 'mod-2', '2.1 Ветвления if / else if / else', 'conditionals', 1, 'Принятие решений в коде на основе булевых выражений.', 15),
  ('les-2-2', 'mod-2', '2.2 Циклы for и while', 'loops', 2, 'Многократное повторение операций, счетчики, суммирование.', 15),
  ('les-3-1', 'mod-3', '3.1 Динамический список List<T>', 'generic-lists', 1, 'Коллекция List<T> из пространства имен System.Collections.Generic.', 20),
  ('les-4-1', 'mod-4', '4.1 Создание класса Student и свойства', 'classes-and-properties', 1, 'Проектируем сущность студента с именем, группой и баллом.', 25),
  ('les-5-1', 'mod-5', '5.1 Фильтрация и проекция с LINQ', 'linq-basics', 1, 'Методы расширения из System.Linq для элегантной работы со списками.', 20)
on conflict (id) do nothing;

-- Задания
insert into public.tasks (id, lesson_id, title, type, difficulty, xp, instructions, theory_snippet, initial_code, solution_code, tests, hints)
values
  (
    'task-1-1-1',
    'les-1-1',
    'Вывод приветствия разработчика',
    'code_challenge',
    'easy',
    25,
    'Напишите код, который выводит в консоль строку "Hello, C# Developer!". Соблюдайте регистр букв и знаки препинания.',
    '// В C# для вывода данных используется Console.WriteLine:\nConsole.WriteLine("Текст сообщения");',
    'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        // Напишите команду вывода ниже:\n        \n    }\n}',
    'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        Console.WriteLine("Hello, C# Developer!");\n    }\n}',
    '[{"id": "t1", "description": "Выводит Hello, C# Developer! в консоль"}]'::jsonb,
    '["Используйте Console.WriteLine(...);", "Не забудьте точку с запятой в конце строки"]'::jsonb
  ),
  (
    'task-1-1-2',
    'les-1-1',
    'Интерполяция строк ($)',
    'code_challenge',
    'easy',
    30,
    'Объявите строковую переменную language со значением "C#". Затем выведите сообщение "Я изучаю {language} в аудитории!" с помощью интерполяции строк ($"...{...}...").',
    'string name = "Алексей";\nConsole.WriteLine($"Привет, {name}!");',
    'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        // 1. Объявите string language = "C#";\n        // 2. Выведите строку через $\n        \n    }\n}',
    'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        string language = "C#";\n        Console.WriteLine($"Я изучаю {language} в аудитории!");\n    }\n}',
    '[{"id": "t1", "description": "Сообщение с подставленной переменной language"}]'::jsonb,
    '["Используйте знак $ перед строкой: $\"Я изучаю {language} в аудитории!\""]'::jsonb
  ),
  (
    'task-1-2-1',
    'les-1-2',
    'Парсинг строки в целое число',
    'code_challenge',
    'medium',
    35,
    'Дана строковая переменная input = "42". Преобразуйте её в целочисленную переменную score с помощью int.Parse() и прибавьте к ней 8. Выведите результат.',
    'string raw = "100";\nint number = int.Parse(raw);',
    'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        string input = "42";\n        // Преобразуйте input в int, прибавьте 8 и выведите в консоль:\n        \n    }\n}',
    'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        string input = "42";\n        int score = int.Parse(input);\n        Console.WriteLine(score + 8);\n    }\n}',
    '[{"id": "t1", "description": "Выводит сумму 50 в консоль"}]'::jsonb,
    '["int score = int.Parse(input);", "Console.WriteLine(score + 8);"]'::jsonb
  )
on conflict (id) do nothing;
