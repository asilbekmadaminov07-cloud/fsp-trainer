// Audio → matn (nemis tilida). iPhone/iOS uchun: iOS brauzerlari SpeechRecognition'ni
// qo'llab-quvvatlamaydi, shuning uchun ovoz MediaRecorder bilan yozib olinadi va shu yerda
// Gemini orqali matnga aylantiriladi.

import { callGemini, geminiMessage } from '@/lib/gemini';
import { guard } from '@/lib/apiGuard';

export const maxDuration = 60;

export async function POST(req) {
  const gate = await guard(req, 'transcribe');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Der KI-Dienst ist nicht konfiguriert.' }, { status: 500 });
  }

  let audioBase64, mimeType;
  try {
    const body = await req.json();
    audioBase64 = body.audioBase64;
    mimeType = body.mimeType || 'audio/webm';
  } catch (e) {
    return Response.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  if (!audioBase64) {
    return Response.json({ error: 'Es wurde keine Audioaufnahme übergeben.' }, { status: 400 });
  }
  if (typeof audioBase64 !== 'string' || audioBase64.length > 10_000_000) {
    return Response.json({ error: 'Die Audioaufnahme ist zu groß.' }, { status: 413 });
  }

  // "audio/webm;codecs=opus" → "audio/webm" (Gemini faqat asosiy MIME turini qabul qiladi)
  const cleanMime = String(mimeType).split(';')[0].trim();
  if (!['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'].includes(cleanMime)) {
    return Response.json({ error: 'Dieses Audioformat wird nicht unterstützt.' }, { status: 400 });
  }

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
    const { data: data } = await callGemini(body, apiKey);
    let text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    text = text.trim().replace(/^["„»]|["“«]$/g, '').trim();
    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: geminiMessage(err) }, { status: err.status || 502 });
  }
}
