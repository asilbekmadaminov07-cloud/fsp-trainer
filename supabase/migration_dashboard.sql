-- FSP Trainer — qo'shimcha migratsiya (Dashboard uchun)
-- SQL Editor -> New query -> shu faylni joylashtiring -> Run
-- (avvalgi schema.sql allaqachon ishga tushirilgan bo'lishi kerak)

alter table public.profiles add column if not exists cases_solved int default 0;

-- Reyting jadvali uchun: barcha ro'yxatdan o'tgan foydalanuvchilar
-- boshqalarning ism/XP/daraja ma'lumotlarini ko'ra olishi kerak.
create policy "Authenticated users can view leaderboard data"
  on public.profiles for select
  to authenticated
  using (true);
