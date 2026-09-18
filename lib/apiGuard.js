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

async function consumeQuota(token, route){
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/consume_api_quota`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_route: route })
  });
  if (!res.ok) return false;
  return Boolean(await res.json().catch(() => false));
}

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

  if (!(await consumeQuota(token, route))) {
    return { error: 'Zu viele Anfragen. Bitte in einer Stunde erneut versuchen.', status: 429 };
  }

  return { user };
}
