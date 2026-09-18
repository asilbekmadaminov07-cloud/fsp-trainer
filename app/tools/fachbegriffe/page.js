'use client';
import { apiRawPost, apiRawGet } from '@/lib/api';
import { useEffect, useState } from 'react';
import ToolShell from '../ToolShell';

// Fachbegriff ↔ Laiensprache. 3D aylanadigan kartalar.
export default function Fachbegriffe() {
  const [topics, setTopics] = useState([]);
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState([]);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [known, setKnown] = useState(0);

  useEffect(() => {
    apiRawGet('/api/vokabel').then(r => r.json()).then(d => setTopics(d.topics || [])).catch(() => {});
    load('');

  }, []);

  async function load(t){
    setLoading(true); setError(''); setCards([]); setI(0); setFlipped(false); setKnown(0);
    try {
      const res = await apiRawPost('/api/vokabel', { topic: t || undefined, count: 12 });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Karten konnten nicht geladen werden');
      setCards(d.cards); setTopic(d.topic || t);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  function advance(wasKnown){
    if (wasKnown) setKnown(k => k + 1);
    setFlipped(false);
    setTimeout(() => setI(x => x + 1), 180);
  }

  const c = cards[i];
  const done = cards.length > 0 && i >= cards.length;

  return (
    <ToolShell
      title="Fachbegriffe"
      lead="Die Kernfähigkeit der FSP: einen Fachbegriff so erklären, dass ein Patient ihn versteht. Karte antippen zum Umdrehen."
    >
      <div className="panel" style={{ marginBottom: 18, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={topic}
          onChange={e => load(e.target.value)}
          style={{ flex: 1, minWidth: 210, padding: '11px 13px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 14.5 }}
        >
          <option value="">Zufälliges Themengebiet</option>
          {topics.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button className="quiz-btn ghost" onClick={() => load(topic)} disabled={loading}>Neue Karten</button>
      </div>

      {loading && <div className="quiz-loading">Karten werden erstellt…<span className="quiz-sub">Jedes Mal ein neuer Satz.</span></div>}
      {error && <p className="error-text">{error}</p>}

      {!loading && c && (
        <>
          <div className="quiz-head">
            <span>Karte <b>{i + 1}</b> von {cards.length}</span>
            <span>{known} gewusst</span>
          </div>
          <div className="quiz-bar"><span style={{ width: (i / cards.length * 100) + '%' }} /></div>

          <div className={'flip' + (flipped ? ' on' : '')} onClick={() => setFlipped(f => !f)} style={{ cursor: 'pointer' }}>
            <div className="flip-inner">
              <div className="flip-face">
                <div className="flip-term">{c.fach}</div>
                <div className="flip-hint">Wie sagen Sie das einem Patienten? — Tippen zum Umdrehen</div>
              </div>
              <div className="flip-face back">
                <div className="flip-term" style={{ fontSize: 21 }}>{c.laie}</div>
                <div className="flip-body">{c.erklaerung}</div>
                {c.beispielsatz && (
                  <div className="flip-body" style={{ fontStyle: 'italic', color: 'var(--muted)', fontSize: 14 }}>
                    „{c.beispielsatz}"
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="quiz-actions">
            <button className="quiz-btn" onClick={() => advance(true)}>Gewusst</button>
            <button className="quiz-btn ghost" onClick={() => advance(false)}>Nochmal üben</button>
          </div>
        </>
      )}

      {done && (
        <div className="fb-block">
          <div className="quiz-verdict passed">{known} von {cards.length} gewusst</div>
          <p className="quiz-note">Die nächsten Karten sind wieder neu — dieselben Begriffe kommen nicht garantiert wieder.</p>
          <div className="quiz-actions">
            <button className="quiz-btn" onClick={() => load(topic)}>Neue Karten</button>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
