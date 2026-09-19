import { guard } from '@/lib/apiGuard';
import { callGemini, geminiMessage } from '@/lib/gemini';

export const maxDuration = 60;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          q: { type: 'STRING' }, options: { type: 'ARRAY', items: { type: 'STRING' } },
          correct: { type: 'INTEGER' }, explanation: { type: 'STRING' }
        },
        required: ['q', 'options', 'correct', 'explanation']
      }
    }
  },
  required: ['questions']
};

function sanitize(items) {
  if (!Array.isArray(items)) return [];
  return items.filter(item =>
    typeof item?.q === 'string' && Array.isArray(item.options) && item.options.length === 4 &&
    Number.isInteger(item.correct) && item.correct >= 0 && item.correct < 4
  ).slice(0, 5);
}

export async function POST(req) {
  const gate = await guard(req, 'daily-quiz');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });
  const input = await req.json().catch(() => ({}));
  const focus = String(input.focus || 'Anamnese').trim().slice(0, 160);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: 'Der KI-Dienst ist nicht konfiguriert.' }, { status: 500 });

  const body = {
    contents: [{ role: 'user', parts: [{ text: `Erstelle die heutige Challenge zum Schwerpunkt: ${focus}` }] }],
    systemInstruction: { parts: [{ text: `Du bist FSP-Prüfer für Zahnmedizin. Erstelle genau 5 abwechslungsreiche Multiple-Choice-Fragen für eine 10-minütige Tagesübung. Jede Frage hat genau vier unterschiedliche Antworten und nur eine eindeutige richtige Antwort. Die Erklärung soll den Denkweg in höchstens zwei Sätzen zeigen. Alles auf Deutsch.` }] },
    generationConfig: {
      maxOutputTokens: 4000,
      temperature: 0.9,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA
    }
  };

  try {
    const { data } = await callGemini(body, apiKey);
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    const questions = sanitize(JSON.parse(text).questions);
    if (questions.length !== 5) throw new Error('Ungültige Tagesfragen');
    return Response.json({ questions, focus });
  } catch (error) {
    return Response.json({ error: geminiMessage(error) }, { status: error.status || 502 });
  }
}
