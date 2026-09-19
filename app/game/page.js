'use client';
import { apiRawPost, apiRawGet } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CASES, DIFFS, DIFF_REWARDS, IMAGES, COMMON_PATIENT_INSTRUCTIONS } from '@/lib/cases';
import { levelFromXp, careerStage } from '@/lib/career';
import { touchPracticeDay } from '@/lib/practice';
import { awardProgress, newAttemptId } from '@/lib/progress';
import { playCorrect, playWrong } from '@/lib/sound';
import { burstConfetti } from '@/lib/confetti';
import Header from '@/app/components/Header';
import TiltCard from '@/app/components/TiltCard';
import ToothChart from '@/app/components/ToothChart';
import { ToolSkeleton } from '@/app/components/Skeleton';
import {
  speakNatural, stopSpeaking, pickVoice,
  unlockAudio, hasSpeechRecognition, hasRecorder, startRecording, transcribeAudio
} from '@/lib/voice';
import Quiz from './Quiz';

// Befund rasmi: agar holatga Commons fayli biriktirilgan bo'lsa, uni jonli olib keladi
// (atribut bilan — CC litsenziyasi talabi). Aks holda sxematik SVG chizma ko'rsatiladi.
function CaseImage({ imageKey, commonsFile }) {
  const [info, setInfo] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!commonsFile) { setFailed(true); return; }
    let alive = true;
    setInfo(null);
    setFailed(false);
    apiRawGet('/api/case-image?file=' + encodeURIComponent(commonsFile))
      .then(r => r.ok ? r.json() : Promise.reject(new Error('nicht verfügbar')))
      .then(d => { if (alive) setInfo(d); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [commonsFile]);

  if (failed || (!info && !commonsFile)) {
    return (
      <TiltCard className="img-frame" maxDeg={8} dangerouslySetInnerHTML={{ __html: IMAGES[imageKey] || '' }} />
    );
  }
  if (!info) {
    return <div className="img-frame img-loading">Befundbild wird geladen…</div>;
  }
  return (
    <>
      <TiltCard className="img-frame" maxDeg={8}>
        <img src={info.url} alt="Befundbild" onError={() => setFailed(true)} />
      </TiltCard>
      <div className="img-credit">
        {info.artist ? info.artist + ' · ' : ''}{info.license}
        {info.full && <> · <a href={info.full} target="_blank" rel="noreferrer">Röntgen vergrößern</a></>}
        {info.source && <> · <a href={info.source} target="_blank" rel="noreferrer">Quelle</a></>}
      </div>
    </>
  );
}

