'use client';
import { useEffect, useState } from 'react';

// 20 ta savolli imtihon.
// Qoida: 3-xato — imtihon tugaydi va boshidan boshlanadi.
// Ya'ni o'tish uchun kamida 18/20 kerak.
const MAX_WRONG = 3;

export default function Quiz({ currentCase, transcript, onPassed, onClose }) {
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(1);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [wrong, setWrong] = useState([]);
  const [status, setStatus] = useState('running'); // running | passed | failed
  const [awarded, setAwarded] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setQuestions(null);
    fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caseName: currentCase.name,
        meta: currentCase.meta,
        diagnosis: currentCase.diagnosis,
        difficulty: currentCase.difficulty,
        transcript
      })
    })
      .then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || 'Fragen konnten nicht geladen werden');
        return d;
      })
      .then(d => {
        if (!alive) return;
        setQuestions(d.questions);
        setLoading(false);
      })
      .catch(e => {
        if (!alive) return;
        setError(e.message);
        setLoading(false);
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  function restart(){
    setIdx(0); setSelected(null); setRevealed(false);
    setWrong([]); setStatus('running'); setAwarded(null);
    setAttempt(a => a + 1);   // yangi savollar yaratiladi
  }

  function choose(i){
    if (revealed) return;
    setSelected(i);
  }

  function confirm(){
    if (selected === null || revealed) return;
    const q = questions[idx];
    setRevealed(true);
    if (selected !== q.correct) {
      const next = [...wrong, {
        nr: idx + 1,
        q: q.q,
        chosen: q.options[selected],
        correct: q.options[q.correct],
        explanation: q.explanation
      }];
      setWrong(next);
      if (next.length >= MAX_WRONG) setStatus('failed');
    }
  }

  async function next(){
    if (status === 'failed') return;
    if (idx + 1 >= questions.length) {
      setStatus('passed');
      const r = await onPassed(questions.length - wrong.length, questions.length);
      setAwarded(r || null);
      return;
    }
    setIdx(idx + 1);
    setSelected(null);
    setRevealed(false);
  }

  if (loading) {
    return (
      <div className="quiz-box">
        <div className="quiz-loading">
          Die Prüfungsfragen werden für diesen Fall erstellt…
          <span className="quiz-sub">Sie werden jedes Mal neu generiert.</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-box">
        <div className="quiz-head"><b>Prüfung</b></div>
        <p className="error-text">{error}</p>
        <div className="quiz-actions">
          <button className="quiz-btn" onClick={() => setAttempt(a => a + 1)}>Erneut versuchen</button>
          <button className="quiz-btn ghost" onClick={onClose}>Zurück zum Fall</button>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="quiz-box">
        <div className="quiz-verdict failed">Nicht bestanden — {MAX_WRONG} Fehler</div>
        <p className="quiz-note">
          Die Prüfung endet nach {MAX_WRONG} Fehlern. Sie müssen von vorne beginnen —
          mit neuen Fragen. Lesen Sie zuerst, was schiefgelaufen ist:
        </p>
        <MistakeList wrong={wrong} />
        <div className="quiz-actions">
          <button className="quiz-btn" onClick={restart}>Von vorne beginnen</button>
          <button className="quiz-btn ghost" onClick={onClose}>Zurück zum Fall</button>
        </div>
      </div>
    );
  }

  if (status === 'passed') {
    const score = questions.length - wrong.length;
    return (
      <div className="quiz-box">
        <div className="quiz-verdict passed">Bestanden — {score} von {questions.length}</div>
        {awarded && (
          <div className="reward-toast">
            +{awarded.coins} zum Praxiskonto · +{awarded.xp} Erfahrung
            {awarded.levelUp && <> · <b>Aufstieg: {awarded.title}</b></>}
          </div>
        )}
        {wrong.length > 0 && (
          <>
            <p className="quiz-note">Diese Punkte sollten Sie sich trotzdem ansehen:</p>
            <MistakeList wrong={wrong} />
          </>
        )}
        <div className="quiz-actions">
          <button className="quiz-btn" onClick={onClose}>Nächster Patient</button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const lives = MAX_WRONG - wrong.length;

  return (
    <div className="quiz-box">
      <div className="quiz-head">
        <span>Frage <b>{idx + 1}</b> von {questions.length}</span>
        <span className="quiz-lives" title="Verbleibende Fehler">
          {'●'.repeat(lives)}{'○'.repeat(MAX_WRONG - lives)}
        </span>
      </div>

      <div className="quiz-bar"><span style={{ width: ((idx) / questions.length * 100) + '%' }} /></div>

      {q.topic && <div className="quiz-topic">{q.topic}</div>}
      <div className="quiz-q">{q.q}</div>

      <div className="quiz-options">
        {q.options.map((o, i) => {
          let cls = 'quiz-opt';
          if (revealed) {
            if (i === q.correct) cls += ' right';
            else if (i === selected) cls += ' wrong';
          } else if (i === selected) cls += ' sel';
          return (
            <button key={i} className={cls} onClick={() => choose(i)} disabled={revealed}>
              <span className="quiz-letter">{'ABCD'[i]}</span>{o}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div className={'quiz-feedback ' + (selected === q.correct ? 'ok' : 'bad')}>
          <b>{selected === q.correct ? 'Richtig.' : 'Falsch.'}</b> {q.explanation}
        </div>
      )}

      <div className="quiz-actions">
        {!revealed
          ? <button className="quiz-btn" onClick={confirm} disabled={selected === null}>Antwort bestätigen</button>
          : <button className="quiz-btn" onClick={next}>
              {idx + 1 >= questions.length ? 'Prüfung abschließen' : 'Weiter'}
            </button>}
        <button className="quiz-btn ghost" onClick={onClose}>Abbrechen</button>
      </div>
    </div>
  );
}

function MistakeList({ wrong }) {
  return (
    <div className="quiz-mistakes">
      {wrong.map((w, i) => (
        <div className="quiz-mistake" key={i}>
          <div className="qm-nr">Frage {w.nr}</div>
          <div className="qm-q">{w.q}</div>
          <div className="qm-line bad">Ihre Antwort: {w.chosen}</div>
          <div className="qm-line good">Richtig wäre: {w.correct}</div>
          <div className="qm-exp">{w.explanation}</div>
        </div>
      ))}
    </div>
  );
}
