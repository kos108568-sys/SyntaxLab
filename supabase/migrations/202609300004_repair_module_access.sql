-- Repair installations that have group_courses but missed the group_modules table.
begin;

create table if not exists public.group_modules (
  id uuid default gen_random_uuid() primary key,
  group_name text not null,
  module_id text not null references public.modules(id) on delete cascade,
  course_id text not null references public.courses(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(group_name, module_id)
);

alter table public.group_modules enable row level security;
revoke all on public.group_modules from anon, authenticated;
grant select, insert, update, delete on public.group_modules to authenticated;
grant all on public.group_modules to service_role;

drop policy if exists module_access_read on public.group_modules;
drop policy if exists module_access_write on public.group_modules;
create policy module_access_read on public.group_modules for select to authenticated
  using(public.is_teacher() or group_name = (select group_name from public.profiles where id = auth.uid()));
create policy module_access_write on public.group_modules for all to authenticated
  using(public.is_teacher()) with check(public.is_teacher());

insert into public.group_modules(group_name, module_id, course_id)
select gc.group_name, m.id, m.course_id
from public.group_courses gc
join public.modules m on m.course_id = gc.course_id
on conflict(group_name, module_id) do nothing;

commit;
