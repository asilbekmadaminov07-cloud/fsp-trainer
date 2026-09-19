'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import TiltCard from '@/app/components/TiltCard';
import { friendlyError } from '@/lib/errors';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push('/home');
  }

  return (
    <div className="auth-shell">
      <TiltCard className="auth-box">
        <h1>Anmelden</h1>
        <p className="sub">Willkommen zurück — machen Sie da weiter, wo Sie aufgehört haben.</p>
        <form onSubmit={handleSubmit} className="card">
          <div className="field">
            <label>E-Mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Passwort</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <p className="error-text">{friendlyError(error)}</p>}
          <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'Einen Moment…' : 'Anmelden'}
          </button>
        </form>
        <p className="sub" style={{ marginTop: 16, textAlign: 'center' }}>
          Noch kein Konto? <a href="/register" style={{ color: 'var(--brand)', fontWeight: 500 }}>Registrieren</a>
        </p>
      </TiltCard>
    </div>
  );
}
