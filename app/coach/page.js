'use client';
import { useEffect, useState } from 'react';
import ToolShell from '@/app/tools/ToolShell';
import { apiPost } from '@/lib/api';
import { buildFallbackPlan } from '@/lib/learning';
import { supabase } from '@/lib/supabaseClient';

export default function CoachPage() {
  const [plan, setPlan] = useState(null);
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadPlan() {
    setLoading(true); setError('');
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (!userId) return;
    const { data: mistakes = [] } = await supabase
      .from('mistakes')
      .select('topic, case_name, difficulty, question, chosen, correct')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    try {
      const result = await apiPost('/api/coach', { mistakes });
      setPlan(result.plan); setSource(result.generatedBy);
    } catch (e) {
      setPlan(buildFallbackPlan(mistakes)); setSource('local'); setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPlan(); }, []);

  return (
    <ToolShell title="Ihr persönlicher AI-Lerncoach" lead="Ihre bisherigen Fehler werden zu einem konkreten 7-Tage-Plan — kostenlos und auf Ihren Lernstand zugeschnitten.">
      {loading && <div className="coach-loading">Ihr Lerncoach analysiert die Fehlermuster…</div>}
      {!loading && plan && (
        <>
          <section className="coach-hero">
            <div>
              <span className="eyebrow">HEUTIGER SCHWERPUNKT</span>
              <h2>{plan.focusTopic}</h2>
              <p>{plan.summary}</p>
            </div>
            <a className="quiz-btn" href={'/daily?' + new URLSearchParams({ focus: plan.focusTopic })}>10-Minuten-Training starten</a>
          </section>

          {error && <p className="coach-note">Der Offline-Plan wird angezeigt: {error}</p>}
          <div className="coach-grid">
            <section className="panel">
              <h3>Ihre drei Lernfelder</h3>
              <div className="weak-list">
                {plan.weakTopics?.slice(0, 3).map((item, index) => (
                  <div className="weak-item" key={item.topic}>
                    <span>{index + 1}</span><div><b>{item.topic}</b><p>{item.reason}</p></div>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel coach-tip">
              <span className="eyebrow">COACH-TIPP</span>
              <p>“{plan.coachTip}”</p>
              <small>{source === 'ai' ? 'Persönlich von Ihrem AI-Coach erstellt' : 'Sicherer Basisplan'}</small>
            </section>
          </div>

          <section className="panel plan-panel">
            <h3>Ihr 7-Tage-Plan</h3>
            <div className="plan-days">
              {plan.days?.map(day => (
                <a href={'/daily?' + new URLSearchParams({ focus: day.topic })} className="plan-day" key={day.day}>
                  <span className="day-number">{day.day}</span>
                  <div><b>{day.topic}</b><p>{day.goal}</p></div>
                  <em>{day.minutes || 10} Min →</em>
                </a>
              ))}
            </div>
          </section>
          <div className="quiz-actions"><button className="quiz-btn ghost" onClick={loadPlan}>Plan neu berechnen</button></div>
        </>
      )}
    </ToolShell>
  );
}
