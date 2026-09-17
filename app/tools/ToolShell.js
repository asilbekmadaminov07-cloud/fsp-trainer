'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

// Barcha vositalar uchun umumiy ramka: tepa panel, sarlavha, orqaga havola.
export default function ToolShell({ title, lead, children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (!data.session) { router.replace('/login'); return; }
      setReady(true);
    });
    return () => { alive = false; };
  }, [router]);

  if (!ready) return null;

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <a href="/home" className="brand-mark">
            FSP<span style={{ color: 'var(--brand)' }}>.</span>Trainer
          </a>
        </div>
      </div>
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
