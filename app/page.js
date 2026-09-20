'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import TiltCard from '@/app/components/TiltCard';
import SensorToggle from '@/app/components/SensorToggle';
import { LANGS, T, detectLang } from '@/lib/i18n';

export default function Home() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [lang, setLang] = useState('de');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/home');
      else setChecked(true);
    });
    try {
      const saved = localStorage.getItem('fsp-lang');
      setLang(saved && T[saved] ? saved : detectLang());
    } catch (e) { setLang(detectLang()); }
    fetch('/api/stats').then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d); }).catch(() => {});
  }, [router]);

  function changeLang(code){
    setLang(code);
    try { localStorage.setItem('fsp-lang', code); } catch (e) {}
  }

  if (!checked) return null;
  const t = T[lang] || T.de;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="entry entry-lux" dir={dir}>
      <div className="entry-bg" aria-hidden="true">
        <div className="lx-glow lx-glow-1"></div>
        <div className="lx-glow lx-glow-2"></div>
      </div>

      <div className="entry-top">
        <div className="entry-mark">F</div>
        <span className="entry-brand">FSP Trainer</span>
        <select className="lang-switcher" value={lang} onChange={e => changeLang(e.target.value)} aria-label="Sprache / Til / Язык">
          {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
      </div>

      <div className="entry-main">
        <h1 className="entry-h1">{t.h1}</h1>
        <p className="entry-sub">{t.sub}</p>

        <div className="entry-ctas">
          <a className="btn lx-cta-primary" href="/register">{t.ctaPrimary}</a>
          <a className="btn btn-ghost" href="/login">{t.ctaSecondary}</a>
        </div>
        <p className="entry-note">{t.note}</p>
        <div style={{ marginTop: 14 }}><SensorToggle /></div>

        {stats && (stats.sessions > 0 || stats.users > 0) && (
          <div className="lx-stats">
            <div className="lx-stat"><b>{stats.sessions.toLocaleString(lang)}</b><span>{t.statSessions}</span></div>
            <div className="lx-stat"><b>{stats.users.toLocaleString(lang)}</b><span>{t.statUsers}</span></div>
          </div>
        )}
      </div>

      <div className="entry-preview">
        <div className="preview-label">{t.previewLabel}</div>
        <TiltCard className="preview-card">
          <div className="preview-msg patient">{t.msgs[0]}</div>
          <div className="preview-msg doctor">{t.msgs[1]}</div>
          <div className="preview-msg patient2">{t.msgs[2]}</div>
          <div className="preview-mic">
            <span className="preview-mic-dot" />
            <span className="preview-wave">
              {[6, 12, 8, 15, 5, 11, 7].map((h, i) => <span key={i} style={{ height: h, animationDelay: (i * 0.09) + 's' }} />)}
            </span>
          </div>
        </TiltCard>
      </div>

      <div className="lx-parts">
        <div className="lx-eyebrow">{t.eyebrowParts}</div>
        <h2 className="lx-section-title">{t.partsTitle}</h2>
        <div className="lx-parts-grid">
          <div className="lx-part-card"><div className="lx-part-num">1</div><h3>{t.part1Title}</h3><p>{t.part1Desc}</p></div>
          <div className="lx-part-card"><div className="lx-part-num">2</div><h3>{t.part2Title}</h3><p>{t.part2Desc}</p></div>
          <div className="lx-part-card"><div className="lx-part-num">3</div><h3>{t.part3Title}</h3><p>{t.part3Desc}</p></div>
        </div>
      </div>

      <div className="lx-why">
        <div className="lx-eyebrow">{t.eyebrowWhy}</div>
        <h2 className="lx-section-title">{t.whyTitle}</h2>
        <div className="lx-why-grid">
          <div className="lx-why-item"><div className="lx-why-icon">✓</div><div><h4>{t.why1Title}</h4><p>{t.why1Desc}</p></div></div>
          <div className="lx-why-item"><div className="lx-why-icon">🌐</div><div><h4>{t.why2Title}</h4><p>{t.why2Desc}</p></div></div>
          <div className="lx-why-item"><div className="lx-why-icon">🧭</div><div><h4>{t.why3Title}</h4><p>{t.why3Desc}</p></div></div>
          <div className="lx-why-item"><div className="lx-why-icon">↗</div><div><h4>{t.why4Title}</h4><p>{t.why4Desc}</p></div></div>
        </div>
      </div>

      <div className="lx-faq">
        <div className="lx-eyebrow">{t.faqEyebrow}</div>
        <h2 className="lx-section-title">{t.faqTitle}</h2>
        <div style={{ marginTop: 28 }}>
          <details className="lx-faq-item"><summary>{t.faq1Q}</summary><p>{t.faq1A}</p></details>
          <details className="lx-faq-item"><summary>{t.faq2Q}</summary><p>{t.faq2A}</p></details>
          <details className="lx-faq-item"><summary>{t.faq3Q}</summary><p>{t.faq3A}</p></details>
          <details className="lx-faq-item"><summary>{t.faq4Q}</summary><p>{t.faq4A}</p></details>
        </div>
      </div>

      <div className="lx-final">
        <h2>{t.finalTitle}</h2>
        <p>{t.finalSub}</p>
        <div className="entry-ctas">
          <a className="btn lx-cta-primary" href="/register">{t.ctaPrimary}</a>
        </div>
      </div>

      <div className="lx-footer">FSP Trainer — © {new Date().getFullYear()}</div>
    </div>
  );
}
