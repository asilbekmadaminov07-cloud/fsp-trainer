'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { levelFromXp, careerStage } from '@/lib/career';
import { touchPracticeDay, daysSince } from '@/lib/practice';
import Header from '@/app/components/Header';
import TiltCard from '@/app/components/TiltCard';
import ReferralCard from '@/app/components/ReferralCard';
import PushOptIn from '@/app/components/PushOptIn';
import { HomeSkeleton } from '@/app/components/Skeleton';
import { useCountUp } from '@/lib/useCountUp';

const ACHIEVEMENTS = [
  { id: 'first_case', title: 'Erste Diagnose bestanden', need: 1 },
  { id: 'five_cases', title: '5 Fälle gelöst', need: 5 },
  { id: 'twenty_cases', title: '20 Fälle gelöst', need: 20 },
  { id: 'fifty_cases', title: '50 Fälle gelöst', need: 50 }
];

const TOOLS = [
  {
    href: '/game', icon: '🦷', name: 'Patientengespräch',
    desc: 'Anamnese erheben, Röntgenbild anfordern, Diagnose stellen — danach 20 Prüfungsfragen zum Fall.',
    tag: 'Teil 1 · Kernübung', category: 'prüfung'
  },
  {
    href: '/tools/befund', icon: '🩻', name: 'Befund-Training',
    desc: 'Echte Röntgenbilder befunden. Ihre Beschreibung wird gegen den tatsächlichen Befund geprüft.',
    tag: 'Röntgen lesen', category: 'klinik'
  },
  {
    href: '/tools/arztbrief', icon: '✍️', name: 'Arztbrief',
    desc: 'Den schriftlichen Teil üben. Bewertung nach Struktur, Fachsprache, Vollständigkeit und Grammatik.',
    tag: 'Teil 2 · Schriftlich', category: 'prüfung'
  },
  {
    href: '/tools/kollege', icon: '👨‍⚕️', name: 'Arzt-Arzt-Gespräch',
    desc: 'Den Fall einem Oberarzt vorstellen. Er hakt nach, sobald etwas fehlt oder zu umgangssprachlich klingt.',
    tag: 'Teil 3 · Fallübergabe', category: 'prüfung'
  },
  {
    href: '/tools/fachbegriffe', icon: '📇', name: 'Fachbegriffe',
    desc: 'Fachwort auf der einen Seite, Patientensprache auf der anderen. Karten drehen sich, Sätze inklusive.',
    tag: 'Vokabeln', category: 'sprache'
  },
  {
    href: '/tools/aussprache', icon: '🎙️', name: 'Aussprache',
    desc: 'Satz anhören, nachsprechen, Wort für Wort vergleichen. Sie sehen, welches Wort nicht angekommen ist.',
    tag: 'Sprechen', category: 'sprache'
  },
  {
    href: '/tools/test', icon: '📝', name: 'Testmodus',
    desc: 'Schnelle Multiple-Choice-Runde über alle Themen — ohne Patientenfall, ideal zum Aufwärmen.',
    tag: 'Schnelltest', category: 'klinik'
  },
  {
    href: '/mistakes', icon: '📌', name: 'Meine Fehler',
    desc: 'Alle bisherigen Fehler an einem Ort — lesen, verstehen, als gelernt markieren.',
    tag: 'Lernen aus Fehlern', category: 'fortschritt'
  }
];

