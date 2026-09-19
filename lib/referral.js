import { supabase } from './supabaseClient';

export function referralLink(code){
  if (typeof window === 'undefined' || !code) return '';
  return `${window.location.origin}/register?ref=${code}`;
}

// Ro'yxatdan o'tgandan keyin bir marta chaqiriladi: URL'dagi ?ref= kodini
// bazaga bog'laydi va ikkala tomonga (taklif qiluvchi + yangi foydalanuvchi) bonus beradi.
export async function claimReferral(code){
  if (!code) return null;
  const { data, error } = await supabase.rpc('claim_referral', { p_code: code });
  if (error) return null;
  return data;
}
