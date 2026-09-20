// Ommaviy (login talab qilmaydigan) ijtimoiy isbot sonlari — kirish sahifasi uchun.
// Faqat umumiy sonlar qaytariladi, hech qanday shaxsiy ma'lumot yo'q.

import { createClient } from '@supabase/supabase-js';

// MUHIM: `revalidate` export QILMAYMIZ — u bu route'ni statik (ISR) qilib
// qo'yadi, build paytidagi bitta natijani "qotirib" qo'yishi mumkin. Har
// so'rovda haqiqiy sonni olish uchun route dinamik bo'lishi kerak.
export const dynamic = 'force-dynamic';

export async function GET(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json({ sessions: 0, users: 0 });
  }

  try {
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const [{ count: sessions }, { count: users }] = await Promise.all([
      admin.from('reward_ledger').select('id', { count: 'exact', head: true }),
      admin.from('profiles').select('id', { count: 'exact', head: true })
    ]);

    return Response.json(
      { sessions: sessions || 0, users: users || 0 },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' } }
    );
  } catch (e) {
    // Statistika ikkilamchi (dekorativ) narsa — agar ishlamasa, sahifa
    // baribir buzilmasligi kerak, shunchaki statistika satri ko'rinmaydi.
    return Response.json({ sessions: 0, users: 0 });
  }
}
