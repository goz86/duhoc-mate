-- TOPIK product content, personal mistakes, and room game history.
-- Run after supabase-template-schema.sql / supabase-community-migration.sql.

create extension if not exists pgcrypto;

create or replace function public.is_topik_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and is_admin = true
  );
$$;

create table if not exists public.topik_grammar_patterns (
  id text primary key,
  level integer not null check (level between 1 and 6),
  title text not null,
  formula text not null,
  meaning_vi text not null,
  meaning_en text not null default '',
  examples jsonb not null default '[]'::jsonb check (jsonb_typeof(examples) = 'array'),
  common_mistake text not null default '',
  grammar_type text not null default 'general',
  tags text[] not null default '{}'::text[],
  similar_patterns text[] not null default '{}'::text[],
  contrast_notes text not null default '',
  prerequisites text[] not null default '{}'::text[],
  ai_model text,
  ai_prompt_version text,
  source text not null default 'curated',
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published', 'archived')),
  quality_score numeric(4, 2) not null default 0 check (quality_score between 0 and 10),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topik_question_bank (
  id text primary key,
  level integer not null check (level between 1 and 6),
  category text not null check (category in ('grammar', 'vocabulary', 'reading', 'sentence', 'listening')),
  game_types text[] not null default '{}'::text[],
  error_type text not null check (error_type in ('vocabulary', 'grammar_connector', 'honorific', 'reading', 'similar_meaning')),
  pattern_id text references public.topik_grammar_patterns(id) on delete set null,
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) between 2 and 6),
  answer_index integer not null check (answer_index between 0 and 5),
  explanation text not null default '',
  difficulty integer not null default 3 check (difficulty between 1 and 5),
  source text not null default 'curated',
  status text not null default 'draft' check (status in ('draft', 'reviewed', 'published', 'archived')),
  quality_score numeric(4, 2) not null default 0 check (quality_score between 0 and 10),
  times_used integer not null default 0,
  correct_count integer not null default 0,
  wrong_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.topik_grammar_patterns add column if not exists grammar_type text not null default 'general';
alter table public.topik_grammar_patterns add column if not exists tags text[] not null default '{}'::text[];
alter table public.topik_grammar_patterns add column if not exists similar_patterns text[] not null default '{}'::text[];
alter table public.topik_grammar_patterns add column if not exists contrast_notes text not null default '';
alter table public.topik_grammar_patterns add column if not exists prerequisites text[] not null default '{}'::text[];
alter table public.topik_grammar_patterns add column if not exists ai_model text;
alter table public.topik_grammar_patterns add column if not exists ai_prompt_version text;

create table if not exists public.topik_content_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level integer not null check (level between 1 and 6),
  grammar_payload jsonb not null check (jsonb_typeof(grammar_payload) = 'object'),
  questions_payload jsonb not null check (jsonb_typeof(questions_payload) = 'array'),
  validation_report jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text not null default '',
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topik_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level integer not null check (level between 1 and 6),
  requested_count integer not null check (requested_count between 1 and 3),
  grammar_type text not null default 'general',
  topic text not null default '',
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  generated_count integer not null default 0,
  error_message text not null default '',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.topik_user_mistakes (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  source text not null check (source in ('quick-practice', 'room-game', 'mock-exam')),
  level integer not null check (level between 1 and 6),
  error_type text not null,
  prompt_snapshot text not null,
  last_wrong_answer text not null,
  correct_answer text not null,
  explanation_snapshot text not null default '',
  wrong_count integer not null default 1,
  last_wrong_at timestamptz not null default now(),
  mastered_at timestamptz,
  primary key (user_id, question_id, source)
);

create table if not exists public.topik_game_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  game_type text not null check (game_type in ('vocab-speed', 'sentence-build', 'topik-master', 'grammar-race')),
  started_at timestamptz not null,
  ended_at timestamptz not null default now(),
  questions_used text[] not null default '{}'::text[],
  leaderboard jsonb not null default '[]'::jsonb,
  player_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists topik_grammar_patterns_published_level_idx
  on public.topik_grammar_patterns (level, quality_score desc)
  where status = 'published';

create index if not exists topik_question_bank_published_level_idx
  on public.topik_question_bank (level, category, quality_score desc)
  where status = 'published';

create index if not exists topik_question_bank_pattern_idx
  on public.topik_question_bank (pattern_id)
  where pattern_id is not null;

create index if not exists topik_question_bank_game_types_idx
  on public.topik_question_bank using gin (game_types);

create index if not exists topik_grammar_patterns_tags_idx
  on public.topik_grammar_patterns using gin (tags);

create index if not exists topik_content_submissions_status_created_idx
  on public.topik_content_submissions (status, created_at desc);

create index if not exists topik_content_submissions_user_created_idx
  on public.topik_content_submissions (user_id, created_at desc);

create index if not exists topik_generation_jobs_user_created_idx
  on public.topik_generation_jobs (user_id, created_at desc);

create index if not exists topik_user_mistakes_user_last_wrong_idx
  on public.topik_user_mistakes (user_id, last_wrong_at desc);

create index if not exists topik_game_sessions_room_ended_idx
  on public.topik_game_sessions (room_id, ended_at desc);

alter table public.topik_grammar_patterns enable row level security;
alter table public.topik_question_bank enable row level security;
alter table public.topik_content_submissions enable row level security;
alter table public.topik_generation_jobs enable row level security;
alter table public.topik_user_mistakes enable row level security;
alter table public.topik_game_sessions enable row level security;

drop policy if exists "Published grammar is readable" on public.topik_grammar_patterns;
create policy "Published grammar is readable"
  on public.topik_grammar_patterns for select
  using (status = 'published' or (select public.is_topik_admin()));

drop policy if exists "Admins manage grammar" on public.topik_grammar_patterns;
create policy "Admins manage grammar"
  on public.topik_grammar_patterns for all
  using ((select public.is_topik_admin()))
  with check ((select public.is_topik_admin()));

drop policy if exists "AI direct grammar can be inserted" on public.topik_grammar_patterns;
create policy "AI direct grammar can be inserted"
  on public.topik_grammar_patterns for insert
  with check (
    id like 'ai-grammar-%'
    and source = 'ai-direct'
    and status = 'published'
  );

drop policy if exists "AI direct grammar cleanup is allowed" on public.topik_grammar_patterns;
create policy "AI direct grammar cleanup is allowed"
  on public.topik_grammar_patterns for delete
  using (
    id like 'ai-grammar-%'
    and source = 'ai-direct'
  );

drop policy if exists "Published questions are readable" on public.topik_question_bank;
create policy "Published questions are readable"
  on public.topik_question_bank for select
  using (status = 'published' or (select public.is_topik_admin()));

