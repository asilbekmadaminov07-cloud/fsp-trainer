// Cheksiz bemor holatlari.
//
// Mantiq: avval SERVER tekshirilgan rentgen topilmasini tasodifiy tanlaydi,
// keyin Gemini shu topilmaga MOS keladigan bemorni yozadi. Tartib shunday
// bo'lgani uchun rentgen va muammo hech qachon bir-biriga zid bo'lmaydi —
// AI o'ziga rasm tanlamaydi, unga tayyor rasm beriladi.
//
// POST { difficulty, exclude?: [ismlar] }
// → { case: {...}, generated: true }

import { callGemini, geminiMessage } from '@/lib/gemini';
import { guard } from '@/lib/apiGuard';
import { safeLang, langInstruction, LANGUAGE_NAMES } from '@/lib/langPrompt';

import { verifiedFindings } from '@/lib/findings';

export const maxDuration = 60;

const LEVEL_BRIEF = {
  leicht: 'Einsteigerniveau. Ein klares Leitsymptom, eindeutige Diagnose. Mindestens 3 sinnvolle Anamnesefragen sind nötig.',
  mittel: 'Mittleres Niveau. Ein relevanter Begleitumstand und zwei plausible Differentialdiagnosen. Mindestens 5 gezielte Anamnesefragen sind nötig.',
  schwer: 'Fortgeschritten. Allgemeinerkrankung oder Dauermedikation ändert die Behandlung. Mindestens 7 gezielte Fragen sind nötig; die entscheidende Angabe bleibt bis zur passenden Frage verborgen.',
  pro: 'Expertenniveau. Nicht-odontogene Ursache oder Hochrisikopatient mit klinischer Falle. Mindestens 9 gezielte Fragen aus Schmerz-, Allgemein-, Medikamenten-, Risiko- und Sozialanamnese sind nötig.'
};

function buildSystem(lang){
  const patientLine = lang === 'de'
    ? 'Antworte NUR auf Deutsch, einfache Umgangssprache, kurze Antworten (1-3 Sätze), Details nur auf Nachfrage.'
    : `Antworte NUR auf ${LANGUAGE_NAMES[lang]} (nicht auf Deutsch), einfache Umgangssprache, kurze Antworten (1-3 Sätze), Details nur auf Nachfrage.`;
  return `Du entwickelst Prüfungsfälle für die Fachsprachprüfung (FSP) Zahnmedizin in Deutschland.

Du bekommst einen RÖNTGENBEFUND vorgegeben. Deine Aufgabe ist es, einen Patienten zu erfinden, dessen Beschwerden GENAU zu diesem Röntgenbefund passen.

ABSOLUT VERBINDLICH:
1. Die Diagnose muss zum vorgegebenen Röntgenbefund passen. Erfinde NIEMALS radiologische Zeichen, die im vorgegebenen Befund nicht genannt sind.
2. "imageContent" beschreibt NUR das, was im vorgegebenen Befund steht — in eigenen Worten, aber ohne zusätzliche Befunde.
3. Wenn der Röntgenbefund unauffällig ist, ist die Diagnose entweder nicht-odontogen oder rein klinisch zu stellen. Dann sagt "imageContent" ausdrücklich, dass das Röntgenbild unauffällig ist und die Diagnose klinisch gestellt wird.

DER PATIENT ("system"-Feld) — das ist eine Rollenanweisung für ein Sprachmodell, das den Patienten spielt:
- Deutscher Name, Alter, Beruf. Realistisch für Deutschland, gern auch Migrationshintergrund.
- Beschwerden in Laiensprache, NIEMALS Fachbegriffe.
- Die entscheidenden Informationen (Vorerkrankungen, Medikamente, Allergien, Rauchen, Alkohol, Schwangerschaft, frühere Behandlungen) werden NUR genannt, wenn der Kandidat konkret danach fragt. Schreibe das ausdrücklich in die Rollenanweisung.
- Baue den Fall wie einen echten Praxisbesuch auf: Leitsymptom → Schmerzcharakter/Verlauf → Begleitsymptome → zahnärztliche Vorgeschichte → Allgemein- und Medikamentenanamnese → Patientensorge.
- Das Gespräch muss 15-20 Arztfragen konsistent aushalten. Gib pro Antwort höchstens einen neuen klinischen Hinweis preis.
- Formuliere 2-3 realistische Rückfragen oder Sorgen, die der Patient erst nach Diagnose oder Therapieempfehlung stellen kann.
- Eine Persönlichkeit: ängstlich, ungeduldig, bagatellisierend, gesprächig, misstrauisch, dankbar — verschieden pro Fall.
- Endet mit: "${patientLine}"

STIL: Die Felder "name", "meta", "opener", "imageCaption" und "imageContent" (was der Kandidat liest) sowie die Rollenbeschreibung im "system"-Feld: ${langInstruction(lang)} Kein Markdown. "avatar" ist EIN Großbuchstabe (Anfangsbuchstabe des Nachnamens). "meta" sind 2-4 Wörter Laiensprache, z. B. "Schmerzen unten links". Der deutsche Name des Patienten bleibt aber ein echter deutscher Name (Namen werden nicht übersetzt).`;
}

