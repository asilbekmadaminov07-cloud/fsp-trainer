// MIJOZ tomonidagi API chaqiruvchi.
//
// Har bir so'rovga foydalanuvchi tokenini qo'shadi — serverda `guard()` aynan
// shuni tekshiradi. Barcha `/api/...` chaqiruvlari shu funksiya orqali o'tadi.

import { supabase } from './supabaseClient';

async function authHeader(){
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    return token ? { Authorization: 'Bearer ' + token } : {};
  } catch (e) {
    return {};
  }
}

// JSON yuboradi va JSON qaytaradi. Xato bo'lsa Error tashlaydi.
export async function apiPost(path, body){
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Anfrage fehlgeschlagen');
  return data;
}

export async function apiGet(path){
  const res = await fetch(path, { headers: await authHeader() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Anfrage fehlgeschlagen');
  return data;
}

// Javob JSON emas (masalan ovoz fayli) bo'lgan hollar uchun
export async function apiRaw(path, body){
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
    body: JSON.stringify(body || {})
  });
}
