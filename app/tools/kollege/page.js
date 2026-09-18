'use client';
import { apiRawPost, apiRawGet } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { CASES } from '@/lib/cases';
import ToolShell from '../ToolShell';

// FSP 3-qism: Arzt-Arzt-Gespräch. Hamkasbga holatni topshirish.
// Hamkasb passiv emas — savol beradi, e'tiroz bildiradi, aniqlik talab qiladi.
function systemFor(c){
  return `Du spielst Dr. Hoffmann, Oberarzt/Oberärztin einer zahnärztlichen Klinik in Deutschland. Ein Kollege stellt dir einen Fall vor (Arzt-Arzt-Gespräch, dritter Teil der Fachsprachprüfung).

DER FALL, den der Kollege vorstellen soll:
Patient: ${c.name} (${c.meta})
Diagnose: ${c.diagnosis}
Röntgenbefund: ${c.imageContent}

DEINE ROLLE:
- Du bist kollegial, aber fordernd. Du hörst zu und hakst nach.
- Du erwartest FACHSPRACHE. Wenn der Kollege Laiensprache benutzt ("das Loch im Zahn", "die Wurzel ist entzündet"), frage freundlich nach dem Fachbegriff.
- Wenn eine wichtige Information fehlt (Anamnese, Vorerkrankungen, Medikation, Allergien, Befund, Therapieplan), frage gezielt danach — nenne dabei NICHT die Antwort.
- Wenn etwas fachlich falsch ist, widersprich sachlich und begründe.
- Stelle nur EINE Frage pro Antwort. Kurz halten: 1-3 Sätze.
- Wenn der Fall vollständig und korrekt vorgestellt wurde, fasse in zwei Sätzen zusammen und sage ausdrücklich: "Damit ist die Fallvorstellung vollständig."

Antworte NUR auf Deutsch, in kollegialem Klinikton. Kein Markdown.`;
}

export default function Kollege() {
  const [idx, setIdx] = useState(0);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);
  const c = CASES[idx];

  useEffect(() => { reset(idx); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [history]);

  function reset(i){
    setIdx(i);
    setHistory([{ role: 'assistant', content: 'Guten Morgen, Kollege. Sie wollten mir einen Fall vorstellen — bitte, ich höre.' }]);
    setInput('');
  }

  async function send(){
    const t = input.trim();
    if (!t || sending) return;
    setInput('');
    const next = [...history, { role: 'user', content: t }];
    setHistory(next);
    setSending(true);
    try {
      const res = await apiRawPost('/api/chat', { system: systemFor(c), messages: next, maxTokens: 300 });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Fehler');
      setHistory(h => [...h, { role: 'assistant', content: d.text || '…' }]);
    } catch (e) {
      setHistory(h => [...h, { role: 'assistant', content: '[Verbindungsfehler — bitte erneut versuchen]' }]);
    }
    setSending(false);
  }

  return (
    <ToolShell
      title="Arzt-Arzt-Gespräch"
      lead="Der dritte Teil der FSP. Stellen Sie Dr. Hoffmann den Fall vor — strukturiert und in Fachsprache. Er hakt nach, sobald etwas fehlt oder zu umgangssprachlich klingt."
    >
      <div className="panel" style={{ marginBottom: 18 }}>
        <h3>Fall, den Sie vorstellen</h3>
        <select
          value={idx}
          onChange={e => reset(parseInt(e.target.value, 10))}
          style={{ width: '100%', padding: '12px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 15 }}
        >
          {CASES.map((x, i) => <option key={x.name} value={i}>{x.name} — {x.meta}</option>)}
        </select>
        <div style={{ marginTop: 14, fontSize: 13.5, lineHeight: 1.65, color: 'var(--muted)' }}>
          <b style={{ color: 'var(--ink-2)' }}>Diagnose:</b> {c.diagnosis}<br />
          <b style={{ color: 'var(--ink-2)' }}>Röntgenbefund:</b> {c.imageContent}
        </div>
      </div>

      <div className="casefile">
        <div className="cf-head">
          <div className="cf-patient">
            <div className="cf-avatar">H</div>
            <div>
              <div className="cf-name">Dr. Hoffmann</div>
              <div className="cf-meta"><span>Oberarzt · Fallübergabe</span></div>
            </div>
          </div>
          <button className="next-case-btn" onClick={() => reset(idx)}>Gespräch neu beginnen</button>
        </div>

        <div className="cf-body" ref={bodyRef}>
          {history.map((m, i) => (
            <div className={'msg ' + (m.role === 'assistant' ? 'patient' : 'doctor')} key={i}>{m.content}</div>
          ))}
        </div>

        <div className="cf-input">
          <input
            placeholder="Stellen Sie den Fall vor…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
          />
          <button onClick={send} disabled={sending}>Senden</button>
        </div>
      </div>
    </ToolShell>
  );
}
