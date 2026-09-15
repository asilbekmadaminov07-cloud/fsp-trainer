-- FSP Trainer — profillar jadvali
-- Buni Supabase loyihangizda: SQL Editor -> New query -> shu faylni joylashtiring -> Run

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  age int,
  level int default 1,
  xp int default 0,
  coins int default 100,
  cases_solved int default 0,
  clinic_name text,
  created_at timestamp with time zone default now()
);

alter table public.profiles enable row level security;

-- Har bir foydalanuvchi faqat o'z profilini ko'ra oladi
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Har bir foydalanuvchi faqat o'z profilini yangilay oladi
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Ro'yxatdan o'tishda foydalanuvchi o'ziga profil qatorini yarata oladi
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Reyting jadvali uchun: barcha ro'yxatdan o'tgan foydalanuvchilar
-- boshqalarning ism/XP/daraja ma'lumotlarini ko'ra olishi kerak.
create policy "Authenticated users can view leaderboard data"
  on public.profiles for select
  to authenticated
  using (true);
