'use client';
import { apiRawPost, apiRawGet } from '@/lib/api';
import { useEffect, useState } from 'react';
import { verifiedFindings } from '@/lib/findings';
import ToolShell, { Feedback } from '../ToolShell';

// Rentgen o'qish mashqi: rasm ko'rsatiladi, foydalanuvchi nemis tilida Befund
// yozadi, AI uni kutubxonadagi to'g'ri Befund bilan solishtiradi.
export default function BefundTrainer() {
  const [pool] = useState(() => verifiedFindings());
  const [cur, setCur] = useState(null);
  const [img, setImg] = useState(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { next(); /* eslint-disable-next-line */ }, []);

  function next(){
    if (!pool.length) return;
    const f = pool[Math.floor(Math.random() * pool.length)];
    setCur(f); setText(''); setResult(null); setError(''); setImg(null);
    apiRawGet('/api/case-image?file=' + encodeURIComponent(f.file))
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Bild nicht verfügbar')))
      .then(setImg)
      .catch(() => setImg({ error: true }));
  }

  async function grade(){
    if (!cur) return;
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await apiRawPost('/api/grade', { task: 'befund', text, context: cur.befund });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Bewertung fehlgeschlagen');
      setResult(d);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  if (!pool.length) {
    return (
      <ToolShell title="Befund-Training" lead="Röntgenbilder befunden.">
        <div className="panel"><p style={{ color: 'var(--muted)' }}>Noch keine geprüften Röntgenbefunde in der Bibliothek.</p></div>
      </ToolShell>
    );
  }

  return (
    <ToolShell
      title="Befund-Training"
      lead="Ein echtes Röntgenbild, keine Vorgaben. Beschreiben Sie den Befund in Fachsprache — so, wie Sie es in der Prüfung sagen würden. Die Auswertung vergleicht Ihre Beschreibung mit dem tatsächlichen Befund."
    >
      <div className="panel" style={{ marginBottom: 18 }}>
        {!img && <div className="img-frame img-loading">Röntgenbild wird geladen…</div>}
        {img && img.error && <div className="img-frame img-loading">Bild derzeit nicht verfügbar.</div>}
        {img && !img.error && (
          <>
            <div className="img-frame"><img src={img.url} alt="Röntgenbild" /></div>
            <div className="img-credit">
              {img.artist ? img.artist + ' · ' : ''}{img.license}
              {img.source && <> · <a href={img.source} target="_blank" rel="noreferrer">Quelle</a></>}
            </div>
          </>
        )}
      </div>

      <textarea
        className="ta"
        style={{ minHeight: 150 }}
        placeholder="z. B. Periapikale Aufhellung an der Wurzelspitze des zweiten unteren Molaren…"
        value={text}
        onChange={e => setText(e.target.value)}
      />

      <div className="quiz-actions">
        <button className="quiz-btn" onClick={grade} disabled={loading || text.trim().length < 10}>
          {loading ? <><span className="spinner" /> Wird bewertet…</> : 'Befund bewerten lassen'}
        </button>
        <button className="quiz-btn ghost" onClick={next}>Nächstes Bild</button>
      </div>

      {error && <p className="error-text">{error}</p>}
      <Feedback result={result} />

      {result && (
        <div className="fb-block" style={{ marginTop: 14 }}>
          <h4>Tatsächlicher Befund aus der Bibliothek</h4>
          <p style={{ fontSize: 14, lineHeight: 1.65 }}>{cur.befund}</p>
        </div>
      )}
    </ToolShell>
  );
}
