import { guard } from '@/lib/apiGuard';
import { callGemini, geminiMessage } from '@/lib/gemini';
import { buildFallbackPlan } from '@/lib/learning';
import { safeLang, langInstruction } from '@/lib/langPrompt';

export const maxDuration = 60;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    summary: { type: 'STRING' },
    focusTopic: { type: 'STRING' },
    weakTopics: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { topic: { type: 'STRING' }, reason: { type: 'STRING' } },
        required: ['topic', 'reason']
      }
    },
    days: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          day: { type: 'INTEGER' }, topic: { type: 'STRING' },
          goal: { type: 'STRING' }, minutes: { type: 'INTEGER' }
        },
        required: ['day', 'topic', 'goal', 'minutes']
      }
    },
    coachTip: { type: 'STRING' }
  },
  required: ['summary', 'focusTopic', 'weakTopics', 'days', 'coachTip']
};

function cleanMistakes(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 30).map(item => ({
    topic: String(item?.topic || item?.case_name || item?.difficulty || '').slice(0, 160),
    question: String(item?.question || '').slice(0, 500),
    chosen: String(item?.chosen || '').slice(0, 300),
    correct: String(item?.correct || '').slice(0, 300)
  }));
}

export async function POST(req) {
  const gate = await guard(req, 'coach');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });

  const payload = await req.json().catch(() => ({}));
  const mistakes = cleanMistakes(payload.mistakes);
  const bundesland = typeof payload.bundesland === 'string' ? payload.bundesland.slice(0, 60) : '';
  const lang = safeLang(payload.lang);
  const fallback = buildFallbackPlan(mistakes);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ plan: fallback, generatedBy: 'local' });

  const stateNote = bundesland
    ? ` Der Kandidat plant die FSP bei der Landesärztekammer/Zahnärztekammer in ${bundesland} abzulegen — erwähne im Coach-Tipp bei Gelegenheit eine praktische, korrekte Besonderheit dieses Bundeslandes (z. B. Anmeldeverfahren, Bearbeitungsdauer), falls dir dazu etwas Verlässliches einfällt; erfinde nichts, wenn du unsicher bist.`
    : '';

  const body = {
    contents: [{ role: 'user', parts: [{ text: JSON.stringify(mistakes) }] }],
    systemInstruction: { parts: [{ text: `Du bist ein persönlicher FSP-Lerncoach für Zahnmedizin. Analysiere die Fehlerliste und erstelle einen realistischen 7-Tage-Plan. Jeder Tag dauert genau 10 Minuten. Priorisiere wiederkehrende Denkfehler, nicht bloß einzelne Fragen. ${langInstruction(lang)} Motivierend aber konkret. Gib genau 3 Schwachpunkte und genau 7 Tage zurück. Keine erfundenen Leistungen.${stateNote}` }] },
    generationConfig: {
      maxOutputTokens: 3000,
      temperature: 0.45,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA
    }
  };

  try {
    const { data } = await callGemini(body, apiKey);
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    const plan = JSON.parse(text);
    if (!Array.isArray(plan.days) || plan.days.length !== 7) throw new Error('Invalid plan');
    return Response.json({ plan, generatedBy: 'ai' });
  } catch (error) {
    if (error instanceof SyntaxError || error.message === 'Invalid plan') {
      return Response.json({ plan: fallback, generatedBy: 'local' });
    }
    return Response.json({ error: geminiMessage(error) }, { status: error.status || 502 });
  }
}
