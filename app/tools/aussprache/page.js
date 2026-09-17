'use client';
import { useEffect, useState } from 'react';
import { speakNatural, unlockAudio, hasRecorder, startRecording, transcribeAudio } from '@/lib/voice';
import ToolShell from '../ToolShell';

// Talaffuz mashqi: jumla ovoz bilan o'qiladi, foydalanuvchi takrorlaydi,
// yozuv matnga aylantiriladi va so'zma-so'z solishtiriladi.

const SETS = {
  'Anamnese-Fragen': [
    'Seit wann haben Sie diese Beschwerden?',
    'Strahlt der Schmerz irgendwohin aus?',
    'Nehmen Sie regelmäßig Medikamente ein?',
    'Sind bei Ihnen Allergien bekannt?',
    'Wurden Sie schon einmal am Herzen operiert?',
    'Hatten Sie in letzter Zeit Fieber oder eine Schwellung?'
  ],
  'Befund erklären': [
    'Auf dem Röntgenbild sehe ich eine Aufhellung an der Wurzelspitze.',
    'Der Zahnnerv ist entzündet und lässt sich nicht mehr beruhigen.',
    'Der Knochen um den Zahn herum hat sich zurückgebildet.',
    'Der Weisheitszahn liegt schräg und ist nur teilweise durchgebrochen.',
    'Die Karies reicht bis nahe an das Zahnmark heran.'
  ],
  'Fachbegriffe': [
    'irreversible Pulpitis',
    'apikale Parodontitis',
    'medikamentenassoziierte Kiefernekrose',
    'Wurzelkanalbehandlung',
    'Perikoronitis bei teilretiniertem Weisheitszahn',
    'generalisierter horizontaler Knochenabbau'
  ]
};

function normalize(s){
  return String(s || '').toLowerCase()
    .replace(/[.,;:!?„"'()-]/g, ' ')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ')
    .trim();
}

// So'zlarni solishtirish — qaysi so'z tushib qolgan yoki noto'g'ri aytilgan
function compare(target, said){
  const t = normalize(target).split(' ').filter(Boolean);
  const s = normalize(said).split(' ').filter(Boolean);
  const pool = [...s];
  const marks = t.map(w => {
    const at = pool.indexOf(w);
    if (at >= 0) { pool.splice(at, 1); return { w, ok: true }; }
    return { w, ok: false };
  });
  const hit = marks.filter(m => m.ok).length;
  return { marks, score: t.length ? Math.round(hit / t.length * 100) : 0, extra: pool };
}

export default function Aussprache() {
  const [setName, setSetName] = useState(Object.keys(SETS)[0]);
  const [i, setI] = useState(0);
  const [supported, setSupported] = useState(true);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');
  const [res, setRes] = useState(null);
  const [error, setError] = useState('');
  const [rec, setRec] = useState(null);

  useEffect(() => { setSupported(hasRecorder()); }, []);

  const list = SETS[setName];
  const target = list[i % list.length];

  function listen(){
    unlockAudio();
    speakNatural(target);
  }

  async function toggle(){
    setError('');
    if (recording) {
      const r = rec; setRec(null); setRecording(false);
      if (!r) return;
      setBusy(true);
      try {
        const payload = await r.stop();
        const text = await transcribeAudio(payload);
        setSaid(text);
        setRes(compare(target, text));
      } catch (e) { setError('Aufnahme konnte nicht ausgewertet werden.'); }
      setBusy(false);
      return;
    }
    unlockAudio();
    try {
      setRec(await startRecording());
      setRecording(true);
      setSaid(''); setRes(null);
    } catch (e) { setError('Kein Mikrofonzugriff. Bitte in den Einstellungen erlauben.'); }
  }

  function next(){
    setI(x => x + 1); setSaid(''); setRes(null); setError('');
  }

  return (
    <ToolShell
      title="Aussprache"
      lead="Hören, nachsprechen, vergleichen. Die Aufnahme wird in Text umgewandelt und Wort für Wort gegen den Sollsatz geprüft — Sie sehen genau, welches Wort nicht angekommen ist."
    >
      <div className="panel" style={{ marginBottom: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={setName}
          onChange={e => { setSetName(e.target.value); setI(0); setSaid(''); setRes(null); }}
          style={{ flex: 1, minWidth: 200, padding: '11px 13px', borderRadius: 'var(--r-sm)', border: '1px solid var(--line)', background: 'var(--surface)', fontSize: 14.5 }}
        >
          {Object.keys(SETS).map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <span className="score-pill">{(i % list.length) + 1} / {list.length}</span>
      </div>

      <div className="flip-face" style={{ position: 'static', minHeight: 150 }}>
        {!res && <div className="flip-term" style={{ fontSize: 22, lineHeight: 1.35 }}>{target}</div>}
        {res && (
          <div className="flip-term" style={{ fontSize: 22, lineHeight: 1.5, display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
            {res.marks.map((m, k) => (
              <span key={k} style={{
                color: m.ok ? 'var(--easy)' : 'var(--mark)',
                borderBottom: m.ok ? 'none' : '2px solid var(--mark)'
              }}>{m.w}</span>
            ))}
          </div>
        )}
        {res && <div className={'score-pill ' + (res.score >= 85 ? 'good' : res.score >= 60 ? 'mid' : 'bad')}>{res.score}% erkannt</div>}
        {said && <div className="flip-body" style={{ fontSize: 13.5, color: 'var(--muted)' }}>Verstanden: „{said}"</div>}
      </div>

      <div className="quiz-actions">
        <button className="quiz-btn ghost" onClick={listen}>🔊 Vorsprechen lassen</button>
        {supported && (
          <button className={'quiz-btn' + (recording ? ' ghost' : '')} onClick={toggle} disabled={busy}>
            {busy ? <><span className="spinner" /> Wird ausgewertet…</> : recording ? '⏹ Aufnahme beenden' : '🎤 Nachsprechen'}
          </button>
        )}
        <button className="quiz-btn ghost" onClick={next}>Nächster Satz</button>
      </div>

      {!supported && <p className="error-text">Dieses Gerät unterstützt keine Aufnahme. Das Vorsprechen funktioniert trotzdem.</p>}
      {error && <p className="error-text">{error}</p>}

      {res && res.extra.length > 0 && (
        <div className="fb-block">
          <h4>Zusätzlich gesagt</h4>
          <p style={{ fontSize: 14 }}>{res.extra.join(', ')}</p>
        </div>
      )}
    </ToolShell>
  );
}
