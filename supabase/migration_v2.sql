-- FSP Trainer — migratsiya v2 (xatolar jurnali + amaliyot kunlari)
-- Supabase SQL Editor -> New query -> shu faylni joylashtiring -> Run
-- (schema.sql va migration_dashboard.sql avval ishga tushirilgan bo'lishi kerak)

-- Amaliyot kunlarini sanash uchun
alter table public.profiles add column if not exists practice_days int default 0;
alter table public.profiles add column if not exists last_practice_date date;

-- Har bir xato javobni saqlaydigan jadval — "Mening xatolarim" sahifasi uchun
create table if not exists public.mistakes (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  case_name text,
  difficulty text,
  question text not null,
  chosen text,
  correct text,
  explanation text,
  reviewed boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.mistakes enable row level security;

create policy "Users can view own mistakes"
  on public.mistakes for select
  using (auth.uid() = user_id);

create policy "Users can insert own mistakes"
  on public.mistakes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mistakes"
  on public.mistakes for update
  using (auth.uid() = user_id);

create policy "Users can delete own mistakes"
  on public.mistakes for delete
  using (auth.uid() = user_id);

create index if not exists mistakes_user_created_idx on public.mistakes (user_id, created_at desc);
