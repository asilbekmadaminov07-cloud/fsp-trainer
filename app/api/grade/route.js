// Yozma ishlarni baholaydi: Arztbrief (FSP 2-qism) va rentgen tavsifi (Befund).
//
// POST { task: 'arztbrief' | 'befund', text, context }
// → { score, max, summary, good: [...], bad: [...], corrected }

import { callGemini, geminiMessage } from '@/lib/gemini';
import { guard } from '@/lib/apiGuard';

export const maxDuration = 60;

const TASKS = {
  arztbrief: {
    max: 20,
    system: `Du bist Prüfer der Fachsprachprüfung Zahnmedizin und bewertest den schriftlichen Teil: den Arztbrief.

Bewertungsraster (insgesamt 20 Punkte):
- Struktur (4): Anrede, Patientendaten, Anamnese, Befund, Diagnose, Therapie/Procedere, Grußformel
- Fachsprache (5): korrekte Fachbegriffe, korrekte Zahnbezeichnung nach FDI, keine Laiensprache
- Vollständigkeit (5): alle relevanten Informationen aus dem Fall, nichts Wesentliches fehlt
- Sprachrichtigkeit (4): Grammatik, Kasus, Wortstellung, Fachtermini richtig geschrieben
- Stil (2): sachlich, knapp, kollegialer Ton, kein Roman

REGELN:
- "good" nennt konkret, was gelungen ist — mit Zitat aus dem Text.
- "bad" nennt jeden Fehler EINZELN: was falsch ist, warum, und wie es richtig heißt.
- "corrected" ist der vollständige, korrigierte Arztbrief, so wie ein deutscher Zahnarzt ihn schreiben würde.
- Sei streng aber fair. Ein leerer oder unsinniger Text bekommt 0 Punkte.
- Alles auf Deutsch, kein Markdown.`
  },
  befund: {
    max: 10,
    system: `Du bist Prüfer der Fachsprachprüfung Zahnmedizin. Der Kandidat hat ein Röntgenbild beschrieben. Dir liegt der KORREKTE Befund vor.

Bewertungsraster (insgesamt 10 Punkte):
- Erkennen der Auffälligkeit (4): wurde der entscheidende Befund überhaupt genannt
- Lokalisation (2): richtiger Kiefer, richtige Region, richtige Zahnbezeichnung
- Fachsprache (3): "Aufhellung", "Verschattung", "periapikal", "Parodontalspalt", "retiniert" statt Laiensprache
- Zurückhaltung (1): nichts behauptet, was auf dem Bild nicht zu sehen ist

REGELN:
- Wenn der Kandidat etwas beschreibt, das im korrekten Befund NICHT vorkommt, ist das ein schwerer Fehler — nenne ihn ausdrücklich.
- "bad" erklärt jeden Fehler einzeln und nennt die richtige Formulierung.
- "corrected" ist eine musterhafte Befundbeschreibung in 2-4 Sätzen.
- Alles auf Deutsch, kein Markdown.`
  }
};

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    score: { type: 'INTEGER' },
    summary: { type: 'STRING' },
    good: { type: 'ARRAY', items: { type: 'STRING' } },
    bad: { type: 'ARRAY', items: { type: 'STRING' } },
    corrected: { type: 'STRING' }
  },
  required: ['score', 'summary', 'good', 'bad', 'corrected']
};

export async function POST(req) {
  const gate = await guard(req, 'grade');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: 'Der KI-Dienst ist nicht konfiguriert.' }, { status: 500 });

  let body = {};
  try { body = await req.json(); } catch (e) {}
  const task = TASKS[body.task];
  if (!task) return Response.json({ error: 'Unbekannte Aufgabe.' }, { status: 400 });
  const text = String(body.text || '').trim();
  if (text.length < 10) return Response.json({ error: 'Der Text ist zu kurz.' }, { status: 400 });

  const prompt = `${body.context ? 'VORGABEN / KORREKTER BEFUND:\n' + body.context + '\n\n' : ''}TEXT DES KANDIDATEN:\n"""\n${text.slice(0, 6000)}\n"""\n\nBewerte jetzt. Maximalpunktzahl: ${task.max}.`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: task.system }] },
    generationConfig: {
      maxOutputTokens: 3000, temperature: 0.3,
      responseMimeType: 'application/json', responseSchema: SCHEMA
    }
  };

  try {
    const { data: data } = await callGemini(payload, apiKey);
    const out = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    let r;
    try { r = JSON.parse(out); } catch (e) { return Response.json({ error: 'Die Antwort konnte nicht gelesen werden. Bitte erneut versuchen.' }, { status: 502 }); }
    const score = Math.max(0, Math.min(task.max, Number(r.score) || 0));
    return Response.json({
      score, max: task.max,
      summary: String(r.summary || ''),
      good: Array.isArray(r.good) ? r.good.map(String) : [],
      bad: Array.isArray(r.bad) ? r.bad.map(String) : [],
      corrected: String(r.corrected || '')
    });
  } catch (err) {
    return Response.json({ error: geminiMessage(err) }, { status: err.status || 502 });
  }
}
