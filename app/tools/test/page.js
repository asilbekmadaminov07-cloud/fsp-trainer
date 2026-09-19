'use client';
import { apiRawPost } from '@/lib/api';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ToolShell from '../ToolShell';
import { awardProgress, newAttemptId } from '@/lib/progress';
import { playCorrect, playWrong } from '@/lib/sound';
import { burstConfetti } from '@/lib/confetti';
import { friendlyError } from '@/lib/errors';

const REWARD_PER_CORRECT = { xp: 8, coins: 4 };

// Testmodus: bemor holatisiz, tez multiple-choice tekshiruv. Har so'rov —
// yangi, tasodifiy mavzular bilan yaratilgan savollar to'plami.
export default function TestMode(){
  const [userId, setUserId] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [wrong, setWrong] = useState([]);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attemptId, setAttemptId] = useState(() => newAttemptId());

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setUserId(data.session.user.id);
    });
    load();

  }, []);

  function load(){
    setLoading(true); setError(''); setQuestions(null);
    setIdx(0); setSelected(null); setRevealed(false); setWrong([]); setDone(false); setSaved(false);
    setAttemptId(newAttemptId());
    apiRawPost('/api/test-quiz')
      .then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || 'Fragen konnten nicht geladen werden');
        return d;
      })
      .then(d => { setQuestions(d.questions); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }

  function choose(i){ if (!revealed) setSelected(i); }

  function confirm(){
    if (selected === null || revealed) return;
    const q = questions[idx];
    setRevealed(true);
    if (selected === q.correct) playCorrect(); else playWrong();
    if (selected !== q.correct) {
      setWrong(w => [...w, {
        nr: idx + 1, q: q.q, chosen: q.options[selected], correct: q.options[q.correct], explanation: q.explanation, topic: q.topic
      }]);
    }
  }

  async function next(){
    if (idx + 1 >= questions.length) {
      setDone(true);
      const correctCount = questions.length - wrong.length;
      if (userId && correctCount > 0) {
        await awardProgress('test:correct', attemptId, correctCount);
      }
      if (correctCount === questions.length) burstConfetti();
      return;
    }
    setIdx(idx + 1); setSelected(null); setRevealed(false);
  }

  // Test tugagach xatolarni "Mening xatolarim"ga saqlaymiz
  useEffect(() => {
    if (!done || saved || !userId || wrong.length === 0) return;
    setSaved(true);
    supabase.from('mistakes').insert(wrong.map(w => ({
      user_id: userId, case_name: null, difficulty: 'test',
      question: w.q, chosen: w.chosen, correct: w.correct, explanation: w.explanation, topic: w.topic || null
    }))).then(() => {});
  }, [done, saved, userId, wrong]);

  return (
    <ToolShell title="Testmodus" lead="Schnelle Multiple-Choice-Runde über alle FSP-Themen — Fachbegriffe, Anamnese, Notfälle, Arztbrief. Jede Runde ist neu und zufällig.">
      {loading && (
        <div className="quiz-box">
          <div className="quiz-loading">Fragen werden erstellt… <span className="quiz-sub">Jede Runde ist anders.</span></div>
        </div>
      )}

      {!loading && error && (
        <div className="quiz-box">
          <p className="error-text">{friendlyError(error)}</p>
          <div className="quiz-actions"><button className="quiz-btn" onClick={load}>Erneut versuchen</button></div>
        </div>
      )}

      {!loading && !error && questions && !done && (() => {
        const q = questions[idx];
        return (
          <div className="quiz-box">
            <div className="quiz-head">
              <span>Frage <b>{idx + 1}</b> von {questions.length}</span>
            </div>
            <div className="quiz-bar"><span style={{ width: (idx / questions.length * 100) + '%' }} /></div>
            {q.topic && <div className="quiz-topic">{q.topic}</div>}
            <div className="quiz-q">{q.q}</div>
            <div className="quiz-options">
              {q.options.map((o, i) => {
                let cls = 'quiz-opt';
                if (revealed) { if (i === q.correct) cls += ' right'; else if (i === selected) cls += ' wrong'; }
                else if (i === selected) cls += ' sel';
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
                : <button className="quiz-btn" onClick={next}>{idx + 1 >= questions.length ? 'Test abschließen' : 'Weiter'}</button>}
            </div>
          </div>
        );
      })()}

      {!loading && !error && done && (
        <div className="quiz-box">
          <div className="quiz-verdict passed">Fertig — {questions.length - wrong.length} von {questions.length} richtig</div>
          {questions.length - wrong.length > 0 && (
            <div className="reward-toast">
              +{(questions.length - wrong.length) * REWARD_PER_CORRECT.coins} zum Praxiskonto · +{(questions.length - wrong.length) * REWARD_PER_CORRECT.xp} Erfahrung
            </div>
          )}
          {wrong.length > 0 && (
            <>
              <p className="quiz-note" style={{ marginTop: 14 }}>Diese Fragen finden Sie auch unter „Meine Fehler":</p>
              <div className="quiz-mistakes">
                {wrong.map((w, i) => (
                  <div className="quiz-mistake" key={i}>
                    <div className="qm-nr">Frage {w.nr}</div>
                    <div className="qm-q">{w.q}</div>
                    <div className="qm-line bad">Ihre Antwort: {w.chosen}</div>
                    <div className="qm-line good">Richtig wäre: {w.correct}</div>
                    <div className="qm-exp">{w.explanation}</div>
                    <a
                      className="quiz-btn ghost"
                      style={{ marginTop: 10, display: 'inline-flex' }}
                      href={'/lernen?' + new URLSearchParams({ thema: w.topic || 'Testmodus', frage: w.q, falsch: w.chosen, richtig: w.correct }).toString()}
                    >
                      Thema vertiefen →
                    </a>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="quiz-actions" style={{ marginTop: 16 }}>
            <button className="quiz-btn" onClick={load}>Neue Runde</button>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
