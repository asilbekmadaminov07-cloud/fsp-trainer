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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace('/home');
      else setChecked(true);
    });
    try {
      const saved = localStorage.getItem('fsp-lang');
      setLang(saved && T[saved] ? saved : detectLang());
    } catch (e) { setLang(detectLang()); }
  }, [router]);

  function changeLang(code){
    setLang(code);
    try { localStorage.setItem('fsp-lang', code); } catch (e) {}
  }

  if (!checked) return null;
  const t = T[lang] || T.de;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="entry" dir={dir}>
      <div className="entry-bg" aria-hidden="true">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
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
          <a className="btn" href="/register">{t.ctaPrimary}</a>
          <a className="btn btn-ghost" href="/login">{t.ctaSecondary}</a>
        </div>
        <p className="entry-note">{t.note}</p>
        <div style={{ marginTop: 14 }}><SensorToggle /></div>
      </div>

      <div className="entry-preview">
        <div className="preview-label">{t.previewLabel}</div>
        <TiltCard className="preview-card">
          <div className="preview-msg patient">{t.msgs[0]}</div>
          <div className="preview-msg doctor">{t.msgs[1]}</div>
          <div className="preview-msg patient2">{t.msgs[2]}</div>
        </TiltCard>
      </div>

      <div style={{ height: 28 }} />
    </div>
  );
}
