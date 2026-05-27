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
  host_friend_code text not null default '',
  host_username text not null default '',
  host_reconnect_until timestamptz,
  study_table jsonb not null default '{}'::jsonb,
  pinned_message jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.room_states
  add column if not exists host_friend_code text not null default '',
  add column if not exists host_username text not null default '',
  add column if not exists host_reconnect_until timestamptz,
  add column if not exists study_table jsonb not null default '{}'::jsonb,
  add column if not exists pinned_message jsonb not null default 'null'::jsonb;

alter table public.room_states enable row level security;

drop policy if exists "room states are readable" on public.room_states;
create policy "room states are readable"
on public.room_states for select
using (true);

-- Do not add public write policies for this table.
-- The backend should write with SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS.
