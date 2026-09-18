'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ToolShell from '@/app/tools/ToolShell';
import { apiPost } from '@/lib/api';
import { primaryFocus } from '@/lib/learning';
import { supabase } from '@/lib/supabaseClient';

function DailyTraining() {
  const params = useSearchParams();
  const requestedFocus = params.get('focus');
  const [focus, setFocus] = useState(requestedFocus || '');
  const [questions, setQuestions] = useState(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const [league, setLeague] = useState([]);
  const [completedToday, setCompletedToday] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [elapsedMinutes, setElapsedMinutes] = useState(1);
  const startedAt = useRef(null);

  useEffect(() => {
    startedAt.current = Date.now();
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getSession();
      const userId = auth.session?.user?.id;
      if (!userId) return;
      const [{ data: mistakes = [] }, { data: today }, { data: board = [] }] = await Promise.all([
        supabase.from('mistakes').select('topic, case_name, difficulty').eq('user_id', userId).eq('reviewed', false).limit(30),
        supabase.from('daily_training_sessions').select('id, score, points').eq('user_id', userId).eq('training_date', new Date().toISOString().slice(0, 10)).maybeSingle(),
        supabase.from('profiles').select('id, full_name, daily_points').order('daily_points', { ascending: false }).limit(10)
      ]);
      if (!alive) return;
      setCompletedToday(Boolean(today)); setLeague(board || []);
      const chosenFocus = requestedFocus || primaryFocus(mistakes);
      setFocus(chosenFocus);
      try {
        const quiz = await apiPost('/api/daily-quiz', { focus: chosenFocus });
        if (alive) setQuestions(quiz.questions);
      } catch (e) { if (alive) setError(e.message); }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [requestedFocus]);

  function confirm() {
    if (selected === null || revealed) return;
    if (selected === questions[index].correct) setScore(value => value + 1);
    setRevealed(true);
  }

  async function next() {
    if (index + 1 < questions.length) {
      setIndex(value => value + 1); setSelected(null); setRevealed(false); return;
    }
    const finalScore = score;
    setElapsedMinutes(Math.max(1, Math.round((Date.now() - (startedAt.current || Date.now())) / 60000)));
    setDone(true);
    const { data, error: rpcError } = await supabase.rpc('complete_daily_training', {
      p_focus_topic: focus, p_score: finalScore
    });
    if (rpcError) setError('Fortschritt konnte nicht gespeichert werden. Bitte zuerst die neue Datenbank-Migration ausführen.');
    else { setResult(data); setCompletedToday(true); }
  }

  return (
    <ToolShell title="10-Minuten-Training" lead="Eine kurze persönliche Challenge pro Tag. Wissen festigen, Serie halten und in der Liga aufsteigen.">
      <div className="daily-strip">
        <div><span>🔥</span><b>{completedToday ? 'Heute geschafft' : 'Heute offen'}</b><small>Tages-Challenge</small></div>
        <div><span>🎯</span><b>{focus || 'Wird ermittelt'}</b><small>Ihr Schwerpunkt</small></div>
        <div><span>⏱</span><b>10 Minuten</b><small>Kurze Lerneinheit</small></div>
      </div>

      {loading && <div className="coach-loading">Die heutige persönliche Challenge wird erstellt…</div>}
      {!loading && error && !questions && <div className="panel"><p className="error-text">{error}</p></div>}

      {!loading && questions && !done && (() => {
        const q = questions[index];
        return <section className="quiz-box daily-quiz">
          <div className="quiz-head"><span>Aufgabe <b>{index + 1}</b> von 5</span><span>ca. {Math.max(2, 10 - index * 2)} Min.</span></div>
          <div className="quiz-bar"><span style={{ width: `${(index / 5) * 100}%` }} /></div>
          <div className="quiz-topic">{focus}</div><div className="quiz-q">{q.q}</div>
          <div className="quiz-options">{q.options.map((option, i) => {
            let cls = 'quiz-opt';
            if (revealed) cls += i === q.correct ? ' right' : i === selected ? ' wrong' : '';
            else if (i === selected) cls += ' sel';
            return <button className={cls} key={option} disabled={revealed} onClick={() => setSelected(i)}><span className="quiz-letter">{'ABCD'[i]}</span>{option}</button>;
          })}</div>
          {revealed && <div className={'quiz-feedback ' + (selected === q.correct ? 'ok' : 'bad')}><b>{selected === q.correct ? 'Richtig. ' : 'Noch nicht. '}</b>{q.explanation}</div>}
          <div className="quiz-actions">{revealed
            ? <button className="quiz-btn" onClick={next}>{index === 4 ? 'Training abschließen' : 'Weiter'}</button>
            : <button className="quiz-btn" disabled={selected === null} onClick={confirm}>Antwort prüfen</button>}</div>
        </section>;
      })()}

      {done && <section className="daily-result">
        <div className="result-ring"><b>{score}/5</b><span>richtig</span></div>
        <div><span className="eyebrow">TAGESZIEL ERREICHT</span><h2>Stark trainiert!</h2><p>{elapsedMinutes} Minuten · {focus}</p>
          {result?.points > 0 && <div className="reward-toast">+{result.points} Ligapunkte</div>}
          {!result?.first_completion_today && completedToday && <p className="coach-note">Die heutige Belohnung wurde bereits gutgeschrieben.</p>}
          <div className="quiz-actions"><a className="quiz-btn" href="/coach">Zum Lernplan</a>{result?.certificate_unlocked && <a className="quiz-btn ghost" href="/certificate">Zertifikat öffnen</a>}</div>
        </div>
      </section>}

      <section className="panel league-panel"><div className="league-head"><div><span className="eyebrow">WOCHENLIGA</span><h3>FSP Lernliga</h3></div><span>Top 10</span></div>
        <div className="row-list">{league.map((player, i) => <div className="row-item" key={player.id}><span className="rank-nr">{i + 1}.</span><span style={{ flex: 1 }}>{player.full_name || 'Anonym'}</span><b>{player.daily_points || 0} P</b></div>)}</div>
      </section>
    </ToolShell>
  );
}

export default function DailyPage() {
  return <Suspense fallback={null}><DailyTraining /></Suspense>;
}
