// Har bir holat uchun 20 ta imtihon savolini Gemini yordamida yaratadi.
// Savollar oldindan yozilmagan — har urinishda yangidan tuziladi, shuning uchun
// foydalanuvchi javoblarni yodlab ololmaydi.
//
// POST { caseName, meta, diagnosis, difficulty, transcript }
// → { questions: [{ q, options: [4 ta], correct: 0-3, explanation, topic }] }

import { callGemini, geminiMessage } from '@/lib/gemini';
import { guard } from '@/lib/apiGuard';

export const maxDuration = 60;

const TOPICS = [
  'Anamnese: welche Frage ist in dieser Situation als nächstes am wichtigsten',
  'Differentialdiagnose: was muss abgegrenzt oder ausgeschlossen werden',
  'Befund und Röntgen: wie ist der beschriebene Befund zu deuten',
  'Therapie: welches Vorgehen ist leitliniengerecht und in welcher Reihenfolge',
  'Medikamente, Allgemeinerkrankungen und Risiken (Wechselwirkungen, Antibiose, Blutverdünnung, Schwangerschaft)',
  'Notfall und Überweisung: wann ist der Fall nicht mehr zahnärztlich',
  'Patientenkommunikation: wie wird der Befund laienverständlich erklärt',
  'Fachsprache: korrekter Fachbegriff für einen umgangssprachlichen Ausdruck'
];

function buildSystem(){
  return `Du bist Prüfer der Fachsprachprüfung (FSP) Zahnmedizin einer deutschen Landeszahnärztekammer.

Du erstellst Prüfungsfragen im Multiple-Choice-Format. Diese Fragen entscheiden darüber, ob ein Kandidat eine Stufe aufsteigt — sie müssen daher fachlich korrekt, eindeutig und prüfungsrelevant sein.

REGELN — strikt einhalten:
1. Genau 20 Fragen.
2. Jede Frage hat GENAU 4 Antwortmöglichkeiten, davon GENAU EINE eindeutig richtig.
3. Die falschen Antworten müssen plausibel sein (typische Verwechslungen, häufige Anfängerfehler) — keine offensichtlich absurden Optionen.
4. Die Fragen müssen sich auf DIESEN konkreten Fall beziehen, nicht auf allgemeines Lehrbuchwissen ohne Bezug.
5. Stütze dich auf häufige, alltägliche Situationen aus der deutschen zahnärztlichen Praxis und auf die Themen, die in der FSP regelmäßig geprüft werden.
6. Verteile die Fragen über die vorgegebenen Themenbereiche, mehrere Fragen pro Bereich sind erlaubt.
7. "explanation" erklärt in 1-3 Sätzen, WARUM die richtige Antwort richtig ist UND worin der typische Denkfehler bei den falschen Antworten besteht. Der Kandidat liest das nach einem Fehler — es muss ihm beibringen, was er übersehen hat.
8. Alles auf Deutsch. Kein Markdown, keine Aufzählungszeichen, keine Nummerierung im Fragetext.
9. Verrate in der Fragestellung nicht die Antwort einer anderen Frage.`;
}

function buildPrompt({ caseName, meta, diagnosis, difficulty, transcript }){
  const level = {
    leicht: 'Einsteigerniveau: Grundlagen, klare Befunde, eindeutige Therapieentscheidungen.',
    mittel: 'Mittleres Niveau: mehrere Differentialdiagnosen, Begleitumstände beachten.',
    schwer: 'Fortgeschritten: Allgemeinerkrankungen, Medikamenteninteraktionen, Risikopatienten.',
    pro: 'Expertenniveau: Fälle mit Fallstricken, nicht-odontogene Ursachen, Notfall- und Überweisungsentscheidungen, rechtliche und kommunikative Aspekte.'
  }[difficulty] || '';

  return `FALL
Patient: ${caseName}${meta ? ' — ' + meta : ''}
Korrekte Diagnose: ${diagnosis}
Schwierigkeitsstufe: ${difficulty} — ${level}

GESPRÄCHSVERLAUF (was der Kandidat tatsächlich erfragt hat):
${transcript || '(kein Gespräch protokolliert)'}

THEMENBEREICHE, über die die 20 Fragen zu verteilen sind:
${TOPICS.map((t, i) => (i + 1) + '. ' + t).join('\n')}

Erstelle jetzt die 20 Prüfungsfragen zu diesem Fall.`;
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

// Javobni tekshiramiz: 4 ta variant, to'g'ri indeks 0-3, takrorlanmagan variantlar
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

export async function POST(req) {
  const gate = await guard(req, 'quiz');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Der KI-Dienst ist nicht konfiguriert.' }, { status: 500 });
  }

  let payload;
  try { payload = await req.json(); }
  catch (e) { return Response.json({ error: 'Ungültige Anfrage.' }, { status: 400 }); }

  if (!payload || !payload.diagnosis) {
    return Response.json({ error: 'Es wurde keine Diagnose übergeben.' }, { status: 400 });
  }

  const body = {
    contents: [{ role: 'user', parts: [{ text: buildPrompt(payload) }] }],
    systemInstruction: { parts: [{ text: buildSystem() }] },
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 1.0,          // har urinishda boshqa savollar chiqsin
      responseMimeType: 'application/json',
      responseSchema: SCHEMA
    }
  };

  try {
    const { data: data } = await callGemini(body, apiKey);
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { return Response.json({ error: 'Die Antwort konnte nicht gelesen werden. Bitte erneut versuchen.' }, { status: 502 }); }

    const questions = sanitize(parsed.questions).slice(0, 20);
    if (questions.length < 10) {
      return Response.json({ error: 'Es konnten nicht genug Fragen erstellt werden (' + questions.length + ')' }, { status: 502 });
    }
    return Response.json({ questions });
  } catch (err) {
    return Response.json({ error: geminiMessage(err) }, { status: err.status || 502 });
  }
}