drop policy if exists "Admins manage questions" on public.topik_question_bank;
create policy "Admins manage questions"
  on public.topik_question_bank for all
  using ((select public.is_topik_admin()))
  with check ((select public.is_topik_admin()));

drop policy if exists "AI direct questions can be inserted" on public.topik_question_bank;
create policy "AI direct questions can be inserted"
  on public.topik_question_bank for insert
  with check (
    id like 'ai-grammar-%'
    and pattern_id like 'ai-grammar-%'
    and source = 'ai-direct'
    and status = 'published'
  );

drop policy if exists "Users read own TOPIK submissions" on public.topik_content_submissions;
create policy "Users read own TOPIK submissions"
  on public.topik_content_submissions for select
  using ((select auth.uid()) = user_id or (select public.is_topik_admin()));

drop policy if exists "Users create own TOPIK submissions" on public.topik_content_submissions;
create policy "Users create own TOPIK submissions"
  on public.topik_content_submissions for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Admins review TOPIK submissions" on public.topik_content_submissions;
create policy "Admins review TOPIK submissions"
  on public.topik_content_submissions for update
  using ((select public.is_topik_admin()))
  with check ((select public.is_topik_admin()));

drop policy if exists "Users read own TOPIK generation jobs" on public.topik_generation_jobs;
create policy "Users read own TOPIK generation jobs"
  on public.topik_generation_jobs for select
  using ((select auth.uid()) = user_id or (select public.is_topik_admin()));

drop policy if exists "Users create own TOPIK generation jobs" on public.topik_generation_jobs;
create policy "Users create own TOPIK generation jobs"
  on public.topik_generation_jobs for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own TOPIK generation jobs" on public.topik_generation_jobs;
