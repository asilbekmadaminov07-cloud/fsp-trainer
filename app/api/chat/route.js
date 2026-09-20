import { callGemini, geminiMessage } from '@/lib/gemini';
import { guard } from '@/lib/apiGuard';

export async function POST(req) {
  const gate = await guard(req, 'chat');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Der KI-Dienst ist nicht konfiguriert.' }, { status: 500 });
  }

  let payload;
  try { payload = await req.json(); }
  catch { return Response.json({ error: 'Ungültige Anfrage.' }, { status: 400 }); }
  const { system, messages, maxTokens } = payload || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'Es wurden keine Nachrichten übergeben.' }, { status: 400 });
  }

  if (messages.length > 80 || messages.some(m => typeof m?.content !== 'string' || m.content.length > 4000)) {
    return Response.json({ error: 'Die Unterhaltung ist zu lang.' }, { status: 400 });
  }
  if (system && (typeof system !== 'string' || system.length > 8000)) {
    return Response.json({ error: 'Ungültige Anweisungen.' }, { status: 400 });
  }

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    contents,
    generationConfig: {
      maxOutputTokens: Math.max(50, Math.min(Number(maxTokens) || 300, 1600)),
      temperature: 0.8,
      // Fikrlash (thinking) tokenlari o'chirilgan: aks holda ular maxOutputTokens
      // byudjetining katta qismini "ko'zga ko'rinmas" fikrlashga sarflab, ko'rinadigan
      // javobni yarim jumlada kesib qo'yishi mumkin (masalan tashxis bahosida ko'rilgan).
      thinkingConfig: { thinkingBudget: 0 }
    }
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  try {
    const { data: data } = await callGemini(body, apiKey);
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: geminiMessage(err) }, { status: err.status || 502 });
  }
}
