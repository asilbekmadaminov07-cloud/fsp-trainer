// Ommaviy (login talab qilmaydigan) ijtimoiy isbot sonlari — kirish sahifasi uchun.
// Faqat umumiy sonlar qaytariladi, hech qanday shaxsiy ma'lumot yo'q.

import { createClient } from '@supabase/supabase-js';

export const revalidate = 300; // 5 daqiqada bir marta yangilanadi, har so'rovda emas

export async function GET(){
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json({ sessions: 0, users: 0 });
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const [{ count: sessions }, { count: users }] = await Promise.all([
    admin.from('reward_ledger').select('id', { count: 'exact', head: true }),
    admin.from('profiles').select('id', { count: 'exact', head: true })
  ]);

  return Response.json({ sessions: sessions || 0, users: users || 0 });
}
