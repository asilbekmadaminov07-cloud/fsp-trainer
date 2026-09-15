# FSP Trainer — Next.js + Supabase loyihasi

Bu — akkaunt, daraja (level), tanga (coins) va klinika mexanikasi bilan to'liq ilova.

## 1-qadam — Supabase loyiha yaratish

1. supabase.com'ga o'ting, akkaunt oching (bepul)
2. "New Project" tugmasini bosing, nom bering (masalan `fsp-trainer`), parol o'rnating, hudud tanlang
3. Loyiha yaratilguncha 1-2 daqiqa kuting

## 2-qadam — Bazani sozlash

1. Chap menyudan **SQL Editor** ni oching
2. "New query" tugmasini bosing
3. `supabase/schema.sql` faylining butun matnini ko'chirib, shu yerga joylashtiring
4. **Run** tugmasini bosing — `profiles` jadvali yaratiladi

## 3-qadam — Kalitlarni olish

1. Chap menyudan **Project Settings → API** ga o'ting
2. **Project URL** va **anon public** kalitni nusxalab oling

## 4-qadam — Loyihani kompyuterda sozlash

1. `fsp-nextjs` papkasini biror joyga chiqaring (masalan Ishchi stolga)
2. Terminalda o'sha papkaga o'ting: `cd Desktop/fsp-nextjs`
3. `.env.local.example` faylini nusxalab, nomini `.env.local` qiling
4. `.env.local` faylini oching, uchta qiymatni to'ldiring:
   - `NEXT_PUBLIC_SUPABASE_URL` — 3-qadamdagi Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — 3-qadamdagi anon key
   - `GEMINI_API_KEY` — sizning Gemini kalitingiz
5. Terminalda: `npm install`
6. Keyin: `npm run dev`
7. Brauzerda `http://localhost:3000` ni oching

Ro'yxatdan o'tib, o'yin sahifasini sinab ko'rishingiz mumkin.

## 5-qadam — Internetga chiqarish (Vercel)

1. Loyihani GitHub'ga yuklang (`.env.local` avtomatik chiqarib tashlanadi — `.gitignore` ichida)
2. vercel.com'da "Add New → Project" → GitHub repositoryingizni tanlang
3. **Environment Variables** bo'limiga uchta qiymatni qo'shing (xuddi `.env.local` dagidek: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`)
4. Deploy tugmasini bosing

## Hozircha nima ishlaydi

- ✅ Ro'yxatdan o'tish / kirish (Supabase Auth)
- ✅ Har bir foydalanuvchi uchun profil: ism, yosh, daraja, tanga
- ✅ 4 qiyinlik darajasi (Leicht/Mittel/Schwer/Pro), jumladan bolalar (Kevin, 8 yosh, qo'rqoq) va asabiy bemor (Frau Wolter) — turli kayfiyat namunalari
- ✅ AI-bemor bilan suhbat, rasm so'rash, tashxis kiritish
- ✅ To'g'ri tashxis qo'yilsa — avtomatik tanga va XP beriladi, daraja oshadi

## Keyingi qadamlar (hali qurilmagan)

- Ovozli kiritish/chiqish (Web Speech API)
- Haqiqiy rentgen rasmlari (ochiq litsenziyali bazadan)
- Klinika ochish o'yin mexanikasi (hozircha faqat matn ko'rinishida)
- Ko'proq holatlar va darajalar
