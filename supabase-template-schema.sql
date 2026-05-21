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

alter table public.room_templates enable row level security;
alter table public.room_idea_tasks enable row level security;

create policy "Anyone can read room templates"
  on public.room_templates for select
  using (true);

create policy "Anyone can create room templates"
  on public.room_templates for insert
  with check (true);

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
