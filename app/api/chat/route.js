import { callGemini, geminiMessage } from '@/lib/gemini';
import { guard } from '@/lib/apiGuard';

export async function POST(req) {
  const gate = await guard(req, 'chat');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Der KI-Dienst ist nicht konfiguriert.' }, { status: 500 });
  }

  const { system, messages, maxTokens } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'Es wurden keine Nachrichten übergeben.' }, { status: 400 });
  }

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    contents,
    generationConfig: { maxOutputTokens: maxTokens || 300, temperature: 0.8 }
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
