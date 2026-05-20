create table if not exists public.cbt_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id text not null,
  exam_title text not null,
  student_id text not null,
  started_at timestamptz not null,
  submitted_at timestamptz not null default now(),
  correct_count integer not null,
  score integer not null,
  items jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cbt_access_logs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  role text not null check (role in ('student', 'teacher')),
  accessed_at timestamptz not null default now()
);

create index if not exists cbt_attempts_submitted_at_idx
  on public.cbt_attempts (submitted_at desc);

create index if not exists cbt_attempts_student_exam_idx
  on public.cbt_attempts (student_id, exam_id);

create index if not exists cbt_access_logs_accessed_at_idx
  on public.cbt_access_logs (accessed_at desc);

alter table public.cbt_attempts enable row level security;
alter table public.cbt_access_logs enable row level security;

drop policy if exists "cbt_attempts_select_anon" on public.cbt_attempts;
drop policy if exists "cbt_attempts_insert_anon" on public.cbt_attempts;
drop policy if exists "cbt_access_logs_select_anon" on public.cbt_access_logs;
drop policy if exists "cbt_access_logs_insert_anon" on public.cbt_access_logs;

create policy "cbt_attempts_select_anon"
  on public.cbt_attempts
  for select
  to anon
  using (true);

create policy "cbt_attempts_insert_anon"
  on public.cbt_attempts
  for insert
  to anon
  with check (true);

create policy "cbt_access_logs_select_anon"
  on public.cbt_access_logs
  for select
  to anon
  using (true);

create policy "cbt_access_logs_insert_anon"
  on public.cbt_access_logs
  for insert
  to anon
  with check (true);
