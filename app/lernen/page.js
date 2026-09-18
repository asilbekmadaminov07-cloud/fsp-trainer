'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiPost } from '@/lib/api';

const SYSTEM = `Du bist Dozent für die Fachsprachprüfung Zahnmedizin in Deutschland.

Ein Kandidat hat eine Prüfungsfrage falsch beantwortet. Er kommt jetzt zu dir, um genau dieses Thema zu verstehen — nicht um die Antwort auswendig zu lernen.

Baue die Erklärung so auf:
1. WORUM ES GEHT — zwei bis drei Sätze, was dieses Thema klinisch bedeutet.
2. DER DENKFEHLER — warum der Kandidat auf die falsche Antwort gekommen ist. Sei konkret: welche Verwechslung liegt nahe.
3. WIE MAN ES RICHTIG ABLEITET — der Gedankengang Schritt für Schritt, so wie ein Prüfer ihn hören will.
4. MERKSATZ — ein Satz, den man sich merkt und der in der Prüfung trägt.
5. DAS FRAGT DIE PRÜFUNG DAZU — zwei bis drei typische Nachfragen samt kurzer Musterantwort.

Schreibe in klarem, ruhigem Deutsch. Fachbegriffe verwendest du, erklärst sie aber beim ersten Mal.
Kein Markdown, keine Sternchen, keine Aufzählungszeichen — nur Absätze. Beginne jeden Abschnitt mit der Überschrift in Großbuchstaben und einem Doppelpunkt.`;

function Inner() {
  const params = useSearchParams();
  const thema = params.get('thema') || '';
  const frage = params.get('frage') || '';
  const falsch = params.get('falsch') || '';
  const richtig = params.get('richtig') || '';

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const prompt = [
      thema ? 'Themenbereich: ' + thema : '',
      frage ? 'Prüfungsfrage: ' + frage : '',
      falsch ? 'Der Kandidat hat geantwortet: ' + falsch : '',
      richtig ? 'Richtig gewesen wäre: ' + richtig : '',
      '',
      'Erkläre dieses Thema so, dass der Kandidat es beim nächsten Mal selbst herleiten kann.'
    ].filter(Boolean).join('\n');

    apiPost('/api/chat', { system: SYSTEM, messages: [{ role: 'user', content: prompt }], maxTokens: 1400 })
      .then(d => { if (alive) { setText(d.text || ''); setLoading(false); } })
      .catch(e => { if (alive) { setError(e.message); setLoading(false); } });
    return () => { alive = false; };
  }, [thema, frage, falsch, richtig]);

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <a href="/home" className="brand-mark">FSP<span style={{ color: 'var(--brand)' }}>.</span>Trainer</a>
        </div>
      </div>
      <div className="tool-shell">
        <a href="/game" className="back-link">← Zurück zur Prüfung</a>
        <div className="tool-head">
          <h1>Thema verstehen</h1>
          {thema && <p>{thema}</p>}
        </div>

        {frage && (
          <div className="quiz-mistake" style={{ marginBottom: 18 }}>
            <div className="qm-nr">Die Frage</div>
            <div className="qm-q">{frage}</div>
            {falsch && <div className="qm-line bad">Ihre Antwort: {falsch}</div>}
            {richtig && <div className="qm-line good">Richtig: {richtig}</div>}
          </div>
        )}

        {loading && <div className="quiz-loading">Die Erklärung wird vorbereitet…<span className="quiz-sub">Auf genau diesen Fehler zugeschnitten.</span></div>}
        {error && <p className="error-text">{error}</p>}

        {text && (
          <div className="fb-block lesson">
            {text.split('\n').filter(Boolean).map((para, i) => {
              const m = para.match(/^([A-ZÄÖÜ\s]{4,}):\s*(.*)$/);
              if (m) return <div key={i}><h3>{m[1].trim()}</h3><p>{m[2]}</p></div>;
              return <p key={i}>{para}</p>;
            })}
          </div>
        )}

        <div className="quiz-actions">
          <a className="quiz-btn" href="/game">Zurück zur Prüfung</a>
          <a className="quiz-btn ghost" href="/home">Übersicht</a>
        </div>
      </div>
    </>
  );
}

export default function Lernen() {
  return <Suspense fallback={null}><Inner /></Suspense>;
}
