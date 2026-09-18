'use client';
import { apiRawPost, apiRawGet } from '@/lib/api';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaReady, setCaptchaReady] = useState(false);
  const widgetIdRef = useRef(null);
  const captchaBoxRef = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (window.grecaptcha && window.grecaptcha.render && captchaBoxRef.current && widgetIdRef.current === null) {
        widgetIdRef.current = window.grecaptcha.render(captchaBoxRef.current, { sitekey: SITE_KEY });
        setCaptchaReady(true);
        clearInterval(t);
      }
      if (tries > 60) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (SITE_KEY) {
      const token = window.grecaptcha && widgetIdRef.current !== null
        ? window.grecaptcha.getResponse(widgetIdRef.current) : '';
      if (!token) { setError('Bitte bestätigen Sie, dass Sie kein Roboter sind.'); return; }

      setLoading(true);
      try {
        const vr = await apiRawPost('/api/verify-recaptcha', { token });
        const vd = await vr.json();
        if (!vd.success) {
          setLoading(false);
          setError('Sicherheitsprüfung fehlgeschlagen. Bitte versuchen Sie es erneut.');
          if (window.grecaptcha && widgetIdRef.current !== null) window.grecaptcha.reset(widgetIdRef.current);
          return;
        }
      } catch (e) {
        setLoading(false);
        setError('Sicherheitsprüfung konnte nicht durchgeführt werden.');
        return;
      }
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setLoading(false); setError(signUpError.message);
      if (window.grecaptcha && widgetIdRef.current !== null) window.grecaptcha.reset(widgetIdRef.current);
      return;
    }

    const user = data.user;
    if (user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: fullName,
        age: age ? parseInt(age, 10) : null
      });
      if (profileError) { setLoading(false); setError('Das Konto wurde angelegt, aber das Profil konnte nicht gespeichert werden: ' + profileError.message); return; }
    }

    setLoading(false);
    if (!data.session) {
      setError('Ro\'yxatdan o\'tdingiz! E-mailingizni tasdiqlang, so\'ng kiring.');
      return;
    }
    router.push('/home');
  }

  return (
    <div className="auth-shell">
      {SITE_KEY && <Script src="https://www.google.com/recaptcha/api.js?render=explicit" strategy="afterInteractive" />}
      <div className="auth-box">
        <h1>Registrieren</h1>
        <p className="sub">Erstellen Sie Ihr FSP-Trainer-Konto.</p>
        <form onSubmit={handleSubmit} className="card">
          <div className="field">
            <label>Vor- und Nachname</label>
            <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="field">
            <label>Alter</label>
            <input type="number" min="18" max="90" value={age} onChange={e => setAge(e.target.value)} />
          </div>
          <div className="field">
            <label>E-Mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Passwort (mind. 6 Zeichen)</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {SITE_KEY && (
            <div className="field">
              <div ref={captchaBoxRef} />
              {!captchaReady && <p style={{ fontSize: 12.5, color: 'var(--faint)' }}>Sicherheitsprüfung wird geladen…</p>}
            </div>
          )}
          {error && <p className="error-text">{error}</p>}
          <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'Einen Moment…' : 'Konto erstellen'}
          </button>
        </form>
        <p className="sub" style={{ marginTop: 16, textAlign: 'center' }}>
          Schon ein Konto? <a href="/login" style={{ color: 'var(--brand)', fontWeight: 500 }}>Anmelden</a>
        </p>
      </div>
    </div>
  );
}
