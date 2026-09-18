import { guard } from '@/lib/apiGuard';

export async function POST(req) {
  const gate = await guard(req, 'chat');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY sozlanmagan (.env.local faylini tekshiring).' }, { status: 500 });
  }

  const { system, messages, maxTokens } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: 'messages massivi kerak' }, { status: 400 });
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
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    const data = await geminiRes.json();
    if (!geminiRes.ok) {
      return Response.json({ error: data.error?.message || 'Gemini API xatosi' }, { status: geminiRes.status });
    }
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    return Response.json({ text });
  } catch (err) {
    return Response.json({ error: 'So\'rov bajarilmadi: ' + err.message }, { status: 500 });
  }
}
