create table if not exists public.room_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('topik', 'life', 'listening', 'job', 'study', 'money')),
  creator_name text not null,
  tasks jsonb not null default '[]'::jsonb,
  playlist jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  uses integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.room_idea_tasks (
  id text primary key,
  room_id text not null,
  title text not null,
  note text,
  status text not null check (status in ('todo', 'doing', 'done')),
  owner text,
  due text,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id text primary key,
  title text not null,
  host_user_id uuid references auth.users(id) on delete set null,
  host_name text not null,
  host_avatar_url text,
  is_private boolean not null default false,
  password_hash text,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  avatar_url text,
  city text,
  bio text,
  language text not null default 'vi' check (language in ('vi', 'ko', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists language text not null default 'vi';
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.rooms add column if not exists title text;
alter table public.rooms add column if not exists host_user_id uuid references auth.users(id) on delete set null;
alter table public.rooms add column if not exists host_name text;
alter table public.rooms add column if not exists host_avatar_url text;
alter table public.rooms add column if not exists is_private boolean not null default false;
alter table public.rooms add column if not exists password_hash text;
alter table public.rooms add column if not exists created_at timestamptz not null default now();
alter table public.rooms add column if not exists last_active_at timestamptz not null default now();

alter table public.room_templates enable row level security;
alter table public.room_idea_tasks enable row level security;
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;

drop policy if exists "Anyone can read room templates" on public.room_templates;
drop policy if exists "Anyone can create room templates" on public.room_templates;
drop policy if exists "Anyone can read rooms" on public.rooms;
drop policy if exists "Anyone can create rooms" on public.rooms;
drop policy if exists "Anyone can update rooms" on public.rooms;
drop policy if exists "Anyone can delete rooms" on public.rooms;
drop policy if exists "Only admins can delete rooms" on public.rooms;
drop policy if exists "Anyone can read room idea tasks" on public.room_idea_tasks;
drop policy if exists "Anyone can create room idea tasks" on public.room_idea_tasks;
drop policy if exists "Anyone can update room idea tasks" on public.room_idea_tasks;
drop policy if exists "Anyone can delete room idea tasks" on public.room_idea_tasks;
drop policy if exists "Anyone can read profiles" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Anyone can read room templates"
  on public.room_templates for select
  using (true);

create policy "Anyone can create room templates"
  on public.room_templates for insert
  with check (true);

create policy "Anyone can read rooms"
  on public.rooms for select
  using (true);

create policy "Anyone can create rooms"
  on public.rooms for insert
  with check (true);

create policy "Anyone can update rooms"
  on public.rooms for update
  using (true)
  with check (true);

create policy "Only admins can delete rooms"
  on public.rooms for delete
  using (public.is_admin_user(auth.uid()));

create policy "Anyone can read room idea tasks"
  on public.room_idea_tasks for select
  using (true);

create policy "Anyone can create room idea tasks"
  on public.room_idea_tasks for insert
  with check (true);

create policy "Anyone can update room idea tasks"
  on public.room_idea_tasks for update
  using (true);

create policy "Anyone can delete room idea tasks"
  on public.room_idea_tasks for delete
  using (true);

create policy "Anyone can read profiles"
  on public.profiles for select
  using (true);

create policy "Users can create their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can read avatars" on storage.objects;
drop policy if exists "Users can upload their own avatars" on storage.objects;
drop policy if exists "Users can update their own avatars" on storage.objects;

create policy "Anyone can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
