// Gemini chaqiruvi — yuklanish va vaqtinchalik xatolarga chidamli.
//
// Muammo: Gemini ba'zan 503 "high demand" yoki 429 qaytaradi. Bu o'tkinchi,
// lekin foydalanuvchi uchun sayt buzilgandek ko'rinadi. Yana ham jiddiyroq
// holat: Google modelni butunlay o'chirib qo'yishi mumkin (2026-09 da
// gemini-2.0-flash bilan aynan shunday bo'ldi) — bu holda BARCHA Gemini
// modellari birdan ishlamay qoladi.
//
// Yechim uch bosqichli:
//   1. Bir xil modelga qisqa tanaffus bilan qayta urinish (250ms, 700ms, 1600ms)
//   2. Baribir bo'lmasa — Gemini ichidagi zaxira modelga o'tish
//   3. Gemini modellarining BARCHASI ishlamasa — butunlay boshqa provayder
//      (Groq, bepul) ga o'tiladi, shu bilan bitta kompaniyaga qaramlik kamayadi.

const MODELS = [
  'gemini-TEMP-force-groq-fallback-test'
];

const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const BACKOFF = [250, 700, 1600];

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

// Gemini'ning { contents, systemInstruction, generationConfig } so'rovini Groq'ning
// OpenAI-mos chat completions formatiga o'giradi, javobni esa chaqiruvchi kod
// o'zgarishsiz o'qiy olishi uchun Gemini shaklidagi { candidates: [...] } ga o'raydi.
const GROQ_MODEL = 'llama-3.3-70b-versatile';

async function callGroq(body, groqKey){
  const messages = [];
  const sys = body.systemInstruction?.parts?.map(p => p.text || '').join('\n') || '';
  const wantsJson = body.generationConfig?.responseMimeType === 'application/json';
  const schemaHint = wantsJson && body.generationConfig?.responseSchema
    ? '\n\nAntworte AUSSCHLIESSLICH mit gültigem JSON, exakt passend zu diesem Schema (kein Markdown, kein zusätzlicher Text):\n' + JSON.stringify(body.generationConfig.responseSchema)
    : '';
  if (sys || schemaHint) messages.push({ role: 'system', content: sys + schemaHint });

  for (const c of (body.contents || [])) {
    messages.push({
      role: c.role === 'model' ? 'assistant' : 'user',
      content: (c.parts || []).map(p => p.text || '').join('')
    });
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: body.generationConfig?.temperature ?? 0.8,
      max_tokens: body.generationConfig?.maxOutputTokens ?? 1024,
      ...(wantsJson ? { response_format: { type: 'json_object' } } : {})
    })
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    let modelsList = '';
    try {
      const mr = await fetch('https://api.groq.com/openai/v1/models', { headers: { Authorization: `Bearer ${groqKey}` } });
      const mj = await mr.json();
      modelsList = ' AVAILABLE=' + (mj.data || []).map(m => m.id).join(',');
    } catch (e) { /* e'tiborsiz */ }
    throw Object.assign(new Error((json?.error?.message || `HTTP ${res.status}`) + modelsList), { status: res.status });
  }
  const text = json.choices?.[0]?.message?.content || '';
  const finishReason = json.choices?.[0]?.finish_reason === 'length' ? 'MAX_TOKENS' : 'STOP';
  return {
    data: { candidates: [{ content: { parts: [{ text }] }, finishReason }] },
    model: 'groq:' + GROQ_MODEL
  };
}

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

  outer:
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
        continue outer;                          // keyingi modelga
      }

      if (res.ok) return { data, model };

      const status = res.status;
      const msg = data?.error?.message || `HTTP ${status}`;
      last = Object.assign(new Error(msg), { status });

      // Model topilmadi yoki so'rov noto'g'ri — qayta urinishdan foyda yo'q
      if (status === 404 || status === 400) continue outer;
      // Kvota tugagan — boshqa Gemini modeli ham yordam bermaydi, zaxira provayderga o'tamiz
      if (status === 403) break outer;

      if (RETRY_STATUS.has(status) && attempt < BACKOFF.length) {
        await sleep(BACKOFF[attempt]);
        continue;
      }
      continue outer;                            // keyingi modelga
    }
  }

  // Gemini'ning barcha modellari ishlamadi — agar GROQ_API_KEY sozlangan bo'lsa,
  // butunlay boshqa provayderga (Groq, bepul) so'nggi zaxira sifatida murojaat qilamiz.
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try { return await callGroq(body, groqKey); }
    catch (e) {
      throw Object.assign(new Error('DEBUG groq_failed: ' + e.message + ' (status ' + e.status + ', keyLen ' + groqKey.length + ')'), { status: 502 });
    }
  } else {
    throw Object.assign(new Error('DEBUG no_groq_key'), { status: 502 });
  }
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
  if (String(err?.message || '').startsWith('DEBUG')) return err.message;
  return 'Der KI-Dienst antwortet gerade nicht. Bitte erneut versuchen.';
}
