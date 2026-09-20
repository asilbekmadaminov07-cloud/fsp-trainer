'use client';
import { apiRawPost } from '@/lib/api';
import { LANGUAGE_NAMES } from '@/lib/langPrompt';

// Statik (nemis tilida oldindan yozilgan) matnni foydalanuvchi tiliga tez tarjima
// qiladi — bemor holatining ochilish gapi va rasm izohi kabi qisqa matnlar uchun.
// Nemis tili tanlangan bo'lsa, hech narsa qilmasdan asl matnni qaytaradi.
export async function translateText(text, lang){
  if (!text || !text.trim() || lang === 'de' || !LANGUAGE_NAMES[lang]) return text;
  try {
    const res = await apiRawPost('/api/chat', {
      system: `Übersetze den folgenden deutschen Text ins ${LANGUAGE_NAMES[lang]}. Gib AUSSCHLIESSLICH die Übersetzung zurück — kein Deutsch, keine Anführungszeichen, keine Erklärung.`,
      messages: [{ role: 'user', content: text }],
      maxTokens: 400
    });
    const data = await res.json().catch(() => ({}));
    return (data.text || '').trim() || text;
  } catch (e) {
    return text;
  }
}
