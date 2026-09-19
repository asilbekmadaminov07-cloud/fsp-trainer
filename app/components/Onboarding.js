'use client';
import { useEffect, useState } from 'react';

const SLIDES = [
  { icon: '🦷', title: 'Virtueller Patient', text: 'Führen Sie ein echtes Anamnesegespräch auf Deutsch mit einem KI-Patienten — inklusive Röntgenbild und Diagnose.' },
  { icon: '📝', title: '20-Fragen-Prüfung', text: 'Nach jedem Fall testen Sie Ihr Wissen mit 20 Prüfungsfragen. Ab 18 richtigen Antworten steigen Sie eine Stufe auf.' },
  { icon: '⚡', title: 'Tägliches Training', text: 'Jeden Tag eine kurze 10-Minuten-Challenge zu Ihren Schwachstellen — halten Sie Ihre Serie und klettern Sie in der Liga.' },
  { icon: '📌', title: 'Aus Fehlern lernen', text: 'Jeder Fehler wird gespeichert und mit einer Erklärung versehen, damit Sie ihn beim nächsten Mal nicht wiederholen.' }
];

const KEY = 'fsp_onboarding_seen_v1';

// Ro'yxatdan o'tgan foydalanuvchiga ilova imkoniyatlarini bir marta tanishtiradi.
export default function Onboarding() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch (e) { /* localStorage yopiq bo'lishi mumkin */ }
  }, []);

  function close() {
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
    setOpen(false);
  }

  function next() {
    if (i + 1 >= SLIDES.length) { close(); return; }
    setI(v => v + 1);
  }

  if (!open) return null;
  const s = SLIDES[i];

  return (
    <div className="onboarding-overlay" onClick={close}>
      <div className="onboarding-card tilt-3d" onClick={e => e.stopPropagation()}>
        <button className="onboarding-skip" onClick={close} aria-label="Schließen">Überspringen</button>
        <div className="onboarding-icon">{s.icon}</div>
        <h2>{s.title}</h2>
        <p>{s.text}</p>
        <div className="onboarding-dots">
          {SLIDES.map((_, idx) => <span key={idx} className={idx === i ? 'active' : ''} />)}
        </div>
        <button className="quiz-btn" onClick={next}>{i + 1 >= SLIDES.length ? "Los geht's" : 'Weiter'}</button>
      </div>
    </div>
  );
}
