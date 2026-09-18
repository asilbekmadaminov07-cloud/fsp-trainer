# FSP Trainer — Loyiha hisoboti

> **Yangi suhbatda davom ettirish uchun:** shu faylni yuklang va "shu loyihani davom ettiramiz" deb yozing.
> Oxirgi yangilanish: 2026-09-18

## 0. OXIRGI SESSIYADA QILINGAN ISHLAR (2026-09-18)

10 ta talab bo'yicha katta yangilanish qilindi:

1. **"Mening xatolarim" sahifasi** (`/mistakes`) — imtihon yoki testda xato javob berilgan har bir savol `mistakes` jadvaliga saqlanadi. Sahifada filtrlash (ochiq/o'rganilgan/hammasi) va "gelernt" deb belgilash mumkin.
2. **Mobil interfeys** yaxshilandi — header, forma, savol bloklari kichik ekranlarda qayta tuzildi (`app/globals.css` oxiridagi `@media(max-width:560px)`).
3. **Tasodifiy bemor/savollar** — bu allaqachon mavjud edi (`pickRandomIdx`, va `/api/quiz` har safar yangi savol yaratadi). Testmodus ham har safar yangi, tasodifiy mavzular bilan yaratiladi.
4-5. **Dizayn**: fon va brend rangi baby-blue palitraga o'zgartirildi (`app/globals.css` `:root` — `--bg`, `--brand*`). Qorong'u rejim ham mos ravishda yangilandi.
6-7. **Header** (`app/components/Header.js`) — barcha sahifalarda bitta umumiy tepa panel: avatar, ism, email, tanga/daraja, "necha kun mashq qilingan" (🔥 belgi) va account dropdown ichida "necha kundan beri a'zo" (`created_at` dan hisoblanadi, `lib/practice.js`).
8. **3D effektlar** — `.tilt-3d`, `.float-3d`, avatar hover'da 3D burilish (`app/globals.css`), tool-card'larda avvaldan bor 3D hover kuchaytirildi.
9. **CAPTCHA** — Google reCAPTCHA v2, faqat `/register` sahifasida. `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` sozlanmasa, captcha ko'rsatilmaydi va ro'yxatdan o'tish bloklanmaydi (ishlab chiqarishdan oldin kalitlarni albatta qo'shing — 3-bo'limga qarang).
10. **Testmodus** (`/tools/test`) — bemor holatisiz, umumiy FSP bilimi bo'yicha tezkor 10 savolli test (`/api/test-quiz`). Xatolar ham "Mening xatolarim"ga tushadi.

**Email xush kelibsiz xabari — HALI QO'SHILMAGAN** (foydalanuvchi so'rovi bilan keyinga qoldirildi). Kerak bo'lsa Resend yoki Supabase Auth email shablonini sozlash kerak bo'ladi.

