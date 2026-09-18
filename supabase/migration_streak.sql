-- Mashq kunlarini hisoblash uchun ustunlar.
-- Supabase → SQL Editor → shu matnni qo'yib "Run" bosing. Bir marta bajariladi.
--
-- `if not exists` bor, shuning uchun ikkinchi marta ishga tushirilsa ham xato bermaydi.

alter table public.profiles
  add column if not exists last_practice_date  date,
  add column if not exists streak_days         integer default 0,
  add column if not exists practice_days       integer default 0,
  add column if not exists longest_streak      integer default 0;

-- Eslatma: `created_at` ustuni Supabase'da odatda allaqachon bor.
-- Agar yo'q bo'lsa, quyidagi qatorni ham ishga tushiring:
-- alter table public.profiles add column if not exists created_at timestamptz default now();
