import { apiPost } from './api';

export function newAttemptId(){
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Mukofot berish tarmoq/server xatosiga uchrasa ham, chaqiruvchi ekran (imtihon
// natijasi, tashxis bahosi) qulab tushmasligi kerak — shuning uchun bu yerda
// xatoni ushlab, null qaytaramiz. Chaqiruvchi kod `updated` null bo'lsa profilni
// yangilamaydi (eski holatda qoladi), lekin foydalanuvchiga natija baribir
// ko'rsatiladi.
export async function awardProgress(rewardKey, attemptId, units = 1){
  try {
    const data = await apiPost('/api/reward', { rewardKey, attemptId, units });
    return data.profile || null;
  } catch (e) {
    return null;
  }
}
