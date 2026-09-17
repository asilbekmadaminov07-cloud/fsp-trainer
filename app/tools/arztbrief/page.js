'use client';
import { useState } from 'react';
import { CASES } from '@/lib/cases';
import ToolShell, { Feedback } from '../ToolShell';

const TEMPLATE = `Sehr geehrte Frau Kollegin, sehr geehrter Herr Kollege,

wir berichten über unsere gemeinsame Patientin / unseren gemeinsamen Patienten …

Anamnese:

Befund:

Diagnose:

Therapie und Procedere:

Mit freundlichen kollegialen Grüßen`;

export default function Arztbrief() {
  const [idx, setIdx] = useState(0);
  const [text, setText] = useState(TEMPLATE);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const c = CASES[idx];

  async function grade(){
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/grade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'arztbrief',
          text,
          context: `Patient: ${c.name} (${c.meta})\nKorrekte Diagnose: ${c.diagnosis}\nRöntgenbefund: ${c.imageContent}`
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Bewertung fehlgeschlagen');
      setResult(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <ToolShell
      title="Arztbrief"
      lead="Der schriftliche Teil der FSP. Wählen Sie einen Fall, schreiben Sie den Arztbrief — die Auswertung prüft Struktur, Fachsprache, Vollständigkeit, Grammatik und Stil nach dem Prüfungsraster."
    >
      <div className="panel" style={{ marginBottom: 18 }}>
        <h3>Fall auswählen</h3>
        <select
          value={idx}
          onChange={e => { setIdx(parseInt(e.target.value, 10)); setResult(null); }}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 15 }}
        >
          {CASES.map((x, i) => (
            <option key={x.name} value={i}>{x.name} — {x.meta}</option>
          ))}
        </select>
        <div style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.65, color: 'var(--muted)' }}>
          <b style={{ color: 'var(--ink-2)' }}>Diagnose:</b> {c.diagnosis}<br />
          <b style={{ color: 'var(--ink-2)' }}>Röntgenbefund:</b> {c.imageContent}
        </div>
      </div>

      <textarea className="ta" value={text} onChange={e => setText(e.target.value)} spellCheck="false" />

      <div className="quiz-actions">
        <button className="quiz-btn" onClick={grade} disabled={loading}>
          {loading ? <><span className="spinner" /> Wird bewertet…</> : 'Arztbrief bewerten lassen'}
        </button>
        <button className="quiz-btn ghost" onClick={() => { setText(TEMPLATE); setResult(null); }}>Vorlage zurücksetzen</button>
      </div>

      {error && <p className="error-text">{error}</p>}
      <Feedback result={result} />
    </ToolShell>
  );
}
