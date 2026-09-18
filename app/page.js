'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import TiltCard from '@/app/components/TiltCard';
import SensorToggle from '@/app/components/SensorToggle';

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/home');
      else setChecked(true);
    });
  }, [router]);

  if (!checked) return null;

  return (
    <div className="entry">
      <div className="entry-bg" aria-hidden="true">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
      </div>

      <div className="entry-top">
        <div className="entry-mark">F</div>
        <span className="entry-brand">FSP Trainer</span>
      </div>

      <div className="entry-main">
        <h1 className="entry-h1">Üben Sie das Patientengespräch, bevor es zählt.</h1>
        <p className="entry-sub">Ein KI-Patient antwortet Ihnen wie im echten Sprechzimmer. Sie stellen die Diagnose — die Auswertung sagt Ihnen, was Sie übersehen haben.</p>

        <div className="entry-ctas">
          <a className="btn" href="/register">Kostenlos registrieren</a>
          <a className="btn btn-ghost" href="/login">Ich habe schon ein Konto</a>
        </div>
        <p className="entry-note">Keine Kartendaten nötig · in wenigen Sekunden startklar</p>
        <div style={{ marginTop: 14 }}><SensorToggle /></div>
      </div>

      <div className="entry-preview">
        <div className="preview-label">So beginnt ein Fall</div>
        <TiltCard className="preview-card">
          <div className="preview-msg patient">Guten Tag, Herr Doktor. Ich habe seit ein paar Tagen richtig üble Schmerzen im Unterkiefer links.</div>
          <div className="preview-msg doctor">Seit wann genau, und wie würden Sie den Schmerz beschreiben?</div>
          <div className="preview-msg patient2">Das pocht die ganze Zeit. Besonders nachts wird's schlimmer.</div>
        </TiltCard>
      </div>

      <div style={{ height: 28 }} />
    </div>
  );
}
