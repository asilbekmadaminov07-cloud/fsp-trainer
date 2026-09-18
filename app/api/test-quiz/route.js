// Testmodus: har qanday bemor holatiga bog'lanmagan, umumiy FSP bilimini
// tekshiruvchi 10 ta savol. Har so'rovda mavzular tasodifiy tanlanadi —
// shu bilan har safar boshqacha test chiqadi.

import { guard } from '@/lib/apiGuard';

export const maxDuration = 60;

const ALL_TOPICS = [
  'Fachbegriffe: medizinischer Fachbegriff vs. patientenverständliche Umgangssprache',
  'Anamneseerhebung: welche Frage in welcher Situation zuerst gestellt wird',
  'Differentialdiagnose bei häufigen zahnmedizinischen Beschwerden',
  'Röntgenbefunde lesen und beschreiben',
  'Therapieplanung und leitliniengerechtes Vorgehen',
  'Medikamente, Wechselwirkungen, Antibiose, Risikopatienten',
  'Notfallsituationen und wann eine Überweisung nötig ist',
  'Patientenaufklärung in einfacher, verständlicher Sprache',
  'Arztbrief: Struktur und formale Sprache',
  'Grammatik und Ausdruck im ärztlichen Gespräch (Konjunktiv, Höflichkeitsform, Fachsyntax)'
];

function buildSystem(topics){
  return `Du bist Prüfer der Fachsprachprüfung (FSP) Zahnmedizin einer deutschen Landeszahnärztekammer.

Erstelle einen kurzen Übungstest mit Multiple-Choice-Fragen, NICHT an einen bestimmten Patientenfall gebunden — allgemeines FSP-relevantes Wissen.

REGELN:
1. Genau 10 Fragen.
2. Jede Frage hat GENAU 4 Antwortmöglichkeiten, davon GENAU EINE eindeutig richtig.
3. Falsche Antworten müssen plausibel sein (typische Verwechslungen), nicht absurd.
4. Verteile die Fragen über diese Themen: ${topics.join(' · ')}.
5. "explanation" erklärt in 1-2 Sätzen, warum die richtige Antwort stimmt.
6. Alles auf Deutsch, kein Markdown, keine Nummerierung im Fragetext.
7. Jede Frage muss anders formuliert sein als eine typische Lehrbuchfrage — variiere Formulierung und Reihenfolge der Optionen.`;
}

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    questions: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          q: { type: 'STRING' },
          options: { type: 'ARRAY', items: { type: 'STRING' } },
          correct: { type: 'INTEGER' },
          explanation: { type: 'STRING' },
          topic: { type: 'STRING' }
        },
        required: ['q', 'options', 'correct', 'explanation']
      }
    }
  },
  required: ['questions']
};

function sanitize(list){
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const item of list) {
    if (!item || typeof item.q !== 'string' || !Array.isArray(item.options)) continue;
    const options = item.options.map(o => String(o || '').trim()).filter(Boolean);
    if (options.length !== 4) continue;
    if (new Set(options.map(o => o.toLowerCase())).size !== 4) continue;
    const correct = Number(item.correct);
    if (!Number.isInteger(correct) || correct < 0 || correct > 3) continue;
    out.push({
      q: item.q.trim(),
      options,
      correct,
      explanation: String(item.explanation || '').trim(),
      topic: String(item.topic || '').trim()
    });
  }
  return out;
}

function pickTopics(){
  const shuffled = [...ALL_TOPICS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 6);
}

export async function POST(req) {
  const gate = await guard(req, 'test-quiz');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY sozlanmagan.' }, { status: 500 });
  }

  const topics = pickTopics();
  const body = {
    contents: [{ role: 'user', parts: [{ text: 'Erstelle jetzt die 10 Testfragen.' }] }],
    systemInstruction: { parts: [{ text: buildSystem(topics) }] },
    generationConfig: {
      maxOutputTokens: 4096,
      temperature: 1.05,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA
    }
  };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );
    const data = await res.json();
    if (!res.ok) {
      return Response.json({ error: data.error?.message || 'Gemini API xatosi' }, { status: res.status });
    }
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { return Response.json({ error: 'Javobni o\'qib bo\'lmadi' }, { status: 502 }); }

    const questions = sanitize(parsed.questions).sort(() => Math.random() - 0.5).slice(0, 10);
    if (questions.length < 5) {
      return Response.json({ error: 'Yetarli savol yaratilmadi (' + questions.length + ')' }, { status: 502 });
    }
    return Response.json({ questions });
  } catch (err) {
    return Response.json({ error: 'So\'rov bajarilmadi: ' + err.message }, { status: 500 });
  }
}
