// Gemini chaqiruvi — yuklanish va vaqtinchalik xatolarga chidamli.
//
// Muammo: Gemini ba'zan 503 "high demand" yoki 429 qaytaradi. Bu o'tkinchi,
// lekin foydalanuvchi uchun sayt buzilgandek ko'rinadi.
//
// Yechim ikki bosqichli:
//   1. Bir xil modelga qisqa tanaffus bilan qayta urinish (250ms, 700ms, 1600ms)
//   2. Baribir bo'lmasa — zaxira modelga o'tish
//
// Zaxira modellar sifat bo'yicha biroz pastroq, lekin ishlamayotgan saytdan
// yaxshiroq. Foydalanuvchi farqni sezmaydi.

// gemini-2.0-flash googletomonidan butunlay o'chirilgan ("no longer available" — 404
// barcha so'rovlarda). gemini-3.6-flash — Google tavsiya qilgan joriy model, birinchi
// o'rinda turadi; 2.5 seriyasi hali ishlayotgan zaxira sifatida qoldirildi.
const MODELS = [
  'gemini-3.6-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite'
];

const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const BACKOFF = [250, 700, 1600];

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

/**
 * @param {object} body    Gemini generateContent tanasi
 * @param {string} apiKey
 * @param {object} [opts]  { models } — kerak bo'lsa boshqa ro'yxat
 * @returns {Promise<{ data, model }>}
 * @throws  Error — `status` maydoni bilan
 */
export async function callGemini(body, apiKey, opts = {}){
  const models = opts.models || MODELS;
  let last = null;

  for (const model of models) {
    for (let attempt = 0; attempt <= BACKOFF.length; attempt++) {
      let res, data;
      try {
        res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        );
        data = await res.json();
      } catch (e) {
        last = Object.assign(new Error(e.message), { status: 503 });
        if (attempt < BACKOFF.length) { await sleep(BACKOFF[attempt]); continue; }
        break;                                  // keyingi modelga
      }

      if (res.ok) return { data, model };

      const status = res.status;
      const msg = data?.error?.message || `HTTP ${status}`;
      last = Object.assign(new Error(msg), { status });

      // Model topilmadi yoki so'rov noto'g'ri — qayta urinishdan foyda yo'q
      if (status === 404 || status === 400) break;
      // Kvota tugagan (pullik tarif kerak) — boshqa model ham yordam bermaydi
      if (status === 403) throw last;

      if (RETRY_STATUS.has(status) && attempt < BACKOFF.length) {
        await sleep(BACKOFF[attempt]);
        continue;
      }
      break;                                    // keyingi modelga
    }
  }

  throw last || Object.assign(new Error('Gemini javob bermadi'), { status: 503 });
}

// Foydalanuvchiga ko'rsatiladigan nemischa xabar
export function geminiMessage(err){
  const s = err?.status;
  if (s === 429 || s === 503) {
    return 'Der KI-Dienst ist gerade überlastet. Bitte in ein paar Sekunden erneut versuchen.';
  }
  if (s === 403) {
    return 'Das Kontingent des KI-Dienstes ist aufgebraucht.';
  }
  return 'Der KI-Dienst antwortet gerade nicht. Bitte erneut versuchen.';
}
