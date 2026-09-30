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
begin
  insert into public.profiles(id,email,full_name,role,group_name,is_approved)
  values(new.id,coalesce(new.email,''),coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'user_name','Студент'),'student',null,false)
  on conflict(id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

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
    if f.proname not in ('complete_verified_task','increment_xp','handle_new_user','session_group') then execute format('grant execute on function %s to authenticated',f.signature); end if;
  end loop;
end $$;

do $$ declare t text; begin
  foreach t in array array['profiles','classroom_sessions','classroom_announcements','student_progress','group_courses','group_modules','tasks'] loop
    begin execute format('alter publication supabase_realtime add table public.%I',t); exception when duplicate_object then null; end;
  end loop;
end $$;
commit;
