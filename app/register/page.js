'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setLoading(false); setError(signUpError.message); return; }

    const user = data.user;
    if (user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: fullName,
        age: age ? parseInt(age, 10) : null
      });
      if (profileError) { setLoading(false); setError('Konto yaratildi, lekin profil xatosi: ' + profileError.message); return; }
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
