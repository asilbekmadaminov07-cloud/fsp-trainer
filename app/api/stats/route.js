// Ommaviy (login talab qilmaydigan) ijtimoiy isbot sonlari — kirish sahifasi uchun.
// Faqat umumiy sonlar qaytariladi, hech qanday shaxsiy ma'lumot yo'q.

import { createClient } from '@supabase/supabase-js';

// MUHIM: `revalidate` export QILMAYMIZ — u bu route'ni statik (ISR) qilib
// qo'yadi, build paytidagi bitta natijani "qotirib" qo'yishi mumkin (bu aynan
// sodir bo'lgan edi: 0/0 natija keshlanib qolgan). Har so'rovda haqiqiy sonni
// olish uchun route dinamik bo'lishi kerak.
export const dynamic = 'force-dynamic';

export async function GET(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json({ sessions: 0, users: 0 });
  }

  // DEBUG: hech qaysi belgini oshkor qilmasdan, faqat lotin-1 doirasidan
  // tashqaridagi belgi bormi va u qayerdaligini tekshiramiz (muhit
  // o'zgaruvchisi noto'g'ri nusxalangan bo'lishi mumkin — masalan "aqlli
  // tirnoq" belgisi bilan).
  function findBad(s, label){
    for (let i = 0; i < s.length; i++) {
      if (s.charCodeAt(i) > 255) return { label, index: i, code: s.charCodeAt(i), len: s.length };
    }
    return null;
  }
  const bad = findBad(url, 'url') || findBad(serviceKey, 'serviceKey');

  return Response.json(
    { sessions: 0, users: 0, DEBUG_bad: bad, DEBUG_urlLen: url.length, DEBUG_keyLen: serviceKey.length },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
