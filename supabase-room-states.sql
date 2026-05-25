create table if not exists public.room_states (
  room_id text primary key,
  playlist jsonb not null default '[]'::jsonb,
  current_video jsonb not null default '{}'::jsonb,
  chat_messages jsonb not null default '[]'::jsonb,
  pomodoro jsonb not null default '{}'::jsonb,
  idea_tasks jsonb not null default '[]'::jsonb,
  room_title text not null default '',
  is_private boolean not null default false,
  host_avatar_url text not null default '',
  tiktok_video_id text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.room_states enable row level security;

drop policy if exists "room states are readable" on public.room_states;
create policy "room states are readable"
on public.room_states for select
using (true);

-- Do not add public write policies for this table.
-- The backend should write with SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
