'use client';
import { useState } from 'react';
import { referralLink } from '@/lib/referral';

export default function ReferralCard({ profile }){
  const [copied, setCopied] = useState(false);
  if (!profile?.referral_code) return null;
  const link = referralLink(profile.referral_code);

  async function copy(){
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch (e) { /* clipboard yo'q bo'lsa jim o'tkazamiz */ }
  }

  async function share(){
    if (navigator.share) {
      try { await navigator.share({ title: 'FSP Trainer', text: 'Üben Sie mit mir für die FSP — kostenlos!', url: link }); return; }
      catch (e) { /* foydalanuvchi bekor qildi */ }
    }
    copy();
  }

  return (
    <div className="panel referral-card">
      <h3>🎁 Freunde einladen</h3>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 14 }}>
        Für jeden Freund, der sich über Ihren Link registriert, erhalten Sie beide einen Bonus — 60 Coins und 30 XP extra.
      </p>
      <div className="referral-link-row">
        <input readOnly value={link} onFocus={e => e.target.select()} />
        <button className="quiz-btn" onClick={copy}>{copied ? '✓ Kopiert' : 'Kopieren'}</button>
      </div>
      <button className="quiz-btn ghost" style={{ marginTop: 10, width: '100%' }} onClick={share}>Teilen →</button>
    </div>
  );
}