create policy "Users update own TOPIK generation jobs"
  on public.topik_generation_jobs for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.approve_topik_submission(submission_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  submission public.topik_content_submissions%rowtype;
  pattern jsonb;
  question jsonb;
begin
  if not public.is_topik_admin() then
    raise exception 'Admin permission required';
  end if;

  select *
  into submission
  from public.topik_content_submissions
  where id = submission_id
    and status = 'pending'
  for update;

  if submission.id is null then
    raise exception 'Pending submission not found';
  end if;

  pattern := submission.grammar_payload;

  insert into public.topik_grammar_patterns (
    id, level, title, formula, meaning_vi, meaning_en, examples, common_mistake,
    grammar_type, tags, similar_patterns, contrast_notes, prerequisites,
    source, status, quality_score, created_by, ai_model, ai_prompt_version, updated_at
  ) values (
    pattern->>'id',
    submission.level,
    pattern->>'title',
    pattern->>'formula',
    pattern->>'meaning_vi',
    coalesce(pattern->>'meaning_en', ''),
    coalesce(pattern->'examples', '[]'::jsonb),
    coalesce(pattern->>'common_mistake', ''),
    coalesce(pattern->>'grammar_type', 'general'),
    array(select jsonb_array_elements_text(coalesce(pattern->'tags', '[]'::jsonb))),
    array(select jsonb_array_elements_text(coalesce(pattern->'similar_patterns', '[]'::jsonb))),
    coalesce(pattern->>'contrast_notes', ''),
    array(select jsonb_array_elements_text(coalesce(pattern->'prerequisites', '[]'::jsonb))),
    'ai-submission',
    'published',
    7.0,
    submission.user_id,
    coalesce(pattern->>'ai_model', 'deepseek-chat'),
    coalesce(pattern->>'ai_prompt_version', 'grammar-v1'),
    now()
  )
  on conflict (id) do update set
    title = excluded.title,
    formula = excluded.formula,
    meaning_vi = excluded.meaning_vi,
    meaning_en = excluded.meaning_en,
    examples = excluded.examples,
    common_mistake = excluded.common_mistake,
    grammar_type = excluded.grammar_type,
    tags = excluded.tags,
    similar_patterns = excluded.similar_patterns,
    contrast_notes = excluded.contrast_notes,
    prerequisites = excluded.prerequisites,
    status = 'published',
    updated_at = now();

  for question in select * from jsonb_array_elements(submission.questions_payload)
  loop
    insert into public.topik_question_bank (
      id, level, category, game_types, error_type, pattern_id, prompt, options,
      answer_index, explanation, difficulty, source, status, quality_score, created_by, updated_at
    ) values (
      question->>'id',
      submission.level,
      question->>'category',
      array(select jsonb_array_elements_text(coalesce(question->'game_types', '[]'::jsonb))),
      question->>'error_type',
      pattern->>'id',
      question->>'prompt',
      question->'options',
      (question->>'answer_index')::integer,
      coalesce(question->>'explanation', ''),
      coalesce((question->>'difficulty')::integer, 3),
      'ai-submission',
      'published',
      7.0,
      submission.user_id,
      now()
    )
    on conflict (id) do update set
      game_types = excluded.game_types,
      prompt = excluded.prompt,
      options = excluded.options,
      answer_index = excluded.answer_index,
      explanation = excluded.explanation,
      status = 'published',
      updated_at = now();
  end loop;

  update public.topik_content_submissions
  set status = 'approved',
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      updated_at = now()
  where id = submission_id;
end;
$$;

revoke all on function public.approve_topik_submission(uuid) from public;
grant execute on function public.approve_topik_submission(uuid) to authenticated;

drop policy if exists "Users read own TOPIK mistakes" on public.topik_user_mistakes;
create policy "Users read own TOPIK mistakes"
  on public.topik_user_mistakes for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own TOPIK mistakes" on public.topik_user_mistakes;
create policy "Users insert own TOPIK mistakes"
  on public.topik_user_mistakes for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update own TOPIK mistakes" on public.topik_user_mistakes;
create policy "Users update own TOPIK mistakes"
  on public.topik_user_mistakes for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete own TOPIK mistakes" on public.topik_user_mistakes;
create policy "Users delete own TOPIK mistakes"
  on public.topik_user_mistakes for delete
  using ((select auth.uid()) = user_id);

-- topik_game_sessions intentionally has no public policies.
-- The realtime server writes it with SUPABASE_SERVICE_ROLE_KEY.

insert into public.topik_grammar_patterns
  (id, level, title, formula, meaning_vi, meaning_en, examples, common_mistake, source, status, quality_score)
values
  ('g1-go-sipda', 1, '-고 싶다', 'V-고 싶다', 'Muốn làm gì đó.', 'Want to do something.',
    '[{"ko":"한국어를 배우고 싶어요.","vi":"Tôi muốn học tiếng Hàn."},{"ko":"주말에 쉬고 싶어요.","vi":"Cuối tuần tôi muốn nghỉ."}]',
    'Không dùng trực tiếp với danh từ. Hãy đổi sang động từ: 김치를 먹고 싶어요.', 'curated', 'published', 8.5),
  ('g1-euro-gada', 1, '-으러/러 가다', 'V-(으)러 가다/오다', 'Đi/đến để làm một việc gì đó.', 'Go/come in order to do something.',
    '[{"ko":"책을 사러 서점에 가요.","vi":"Tôi đến hiệu sách để mua sách."},{"ko":"친구를 만나러 카페에 왔어요.","vi":"Tôi đến quán cà phê để gặp bạn."}]',
    'Chỉ dùng với động từ chỉ mục đích, phía sau thường là 가다/오다/다니다.', 'curated', 'published', 8.5),
  ('g2-eumyeon', 2, '-으면/면', 'V/A-(으)면', 'Nếu/khi một điều kiện xảy ra.', 'If/when a condition happens.',
    '[{"ko":"시간이 있으면 같이 공부해요.","vi":"Nếu có thời gian thì học cùng nhé."},{"ko":"날씨가 좋으면 산책할 거예요.","vi":"Nếu thời tiết đẹp tôi sẽ đi dạo."}]',
    'Không dùng hai lần điều kiện trong cùng một vế.', 'curated', 'published', 8.5),
  ('g2-gie-jeone', 2, '-기 전에', 'V-기 전에', 'Trước khi làm gì.', 'Before doing something.',
    '[{"ko":"자기 전에 숙제를 했어요.","vi":"Trước khi ngủ tôi đã làm bài tập."},{"ko":"시험 보기 전에 단어를 외워요.","vi":"Trước khi thi tôi học thuộc từ vựng."}]',
    'Không chia thì ở động từ trước -기 전에: 먹기 전에, không viết 먹었기 전에.', 'curated', 'published', 8.5),
  ('g3-neun-baram-e', 3, '-는 바람에', 'V-는 바람에', 'Vì một việc bất ngờ/tiêu cực xảy ra nên dẫn đến kết quả không mong muốn.', 'Because something unexpected happened, usually causing a negative result.',
    '[{"ko":"비가 오는 바람에 소풍이 취소됐어요.","vi":"Vì trời mưa nên chuyến dã ngoại bị hủy."},{"ko":"버스를 놓치는 바람에 늦었어요.","vi":"Vì lỡ xe buýt nên tôi đến muộn."}]',
    'Không dùng cho kết quả tích cực tự nhiên.', 'curated', 'published', 8.5),
  ('g3-dorok', 3, '-도록', 'V-도록', 'Để/nhằm đạt mục tiêu hoặc mức độ nào đó.', 'So that, in order to, or to the extent that.',
    '[{"ko":"잊지 않도록 메모하세요.","vi":"Hãy ghi chú để không quên."},{"ko":"모두 들을 수 있도록 크게 말해 주세요.","vi":"Hãy nói to để mọi người đều nghe được."}]',
    'Nếu chỉ nêu mục đích đơn giản với danh từ địa điểm, -으러 có thể tự nhiên hơn.', 'curated', 'published', 8.5),
  ('g4-neun-dae-banhae', 4, '-는 데 반해', 'V-는 데 반해 / A-(으)ㄴ 데 반해', 'Trái lại, dùng để so sánh hai ý đối lập.', 'In contrast to; used to compare opposing facts.',
    '[{"ko":"형은 조용한 데 반해 동생은 활발해요.","vi":"Anh thì trầm lặng, trái lại em thì năng động."},{"ko":"도시는 편리한 데 반해 생활비가 비싸요.","vi":"Thành phố tiện lợi, nhưng trái lại chi phí sinh hoạt đắt."}]',
    'Hai vế phải có quan hệ đối lập rõ ràng.', 'curated', 'published', 8.5),
  ('g4-eul-bbunman-anira', 4, '-을 뿐만 아니라', 'V/A-(으)ㄹ 뿐만 아니라 N뿐만 아니라', 'Không chỉ... mà còn...', 'Not only... but also...',
    '[{"ko":"이 앱은 편리할 뿐만 아니라 디자인도 예뻐요.","vi":"Ứng dụng này không chỉ tiện lợi mà thiết kế cũng đẹp."},{"ko":"그는 한국어뿐만 아니라 영어도 잘해요.","vi":"Anh ấy không chỉ giỏi tiếng Hàn mà còn giỏi tiếng Anh."}]',
    'Sau vế sau thường dùng 도 để nhấn mạnh cũng/còn.', 'curated', 'published', 8.5),
  ('g5-neun-han', 5, '-는 한', 'V-는 한 / A-(으)ㄴ 한', 'Miễn là/trong phạm vi điều kiện còn đúng.', 'As long as; insofar as.',
    '[{"ko":"노력하는 한 좋은 결과가 있을 거예요.","vi":"Miễn là còn nỗ lực thì sẽ có kết quả tốt."},{"ko":"건강한 한 계속 일하고 싶어요.","vi":"Miễn là còn khỏe, tôi muốn tiếp tục làm việc."}]',
    'Không nhầm với -기만 하면. -는 한 nhấn mạnh điều kiện duy trì lâu hơn.', 'curated', 'published', 8.5),
  ('g5-eul-tende', 5, '-을 텐데', 'V/A-(으)ㄹ 텐데', 'Chắc là/sẽ... nên; diễn tả suy đoán kèm lo lắng hoặc gợi ý.', 'Would probably; used with expectation, concern, or suggestion.',
    '[{"ko":"길이 막힐 텐데 일찍 출발하세요.","vi":"Đường chắc sẽ tắc nên hãy xuất phát sớm."},{"ko":"피곤할 텐데 좀 쉬세요.","vi":"Chắc bạn mệt rồi, nghỉ chút đi."}]',
    'Không dùng như một kết luận chắc chắn tuyệt đối.', 'curated', 'published', 8.5),
  ('g6-eul-mangjeong', 6, '-을 망정', 'V/A-(으)ㄹ 망정', 'Dù có... thì cũng không/nhưng vẫn.', 'Even if; emphatic concession.',
    '[{"ko":"힘들 망정 포기하지 않겠습니다.","vi":"Dù có vất vả tôi cũng sẽ không bỏ cuộc."},{"ko":"늦을 망정 거짓말은 하지 마세요.","vi":"Dù có muộn cũng đừng nói dối."}]',
    'Mẫu này trang trọng, không hợp hội thoại đời thường quá đơn giản.', 'curated', 'published', 8.5),
  ('g6-neun-dungi-maneun-dungi', 6, '-는 둥 마는 둥', 'V-는 둥 마는 둥', 'Làm qua loa, làm như có như không.', 'To do something half-heartedly or barely.',
    '[{"ko":"아침을 먹는 둥 마는 둥 하고 나왔어요.","vi":"Tôi ăn sáng qua loa rồi ra ngoài."},{"ko":"그는 대답하는 둥 마는 둥 했어요.","vi":"Anh ấy trả lời hờ hững như có như không."}]',
    'Không dùng cho hành động làm cẩn thận hoặc hoàn thành đầy đủ.', 'curated', 'published', 8.5)
on conflict (id) do update set
  level = excluded.level,
  title = excluded.title,
  formula = excluded.formula,
  meaning_vi = excluded.meaning_vi,
  meaning_en = excluded.meaning_en,
  examples = excluded.examples,
  common_mistake = excluded.common_mistake,
  status = excluded.status,
  quality_score = excluded.quality_score,
  updated_at = now();

insert into public.topik_grammar_patterns
  (id, level, title, formula, meaning_vi, meaning_en, examples, common_mistake, grammar_type, tags, source, status, quality_score)
values
  ('g1-eul-geoyeyo', 1, '-을/ㄹ 거예요', 'V-(으)ㄹ 거예요', 'Sẽ làm gì; diễn tả dự định hoặc dự đoán tương lai.', 'Will; used for future plans or predictions.',
    '[{"ko":"내일 친구를 만날 거예요.","vi":"Ngày mai tôi sẽ gặp bạn."},{"ko":"주말에 공부할 거예요.","vi":"Cuối tuần tôi sẽ học."}]',
    'Không gắn trực tiếp sau danh từ. Với danh từ dùng N일 거예요.', 'tense-aspect', '{"future","plan"}', 'curated', 'published', 8.2),
  ('g1-aseo-eoseo', 1, '-아서/어서', 'V/A-아서/어서', 'Vì/nên hoặc rồi; dùng cho nguyên nhân tự nhiên và trình tự hành động.', 'Because/so, or and then; used for reasons and sequence.',
    '[{"ko":"비가 와서 집에 있었어요.","vi":"Vì trời mưa nên tôi ở nhà."},{"ko":"학교에 가서 친구를 만났어요.","vi":"Tôi đến trường rồi gặp bạn."}]',
    'Không dùng với câu mệnh lệnh/rủ rê khi nêu lý do; hãy dùng -(으)니까.', 'connector', '{"reason","sequence"}', 'curated', 'published', 8.4),
  ('g1-go', 1, '-고', 'V/A-고', 'Và; nối hai hành động hoặc tính chất ngang hàng.', 'And; links two actions or states.',
    '[{"ko":"밥을 먹고 커피를 마셔요.","vi":"Tôi ăn cơm và uống cà phê."},{"ko":"이 방은 깨끗하고 조용해요.","vi":"Phòng này sạch và yên tĩnh."}]',
    'Không dùng -고 để thể hiện nguyên nhân-kết quả rõ ràng; khi đó dùng -아서/어서.', 'connector', '{"connector","sequence"}', 'curated', 'published', 8.4),
  ('g1-ji-anhda', 1, '-지 않다', 'V/A-지 않다', 'Không làm gì/không như thế.', 'Not; negative form for verbs and adjectives.',
    '[{"ko":"오늘은 학교에 가지 않아요.","vi":"Hôm nay tôi không đi học."},{"ko":"이 음식은 맵지 않아요.","vi":"Món này không cay."}]',
    'Đừng dùng 안 và -지 않다 cùng lúc trong một vị ngữ.', 'general', '{"negative"}', 'curated', 'published', 8.1),
  ('g1-eul-su-issda', 1, '-을/ㄹ 수 있다', 'V-(으)ㄹ 수 있다/없다', 'Có thể/không thể làm gì.', 'Can/cannot do something.',
    '[{"ko":"한국어를 읽을 수 있어요.","vi":"Tôi có thể đọc tiếng Hàn."},{"ko":"오늘은 갈 수 없어요.","vi":"Hôm nay tôi không thể đi."}]',
    'Đừng nhầm khả năng -을 수 있다 với dự định tương lai -을 거예요.', 'general', '{"ability"}', 'curated', 'published', 8.3),
  ('g1-a-eo-boda', 1, '-아/어 보다', 'V-아/어 보다', 'Thử làm gì; đã từng thử/trải nghiệm.', 'Try doing; have the experience of doing.',
    '[{"ko":"김치를 먹어 봤어요.","vi":"Tôi đã thử ăn kimchi."},{"ko":"이 문제를 풀어 보세요.","vi":"Hãy thử giải bài này."}]',
    'Không viết 보다 sau tính từ để diễn tả “trông có vẻ”; đó là mẫu -아/어 보이다.', 'general', '{"experience"}', 'curated', 'published', 8.2),
  ('g2-go-naseo', 2, '-고 나서', 'V-고 나서', 'Sau khi làm xong một việc rồi mới làm việc khác.', 'After finishing one action, then doing another.',
    '[{"ko":"숙제를 하고 나서 영화를 봤어요.","vi":"Sau khi làm bài tập xong tôi xem phim."},{"ko":"밥을 먹고 나서 약을 드세요.","vi":"Sau khi ăn cơm xong hãy uống thuốc."}]',
    'Nhấn mạnh hoàn thành hành động trước; nếu chỉ nối hành động đơn giản, -고 có thể đủ.', 'connector', '{"sequence"}', 'curated', 'published', 8.3),
  ('g2-eul-kka-yo', 2, '-을/ㄹ까요?', 'V-(으)ㄹ까요?', 'Hay là...? dùng để hỏi ý kiến, đề nghị hoặc tự hỏi.', 'Shall we/should I; asks for opinion or suggests.',
    '[{"ko":"같이 공부할까요?","vi":"Chúng ta học cùng nhé?"},{"ko":"무엇을 먹을까요?","vi":"Chúng ta ăn gì nhỉ?"}]',
    'Không dùng như câu trần thuật; đây là dạng câu hỏi/đề nghị.', 'general', '{"suggestion","question"}', 'curated', 'published', 8.1),
  ('g2-eu-nikka', 2, '-으니까/니까', 'V/A-(으)니까', 'Vì... nên; thường dùng với mệnh lệnh, đề nghị, rủ rê.', 'Because; often used with commands and suggestions.',
    '[{"ko":"날씨가 추우니까 코트를 입으세요.","vi":"Vì trời lạnh nên hãy mặc áo khoác."},{"ko":"시간이 없으니까 택시를 탑시다.","vi":"Vì không có thời gian nên đi taxi nhé."}]',
    'Với miêu tả kết quả tự nhiên, -아서/어서 thường mềm hơn.', 'connector', '{"reason"}', 'curated', 'published', 8.4),
  ('g2-eumyeonseo', 2, '-으면서/면서', 'V-(으)면서', 'Vừa làm việc này vừa làm việc khác.', 'While doing; doing two actions simultaneously.',
    '[{"ko":"음악을 들으면서 공부해요.","vi":"Tôi vừa nghe nhạc vừa học."},{"ko":"걸으면서 전화했어요.","vi":"Tôi vừa đi bộ vừa gọi điện."}]',
    'Chủ ngữ hai vế thường phải là một người; nếu khác chủ ngữ cần cấu trúc khác.', 'connector', '{"simultaneous"}', 'curated', 'published', 8.3),
  ('g2-a-ya-hada', 2, '-아/어야 하다', 'V-아/어야 하다', 'Phải làm gì; diễn tả nghĩa vụ/cần thiết.', 'Must/have to do something.',
    '[{"ko":"내일까지 숙제를 해야 해요.","vi":"Tôi phải làm bài tập trước ngày mai."},{"ko":"시험 전에 단어를 외워야 해요.","vi":"Trước kỳ thi phải học thuộc từ vựng."}]',
    'Không nhầm với -고 싶다; một bên là muốn, một bên là phải.', 'general', '{"obligation"}', 'curated', 'published', 8.2),
  ('g2-boda-comparison', 2, '보다', 'N보다', 'So với; dùng trong câu so sánh hơn.', 'Than; used in comparative sentences.',
    '[{"ko":"오늘은 어제보다 더 추워요.","vi":"Hôm nay lạnh hơn hôm qua."},{"ko":"지하철이 버스보다 빨라요.","vi":"Tàu điện ngầm nhanh hơn xe buýt."}]',
    'Không dùng 보다 một mình; cần tính từ/trạng từ so sánh ở vị ngữ.', 'comparison', '{"comparison"}', 'curated', 'published', 8.1),
  ('g3-ge-doeda', 3, '-게 되다', 'V-게 되다', 'Trở nên/được dẫn đến việc làm gì; nhấn mạnh thay đổi hoặc kết quả.', 'Come to; end up doing due to a change or circumstance.',
    '[{"ko":"한국 회사에서 일하게 됐어요.","vi":"Tôi đã được làm ở công ty Hàn Quốc."},{"ko":"친구 덕분에 한국어를 배우게 됐어요.","vi":"Nhờ bạn mà tôi bắt đầu học tiếng Hàn."}]',
    'Không dùng khi muốn nói chủ ý mạnh ngay từ đầu; mẫu này nhấn vào sự chuyển biến.', 'general', '{"change"}', 'curated', 'published', 8.5),
  ('g3-na-boda', 3, '-나 보다', 'V-나 보다 / A-(으)ㄴ가 보다', 'Có vẻ như; suy đoán dựa trên dấu hiệu nhìn/nghe thấy.', 'It seems; guess based on observable evidence.',
    '[{"ko":"불이 꺼져 있어요. 아무도 없나 봐요.","vi":"Đèn tắt rồi. Có vẻ không có ai."},{"ko":"사람이 많네요. 맛있는가 봐요.","vi":"Đông người nhỉ. Có vẻ ngon."}]',
    'Không dùng cho suy đoán hoàn toàn không có căn cứ; khi đó dùng -(으)ㄹ 것 같다.', 'general', '{"guess"}', 'curated', 'published', 8.4),
  ('g3-eul-su-bakke-eopda', 3, '-을/ㄹ 수밖에 없다', 'V-(으)ㄹ 수밖에 없다', 'Không còn cách nào khác ngoài việc phải làm gì.', 'Have no choice but to do something.',
    '[{"ko":"비가 너무 와서 취소할 수밖에 없어요.","vi":"Mưa quá to nên không còn cách nào ngoài hủy."},{"ko":"시간이 없어서 택시를 탈 수밖에 없었어요.","vi":"Không có thời gian nên tôi đành đi taxi."}]',
    'Không dùng cho lựa chọn vui vẻ/tự nguyện; nó có sắc thái bị buộc phải làm.', 'general', '{"necessity"}', 'curated', 'published', 8.5),
  ('g3-deoni', 3, '-더니', 'V/A-더니', 'Sau khi/đã thấy... thì; nối điều quan sát trước với kết quả sau.', 'After observing that..., then; links observed fact and result.',
    '[{"ko":"열심히 공부하더니 시험을 잘 봤어요.","vi":"Thấy học chăm rồi cuối cùng thi tốt."},{"ko":"아침부터 춥더니 눈이 오네요.","vi":"Từ sáng đã lạnh, giờ tuyết rơi rồi."}]',
    'Thường dùng với điều người nói đã trực tiếp trải nghiệm/quan sát.', 'connector', '{"observation","result"}', 'curated', 'published', 8.4),
  ('g3-neun-daemune', 3, '-기 때문에', 'V/A-기 때문에 / N 때문에', 'Vì; diễn tả nguyên nhân rõ ràng, hơi trang trọng hơn -아서/어서.', 'Because; gives a clear reason, slightly formal.',
    '[{"ko":"시험이 있기 때문에 일찍 자야 해요.","vi":"Vì có kỳ thi nên phải ngủ sớm."},{"ko":"교통 때문에 늦었어요.","vi":"Tôi muộn vì giao thông."}]',
    'Không dùng trực tiếp với mệnh lệnh/rủ rê tự nhiên bằng -기 때문에; dùng -(으)니까 sẽ hợp hơn.', 'connector', '{"reason"}', 'curated', 'published', 8.3),
  ('g3-eul-mankeum', 3, '-을/ㄹ 만큼', 'V-(으)ㄹ 만큼 / A-(으)ㄴ 만큼', 'Đến mức; bằng với mức độ nào đó.', 'To the extent that; as much as.',
    '[{"ko":"눈물이 날 만큼 감동적이었어요.","vi":"Cảm động đến mức rơi nước mắt."},{"ko":"혼자 할 수 있을 만큼 쉬워요.","vi":"Dễ đến mức có thể tự làm một mình."}]',
    'Không nhầm với -처럼. -만큼 nhấn mạnh mức độ/số lượng tương đương.', 'comparison', '{"degree"}', 'curated', 'published', 8.2),
  ('g4-neun-pyeonida', 4, '-는 편이다', 'V-는 편이다 / A-(으)ㄴ 편이다', 'Thuộc loại/khá là; đánh giá ở mức tương đối.', 'Tend to be; rather/relatively.',
    '[{"ko":"저는 아침에 일찍 일어나는 편이에요.","vi":"Tôi thuộc kiểu dậy sớm."},{"ko":"이 식당은 가격이 비싼 편이에요.","vi":"Quán này khá đắt."}]',
    'Không dùng khi muốn khẳng định tuyệt đối; nó mang sắc thái tương đối.', 'general', '{"degree"}', 'curated', 'published', 8.3),
  ('g4-eul-jul-alda', 4, '-을/ㄹ 줄 알다', 'V-(으)ㄹ 줄 알다/모르다', 'Biết/không biết cách làm gì; cũng có thể diễn tả đã tưởng rằng.', 'Know how to; also can mean thought that.',
    '[{"ko":"저는 김치를 만들 줄 알아요.","vi":"Tôi biết làm kimchi."},{"ko":"오늘 비가 올 줄 알았어요.","vi":"Tôi đã tưởng hôm nay sẽ mưa."}]',
    'Cần phân biệt “biết cách làm” với “biết sự thật” là -는지 알다.', 'general', '{"ability","guess"}', 'curated', 'published', 8.2),
  ('g4-ge-mandeulda', 4, '-게 만들다', 'V/A-게 만들다', 'Làm cho ai/cái gì trở nên hoặc làm gì.', 'Make someone/something become or do something.',
    '[{"ko":"그 영화는 사람들을 웃게 만들어요.","vi":"Bộ phim đó làm mọi người cười."},{"ko":"실패가 저를 더 강하게 만들었어요.","vi":"Thất bại khiến tôi mạnh mẽ hơn."}]',
    'Không dùng như mệnh lệnh “hãy làm”; đây là cấu trúc gây tác động/kết quả.', 'connector', '{"causative"}', 'curated', 'published', 8.2),
  ('g4-gi-maryeonida', 4, '-기 마련이다', 'V/A-기 마련이다', 'Thường/đương nhiên sẽ xảy ra như vậy.', 'It is natural/inevitable that.',
    '[{"ko":"노력하면 실력이 늘기 마련이에요.","vi":"Nếu nỗ lực thì năng lực thường sẽ tăng."},{"ko":"처음에는 누구나 실수하기 마련이에요.","vi":"Ban đầu ai cũng thường mắc lỗi."}]',
    'Không dùng cho sự kiện ngẫu nhiên hiếm gặp; nó nói về quy luật/tính tất yếu.', 'general', '{"inevitable"}', 'curated', 'published', 8.3),
  ('g4-neun-ji-alda', 4, '-는지 알다', 'V-는지 / A-(으)ㄴ지 알다/모르다', 'Biết/không biết liệu, rằng, cái gì/khi nào/ở đâu...', 'Know/do not know whether, what, when, where, etc.',
    '[{"ko":"회의가 몇 시에 시작하는지 알아요?","vi":"Bạn biết cuộc họp bắt đầu lúc mấy giờ không?"},{"ko":"그 사람이 왜 화났는지 몰라요.","vi":"Tôi không biết vì sao người đó giận."}]',
    'Không nhầm với -을 줄 알다 khi nói biết cách làm một kỹ năng.', 'general', '{"indirect-question"}', 'curated', 'published', 8.2),
  ('g4-eul-geot-gatda', 4, '-을/ㄹ 것 같다', 'V/A-(으)ㄹ 것 같다', 'Có vẻ/chắc là; diễn tả suy đoán mềm.', 'Seems/probably; a soft guess.',
    '[{"ko":"내일 비가 올 것 같아요.","vi":"Có vẻ ngày mai trời sẽ mưa."},{"ko":"이 문제가 어려울 것 같아요.","vi":"Bài này có vẻ khó."}]',
    'Không dùng như sự thật chắc chắn tuyệt đối; nó là suy đoán.', 'general', '{"guess"}', 'curated', 'published', 8.2),
  ('g5-eul-bbeonhada', 5, '-을/ㄹ 뻔하다', 'V-(으)ㄹ 뻔하다', 'Suýt nữa thì làm gì/xảy ra chuyện gì.', 'Almost did; nearly happened.',
    '[{"ko":"버스를 놓칠 뻔했어요.","vi":"Tôi suýt lỡ xe buýt."},{"ko":"계단에서 넘어질 뻔했어요.","vi":"Tôi suýt ngã ở cầu thang."}]',
    'Thường dùng với tình huống không xảy ra thật; nếu đã xảy ra thì dùng cấu trúc khác.', 'general', '{"almost"}', 'curated', 'published', 8.4),
  ('g5-neun-tong-e', 5, '-는 통에', 'V-는 통에', 'Vì một việc rối/ồn/khó chịu xảy ra nên dẫn tới kết quả không tốt.', 'Because of a disruptive event, leading to a negative result.',
    '[{"ko":"아이가 우는 통에 잠을 못 잤어요.","vi":"Vì em bé khóc ầm lên nên tôi không ngủ được."},{"ko":"공사하는 통에 길이 막혔어요.","vi":"Vì đang thi công nên đường bị tắc."}]',
    'Không dùng cho nguyên nhân tích cực hoặc trang trọng trung tính.', 'connector', '{"negative-reason"}', 'curated', 'published', 8.4),
  ('g5-eul-su-rok', 5, '-을/ㄹ수록', 'V/A-(으)ㄹ수록', 'Càng... càng...', 'The more..., the more...',
    '[{"ko":"공부할수록 한국어가 재미있어요.","vi":"Càng học tiếng Hàn càng thú vị."},{"ko":"생각할수록 어려운 문제예요.","vi":"Càng nghĩ càng thấy đó là vấn đề khó."}]',
    'Không tách sai thành -을 수 록; viết liền -을수록.', 'comparison', '{"degree","progression"}', 'curated', 'published', 8.4),
  ('g5-gi-nareumida', 5, '-기 나름이다', 'V-기 나름이다', 'Tùy vào cách làm/việc làm thế nào.', 'It depends on how one does it.',
    '[{"ko":"성공은 노력하기 나름이에요.","vi":"Thành công tùy vào việc nỗ lực thế nào."},{"ko":"시간은 쓰기 나름이에요.","vi":"Thời gian tùy vào cách sử dụng."}]',
    'Không dùng với danh từ trực tiếp nếu không biến thành hành động bằng -기.', 'general', '{"depends"}', 'curated', 'published', 8.1),
  ('g5-daga-bomyeon', 5, '-다가 보면', 'V-다가 보면', 'Nếu cứ tiếp tục làm thì sẽ dần thấy/xảy ra.', 'If one keeps doing, eventually something happens/is realized.',
    '[{"ko":"매일 듣다가 보면 자연스럽게 들릴 거예요.","vi":"Nếu nghe mỗi ngày thì dần sẽ nghe tự nhiên hơn."},{"ko":"살다가 보면 힘든 날도 있어요.","vi":"Sống thì rồi cũng có ngày khó khăn."}]',
    'Không dùng cho hành động chỉ xảy ra một lần ngắn ngủi.', 'connector', '{"continuation"}', 'curated', 'published', 8.2),
  ('g5-neun-tasi', 5, '-는 탓에', 'V-는 탓에 / N 탓에', 'Do lỗi/tại vì; nguyên nhân mang sắc thái tiêu cực.', 'Due to; because of, usually negative/blaming.',
    '[{"ko":"준비가 부족한 탓에 시험을 망쳤어요.","vi":"Do chuẩn bị thiếu nên tôi làm hỏng bài thi."},{"ko":"비가 많이 오는 탓에 길이 막혔어요.","vi":"Do mưa nhiều nên đường tắc."}]',
    'Không dùng cho nguyên nhân tích cực; nếu trung tính dùng 때문에.', 'connector', '{"negative-reason"}', 'curated', 'published', 8.3),
  ('g6-eul-bareya', 6, '-을/ㄹ 바에야', 'V-(으)ㄹ 바에야', 'Thà... còn hơn; nếu phải làm điều đó thì chọn phương án khác.', 'Rather than doing; if one has to do that, better to do another.',
    '[{"ko":"포기할 바에야 한 번 더 도전하겠어요.","vi":"Thà thử thêm lần nữa còn hơn bỏ cuộc."},{"ko":"거짓말을 할 바에야 차라리 사실을 말하세요.","vi":"Thà nói sự thật còn hơn nói dối."}]',
    'Thường đi với 차라리/오히려 để nhấn mạnh lựa chọn thay thế.', 'general', '{"alternative"}', 'curated', 'published', 8.5),
  ('g6-geonman', 6, '-건만', 'V/A-건만', 'Dù... nhưng; nhượng bộ trang trọng, kết quả trái kỳ vọng.', 'Although; formal concession with an unexpected contrast.',
    '[{"ko":"열심히 준비했건만 결과가 좋지 않았어요.","vi":"Dù đã chuẩn bị chăm chỉ nhưng kết quả không tốt."},{"ko":"여러 번 설명했건만 아직 이해하지 못했어요.","vi":"Dù đã giải thích nhiều lần nhưng vẫn chưa hiểu."}]',
    'Mẫu này khá văn viết/trang trọng, không tự nhiên trong hội thoại rất thân mật.', 'connector', '{"concession"}', 'curated', 'published', 8.3),
  ('g6-neun-semida', 6, '-는 셈이다', 'V-는 셈이다 / A-(으)ㄴ 셈이다', 'Coi như/gần như là; đánh giá theo kết quả thực tế.', 'It amounts to; can be considered as.',
    '[{"ko":"매일 연습했으니 거의 준비가 된 셈이에요.","vi":"Vì luyện mỗi ngày nên coi như gần chuẩn bị xong."},{"ko":"반값에 샀으니 싸게 산 셈이에요.","vi":"Mua nửa giá nên coi như mua rẻ."}]',
    'Không dùng để nói sự thật trực tiếp; nó là cách quy đổi/đánh giá.', 'general', '{"judgment"}', 'curated', 'published', 8.4),
  ('g6-gi-ssangida', 6, '-기 십상이다', 'V-기 십상이다', 'Dễ có khả năng xảy ra kết quả xấu nếu làm vậy.', 'Be likely to, usually for an undesirable result.',
    '[{"ko":"준비 없이 시작하면 실패하기 십상이에요.","vi":"Nếu bắt đầu không chuẩn bị thì rất dễ thất bại."},{"ko":"밤을 새우면 실수하기 십상이에요.","vi":"Nếu thức trắng đêm thì dễ mắc lỗi."}]',
    'Thường dùng cho kết quả tiêu cực, không dùng cho kết quả tốt một cách tự nhiên.', 'general', '{"negative-result"}', 'curated', 'published', 8.4),
  ('g6-eun-nameoji', 6, '-은/ㄴ 나머지', 'A/V-(으)ㄴ 나머지', 'Vì quá... nên; cảm xúc/trạng thái quá mức dẫn tới kết quả.', 'So much that; excessive state leading to a result.',
    '[{"ko":"너무 긴장한 나머지 말을 잊어버렸어요.","vi":"Vì quá căng thẳng nên tôi quên lời."},{"ko":"기쁜 나머지 눈물이 났어요.","vi":"Vì quá vui nên tôi rơi nước mắt."}]',
    'Không dùng cho nguyên nhân bình thường; cần sắc thái quá mức.', 'connector', '{"excessive-reason"}', 'curated', 'published', 8.3),
  ('g6-eul-riga-eopda', 6, '-을/ㄹ 리가 없다', 'V/A-(으)ㄹ 리가 없다', 'Không đời nào/không có lý nào lại như vậy.', 'There is no way that; cannot possibly.',
    '[{"ko":"그 사람이 거짓말을 할 리가 없어요.","vi":"Người đó không đời nào nói dối."},{"ko":"이렇게 쉬운 문제가 틀릴 리가 없어요.","vi":"Không thể nào sai câu dễ thế này được."}]',
    'Mẫu này thể hiện niềm tin mạnh của người nói, không phải phủ định khách quan đơn giản.', 'general', '{"strong-negative-guess"}', 'curated', 'published', 8.4)
on conflict (id) do update set
  level = excluded.level,
  title = excluded.title,
  formula = excluded.formula,
  meaning_vi = excluded.meaning_vi,
  meaning_en = excluded.meaning_en,
  examples = excluded.examples,
  common_mistake = excluded.common_mistake,
  grammar_type = excluded.grammar_type,
  tags = excluded.tags,
  status = excluded.status,
  quality_score = excluded.quality_score,
  updated_at = now();

insert into public.topik_question_bank
  (id, level, category, game_types, error_type, pattern_id, prompt, options, answer_index, explanation, difficulty, source, status, quality_score)
values
  ('q-go-sipda-1', 1, 'grammar', '{"grammar-race","topik-master"}', 'grammar_connector', 'g1-go-sipda',
    '한국어를 ____.', '["배우고 싶어요","배우러 싶어요","배우기 전에","배우는 바람에"]', 0, 'Muốn làm gì dùng V-고 싶다.', 1, 'curated', 'published', 8.5),
  ('q-euro-1', 1, 'grammar', '{"grammar-race","topik-master"}', 'grammar_connector', 'g1-euro-gada',
    '저는 밥을 ____ 식당에 가요.', '["먹고 싶어서","먹으러","먹기 전에","먹는 한"]', 1, 'Đi đến đâu để làm gì dùng V-(으)러 가다.', 1, 'curated', 'published', 8.5),
  ('q-eumyeon-1', 2, 'grammar', '{"grammar-race","topik-master"}', 'grammar_connector', 'g2-eumyeon',
    '시간이 ____ 같이 공부합시다.', '["있으면","있기 전에","있는 바람에","있는 둥 마는 둥"]', 0, 'Điều kiện nếu có thời gian dùng A/V-(으)면.', 2, 'curated', 'published', 8.5),
  ('q-gie-jeone-1', 2, 'grammar', '{"grammar-race","topik-master"}', 'grammar_connector', 'g2-gie-jeone',
    '시험을 ____ 단어를 복습하세요.', '["보기 전에","봤기 전에","보는 한","볼 망정"]', 0, 'Trước khi làm gì dùng V-기 전에, động từ không chia thì.', 2, 'curated', 'published', 8.5),
  ('q-baram-1', 3, 'grammar', '{"grammar-race","topik-master"}', 'grammar_connector', 'g3-neun-baram-e',
    '비가 많이 ____ 약속이 취소됐어요.', '["오는 바람에","오도록","올 뿐만 아니라","오는 한"]', 0, '-는 바람에 hợp với nguyên nhân bất ngờ dẫn tới kết quả không mong muốn.', 3, 'curated', 'published', 8.5),
  ('q-dorok-1', 3, 'grammar', '{"grammar-race","topik-master"}', 'grammar_connector', 'g3-dorok',
    '모두 들을 수 ____ 크게 말해 주세요.', '["있도록","있는 바람에","있기 전에","있는 둥 마는 둥"]', 0, 'Mục tiêu để mọi người nghe được dùng -도록.', 3, 'curated', 'published', 8.5),
  ('q-banhae-1', 4, 'grammar', '{"grammar-race","topik-master"}', 'similar_meaning', 'g4-neun-dae-banhae',
    '형은 조용한 ____ 동생은 활발해요.', '["데 반해","뿐만 아니라","바람에","전에"]', 0, 'Hai vế đối lập dùng -는 데 반해.', 4, 'curated', 'published', 8.5),
  ('q-bbun-1', 4, 'grammar', '{"grammar-race","topik-master"}', 'grammar_connector', 'g4-eul-bbunman-anira',
    '그는 한국어____ 영어도 잘해요.', '["뿐만 아니라","는 한","는 둥 마는 둥","기 전에"]', 0, 'Không chỉ tiếng Hàn mà còn tiếng Anh: N뿐만 아니라.', 4, 'curated', 'published', 8.5),
  ('q-neun-han-1', 5, 'grammar', '{"grammar-race","topik-master"}', 'similar_meaning', 'g5-neun-han',
    '노력하는 ____ 좋은 결과가 있을 거예요.', '["한","바람에","전에","둥 마는 둥"]', 0, 'Miễn là còn nỗ lực: V-는 한.', 4, 'curated', 'published', 8.5),
  ('q-tende-1', 5, 'grammar', '{"grammar-race","topik-master"}', 'grammar_connector', 'g5-eul-tende',
    '길이 막힐 ____ 일찍 출발하세요.', '["텐데","망정","뿐만 아니라","도록"]', 0, 'Suy đoán kèm lời khuyên: -(으)ㄹ 텐데.', 4, 'curated', 'published', 8.5),
  ('q-mangjeong-1', 6, 'grammar', '{"grammar-race","topik-master"}', 'grammar_connector', 'g6-eul-mangjeong',
    '힘들 ____ 포기하지 않겠습니다.', '["망정","텐데","전에","도록"]', 0, 'Dù có vất vả cũng không bỏ cuộc: -(으)ㄹ 망정.', 5, 'curated', 'published', 8.5),
  ('q-dung-1', 6, 'grammar', '{"grammar-race","topik-master"}', 'similar_meaning', 'g6-neun-dungi-maneun-dungi',
    '아침을 먹는 ____ 하고 나왔어요.', '["둥 마는 둥","데 반해","뿐만 아니라","한"]', 0, 'Làm qua loa như có như không: -는 둥 마는 둥.', 5, 'curated', 'published', 8.5),
  ('q-vocab-cha-byeol', 6, 'vocabulary', '{"vocab-speed","topik-master"}', 'vocabulary', null,
    '차별', '["Phân biệt đối xử","Thỏa hiệp","Dự báo","Tập trung"]', 0, '차별 nghĩa là sự phân biệt đối xử.', 4, 'curated', 'published', 8.5),
  ('q-vocab-gachi', 4, 'vocabulary', '{"vocab-speed","topik-master"}', 'similar_meaning', null,
    '가치관', '["Quan niệm giá trị","Kế hoạch du lịch","Phí sinh hoạt","Thời tiết"]', 0, '가치관 là quan niệm/hệ giá trị.', 3, 'curated', 'published', 8.5),
  ('q-honorific-1', 2, 'grammar', '{"topik-master"}', 'honorific', null,
    'Câu nào dùng kính ngữ tự nhiên nhất khi nói với giáo viên?', '["선생님, 어디 가?","선생님, 어디 가세요?","선생님, 어디 갔어?","선생님, 어디야?"]', 1, 'Với giáo viên nên dùng đuôi kính ngữ -세요.', 2, 'curated', 'published', 8.5),
  ('q-reading-1', 3, 'reading', '{"topik-master"}', 'reading', null,
    '“비가 와서 행사가 취소되었습니다.” Ý chính là gì?', '["Sự kiện bị hủy vì trời mưa","Sự kiện được tổ chức ngoài trời","Trời mưa sau sự kiện","Sự kiện bị hoãn vì tắc đường"]', 0, '취소되다 là bị hủy, nguyên nhân là 비가 와서.', 3, 'curated', 'published', 8.5),
  ('q-sentence-1', 2, 'sentence', '{"sentence-build","topik-master"}', 'grammar_connector', 'g2-gie-jeone',
    'Chọn câu ghép đúng: “Trước khi ngủ, tôi đọc sách.”', '["자기 전에 책을 읽어요.","자고 전에 책을 읽어요.","자기 바람에 책을 읽어요.","자는 한 책을 읽어요."]', 0, 'Trước khi làm gì dùng V-기 전에.', 2, 'curated', 'published', 8.5),
  ('q-sentence-2', 3, 'sentence', '{"sentence-build","topik-master"}', 'grammar_connector', 'g3-dorok',
    'Chọn câu tự nhiên nhất: “Hãy nói to để mọi người nghe được.”', '["모두 들을 수 있도록 크게 말하세요.","모두 듣는 바람에 크게 말하세요.","모두 듣기 전에 크게 말하세요.","모두 듣는 한 크게 말하세요."]', 0, 'Mục tiêu/kết quả mong muốn dùng -도록.', 3, 'curated', 'published', 8.5)
on conflict (id) do update set
  level = excluded.level,
  category = excluded.category,
  game_types = excluded.game_types,
  error_type = excluded.error_type,
  pattern_id = excluded.pattern_id,
  prompt = excluded.prompt,
  options = excluded.options,
  answer_index = excluded.answer_index,
  explanation = excluded.explanation,
  difficulty = excluded.difficulty,
  status = excluded.status,
  quality_score = excluded.quality_score,
  updated_at = now();

notify pgrst, 'reload schema';
