'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { touchPracticeDay } from '@/lib/practice';
import Header from '@/app/components/Header';

export default function MistakesPage(){
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [mistakes, setMistakes] = useState(null);
  const [filter, setFilter] = useState('open'); // open | reviewed | all

  useEffect(() => {
    let alive = true;
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
      if (!alive) return;
      setProfile(currentProfile);
      touchPracticeDay(currentProfile).then(updated => { if (alive && updated) setProfile(updated); });

      const { data: rows } = await supabase
        .from('mistakes').select('*')
        .eq('user_id', data.session.user.id)
        .order('created_at', { ascending: false });
      if (alive) setMistakes(rows || []);
    })();
    return () => { alive = false; };
  }, [router]);

  async function markReviewed(id, reviewed){
    setMistakes(m => m.map(x => x.id === id ? { ...x, reviewed } : x));
    await supabase.from('mistakes').update({ reviewed }).eq('id', id);
  }

  if (!profile || !mistakes) return null;

  const visible = mistakes.filter(m =>
    filter === 'all' ? true : filter === 'reviewed' ? m.reviewed : !m.reviewed
  );
  const openCount = mistakes.filter(m => !m.reviewed).length;

  return (
    <>
      <Header profile={profile} backHref="/home" />
      <div className="tool-shell">
        <a href="/home" className="back-link">← Zurück zur Übersicht</a>
        <div className="tool-head">
          <h1>Meine Fehler</h1>
          <p>Jede falsch beantwortete Prüfungsfrage landet hier — lesen Sie die Erklärung, dann markieren Sie sie als gelernt.</p>
        </div>

        <div className="difficulty-row">
          <button className={'diff-btn' + (filter === 'open' ? ' active' : '')} onClick={() => setFilter('open')}>
            Offen {openCount > 0 && `(${openCount})`}
          </button>
          <button className={'diff-btn' + (filter === 'reviewed' ? ' active' : '')} onClick={() => setFilter('reviewed')}>Gelernt</button>
          <button className={'diff-btn' + (filter === 'all' ? ' active' : '')} onClick={() => setFilter('all')}>Alle ({mistakes.length})</button>
        </div>

        {visible.length === 0 && (
          <div className="panel">
            <p style={{ color: 'var(--muted)' }}>
              {filter === 'open' ? 'Keine offenen Fehler — gut gemacht! Sobald Sie in einer Prüfung etwas falsch beantworten, erscheint es hier.' : 'Noch nichts hier.'}
            </p>
          </div>
        )}

        <div className="quiz-mistakes">
          {visible.map(m => (
            <div className="quiz-mistake tilt-3d" key={m.id} style={m.reviewed ? { borderLeftColor: 'var(--easy)', opacity: .78 } : undefined}>
              <div className="qm-nr">
                {m.case_name || 'Testmodus'}{m.difficulty ? ' · ' + m.difficulty : ''} · {new Date(m.created_at).toLocaleDateString('de-DE')}
              </div>
              <div className="qm-q">{m.question}</div>
              <div className="qm-line bad">Ihre Antwort: {m.chosen}</div>
              <div className="qm-line good">Richtig wäre: {m.correct}</div>
              {m.explanation && <div className="qm-exp">{m.explanation}</div>}
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="quiz-btn ghost" onClick={() => markReviewed(m.id, !m.reviewed)}>
                  {m.reviewed ? '↺ Als offen markieren' : '✓ Als gelernt markieren'}
                </button>
                <a
                  className="quiz-btn ghost"
                  href={'/lernen?' + new URLSearchParams({
                    thema: m.case_name || m.difficulty || '', frage: m.question, falsch: m.chosen || '', richtig: m.correct || ''
                  }).toString()}
                >
                  Thema vertiefen →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
