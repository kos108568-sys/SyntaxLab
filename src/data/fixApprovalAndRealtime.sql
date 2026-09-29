-- ====================================================================
-- SyntaxLab: Быстрый фикс для подтверждения заявок студентов и Realtime
-- Запустите этот скрипт в Supabase -> SQL Editor -> Run
-- ====================================================================

-- 1. Убедимся, что колонка is_approved есть в таблице profiles
alter table public.profiles add column if not exists is_approved boolean default false;
update public.profiles set is_approved = true where role = 'teacher';

-- 2. Безопасная функция проверки роли преподавателя (без рекурсии в RLS)
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

-- 3. Хранимая функция одобрения студента преподавателем (SECURITY DEFINER)
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

-- 4. Хранимая функция отклонения студента (SECURITY DEFINER)
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

-- 5. Настройка RLS политик на public.profiles
alter table public.profiles enable row level security;

drop policy if exists "Profiles visible to all users" on public.profiles;
drop policy if exists "Profiles visible to authenticated users" on public.profiles;
create policy "Profiles visible to authenticated users" on public.profiles
  for select using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "Teachers can update student profiles" on public.profiles;
create policy "Teachers can update student profiles" on public.profiles
  for update using (public.is_teacher());

-- 6. Добавление profiles в публикацию Supabase Realtime (чтобы студенты мгновенно получали допуск)
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;
