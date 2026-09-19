'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { touchPracticeDay } from '@/lib/practice';
import Header from '@/app/components/Header';
import { ToolSkeleton } from '@/app/components/Skeleton';

// Barcha vositalar uchun umumiy ramka: tepa panel, sarlavha, orqaga havola.
export default function ToolShell({ title, lead, children }) {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
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
      if (!alive) return;
      setProfile(currentProfile);
      touchPracticeDay(currentProfile).then(updated => { if (alive && updated) setProfile(updated); });
      setReady(true);
    });
    return () => { alive = false; };
  }, [router]);

  if (!ready) {
    return (
      <>
        <div className="topbar"><div className="topbar-inner"><span className="brand-mark">FSP<span style={{ color: 'var(--brand)' }}>.</span>Trainer</span></div></div>
        <ToolSkeleton />
      </>
    );
  }

  return (
    <>
      <Header profile={profile} />
      <div className="tool-shell">
        <a href="/home" className="back-link">← Zurück zur Übersicht</a>
        <div className="tool-head">
          <h1>{title}</h1>
          <p>{lead}</p>
        </div>
        {children}
      </div>
    </>
  );
}

// Baholash natijasi — Arztbrief va Befund vositalari uchun umumiy
export function Feedback({ result }) {
  if (!result) return null;
  const pct = result.score / result.max;
  const cls = pct >= 0.8 ? 'good' : pct >= 0.5 ? 'mid' : 'bad';
  return (
    <div className="fb-block">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
        <span className={'score-pill ' + cls}>{result.score} / {result.max} Punkte</span>
      </div>
      <p style={{ marginBottom: 4 }}>{result.summary}</p>

      {result.good?.length > 0 && (
        <>
          <h4>Das war gut</h4>
          <div className="fb-list">
            {result.good.map((g, i) => <div className="fb-item good" key={i}>{g}</div>)}
          </div>
        </>
      )}

      {result.bad?.length > 0 && (
        <>
          <h4>Das war falsch</h4>
          <div className="fb-list">
            {result.bad.map((b, i) => <div className="fb-item bad" key={i}>{b}</div>)}
          </div>
        </>
      )}

      {result.corrected && (
        <>
          <h4>So wäre es richtig</h4>
          <div style={{ whiteSpace: 'pre-wrap', background: 'var(--surface-3)', border: '1px solid var(--line-soft)', borderRadius: 'var(--r-sm)', padding: '14px 16px', fontSize: 14, lineHeight: 1.7 }}>
            {result.corrected}
          </div>
        </>
      )}
    </div>
  );
}