const TOOL_FILTERS = [
  ['alle', 'Alle'], ['prüfung', 'Prüfung'], ['klinik', 'Klinik'],
  ['sprache', 'Sprache'], ['fortschritt', 'Fortschritt']
];

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toolFilter, setToolFilter] = useState('alle');

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
      touchPracticeDay(currentProfile).then(updated => { if (mounted && updated) setProfile(updated); });

      const { data: board } = await supabase
        .from('profiles').select('id, full_name, xp, level')
        .order('xp', { ascending: false }).limit(5);
      if (mounted && board) setLeaderboard(board);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [router]);

  const solvedDisplay = useCountUp(profile?.cases_solved || 0);

  if (loading || !profile) {
    return (
      <>
        <div className="topbar"><div className="topbar-inner"><span className="brand-mark">FSP<span style={{ color: 'var(--brand)' }}>.</span>Trainer</span></div></div>
        <HomeSkeleton />
      </>
    );
  }

  const xp = profile.xp || 0;
  const level = levelFromXp(xp);
  const stage = careerStage(level);
  const inLevel = xp % 150;
  const solved = profile.cases_solved || 0;

  const memberDays = daysSince(profile.created_at);
  const practiceDays = profile.practice_days || 0;

  return (
    <>
      <Header profile={profile} />

      <div className="game-shell">
        <PushOptIn userId={profile.id} />
        <TiltCard className="hero-card">
          <div className="hero-rank">{stage.title}</div>
          <div className="hero-sub">{profile.full_name}</div>
          <div className="xp-track"><div className="xp-fill" style={{ width: Math.min(100, inLevel / 150 * 100) + '%' }} /></div>
          <div className="hero-meta">
            <span>{inLevel} / 150 Erfahrung bis Stufe {level + 1}</span>
            <span>{solvedDisplay} Fälle gelöst</span>
            <span>{practiceDays} Tage geübt</span>
            <span>Mitglied seit {memberDays} Tagen</span>
            {stage.next && <span>Nächster Rang: {stage.next.title}</span>}
          </div>
        </TiltCard>

        <div className="dashboard-quick">
          <a href="/daily"><span>⚡</span><div><b>Heutiges 10-Minuten-Training</b><small>Challenge starten und Serie halten</small></div><em>Start →</em></a>
          <a href="/coach"><span>🧠</span><div><b>Ihr persönlicher Lernplan</b><small>AI-Coach analysiert Ihre Fehler</small></div><em>Öffnen →</em></a>
          <a href="/partner"><span>🤝</span><div><b>Partner-Übung</b><small>Live mit einem anderen Kandidaten üben</small></div><em>Öffnen →</em></a>
        </div>

        <div className="section-heading-row">
          <div className="section-title">Übungen</div>
          <span>{toolFilter === 'alle' ? TOOLS.length : TOOLS.filter(t => t.category === toolFilter).length} Tools</span>
        </div>
        <div className="tool-filters" aria-label="Übungen filtern">
          {TOOL_FILTERS.map(([value, label]) => (
            <button key={value} className={toolFilter === value ? 'active' : ''} onClick={() => setToolFilter(value)}>{label}</button>
          ))}
        </div>
        <div className="tool-grid">
          {TOOLS.filter(t => toolFilter === 'alle' || t.category === toolFilter).map(t => (
            <TiltCard as="a" className="tool-card" href={t.href} key={t.href}>
              <div className="tool-icon">{t.icon}</div>
              <div className="tool-name">{t.name}</div>
              <div className="tool-desc">{t.desc}</div>
              <div className="tool-foot">{t.tag}</div>
            </TiltCard>
          ))}
        </div>

        <ReferralCard profile={profile} />

        <div className="section-title">Fortschritt</div>
        <div className="two-col">
          <div className="panel">
            <h3>Nachweise</h3>
            <div className="row-list">
              {ACHIEVEMENTS.map(a => {
                const done = solved >= a.need;
                return (
                  <div className={'ach' + (done ? ' done' : '')} key={a.id}>
                    <span className="ach-dot" />
                    <span style={{ flex: 1 }}>{a.title}</span>
                    {!done && <span style={{ fontSize: 12, color: 'var(--faint)' }}>{solved}/{a.need}</span>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <h3>Klinik-Rangliste</h3>
            <div className="row-list">
              {leaderboard.length === 0 && <div className="row-item">Noch keine Einträge.</div>}
              {leaderboard.map((p, i) => (
                <div className="row-item" key={p.id}>
                  <span className="rank-nr">{i + 1}.</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.full_name || 'Anonym'}
                  </span>
                  <b>{p.xp ?? 0} XP</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
