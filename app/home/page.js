'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { levelFromXp, careerStage, WELCOME_LINES, speakText } from '@/lib/career';

const ACHIEVEMENTS = [
  { id: 'first_case', title: 'Erste Diagnose bestanden', need: 1 },
  { id: 'five_cases', title: '5 Fälle gelöst', need: 5 },
  { id: 'twenty_cases', title: '20 Fälle gelöst', need: 20 },
  { id: 'fifty_cases', title: '50 Fälle gelöst', need: 50 }
];

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greetingText, setGreetingText] = useState('');
  const [greetingPlaying, setGreetingPlaying] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { router.replace('/login'); return; }

      const { data: prof, error } = await supabase
        .from('profiles').select('*').eq('id', data.session.user.id).single();

      let currentProfile = prof;
      if (error || !prof) {
        const { data: created } = await supabase.from('profiles').insert({
          id: data.session.user.id, full_name: data.session.user.email, coins: 100, xp: 0
        }).select().single();
        currentProfile = created;
      }
      if (!mounted) return;
      setProfile(currentProfile);

      const { data: board } = await supabase
        .from('profiles')
        .select('id, full_name, xp, level')
        .order('xp', { ascending: false })
        .limit(5);
      if (mounted && board) setLeaderboard(board);

      setLoading(false);
    })();
    setGreetingText(WELCOME_LINES[Math.floor(Math.random() * WELCOME_LINES.length)]);
    return () => { mounted = false; };
  }, [router]);

  function playGreeting(){
    if (greetingPlaying) return;
    setGreetingPlaying(true);
    speakText(greetingText, () => setGreetingPlaying(false));
  }

  async function handleLogout(){
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading || !profile) return null;

  const level = profile.level || levelFromXp(profile.xp || 0);
  const stage = careerStage(level);
  const casesSolved = profile.cases_solved || 0;

  const stageStartXp = (stage.minLevel - 1) * 150;
  const stageEndXp = stage.next ? (stage.next.minLevel - 1) * 150 : stageStartXp + 150;
  const progressPct = Math.min(100, Math.round(((profile.xp - stageStartXp) / Math.max(1, stageEndXp - stageStartXp)) * 100));

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <span className="brand-mark">FSP<span style={{ color: 'var(--brand)' }}>.</span>Trainer</span>
          <div className="stats">
            <span className="stat">{profile.full_name}</span>
            <button className="logout-btn" onClick={handleLogout}>Abmelden</button>
          </div>
        </div>
      </div>

      <div className="game-shell">
        {greetingText && (
          <div className="welcome-banner">
            <button className="welcome-play" onClick={playGreeting} aria-label="Begrüßung anhören">
              {greetingPlaying ? '♪' : '▶'}
            </button>
            <div className="welcome-text">
              <b>Ihre erste Patientin/Ihr erster Patient wartet</b>
              {greetingText}
            </div>
          </div>
        )}

        <div className="career-card">
          <div className="career-top">
            <div>
              <div className="career-stage">{stage.title}</div>
              <div className="career-sub">Stufe {level}{stage.next ? ` · noch ${stage.next.minLevel - level} Stufen bis „${stage.next.title}“` : ' · höchste Stufe erreicht'}</div>
            </div>
            <div className="career-account">
              <div className="career-account-label">Praxiskonto</div>
              <div className="career-account-value">{profile.coins ?? 0}</div>
            </div>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: progressPct + '%' }} /></div>
        </div>

        <div className="clinic-banner">
          {profile.clinic_name
            ? <>Sie arbeiten in: <b>{profile.clinic_name}</b></>
            : <>Sie arbeiten aktuell in: <b>Zahnklinik Nordstadt</b> (Ausbildungsklinik) — erreichen Sie „Praxisinhaber", um Ihre eigene Praxis zu eröffnen.</>}
        </div>

        <a href="/game" className="btn" style={{ width: '100%', justifyContent: 'center', marginBottom: 28 }}>
          Weiter üben
        </a>

        <div className="section-block">
          <h3 className="section-title">Nachweise</h3>
          <div className="qual-list">
            {ACHIEVEMENTS.map(a => {
              const earned = casesSolved >= a.need;
              return (
                <div className={'qual-item' + (earned ? ' earned' : '')} key={a.id}>
                  <span className="qual-check">{earned ? '✓' : '—'}</span>
                  <span>{a.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="section-block">
          <h3 className="section-title">Klinik-Rangliste</h3>
          <div className="leaderboard">
            {leaderboard.map((row, i) => (
              <div className={'lb-row' + (row.id === profile.id ? ' me' : '')} key={row.id}>
                <span className="lb-rank">{i + 1}</span>
                <span className="lb-name">{row.id === profile.id ? 'Sie' : (row.full_name || 'Kollege/in')}</span>
                <span className="lb-xp">{row.xp || 0} XP</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
