create table if not exists public.mirage_staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  staff_name text,
  staff_avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_mirage_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mirage_staff_profiles
    where user_id = check_user_id
      and role = 'admin'
  );
$$;

create or replace function public.has_mirage_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.mirage_staff_profiles
    where role = 'admin'
  );
$$;

create or replace function public.bootstrap_mirage_admin()
returns public.mirage_staff_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  profile public.mirage_staff_profiles;
begin
  if current_user_id is null then
    raise exception 'Utente non autenticato';
  end if;

  if not public.has_mirage_admin() then
    insert into public.mirage_staff_profiles (user_id, role)
    values (current_user_id, 'admin')
    on conflict (user_id) do update
      set role = 'admin',
          updated_at = now();
  end if;

  select *
    into profile
    from public.mirage_staff_profiles
    where user_id = current_user_id;

  return profile;
end;
$$;

create or replace function public.sync_mirage_staff_profile(
  profile_email text,
  profile_name text,
  profile_avatar_url text
)
returns public.mirage_staff_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  profile public.mirage_staff_profiles;
begin
  if current_user_id is null then
    raise exception 'Utente non autenticato';
  end if;

  insert into public.mirage_staff_profiles (
    user_id,
    email,
    staff_name,
    staff_avatar_url,
    role
  )
  values (
    current_user_id,
    profile_email,
    profile_name,
    profile_avatar_url,
    'user'
  )
  on conflict (user_id) do update
    set email = excluded.email,
        staff_name = excluded.staff_name,
        staff_avatar_url = excluded.staff_avatar_url,
        updated_at = now();

  select *
    into profile
    from public.mirage_staff_profiles
    where user_id = current_user_id;

  return profile;
end;
$$;

create or replace function public.handle_mirage_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.mirage_staff_profiles (
    user_id,
    email,
    staff_name,
    staff_avatar_url,
    role
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      new.raw_user_meta_data->>'global_name',
      new.raw_user_meta_data->>'user_name',
      new.raw_user_meta_data->>'preferred_username',
      new.email
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      new.raw_user_meta_data->>'avatar'
    ),
    'user'
  )
  on conflict (user_id) do update
    set email = excluded.email,
        staff_name = excluded.staff_name,
        staff_avatar_url = excluded.staff_avatar_url,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_mirage_profile on auth.users;
create trigger on_auth_user_created_mirage_profile
  after insert on auth.users
  for each row execute function public.handle_mirage_new_user();

alter table public.mirage_staff_profiles enable row level security;

drop policy if exists "Users can read own Mirage profile or admins read all" on public.mirage_staff_profiles;
create policy "Users can read own Mirage profile or admins read all"
  on public.mirage_staff_profiles
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_mirage_admin());

drop policy if exists "Admins can create Mirage profiles" on public.mirage_staff_profiles;
create policy "Admins can create Mirage profiles"
  on public.mirage_staff_profiles
  for insert
  to authenticated
  with check (public.is_mirage_admin());

drop policy if exists "Admins can update Mirage profiles" on public.mirage_staff_profiles;
create policy "Admins can update Mirage profiles"
  on public.mirage_staff_profiles
  for update
  to authenticated
  using (public.is_mirage_admin())
  with check (public.is_mirage_admin());

create table if not exists public.mirage_workspaces (
  id text primary key,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.mirage_workspaces enable row level security;

drop policy if exists "Staff can read Mirage workspaces" on public.mirage_workspaces;
create policy "Staff can read Mirage workspaces"
  on public.mirage_workspaces
  for select
  to authenticated
  using (public.is_mirage_admin());

drop policy if exists "Staff can create Mirage workspaces" on public.mirage_workspaces;
create policy "Staff can create Mirage workspaces"
  on public.mirage_workspaces
  for insert
  to authenticated
  with check (public.is_mirage_admin());

drop policy if exists "Staff can update Mirage workspaces" on public.mirage_workspaces;
create policy "Staff can update Mirage workspaces"
  on public.mirage_workspaces
  for update
  to authenticated
  using (public.is_mirage_admin())
  with check (public.is_mirage_admin());

insert into public.mirage_workspaces (id, name, data)
values ('mirage-rp', 'Mirage RP', '{}'::jsonb)
on conflict (id) do nothing;

create table if not exists public.mirage_audit_logs (
  id bigint generated by default as identity primary key,
  workspace_id text not null references public.mirage_workspaces(id) on delete cascade,
  action text not null default 'update',
  summary text not null,
  sections text[] not null default '{}'::text[],
  staff_id uuid references auth.users(id),
  staff_email text,
  staff_name text,
  staff_avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.mirage_audit_logs
  add column if not exists staff_avatar_url text;

create index if not exists mirage_audit_logs_workspace_created_idx
  on public.mirage_audit_logs (workspace_id, created_at desc);

alter table public.mirage_audit_logs enable row level security;

drop policy if exists "Staff can read Mirage audit logs" on public.mirage_audit_logs;
create policy "Staff can read Mirage audit logs"
  on public.mirage_audit_logs
  for select
  to authenticated
  using (public.is_mirage_admin());

drop policy if exists "Staff can create Mirage audit logs" on public.mirage_audit_logs;
create policy "Staff can create Mirage audit logs"
  on public.mirage_audit_logs
  for insert
  to authenticated
  with check (auth.uid() = staff_id and public.is_mirage_admin());
