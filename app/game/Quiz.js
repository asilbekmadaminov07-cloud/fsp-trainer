'use client';
import { apiRawPost, apiRawGet } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { newAttemptId } from '@/lib/progress';
import { playCorrect, playWrong, playLevelUp } from '@/lib/sound';
import { burstConfetti } from '@/lib/confetti';
import { friendlyError } from '@/lib/errors';
import TiltCard from '@/app/components/TiltCard';
import { useLang } from '@/lib/LanguageContext';

// 20 ta savolli imtihon. Barcha savollar oxirigacha davom etadi — erta
// to'xtamaydi. Oxirida umumiy ball va natija (o'tdi/o'tmadi) ko'rsatiladi.
// O'tish uchun kamida 90% (20 tadan 18 ta) to'g'ri kerak. Server ba'zan
// (kamdan-kam, ikkita paralel so'rovdan biri muvaffaqiyatsiz bo'lsa) 20 tadan
// kamroq savol qaytarishi mumkin — shu sabab chegara doim savollar soniga
// NISBATAN hisoblanadi, qattiq "18" emas.
const PASS_RATIO = 0.9;

export default function Quiz({ currentCase, transcript, onPassed, onClose, onAdvance, userId }) {
  const { t, lang } = useLang();
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(1);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [wrong, setWrong] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [status, setStatus] = useState('running'); // running | passed | failed
  const [awarded, setAwarded] = useState(null);
  const attemptIdRef = useRef(newAttemptId());

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    setQuestions(null);

    async function fetchOnce(){
      const r = await apiRawPost('/api/quiz', {
        caseName: currentCase.name,
        meta: currentCase.meta,
        diagnosis: currentCase.diagnosis,
        difficulty: currentCase.difficulty,
        transcript,
        lang
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const err = new Error(d.error || t('connectionError'));
        err.status = r.status;
        throw err;
      }
      return d;
    }

    // 502/503/504 odatda o'tkinchi (server band yoki vaqt tugagan) — foydalanuvchiga
    // xato ko'rsatishdan oldin sukut bo'yicha bir marta avtomatik qayta urinamiz.
    (async () => {
      try {
        const d = await fetchOnce();
        if (!alive) return;
        setQuestions(d.questions);
        setLoading(false);
      } catch (e) {
        if (!alive) return;
        if (![502, 503, 504].includes(e.status)) { setError(e.message); setLoading(false); return; }
        try {
          const d = await fetchOnce();
          if (!alive) return;
          setQuestions(d.questions);
          setLoading(false);
        } catch (e2) {
          if (!alive) return;
          setError(e2.message);
          setLoading(false);
        }
      }
    })();

    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  // Imtihon tugagach (o'tildi yoki yiqildi), xato javoblarni "Mening xatolarim" ga saqlaymiz.
  useEffect(() => {
    if ((status !== 'passed' && status !== 'failed') || !userId || wrong.length === 0) return;
    supabase.from('mistakes').insert(wrong.map(w => ({
      user_id: userId,
      case_name: currentCase?.name || null,
      difficulty: currentCase?.difficulty || null,
      question: w.q,
      chosen: w.chosen,
      correct: w.correct,
      explanation: w.explanation,
      topic: w.topic || null
    }))).then(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function restart(){
    attemptIdRef.current = newAttemptId();
    setIdx(0); setSelected(null); setRevealed(false);
    setWrong([]); setCorrectCount(0); setStatus('running'); setAwarded(null);
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
    if (selected === q.correct) {
      playCorrect();
      setCorrectCount(c => c + 1);
    } else {
      playWrong();
    }
    if (selected !== q.correct) {
      setWrong(w => [...w, {
        nr: idx + 1,
        q: q.q,
        chosen: q.options[selected],
        correct: q.options[q.correct],
        explanation: q.explanation,
        topic: q.topic
      }]);
    }
  }

  async function finish(){
    const passThreshold = Math.ceil(questions.length * PASS_RATIO);
    const passed = correctCount >= passThreshold;
    if (passed) {
      setStatus('passed');
      const kind = correctCount === questions.length ? 'perfect' : 'pass';
      const r = await onPassed(correctCount, questions.length, attemptIdRef.current, kind);
      setAwarded(r || null);
      if (r?.levelUp) playLevelUp(); else playCorrect();
      burstConfetti();
    } else {
      setStatus('failed');
      playWrong();
    }
  }

  function next(){
    if (idx + 1 >= questions.length) {
      finish();
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
          {t('quizCreating')}
          <span className="quiz-sub">{t('quizCreatingSub')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quiz-box">
        <div className="quiz-head"><b>{t('exam')}</b></div>
        <p className="error-text">{friendlyError(error)}</p>
        <div className="quiz-actions">
          <button className="quiz-btn" onClick={() => setAttempt(a => a + 1)}>{t('retry')}</button>
          <button className="quiz-btn ghost" onClick={onClose}>{t('backToCase')}</button>
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    const score = correctCount;
    const passThreshold = Math.ceil(questions.length * PASS_RATIO);
    return (
      <div className="quiz-box">
        <TiltCard className="quiz-verdict failed" maxDeg={5}>{t('notPassed')} — {score} {t('of')} {questions.length}</TiltCard>
        <p className="quiz-note">
          {t('passNote').replace('{n}', passThreshold).replace('{t}', questions.length)}
        </p>
        <MistakeList wrong={wrong} t={t} />
        <div className="quiz-actions">
          <button className="quiz-btn" onClick={restart}>{t('restart')}</button>
          <button className="quiz-btn ghost" onClick={onClose}>{t('backToCase')}</button>
        </div>
      </div>
    );
  }

  if (status === 'passed') {
    const score = correctCount;
    return (
      <div className="quiz-box">
        <TiltCard className="quiz-verdict passed" maxDeg={5}>{t('passed')} — {score} {t('of')} {questions.length}</TiltCard>
        {awarded && (
          <div className="reward-toast">
            +{awarded.coins} {t('toAccount')} · +{awarded.xp} {t('xpUnit')}
            {awarded.levelUp && <> · <b>{t('levelUp')}: {awarded.title}</b></>}
          </div>
        )}
        {wrong.length > 0 && (
          <>
            <p className="quiz-note">{t('reviewMistakes')}</p>
            <MistakeList wrong={wrong} t={t} />
          </>
        )}
        <div className="quiz-actions">
          <button className="quiz-btn" onClick={onAdvance}>{t('nextStage')}</button>
          <button className="quiz-btn ghost" onClick={onClose}>{t('repeatStage')}</button>
        </div>
      </div>
    );
  }

  const q = questions[idx];

  return (
    <div className="quiz-box">
      <div className="quiz-head">
        <span>{t('question')} <b>{idx + 1}</b> {t('of')} {questions.length}</span>
        <span className="quiz-tally" title="Bisheriges Ergebnis">
          <span className="tally-ok">✓ {correctCount}</span>
          <span className="tally-bad">✗ {wrong.length}</span>
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
          <b>{selected === q.correct ? t('correct') : t('incorrect')}</b> {q.explanation}
        </div>
      )}

      <div className="quiz-actions">
        {!revealed
          ? <button className="quiz-btn" onClick={confirm} disabled={selected === null}>{t('confirmAnswer')}</button>
          : <button className="quiz-btn" onClick={next}>
              {idx + 1 >= questions.length ? t('finishExam') : t('next')}
            </button>}
        <button className="quiz-btn ghost" onClick={onClose}>{t('cancel')}</button>
      </div>
    </div>
  );
}

function MistakeList({ wrong, t }) {
  return (
    <div className="quiz-mistakes">
      {wrong.map((w, i) => (
        <div className="quiz-mistake" key={i}>
          <div className="qm-nr">{t('question')} {w.nr}</div>
          <div className="qm-q">{w.q}</div>
          <div className="qm-line bad">{t('yourAnswer')} {w.chosen}</div>
          <div className="qm-line good">{t('correctWouldBe')} {w.correct}</div>
          <div className="qm-exp">{w.explanation}</div>
          <a
            className="quiz-btn ghost"
            style={{ marginTop: 10, display: 'inline-flex' }}
            href={'/lernen?' + new URLSearchParams({ thema: w.topic || '', frage: w.q, falsch: w.chosen, richtig: w.correct }).toString()}
          >
            {t('deepenTopic')}
          </a>
        </div>
      ))}
    </div>
  );
}