**MUHIM — yangi SQL migratsiyasini ishga tushiring:** `supabase/migration_v2.sql` (profiles'ga `practice_days`/`last_practice_date`, va yangi `mistakes` jadvali). Supabase SQL Editor'da ishga tushiring, aks holda header va xatolar sahifasi ishlamaydi.

**Yangi environment o'zgaruvchilar** (ixtiyoriy, CAPTCHA uchun): `.env.local` va Vercel'ga qo'shing:
```
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...
```
Kalitlarni https://www.google.com/recaptcha/admin (reCAPTCHA v2 "I'm not a robot" checkbox) dan oling.

Lokal ishga tushirish uchun `.claude/launch.json` qo'shildi (`npm run dev`, port 3000).

---

## 1. Loyiha nima

Germaniyaga ketayotgan stomatologlar uchun **FSP (Fachsprachprüfung) imtihoniga tayyorlash platformasi**.
AI-bemor bilan nemis tilida suhbat, tashxis qo'yish, ovozli muloqot, martaba tizimi.
`fsp-zahnmedizin.de` dan ilhomlanган, lekin bepul.

## 2. Texnologiyalar

| Qism | Texnologiya |
|---|---|
| Frontend/Backend | Next.js 14.2.35 (App Router) |
| Baza + Login | Supabase (Postgres + Auth) |
| AI suhbat, audio transkripsiya | Gemini API (`gemini-2.5-flash`) |
| Tabiiy ovoz (TTS) | ElevenLabs API |
| Befund rasmlari | Wikimedia Commons (jonli, ochiq litsenziya) |
| Hosting | Vercel |
| Kod | GitHub |

## 3. MANZILLAR — eng muhim bo'lim

| Nima | Qayerda |
|---|---|
| **Jonli sayt** | https://fsp-trainer-six.vercel.app |
| **GitHub repo** | github.com/asilbekmadaminov07-cloud/fsp-trainer |
| **Supabase** | `https://jlhuggmjrjisdhjhuigx.supabase.co` (Frankfurt) |
| **Lokal papka (YANGI kompyuter)** | `C:\Users\1\Documents\GitHub\fsp-trainer` |
| **Eski kompyuterdagi papka** | `C:\Users\Asilbek\Documents\GitHub\fsp-trainer` — endi ishlatilmaydi |

**Yangi kompyuterda o'rnatilgan:**
- GitHub Desktop v3.6.6 (`%LOCALAPPDATA%\GitHubDesktop`)
- Node.js v22.23.2 — **portativ**, PATH'da har doim ham bo'lmaydi. Terminal `node` ni tanimasa:
  ```powershell
  $env:Path = "C:\Users\1\AppData\Local\Programs\nodejs-portable\node-v22.23.2-win-x64;$env:Path"
  ```

**Kalitlar** (`.env.local`, faqat kompyuterda, GitHub'ga hech qachon tushmaydi):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`
— barchasi Vercel'ning Environment Variables bo'limida ham bor.

## 4. ISH JARAYONI — qanday o'zgartirish kiritiladi

Claude bulut muhitida ishlaydi va **GitHub'ga to'g'ridan-to'g'ri push qila olmaydi** (tarmoq darvozasi bloklaydi — token ham yordam bermaydi). Shuning uchun:

1. Claude kompyuteringizdagi `fsp-trainer` papkasiga fayllarni **to'g'ridan-to'g'ri yozadi** (papka Claude'ga ulangan bo'lishi kerak — "Add folder")
2. **Siz** GitHub Desktop'da: Summary yozasiz → **Commit to main** → **Push origin**
3. Vercel avtomatik deploy qiladi (1-2 daqiqa)

> Claude `.env.local` ga yoza olmaydi (xavfsizlik cheklovi) — uni faqat siz tahrirlaysiz.

## 5. Qurilgan funksiyalar

### Sahifalar
- `/` — mobil-birinchi bosh sahifa, jonli suhbat namunasi
- `/register`, `/login` — Supabase Auth
- `/home` — Dashboard: martaba (Assistenzarzt → Facharzt → Oberarzt → Praxisinhaber), XP, Praxiskonto, Nachweise, Klinik-Rangliste
- `/game` — asosiy mashq sahifasi

### `/game` — qanday ishlaydi
- 4 daraja: **Leicht / Mittel / Schwer / Pro**
- **19 ta holat** (leicht 5, mittel 5, schwer 4, pro 5)
- **Bemor tasodifiy tanlanadi** — qo'lda tanlash yo'q. "Nächster Patient →" tugmasi yangi bemor beradi. Barcha holatlar aylanib chiqilmaguncha takrorlanmaydi
- AI-bemor bilan matn yoki ovozli suhbat
- Befund rasmini so'rash (`Röntgenbild/Foto anfordern`)
- Tashxis kiritish → AI baholash (RICHTIG / TEILWEISE / FALSCH + tushuntirish)
- To'g'ri tashxis → tanga + XP, martaba o'sadi

### Ovozli suhbat
- **Kompyuter (Chrome/Edge):** uzluksiz, qo'l tekkizmasdan. Kalit so'zlar orqali niyat aniqlanadi (savol / rasm so'rash / tashxis)
- **iPhone/iOS:** `SpeechRecognition` yo'q (Apple cheklovi) → avtomatik **"bosib gapirish"** rejimi: `🎤 Sprechen` → gapirasiz → `⏹ Fertig` → `/api/transcribe` orqali Gemini matnga aylantiradi
- iOS'da audio "qulfi" ochiladi: tugma bosilganda bitta umumiy `Audio` elementi jimjit tovush bilan uyg'otiladi, keyingi javoblar shu orqali chiqadi
- Ovoz — ElevenLabs, har bemorga tasodifiy tanlanadi va suhbat davomida saqlanadi

### Befund rasmlari — MUHIM QAROR
Rasmlar **repoda saqlanmaydi**. Har bir holatda `commonsFile: "File:..."` yozilgan, va `/api/case-image` uni ishlash paytida Wikimedia Commons API orqali haqiqiy manzilga aylantiradi (24 soat keshlanadi).

- Faqat **ochiq litsenziyalar** qabul qilinadi: CC0, CC BY, CC BY-SA, Public Domain. Boshqasi kelsa API 403 qaytaradi
- Rasm ostida **muallif + litsenziya + manba havolasi** ko'rsatiladi (CC talabi)
- Wikimedia ishlamasa yoki fayl o'chirilsa → sxematik SVG chizmaga qaytadi
- **19 dan 17 ta holat** haqiqiy rasmga ulangan

**Nega AI-generatsiya emas:** Gemini rasm modellarida bepul tarif **umuman yo'q** (faqat pullik, ~$0.04/rasm). Sinab ko'rildi — `quota exceeded`.

**Nega internetdan tasodifiy rasm emas:** mualliflik huquqi va bemor maxfiyligi. Faqat ochiq litsenziyali, anonimlashtirilgan manbalar.

### Backend API'lar
| Yo'l | Nima qiladi |
|---|---|
| `/api/chat` | Gemini chat proksi (kalitni yashiradi) |
| `/api/tts` | ElevenLabs ovoz proksi |
| `/api/transcribe` | Audio → matn (iOS uchun) |
| `/api/case-image` | Commons fayl nomi → rasm manzili + atribut |

### Yordamchi skriptlar
| Skript | Nima qiladi |
|---|---|
| `scripts/fetch-open-images.js` | Commons'dan rasm qidirish/tekshirish. Buyruqlar: `list`, `search "termin"`, `cat "Category:Nomi"`, `preview "File:..."`, `download` |
| `scripts/generate-images.js` | Gemini bilan rasm yaratish — **ishlamaydi** (bepul tarif yo'q). Pullik hisob ochilsa ishlaydi |

`preview` buyrug'i rasmlarni `_preview/` ga yuklaydi — Claude ularni **ko'z bilan tekshiradi**. Bu muhim: tavsifga ishonish yetarli emas. Masalan `Chronic apical periodontitis.jpg` rad etilgan edi, chunki ustida **oq strelka** bor (talabaga javobni oshkor qiladi) va yuqori jag' edi.

### Baza (Supabase)
`profiles`: `full_name`, `age`, `level`, `xp`, `coins`, `cases_solved`, `clinic_name` + RLS siyosatlari + reyting uchun ochiq o'qish

## 6. KEYINGI QADAMLAR

### Kichik, tayyor ishlar
1. **Kevin** (8 yosh, sut tishi 84 kariesi) va **Herr Weber** (perikoronit 38) — hali haqiqiy rasmsiz. Commons'da qidirish kerak:
   ```powershell
   node scripts/fetch-open-images.js cat "Dental caries"
   node scripts/fetch-open-images.js cat "Deciduous teeth"
   ```
2. **MRONJ rasmi** ko'z bilan tekshirilmagan (Wikimedia `HTTP 429` chiqdi):
   ```powershell
   node scripts/fetch-open-images.js preview "File:Stage 3 MRONJ.jpg"
   ```

### Kattaroq rejalar
- **Arztbrief** — yozma shifokor xati (FSP imtihonining 2-qismi). Hali qurilmagan
- **Arzt-Arzt-Gespräch** — hamkasblar bilan suhbat (3-qism). Hali qurilmagan
- **Klinika mexanikasi** — hozircha faqat matn banner, haqiqiy interaktivlik yo'q
- **Do'stlar tizimi** — faqat global reyting bor
- Ko'proq holatlar (hozir 19, yana qo'shish mumkin)
- ElevenLabs bepul limiti (~10,000 belgi/oy, ~6-8 suhbat) — kerak bo'lsa pullik tarif

## 7. ESLATMALAR

- **Internetdan haqiqiy bemor rasmlarini olish — TAQIQLANGAN.** Faqat ochiq litsenziyali (Commons) manbalar, atribut bilan
- **`.env.local` hech qachon GitHub'ga yuklanmaydi** — `.gitignore` buni avtomatik himoya qiladi
- **Push faqat GitHub Desktop orqali** — Claude push qila olmaydi
- Har bemorda **yashirin ma'lumot** bor, faqat aniq savol berilsagina aytiladi (masalan Frau Hartmann homiladorligini, Herr Ahmadi yurak klapanini o'z-o'zidan aytmaydi). Bu FSP'ning asosiy mahorati — to'liq anamnez yig'ish
- Foydalanuvchi texnik jihatdan yangi boshlovchi — **har bir qadamni batafsil**, buyruqlarni to'liq nusxalanadigan holda yozish kerak
- GitHub Desktop'da "LF → CRLF" ogohlantirishi chiqsa — bu **xato emas**, e'tibor bermang