export default function Game() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [currentDiff, setCurrentDiff] = useState('leicht');
  const [currentCaseIdx, setCurrentCaseIdx] = useState(0);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [diagInput, setDiagInput] = useState('');
  const [diagError, setDiagError] = useState(false);
  const [showTeeth, setShowTeeth] = useState(false);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [evalResult, setEvalResult] = useState(null);
  const [evalLoading, setEvalLoading] = useState(false);

  const [voiceActive, setVoiceActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  // 'sr'  — uzluksiz nutq-tanish (Chrome/Edge, kompyuter va Android)
  // 'ptt' — tugmani bosib gapirish: ovoz yozib olinib, serverda matnga aylantiriladi (iPhone/iOS, Safari)
  // 'none'— ovoz umuman ishlamaydi, faqat matn
  const [voiceMode, setVoiceMode] = useState('sr');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [aiCase, setAiCase] = useState(null);      // Gemini yaratgan holat
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const bodyRef = useRef(null);
  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const activeRef = useRef(false);   // foydalanuvchi uzluksiz rejimni yoqganmi
  const busyRef = useRef(false);     // hozir bir "navbat" qayta ishlanyaptimi (javob kutish/gapirish)
  const stateRef = useRef({});       // eng so'nggi state'ga callback ichidan kirish uchun
  const caseVoiceRef = useRef(pickVoice());
  const seenRef = useRef({});    // har daraja uchun allaqachon ko'rilgan holatlar
  const diagnosisAttemptRef = useRef(newAttemptId());

  const casesForDiff = CASES.filter(c => c.difficulty === currentDiff);
  const currentCase = aiCase || casesForDiff[currentCaseIdx] || casesForDiff[0];

  // Har renderda eng so'nggi qiymatlarni ref'ga yozamiz — SpeechRecognition callback'lari
  // "eskirgan" (stale) state bilan ishlamasligi uchun.
  useEffect(() => {
    stateRef.current = { history, currentCase, currentDiff, profile, diagInput };
  });

  // Mikrofon (nutqni tanish) ni bir marta sozlaymiz
  useEffect(() => {
    if (!hasSpeechRecognition()) {
      // iOS/Safari: nutq-tanish yo'q — "bosib gapirish" rejimiga o'tamiz
      setVoiceMode(hasRecorder() ? 'ptt' : 'none');
      return;
    }
    setVoiceMode('sr');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'de-DE';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onresult = (e) => {
      const transcript = e.results[e.results.length - 1][0].transcript;
      setListening(false);
      busyRef.current = true;
      handleVoiceTurn(transcript);
    };
    rec.onend = () => {
      setListening(false);
      if (activeRef.current && !busyRef.current) restartListening();
    };
    rec.onerror = () => {
      setListening(false);
      if (activeRef.current && !busyRef.current) restartListening();
    };
    recognitionRef.current = rec;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/login'); return; }
      const { data: prof, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
      if (!mounted) return;
      let currentProfile = prof;
      if (error || !prof) {
        const { data: created } = await supabase.from('profiles').insert({
          id: data.session.user.id, full_name: data.session.user.email, coins: 100, xp: 0
        }).select().single();
        currentProfile = created;
      }
      setProfile(currentProfile);
      touchPracticeDay(currentProfile).then(updated => { if (mounted && updated) setProfile(updated); });
      setLoadingProfile(false);
    });
    return () => { mounted = false; };
  }, [router]);

  useEffect(() => {
    // Yangi darajaga o'tilganda (va sahifa birinchi ochilganda) bemor tasodifiy tanlanadi
    resetCase(pickRandomIdx(currentDiff, -1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDiff]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [history]);

  function restartListening(){
    if (!recognitionRef.current) return; // 'ptt' rejimida avtomatik tinglash yo'q
    try { recognitionRef.current.start(); setListening(true); } catch (e) { /* allaqachon ishlayapti */ }
  }

  // --- "Bosib gapirish" (iPhone/iOS) ---
  async function toggleRecording(){
    setVoiceError('');
    if (recording) {
      const r = recorderRef.current;
      recorderRef.current = null;
      setRecording(false);
      if (!r) return;
      setTranscribing(true);
      try {
        const payload = await r.stop();
        const text = await transcribeAudio(payload);
        setTranscribing(false);
        if (!text) { setVoiceError('Nichts verstanden — bitte noch einmal sprechen.'); return; }
        busyRef.current = true;
        await handleVoiceTurn(text);
      } catch (e) {
        setTranscribing(false);
        setVoiceError('Spracherkennung fehlgeschlagen. Bitte erneut versuchen.');
      }
      return;
    }
    // yozishni boshlash
    stopSpeaking();
    setSpeaking(false);
    try {
      recorderRef.current = await startRecording();
      setRecording(true);
    } catch (e) {
      setVoiceError('Kein Mikrofonzugriff. Bitte in den Einstellungen erlauben.');
    }
  }

  async function speak(text){
    setSpeaking(true);
    await speakNatural(text, caseVoiceRef.current);
    setSpeaking(false);
  }

  // Bemor tasodifiy tanlanadi. Barcha holatlar aylanib chiqilmaguncha takrorlanmaydi.
  function pickRandomIdx(diff, currentIdx){
    const pool = CASES.filter(c => c.difficulty === diff);
    if (pool.length <= 1) return 0;
    if (!seenRef.current[diff]) seenRef.current[diff] = [];
    const seen = seenRef.current[diff];
    let avail = pool.map((_, i) => i).filter(i => !seen.includes(i) && i !== currentIdx);
    if (!avail.length) {
      seenRef.current[diff] = [];
      avail = pool.map((_, i) => i).filter(i => i !== currentIdx);
    }
    const idx = avail[Math.floor(Math.random() * avail.length)];
    seenRef.current[diff].push(idx);
    return idx;
  }

  function newCase(){
    resetCase(pickRandomIdx(currentDiff, currentCaseIdx));
  }

  // Istalgan holatni (qo'lda yozilgan yoki AI yaratgan) boshlaydi
  function beginCase(c){
    diagnosisAttemptRef.current = newAttemptId();
    setShowQuiz(false);
    setEvalResult(null);
    setDiagInput('');
    setDiagError(false);
    setAiError('');
    setShowTeeth(false);
    setSelectedTooth(null);
    caseVoiceRef.current = pickVoice();
    stopSpeaking();
    if (!c) return;
    setHistory([{ role: 'assistant', content: c.opener }]);
    if (activeRef.current) {
      busyRef.current = true;
      speak(c.opener).then(() => {
        busyRef.current = false;
        if (activeRef.current) restartListening();
      });
    }
  }

  function resetCase(idx){
    setAiCase(null);
    setCurrentCaseIdx(idx);
    beginCase(CASES.filter(x => x.difficulty === currentDiff)[idx]);
  }

  // Cheksiz holat: server tekshirilgan rentgen topilmasini tanlaydi,
  // Gemini unga mos bemorni yozadi — shuning uchun rasm har doim mos keladi.
  async function generateCase(){
    if (aiLoading) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await apiRawPost('/api/case', {
          difficulty: currentDiff,
          exclude: CASES.filter(c => c.difficulty === currentDiff).map(c => c.name)
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || 'Fall konnte nicht erstellt werden');
      setAiCase(d.case);
      beginCase(d.case);
    } catch (e) {
      setAiError(e.message);
    }
    setAiLoading(false);
  }

  async function callGemini(messages, system, maxTokens){
    const res = await apiRawPost('/api/chat', { system, messages, maxTokens: maxTokens || 300 });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Der Server antwortet nicht.');
    return data.text || '';
  }

  // ---- Ovozli navbatni boshqarish: niyatni aniqlaydi (savol / rasm / tashxis) ----
  function detectIntent(text){
    const lower = text.toLowerCase();
    const wantsImage = /(röntgenbild|roentgenbild|\bfoto\b|\bbild\b)/.test(lower)
      && /(schick|zeig|geben sie|haben sie|können sie)/.test(lower);
    if (wantsImage) return 'image';

    const diagMatch = lower.match(/(meine diagnose ist|meine diagnose lautet|ich diagnostiziere|meine einschätzung ist)\s*(.*)/);
    if (diagMatch) return { type: 'diagnosis', text: diagMatch[2] || text };

    return { type: 'question' };
  }

  async function handleVoiceTurn(transcript){
    const { currentCase: c } = stateRef.current;
    if (!c || !transcript.trim()) { busyRef.current = false; if (activeRef.current) restartListening(); return; }

    const intent = detectIntent(transcript);

    if (intent === 'image') {
      doRequestImage();
      await speak(c.imageCaption);
    } else if (intent.type === 'diagnosis') {
      const diagText = (intent.text || transcript).trim();
      setDiagInput(diagText);
      setHistory(h => [...h, { role: 'user', content: transcript }]);
      await runEval(diagText);
    } else {
      await sendMsg(transcript);
    }

    busyRef.current = false;
    if (activeRef.current) restartListening();
  }

  function doRequestImage(){
    const c = stateRef.current.currentCase;
    if (!c) return;
    setHistory(h => [
      ...h,
      { role: 'user', content: `Könnten Sie mir bitte ${c.imageLabel === 'Foto' ? 'ein Foto' : 'ein Röntgenbild'} schicken?` },
      { role: 'assistant', type: 'image', imageKey: c.imageKey, commonsFile: c.commonsFile, displayCaption: c.imageCaption, content: c.imageContent }
    ]);
  }

  function requestImage(){
    // qo'lda (tugma) bosilganda
    doRequestImage();
    if (activeRef.current) speak(stateRef.current.currentCase.imageCaption);
  }

  async function sendMsg(voiceText){
    const text = (typeof voiceText === 'string' ? voiceText : input).trim();
    const c = stateRef.current.currentCase;
    if (!text || !c) return;
    setInput('');
    const newHistory = [...stateRef.current.history, { role: 'user', content: text }];
    setHistory(newHistory);
    setSending(true);
    try {
      const reply = await callGemini(newHistory, c.system + COMMON_PATIENT_INSTRUCTIONS, 300);
      setHistory(h => [...h, { role: 'assistant', content: reply || '...' }]);
      if (activeRef.current && reply) await speak(reply);
    } catch (e) {
      setHistory(h => [...h, { role: 'assistant', content: '[Fehler: keine Antwort erhalten]' }]);
    }
    setSending(false);
  }

  async function runEval(diagnosisText){
    const c = stateRef.current.currentCase;
    const prof = stateRef.current.profile;
    const hist = stateRef.current.history;
    if (!diagnosisText || !diagnosisText.trim() || !c) return;
    const doctorQuestions = hist.filter(message => message.role === 'user').length;
    const requiredQuestions = { leicht: 3, mittel: 5, schwer: 7, pro: 9 }[stateRef.current.currentDiff] || 3;
    if (doctorQuestions < requiredQuestions) {
      const missing = requiredQuestions - doctorQuestions;
      const hint = `Die Anamnese ist noch nicht vollständig. Stellen Sie mindestens ${missing} weitere gezielte ${missing === 1 ? 'Frage' : 'Fragen'}, bevor Sie die Diagnose abgeben.`;
      if (activeRef.current) await speak(hint);
      else alert(hint);
      return;
    }

    setEvalLoading(true);
    setEvalResult(null);
    const transcript = hist.map(m => (m.role === 'user' ? 'Arzt/Ärztin: ' : 'Patient/in: ') + m.content).join('\n');
    const sys = `Du bist ein erfahrener FSP-Prüfer für Zahnmedizin. Dir liegt die KORREKTE DIAGNOSE für diesen Fall vor: "${c.diagnosis}". Der/die Prüfungskandidat/in hat als eigene Diagnose eingetragen: "${diagnosisText.trim()}". Bewerte auf Deutsch, in klaren Absätzen ohne Markdown:
1. Beginne mit genau einem Wort in Großbuchstaben als erste Zeile: RICHTIG, TEILWEISE oder FALSCH.
2. Dann ein bis zwei Sätze, die die korrekte Diagnose nennen und kurz begründen.
3. Dann: welche wichtigen Anamnesefragen gefehlt haben (2-3 Punkte).
4. Dann: 1-2 konkrete sprachliche Korrekturen, falls vorhanden.`;

    try {
      const text = await callGemini([{ role: 'user', content: transcript }], sys, 550);
      const lines = text.trim().split('\n');
      const first = (lines[0] || '').toUpperCase();
      let verdict = 'teilweise';
      if (first.includes('RICHTIG') && !first.includes('TEILWEISE')) verdict = 'richtig';
      else if (first.includes('FALSCH')) verdict = 'falsch';
      const rest = lines.slice(1).join('\n').trim();

      let reward = null;
      if (verdict === 'richtig' && prof) {
        // MUHIM: ovozli rejimda bu funksiya "eski" closure ichidan chaqiriladi,
        // shuning uchun profil va qiyinlik darajasini stateRef'dan olamiz.
        const r = DIFF_REWARDS[stateRef.current.currentDiff];
        const updated = await awardProgress(
          `diagnosis:${stateRef.current.currentDiff}`,
          diagnosisAttemptRef.current
        );
        if (updated) setProfile(updated);
        reward = r;
      }

      setEvalResult({ verdict, text: rest, reward });
      setEvalLoading(false);
      if (verdict === 'richtig') { playCorrect(); burstConfetti(); } else if (verdict === 'falsch') { playWrong(); }

      if (activeRef.current) {
        const verdictLine = verdict === 'richtig' ? 'Ihre Diagnose ist richtig.'
          : verdict === 'falsch' ? 'Ihre Diagnose ist leider nicht korrekt.'
          : 'Ihre Diagnose ist teilweise richtig.';
        await speak(verdictLine + ' ' + rest);
      }
    } catch (e) {
      setEvalResult({ verdict: 'falsch', text: 'Auswertung konnte nicht geladen werden. Bitte erneut versuchen.', reward: null });
      setEvalLoading(false);
    }
  }

  // Imtihon o'tilganda: asosiy mukofot va martaba shu yerda beriladi
  async function handleQuizPassed(score, total, attemptId){
    const prof = stateRef.current.profile;
    const diff = stateRef.current.currentDiff;
    if (!prof) return null;
    const base = DIFF_REWARDS[diff] || DIFF_REWARDS.leicht;
    const mult = score === total ? 3 : 2;          // 20/20 uchun ko'proq
    const xp = base.xp * mult;
    const coins = base.coins * mult;
    const oldLevel = levelFromXp(prof.xp || 0);
    const kind = score === total ? 'perfect' : 'pass';
    const updated = await awardProgress(`quiz:${diff}:${kind}`, attemptId);
    if (updated) setProfile(updated);
    const newLevel = levelFromXp(updated?.xp || prof.xp || 0);
    return { xp, coins, levelUp: newLevel > oldLevel, title: careerStage(newLevel).title };
  }

  // Imtihondan o'tilgach, keyingi qiyinlik darajasiga o'tkazadi (agar bor bo'lsa)
  function advanceDifficulty(){
    const i = DIFFS.indexOf(stateRef.current.currentDiff);
    setShowQuiz(false);
    if (i >= 0 && i < DIFFS.length - 1) {
      setCurrentDiff(DIFFS[i + 1]);
    } else {
      newCase();
    }
  }

  function quizTranscript(){
    return (stateRef.current.history || [])
      .filter(m => m.type !== 'image')
      .map(m => (m.role === 'user' ? 'Arzt/Ärztin: ' : 'Patient/in: ') + m.content)
      .join('\n');
  }

  function getEval(){
    if (!diagInput.trim()) { setDiagError(true); return; }
    setDiagError(false);
    runEval(diagInput.trim());
  }

  // Tish sxemasidan tanlangan raqamni diagnoz matniga "Zahn NN" sifatida qo'shadi
  // (oldingi tanlovni almashtiradi, qolgan matnni saqlab qoladi).
  function selectTooth(n){
    setSelectedTooth(n);
    setDiagInput(prev => {
      const cleaned = prev.replace(/,?\s*Zahn\s*\d+/i, '').trim();
      return (cleaned ? cleaned + ', ' : '') + 'Zahn ' + n;
    });
  }

  function toggleVoiceMode(){
    if (voiceActive) {
      activeRef.current = false;
      setVoiceActive(false);
      stopSpeaking();
      try { recognitionRef.current?.stop(); } catch (e) {}
      if (recorderRef.current) { recorderRef.current.cancel(); recorderRef.current = null; }
      setRecording(false);
      setTranscribing(false);
      setListening(false);
      setSpeaking(false);
    } else {
      // MUHIM: iPhone'da audio faqat foydalanuvchi tegib turgan payt ochiladi.
      unlockAudio();
      setVoiceError('');
      activeRef.current = true;
      setVoiceActive(true);
      busyRef.current = true;
      const c = stateRef.current.currentCase;
      speak(c ? c.opener : '').then(() => {
        busyRef.current = false;
        if (activeRef.current) restartListening();
      });
    }
  }

  if (loadingProfile || !profile) {
    return (
      <>
        <div className="topbar"><div className="topbar-inner"><span className="brand-mark">FSP<span style={{ color: 'var(--brand)' }}>.</span>Trainer</span></div></div>
        <ToolSkeleton />
      </>
    );
  }

  return (
    <>
      <Header profile={profile} backHref="/home" />

      <div className="game-shell">
        <div className="difficulty-row">
          {DIFFS.map(d => (
            <button
              key={d}
              className={'diff-btn' + (d === currentDiff ? ' active' : '')}
              data-d={d}
              onClick={() => setCurrentDiff(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        {currentCase && (
          <div className="casefile">
            <div className="cf-head">
              <div className="cf-patient">
                <TiltCard className="cf-avatar" maxDeg={14}>{currentCase.avatar}</TiltCard>
                <div>
                  <div className="cf-name">{currentCase.name}</div>
                  <div className="cf-meta">
                    <span className={'badge ' + currentCase.difficulty}>{currentCase.difficulty}</span>
                    <span>{currentCase.meta}</span>
                    {currentCase.generated && <span className="ai-tag" title="Von der KI für diesen Röntgenbefund erstellt">neu</span>}
                  </div>
                </div>
              </div>
              <div className="case-actions">
                <button className="next-case-btn" onClick={newCase} title="Geprüfter Fall aus dieser Stufe">
                  Nächster Patient →
                </button>
                <button className="next-case-btn ai" onClick={generateCase} disabled={aiLoading}
                        title="Neuer, noch nie dagewesener Fall — passend zu einem geprüften Röntgenbefund">
                  {aiLoading ? 'Fall wird erstellt…' : '✨ Neuer Fall'}
                </button>
              </div>
            </div>

            {aiError && <div className="voice-hint"><span className="error-text">{aiError}</span></div>}

            {showQuiz ? (
              <Quiz
                currentCase={currentCase}
                transcript={quizTranscript()}
                onPassed={handleQuizPassed}
                onClose={() => { setShowQuiz(false); newCase(); }}
                onAdvance={advanceDifficulty}
                userId={profile.id}
              />
            ) : (
            <>
            {voiceMode !== 'none' && (
              <div className="voice-bar">
                <button className={'voice-toggle' + (voiceActive ? ' on' : '')} onClick={toggleVoiceMode}>
                  {voiceActive ? '🎙️ Sprachgespräch: Aktiv' : '🎙️ Sprachgespräch starten'}
                </button>

                {voiceActive && voiceMode === 'ptt' && (
                  <button
                    className={'talk-btn' + (recording ? ' rec' : '')}
                    onClick={toggleRecording}
                    disabled={transcribing || speaking}
                  >
                    {recording ? '⏹ Fertig' : '🎤 Sprechen'}
                  </button>
                )}

                {speaking && <span className="voice-status">Patient spricht…</span>}
                {recording && <span className="voice-status listening">● Aufnahme läuft…</span>}
                {transcribing && <span className="voice-status">Wird verstanden…</span>}
                {listening && <span className="voice-status listening">● Ich höre zu…</span>}
                {voiceActive && voiceMode === 'sr' && !speaking && !listening && <span className="voice-status">Einen Moment…</span>}
              </div>
            )}
            {voiceActive && (
              <div className="voice-hint">
                {voiceMode === 'ptt'
                  ? 'Tippen Sie auf „Sprechen", sprechen Sie auf Deutsch, und tippen Sie danach auf „Fertig". Z. B. „Können Sie mir ein Röntgenbild schicken?" oder „Meine Diagnose ist …"'
                  : 'Sagen Sie z. B. „Können Sie mir ein Röntgenbild schicken?" oder „Meine Diagnose ist …" — das Gespräch läuft ohne Tastendruck weiter.'}
                {voiceError && <span className="error-text" style={{ display: 'block', marginTop: 6 }}>{voiceError}</span>}
              </div>
            )}

            <div className="cf-body" ref={bodyRef}>
              {history.map((m, i) => {
                if (m.type === 'image') {
                  return (
                    <div className="msg patient msg-image" key={i}>
                      {m.displayCaption && <div className="img-caption">{m.displayCaption}</div>}
                      <CaseImage imageKey={m.imageKey} commonsFile={m.commonsFile} />
                    </div>
                  );
                }
                return (
                  <div className={'msg ' + (m.role === 'assistant' ? 'patient' : 'doctor')} key={i}>
                    {m.content}
                  </div>
                );
              })}
            </div>

            <div className="cf-input">
              <input
                placeholder={voiceActive ? "Sprachmodus aktiv — oder hier tippen…" : "Stellen Sie Ihre Frage auf Deutsch…"}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendMsg(); }}
              />
              <button onClick={() => sendMsg()} disabled={sending}>Senden</button>
            </div>

            <div className="image-row">
              <button onClick={requestImage}>{currentCase.imageLabel} anfordern</button>
              <span className="img-hint">In der Praxis stützt sich die Diagnose meist auf ein Bild — fordern Sie es an, bevor Sie Ihre Diagnose eintragen.</span>
            </div>

            <div className="diag-block">
              <label>Ihre Diagnose (Pflichtfeld für die Auswertung)</label>
              <div className="diag-row">
                <input
                  placeholder="z. B. Irreversible Pulpitis, Zahn 36"
                  value={diagInput}
                  onChange={e => setDiagInput(e.target.value)}
                />
                <button onClick={getEval} disabled={evalLoading}>Auswertung anzeigen</button>
              </div>
              {diagError && <p className="error-text">Bitte tragen Sie zuerst Ihre Diagnose ein.</p>}
              <button type="button" className="tooth-toggle" onClick={() => setShowTeeth(v => !v)}>
                {showTeeth ? 'Zahnschema ausblenden' : '🦷 Zahnschema öffnen — Zahn auswählen'}
              </button>
              {showTeeth && (
                <ToothChart selected={selectedTooth} onSelect={selectTooth} />
              )}
            </div>

            {(evalLoading || evalResult) && (
              <div className="evalbox">
                {evalLoading ? (
                  <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>Auswertung wird erstellt…</span>
                ) : (
                  <>
                    <div className={'verdict ' + evalResult.verdict}>
                      {evalResult.verdict === 'richtig' ? 'Diagnose richtig' : evalResult.verdict === 'falsch' ? 'Diagnose falsch' : 'Diagnose teilweise richtig'}
                    </div>
                    <div>{evalResult.text.split('\n\n').map((p, i) => <p key={i} style={{ marginBottom: 8 }}>{p}</p>)}</div>
                    {evalResult.reward && (
                      <div className="reward-toast">+{evalResult.reward.coins} zum Praxiskonto · +{evalResult.reward.xp} Erfahrung</div>
                    )}
                  </>
                )}
              </div>
            )}

            {evalResult && !evalLoading && (
              <div className="exam-cta">
                <div className="exam-cta-text">
                  <b>Prüfung (20 Fragen)</b>
                  <span>Sie beantworten alle 20 Fragen. Am Ende sehen Sie Ihr Ergebnis — ab 18 richtigen Antworten haben Sie bestanden und steigen zur nächsten Stufe auf.</span>
                </div>
                <button className="quiz-btn" onClick={() => setShowQuiz(true)}>Prüfung starten</button>
              </div>
            )}
            </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
