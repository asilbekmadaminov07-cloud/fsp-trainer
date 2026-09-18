# FSP Trainer — Loyiha hisoboti

> **Yangi suhbatda davom ettirish uchun:** shu faylni yuklang va "shu loyihani davom ettiramiz" deb yozing.
> Oxirgi yangilanish: 2026-09-18

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

## 6. HOZIRGI HOLAT (2026-09-18)

| Nima | Holat |
|---|---|
| Qo'lda yozilgan holatlar | 19 ta (leicht 5, mittel 5, schwer 4, pro 5) |
| AI yaratadigan holatlar | cheksiz — `/api/case` |
| Rentgen kutubxonasi | **10 ta tasdiqlangan**, 12 ta navbatda, 5 ta rad etilgan |
| Imtihon | 20 savol, 3 xatoda failed, har xato tushuntiriladi |
| Mashq vositalari | 6 ta (`/game` + 5 ta `/tools/...`) |
| Dizayn | yangi tizim, qorong'i rejim bilan |

### Vositalar
`/game` · `/tools/befund` · `/tools/arztbrief` · `/tools/kollege` · `/tools/fachbegriffe` · `/tools/aussprache`

### API'lar
`/api/chat` · `/api/tts` · `/api/transcribe` · `/api/case-image` · `/api/quiz` · `/api/case` · `/api/grade` · `/api/vokabel`

---

## 7. KEYINGI REJA — foydalanuvchi so'rovlari (2026-09-18)

> Bular hali BAJARILMAGAN. Foydalanuvchi ularni eslatma sifatida qoldirdi.

**1. Har xato uchun o'quv sahifasi**
Imtihonda xato qilinganda, o'sha mavzuni chuqur o'rganish sahifasiga havola. Hozir faqat qisqa tushuntirish bor.
*Texnik:* xatoga `topic` biriktirilgan → `/lernen/<topic>` sahifasi, Gemini mavzuni tushuntiradi.

**2. Mobil interfeysni yaxshilash**
Hozirgi dizayn moslashuvchan, lekin mobil uchun alohida ko'rib chiqilmagan. Tugmalar, matn hajmi, suhbat balandligi telefonda tekshirilishi kerak.

**3. Savollar va bemorlar HAR DOIM tasodifiy**
Bemorlar allaqachon tasodifiy. Savollar ham har urinishda yangidan tuziladi. Tekshirish kerak: takrorlanish bormi.

**4. Fon yorqinroq, baby blue rang**
Hozir: iliq neytral + chuqur yashil. So'ralgan: yorqinroq fon, baby blue urg'u.
*Texnik:* faqat `:root` dagi `--bg`, `--surface-*`, `--brand-*` tokenlarini o'zgartirish kifoya — qolgan kod tegilmaydi.

**5. Interfeys oson, lekin zerikarli emas**
Tushunarli bo'lsin, lekin foydalanuvchi zerikmasin. Animatsiya, jonlilik, mukofot hissi.

**6. Header'da akkaunt ma'lumoti aniq ko'rinsin**
Foydalanuvchi ismi, darajasi, rasmi — tepada aniq.

**7. Kunlarni hisoblash**
- necha kun mashq qilgan (streak)
- akkaunt ochilganiga necha kun bo'lgan
*Texnik:* Supabase `profiles` ga ustun qo'shish: `created_at` (bor), `last_practice_date`, `streak_days`, `total_practice_days`.

**8. 3D effektlar — fon va qiziqarlilik uchun**
Kartalarda bor. Fonda ham harakatlanuvchi 3D element qo'shish mumkin.

**9. CAPTCHA — bot va AI'lardan himoya**
*Texnik:* Supabase Auth'da **hCaptcha yoki Cloudflare Turnstile** o'rnatilgan holda keladi — Supabase panelida yoqiladi, kod o'zgarishi minimal.

**10. Ro'yxatdan o'tgan emailga xush kelibsiz xati**
*Texnik:* Supabase → Authentication → Email Templates. Yoki Resend/Postmark orqali maxsus xat.

**11. Test versiya savollari**
Sinov rejimi — qisqartirilgan, ro'yxatdan o'tmasdan sinab ko'rish uchun.

**12. Hammasini bitta interfeysga ulash**
Vositalar hozir alohida sahifalar. Yagona, izchil oqimga birlashtirish.

### Tugallanmagan texnik ishlar
- Rentgen kutubxonasidagi 12 ta nomzodni tekshirish:
  `node scripts/fetch-open-images.js verify new 0 5`
- Herr Weber holati hali foto ishlatadi (perikoronit uchun rentgen topilmadi)

## 8. ESLATMALAR

- **Internetdan haqiqiy bemor rasmlarini olish — TAQIQLANGAN.** Faqat ochiq litsenziyali (Commons) manbalar, atribut bilan
- **`.env.local` hech qachon GitHub'ga yuklanmaydi** — `.gitignore` buni avtomatik himoya qiladi
- **Push faqat GitHub Desktop orqali** — Claude push qila olmaydi
- Har bemorda **yashirin ma'lumot** bor, faqat aniq savol berilsagina aytiladi (masalan Frau Hartmann homiladorligini, Herr Ahmadi yurak klapanini o'z-o'zidan aytmaydi). Bu FSP'ning asosiy mahorati — to'liq anamnez yig'ish
- Foydalanuvchi texnik jihatdan yangi boshlovchi — **har bir qadamni batafsil**, buyruqlarni to'liq nusxalanadigan holda yozish kerak
- GitHub Desktop'da "LF → CRLF" ogohlantirishi chiqsa — bu **xato emas**, e'tibor bermang
