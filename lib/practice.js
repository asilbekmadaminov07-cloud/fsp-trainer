import { supabase } from '@/lib/supabaseClient';

function todayStr(){
  return new Date().toISOString().slice(0, 10);
}

// Sahifa ochilganda bir marta chaqiriladi: agar bugun hali "amaliyot kuni" sifatida
// belgilanmagan bo'lsa, practice_days ni oshiradi. Yangilangan qiymatlarni qaytaradi
// (yoki hech narsa o'zgarmasa null).
export async function touchPracticeDay(profile){
  if (!profile) return null;
  const today = todayStr();
  if (profile.last_practice_date === today) return null;

  const { data, error } = await supabase.rpc('mark_practice_day');
  if (error) return null;
  return Array.isArray(data) ? data[0] || null : data || null;
}

export function daysSince(dateStr){
  if (!dateStr) return 0;
  const start = new Date(dateStr);
  const diffMs = Date.now() - start.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
}
