// Audio → matn (nemis tilida). iPhone/iOS uchun: iOS brauzerlari SpeechRecognition'ni
// qo'llab-quvvatlamaydi, shuning uchun ovoz MediaRecorder bilan yozib olinadi va shu yerda
// Gemini orqali matnga aylantiriladi.

export const maxDuration = 60;

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY sozlanmagan (.env.local faylini tekshiring).' }, { status: 500 });
  }

  let audioBase64, mimeType;
  try {
    const body = await req.json();
    audioBase64 = body.audioBase64;
    mimeType = body.mimeType || 'audio/webm';
  } catch (e) {
    return Response.json({ error: 'Noto\'g\'ri so\'rov' }, { status: 400 });
  }

  if (!audioBase64) {
    return Response.json({ error: 'audioBase64 kerak' }, { status: 400 });
  }

  // "audio/webm;codecs=opus" → "audio/webm" (Gemini faqat asosiy MIME turini qabul qiladi)
  const cleanMime = String(mimeType).split(';')[0].trim();

  const prompt = [
    'Transkribiere die Audioaufnahme wortwörtlich auf Deutsch.',
    'Gib AUSSCHLIESSLICH den gesprochenen Text zurück — keine Anführungszeichen,',
    'keine Erklärung, keine Zeitstempel, keine Sprecherbezeichnung.',
    'Wenn nichts Verständliches gesprochen wurde, gib eine leere Antwort zurück.'
  ].join(' ');

  const body = {
    contents: [{
      role: 'user',
      parts: [
        { text: prompt },
        { inlineData: { mimeType: cleanMime, data: audioBase64 } }
      ]
    }],
    generationConfig: { maxOutputTokens: 300, temperature: 0 }
  };

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      return Response.json({ error: data.error?.message || 'Gemini API xatosi' }, { status: geminiRes.status });
    }
    let text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    text = text.trim().replace(/^["„»]|["“«]$/g, '').trim();
    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: 'So\'rov bajarilmadi: ' + err.message }, { status: 500 });
  }
}
