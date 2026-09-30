-- Progress and XP may only be awarded by the server-side grading service.
begin;

revoke all on public.student_progress from anon, authenticated;

create or replace function public.complete_verified_task(student_id uuid, completed_task_id text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  reward integer;
  lesson text;
  changed integer;
begin
  if not public.can_access_task(completed_task_id, student_id) then
    raise exception 'Task is not available to this student';
  end if;

  select xp, lesson_id into reward, lesson
  from public.tasks
  where id = completed_task_id;

  if reward is null then
    raise exception 'Task does not exist';
  end if;

  insert into public.student_progress(user_id, task_id, lesson_id, status, completed_at)
  values(student_id, completed_task_id, lesson, 'completed', now())
  on conflict(user_id, task_id) do update
    set status = 'completed', completed_at = now()
    where public.student_progress.status <> 'completed';

  get diagnostics changed = row_count;
  if changed = 0 then return 0; end if;

  update public.profiles
  set total_xp = coalesce(total_xp, 0) + reward
  where id = student_id;

  return reward;
end;
$$;

do $$
begin
  if to_regprocedure('public.increment_xp(uuid,integer)') is not null then
    revoke all on function public.increment_xp(uuid, integer) from public, anon, authenticated;
    drop function public.increment_xp(uuid, integer);
  end if;

  revoke all on function public.complete_verified_task(uuid, text) from public, anon, authenticated;
  grant execute on function public.complete_verified_task(uuid, text) to service_role;
end $$;

commit;
