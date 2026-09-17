// Fachbegriff ↔ Laiensprache kartalari.
// FSP'ning asosiy mahorati: bemorga tushunarli qilib tushuntirish va aksincha.
//
// POST { topic?, count? }
// → { cards: [{ fach, laie, erklaerung, beispielsatz }] }

export const maxDuration = 60;

const TOPICS = [
  'Kariologie und Endodontie',
  'Parodontologie',
  'Oralchirurgie und Extraktion',
  'Prothetik und Zahnersatz',
  'Röntgen und Befundung',
  'Anatomie von Zahn und Kiefer',
  'Medikamente, Anästhesie und Notfall',
  'Kinderzahnheilkunde',
  'Allgemeinerkrankungen mit zahnärztlicher Relevanz',
  'Instrumente und Materialien'
];

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    cards: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          fach: { type: 'STRING' },
          laie: { type: 'STRING' },
          erklaerung: { type: 'STRING' },
          beispielsatz: { type: 'STRING' }
        },
        required: ['fach', 'laie', 'erklaerung', 'beispielsatz']
      }
    }
  },
  required: ['cards']
};

export async function POST(req) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: 'GEMINI_API_KEY sozlanmagan.' }, { status: 500 });

  let body = {};
  try { body = await req.json(); } catch (e) {}
  const count = Math.min(Math.max(parseInt(body.count, 10) || 12, 4), 20);
  const topic = TOPICS.includes(body.topic) ? body.topic : TOPICS[Math.floor(Math.random() * TOPICS.length)];

  const system = `Du bist Prüfer der Fachsprachprüfung Zahnmedizin in Deutschland und erstellst Lernkarten.

Jede Karte trainiert genau die Fähigkeit, die in der FSP geprüft wird: einen Fachbegriff so umzuformulieren, dass ein Patient ohne medizinische Vorbildung ihn versteht.

- "fach": der deutsche Fachbegriff, exakt so wie er in der Klinik verwendet wird (mit Artikel, z. B. "die Pulpitis").
- "laie": wie man es einem Patienten sagt — kurz, in Alltagssprache, ohne Fachwort.
- "erklaerung": ein bis zwei Sätze, was es medizinisch bedeutet. Fachlich präzise.
- "beispielsatz": ein Satz, wie ihn ein Zahnarzt im Patientengespräch tatsächlich sagen würde.

Nimm Begriffe, die in der Prüfung und im Praxisalltag WIRKLICH häufig vorkommen — keine Raritäten.
Alles auf Deutsch. Kein Markdown. Keine Wiederholungen innerhalb der Liste.`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: `Themengebiet: ${topic}\n\nErstelle ${count} Lernkarten.` }] }],
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: {
      maxOutputTokens: 4000, temperature: 1.0,
      responseMimeType: 'application/json', responseSchema: SCHEMA
    }
  };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    const data = await res.json();
    if (!res.ok) return Response.json({ error: data.error?.message || 'Gemini xatosi' }, { status: res.status });
    const out = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
    let r;
    try { r = JSON.parse(out); } catch (e) { return Response.json({ error: 'Javobni o\'qib bo\'lmadi' }, { status: 502 }); }
    const cards = (Array.isArray(r.cards) ? r.cards : [])
      .filter(c => c && c.fach && c.laie)
      .map(c => ({
        fach: String(c.fach).trim(),
        laie: String(c.laie).trim(),
        erklaerung: String(c.erklaerung || '').trim(),
        beispielsatz: String(c.beispielsatz || '').trim()
      }));
    if (!cards.length) return Response.json({ error: 'Keine Karten erstellt' }, { status: 502 });
    return Response.json({ topic, cards });
  } catch (err) {
    return Response.json({ error: 'So\'rov bajarilmadi: ' + err.message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ topics: TOPICS });
}
