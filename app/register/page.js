'use client';
import { Suspense, useRef, useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import { supabase } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import TiltCard from '@/app/components/TiltCard';
import { claimReferral } from '@/lib/referral';
import { BUNDESLAENDER } from '@/lib/bundesland';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const refCode = params.get('ref') || '';
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [bundesland, setBundesland] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const captchaRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (SITE_KEY && !captchaToken) {
      setError('Bitte bestätigen Sie, dass Sie kein Roboter sind.');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: SITE_KEY ? { captchaToken } : undefined
    });
    if (signUpError) {
      setLoading(false); setError(signUpError.message);
      captchaRef.current?.reset?.();
      setCaptchaToken('');
      return;
    }

    const user = data.user;
    if (user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: fullName,
        age: age ? parseInt(age, 10) : null,
        bundesland: bundesland || null
      });
      if (profileError) { setLoading(false); setError('Das Konto wurde angelegt, aber das Profil konnte nicht gespeichert werden: ' + profileError.message); return; }
      if (refCode) claimReferral(refCode).then(() => {});
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
      <TiltCard className="auth-box">
        <h1>Registrieren</h1>
        <p className="sub">Erstellen Sie Ihr FSP-Trainer-Konto.</p>
        {refCode && <p className="sub" style={{ color: 'var(--brand)', fontWeight: 600, marginBottom: 8 }}>🎁 Einladung erkannt — Sie und Ihr Freund erhalten einen Bonus!</p>}
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
            <label>Ziel-Bundesland (optional)</label>
            <select value={bundesland} onChange={e => setBundesland(e.target.value)}>
              <option value="">Noch nicht bekannt</option>
              {BUNDESLAENDER.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
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
              <Turnstile
                ref={captchaRef}
                siteKey={SITE_KEY}
                onSuccess={setCaptchaToken}
                onExpire={() => setCaptchaToken('')}
                onError={() => setCaptchaToken('')}
              />
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
      </TiltCard>
    </div>
  );
}

export default function Register() {
  return <Suspense fallback={null}><RegisterForm /></Suspense>;
}
