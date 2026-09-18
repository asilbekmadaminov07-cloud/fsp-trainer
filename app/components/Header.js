'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { daysSince } from '@/lib/practice';
import SensorToggle from '@/app/components/SensorToggle';

// Barcha ichki sahifalar uchun umumiy tepa panel: hisob ma'lumotlari,
// amaliyot statistikasi va chiqish tugmasi bitta joyda.
export default function Header({ profile, backHref }){
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const boxRef = useRef(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email || ''));
  }, []);

  useEffect(() => {
    function onDoc(e){ if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function handleLogout(){
    await supabase.auth.signOut();
    router.replace('/');
  }

  if (!profile) return null;
  const initials = (profile.full_name || '?').trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const memberDays = daysSince(profile.created_at);
  const practiceDays = profile.practice_days || 0;

  return (
    <div className="topbar">
      <div className="topbar-inner">
        <a href={backHref || '/home'} className="brand-mark" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {backHref && <span style={{ fontSize: 14 }}>←</span>}
          FSP<span style={{ color: 'var(--brand)' }}>.</span>Trainer
        </a>
        <div className="stats">
          <span className="stat coins" title="Praxiskonto">💰 <b>{profile.coins ?? 0}</b></span>
          <span className="stat level" title="Stufe">⭐ <b>{profile.level ?? 1}</b></span>
          <span className="streak-badge" title="An diesen Tagen geübt">🔥 {practiceDays} Tage</span>

          <div className="acct" ref={boxRef}>
            <button className="acct-menu-btn" onClick={() => setOpen(o => !o)} aria-label="Konto">
              <div className="acct-avatar">{initials}</div>
            </button>
            <div className="acct-info">
              <span className="acct-name">{profile.full_name}</span>
              <span className="acct-email">{email}</span>
            </div>

            {open && (
              <div className="acct-dropdown">
                <div className="row-item"><span>Angemeldet als</span><b style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</b></div>
                <div className="row-item"><span>Mitglied seit</span><b>{memberDays} Tage</b></div>
                <div className="row-item"><span>Geübt an</span><b>{practiceDays} Tagen</b></div>
                <a href="/mistakes" className="row-item" style={{ cursor: 'pointer' }}><span>Meine Fehler</span><b>→</b></a>
                <a href="/daily" className="row-item" style={{ cursor: 'pointer' }}><span>10-Minuten-Training</span><b>→</b></a>
                <a href="/coach" className="row-item" style={{ cursor: 'pointer' }}><span>AI-Lerncoach</span><b>→</b></a>
                <a href="/home" className="row-item" style={{ cursor: 'pointer' }}><span>Dashboard</span><b>→</b></a>
                <div style={{ marginTop: 10 }}><SensorToggle /></div>
                <button className="logout-btn" style={{ width: '100%', marginTop: 8 }} onClick={handleLogout}>Abmelden</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