function buildPrompt(finding, difficulty, hint, exclude){
  return `VORGEGEBENER RÖNTGENBEFUND (unveränderlich):
"${finding.befund}"

Dieser Befund passt typischerweise zu: ${(finding.fits || []).join(', ')}.
Wähle daraus eine Richtung — Vorschlag für diesen Fall: ${hint}.

SCHWIERIGKEITSSTUFE: ${difficulty}
${LEVEL_BRIEF[difficulty] || ''}

${exclude && exclude.length ? 'Diese Namen sind schon vergeben, nimm andere: ' + exclude.join(', ') : ''}

Erstelle jetzt den Fall.`;
}

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    meta: { type: 'STRING' },
    avatar: { type: 'STRING' },
    diagnosis: { type: 'STRING' },
    opener: { type: 'STRING' },
    imageCaption: { type: 'STRING' },
    imageContent: { type: 'STRING' },
    system: { type: 'STRING' }
  },
  required: ['name', 'meta', 'avatar', 'diagnosis', 'opener', 'imageCaption', 'imageContent', 'system']
};

function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

export async function POST(req) {
  const gate = await guard(req, 'case');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: 'Der KI-Dienst ist nicht konfiguriert.' }, { status: 500 });

  let body = {};
  try { body = await req.json(); } catch (e) {}
  const difficulty = ['leicht', 'mittel', 'schwer', 'pro'].includes(body.difficulty) ? body.difficulty : 'leicht';
  const exclude = Array.isArray(body.exclude) ? body.exclude.slice(0, 20) : [];
  const lang = safeLang(body.lang);

  const pool = verifiedFindings();
  if (!pool.length) {
    return Response.json({ error: 'Noch keine geprüften Röntgenbefunde verfügbar.' }, { status: 503 });
  }
  const finding = pick(pool);
  const hint = pick(finding.fits && finding.fits.length ? finding.fits : ['ein passender Befund']);

  const payload = {
    contents: [{ role: 'user', parts: [{ text: buildPrompt(finding, difficulty, hint, exclude) }] }],
    systemInstruction: { parts: [{ text: buildSystem(lang) }] },
    generationConfig: {
      maxOutputTokens: 3500,
      temperature: 1.1,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA
    }
  };

  try {
    const { data: data } = await callGemini(payload, apiKey);
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    let c;
    try { c = JSON.parse(text); }
    catch (e) { return Response.json({ error: 'Die Antwort konnte nicht gelesen werden. Bitte erneut versuchen.' }, { status: 502 }); }

    for (const k of ['name', 'diagnosis', 'opener', 'system']) {
      if (!c[k] || typeof c[k] !== 'string' || !c[k].trim()) {
        return Response.json({ error: 'Der Fall konnte nicht vollständig erstellt werden (' + k + ')' }, { status: 502 });
      }
    }

    // Rasm SERVER tomonidan biriktiriladi — AI unga ta'sir qila olmaydi.
    const built = {
      difficulty,
      name: c.name.trim(),
      meta: (c.meta || '').trim(),
      avatar: (c.avatar || c.name.trim().slice(-1)).trim().charAt(0).toUpperCase() || '?',
      diagnosis: c.diagnosis.trim(),
      opener: c.opener.trim(),
      imageLabel: 'Röntgenbild',
      imageKey: 'normal_xray',
      commonsFile: finding.file,
      findingKey: finding.key,
      imageCaption: (c.imageCaption || 'Hier ist das Röntgenbild.').trim(),
      imageContent: (c.imageContent || finding.befund).trim(),
      system: c.system.trim(),
      generated: true
    };

    return Response.json({ case: built, finding: { key: finding.key, label: finding.label } });
  } catch (err) {
    return Response.json({ error: geminiMessage(err) }, { status: err.status || 502 });
  }
}
