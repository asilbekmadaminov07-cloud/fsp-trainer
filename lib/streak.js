// Mashq kunlarini hisoblash.
//
// Baza ustunlari (agar hali qo'shilmagan bo'lsa, kod jim ishlayveradi —
// SQL uchun supabase/migration_streak.sql ga qarang):
//   last_practice_date  date
//   streak_days         int
//   total_practice_days int

import { supabase } from './supabaseClient';

function today(){
  const d = new Date();
  return d.toISOString().slice(0, 10);   // YYYY-MM-DD
}

function daysBetween(a, b){
  const ms = new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z');
  return Math.round(ms / 86400000);
}

// Akkaunt ochilganiga necha kun bo'ldi — created_at Supabase'da har doim bor
export function accountAgeDays(profile){
  if (!profile?.created_at) return 0;
  const created = new Date(profile.created_at);
  if (isNaN(created)) return 0;
  return Math.max(0, Math.floor((Date.now() - created.getTime()) / 86400000));
}

// Bugun mashq qilinganini belgilaydi va ketma-ketlikni yangilaydi.
// Ustunlar yo'q bo'lsa xato qaytaradi — uni jim yutamiz, sayt baribir ishlaydi.
export async function markPracticeToday(profile){
  if (!profile?.id) return profile;
  const t = today();
  const last = profile.last_practice_date;
  if (last === t) return profile;                 // bugun allaqachon belgilangan

  const gap = last ? daysBetween(last, t) : null;
  const streak = gap === 1 ? (profile.streak_days || 0) + 1 : 1;
  const total = (profile.total_practice_days || 0) + 1;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ last_practice_date: t, streak_days: streak, total_practice_days: total })
      .eq('id', profile.id)
      .select()
      .single();
    if (error) return profile;                    // ustunlar hali yo'q
    return data || profile;
  } catch (e) {
    return profile;
  }
}

// Ketma-ketlik hali uzilmaganmi (bugun yoki kecha mashq qilinganmi)
export function streakAlive(profile){
  const last = profile?.last_practice_date;
  if (!last) return false;
  const gap = daysBetween(last, today());
  return gap <= 1;
}
