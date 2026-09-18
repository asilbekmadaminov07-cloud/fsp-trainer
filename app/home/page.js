'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { levelFromXp, careerStage } from '@/lib/career';
import { touchPracticeDay, daysSince } from '@/lib/practice';
import Header from '@/app/components/Header';

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
    tag: 'Teil 1 · Kernübung'
  },
  {
    href: '/tools/befund', icon: '🩻', name: 'Befund-Training',
    desc: 'Echte Röntgenbilder befunden. Ihre Beschreibung wird gegen den tatsächlichen Befund geprüft.',
    tag: 'Röntgen lesen'
  },
  {
    href: '/tools/arztbrief', icon: '✍️', name: 'Arztbrief',
    desc: 'Den schriftlichen Teil üben. Bewertung nach Struktur, Fachsprache, Vollständigkeit und Grammatik.',
    tag: 'Teil 2 · Schriftlich'
  },
  {
    href: '/tools/kollege', icon: '👨‍⚕️', name: 'Arzt-Arzt-Gespräch',
    desc: 'Den Fall einem Oberarzt vorstellen. Er hakt nach, sobald etwas fehlt oder zu umgangssprachlich klingt.',
    tag: 'Teil 3 · Fallübergabe'
  },
  {
    href: '/tools/fachbegriffe', icon: '📇', name: 'Fachbegriffe',
    desc: 'Fachwort auf der einen Seite, Patientensprache auf der anderen. Karten drehen sich, Sätze inklusive.',
    tag: 'Vokabeln'
  },
  {
    href: '/tools/aussprache', icon: '🎙️', name: 'Aussprache',
    desc: 'Satz anhören, nachsprechen, Wort für Wort vergleichen. Sie sehen, welches Wort nicht angekommen ist.',
    tag: 'Sprechen'
  },
  {
    href: '/tools/test', icon: '📝', name: 'Testmodus',
    desc: 'Schnelle Multiple-Choice-Runde über alle Themen — ohne Patientenfall, ideal zum Aufwärmen.',
    tag: 'Schnelltest'
  },
  {
    href: '/mistakes', icon: '📌', name: 'Meine Fehler',
    desc: 'Alle bisherigen Fehler an einem Ort — lesen, verstehen, als gelernt markieren.',
    tag: 'Lernen aus Fehlern'
  }
];

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading || !profile) return null;

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
        <div className="hero-card">
          <div className="hero-rank">{stage.title}</div>
          <div className="hero-sub">{profile.full_name}</div>
          <div className="xp-track"><div className="xp-fill" style={{ width: Math.min(100, inLevel / 150 * 100) + '%' }} /></div>
          <div className="hero-meta">
            <span>{inLevel} / 150 Erfahrung bis Stufe {level + 1}</span>
            <span>{solved} Fälle gelöst</span>
            <span>{practiceDays} Tage geübt</span>
            <span>Mitglied seit {memberDays} Tagen</span>
            {stage.next && <span>Nächster Rang: {stage.next.title}</span>}
          </div>
        </div>

        <div className="section-title">Übungen</div>
        <div className="tool-grid">
          {TOOLS.map(t => (
            <a className="tool-card" href={t.href} key={t.href}>
              <div className="tool-icon">{t.icon}</div>
              <div className="tool-name">{t.name}</div>
              <div className="tool-desc">{t.desc}</div>
              <div className="tool-foot">{t.tag}</div>
            </a>
          ))}
        </div>

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
