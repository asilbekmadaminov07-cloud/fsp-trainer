// API himoyasi — SERVER tomonida ishlaydi.
//
// Ikki qatlam:
//   1. Autentifikatsiya — so'rov haqiqiy, kirgan foydalanuvchidanmi?
//   2. Tezlik chegarasi — bitta foydalanuvchi qancha chaqira oladi, va
//      barcha foydalanuvchilar birgalikda qancha (qimmat xizmatlar uchun).
//
// Nega kerak: bu yo'llar Gemini va ElevenLabs kalitlarini ishlatadi. Himoyasiz
// bo'lsa, istalgan odam terminaldan so'rov yuborib oylik limitni bir necha
// daqiqada tugatadi.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// --- Tokenni tekshirish ---
// Supabase'ning o'z /auth/v1/user yo'li tokenni tekshiradi. Qo'shimcha
// kutubxona ham, service-role kaliti ham kerak emas.
const userCache = new Map();          // token -> { user, exp }
const CACHE_MS = 60_000;

async function verifyToken(token){
  const hit = userCache.get(token);
  if (hit && hit.exp > Date.now()) return hit.user;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  const user = await res.json().catch(() => null);
  if (!user || !user.id) return null;

  userCache.set(token, { user, exp: Date.now() + CACHE_MS });
  if (userCache.size > 500) {         // xotira o'smasin
    for (const [k, v] of userCache) if (v.exp < Date.now()) userCache.delete(k);
  }
  return user;
}

// --- Tezlik chegarasi ---
// Xotirada saqlanadi. Serverless'da har nusxa alohida hisoblaydi, shuning uchun
// bu qat'iy kafolat emas — lekin avtomatlashtirilgan suiiste'molni to'xtatadi.
const buckets = new Map();            // kalit -> [vaqt, vaqt, ...]

function hit(key, max, windowMs){
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter(t => now - t < windowMs);
  if (arr.length >= max) {
    buckets.set(key, arr);
    return false;
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > 3600_000) buckets.delete(k);
  }
  return true;
}

const HOUR = 3600_000;

// Har yo'l uchun: foydalanuvchiga soatiga nechta, va (kerak bo'lsa)
// BARCHA foydalanuvchilarga birgalikda soatiga nechta.
const LIMITS = {
  chat:       { perUser: 80,  global: 0    },
  quiz:       { perUser: 15,  global: 0    },
  case:       { perUser: 30,  global: 0    },
  grade:      { perUser: 30,  global: 0    },
  vokabel:    { perUser: 25,  global: 0    },
  transcribe: { perUser: 150, global: 0    },
  // ElevenLabs bepul tarifi eng tor joy: ~10 000 belgi/OY, hammaga birgalikda.
  // Shuning uchun bu yerda umumiy chegara ham bor.
  tts:        { perUser: 60,  global: 250  },
  'case-image': { perUser: 200, global: 0  }
};

/**
 * So'rovni tekshiradi.
 * @returns {{ user }} yoki {{ error, status }}
 */
export async function guard(req, route){
  if (!SUPABASE_URL || !ANON_KEY) {
    return { error: 'Server ist nicht konfiguriert.', status: 500 };
  }

  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) {
    return { error: 'Nicht angemeldet.', status: 401 };
  }

  const user = await verifyToken(token);
  if (!user) {
    return { error: 'Sitzung abgelaufen. Bitte neu anmelden.', status: 401 };
  }

  const lim = LIMITS[route] || { perUser: 60, global: 0 };
  if (!hit(`u:${route}:${user.id}`, lim.perUser, HOUR)) {
    return { error: 'Zu viele Anfragen. Bitte in einer Stunde erneut versuchen.', status: 429 };
  }
  if (lim.global && !hit(`g:${route}`, lim.global, HOUR)) {
    return { error: 'Diese Funktion ist gerade stark ausgelastet. Bitte später erneut versuchen.', status: 429 };
  }

  return { user };
}
