'use client';
import { useState } from 'react';
import { generateShareCard } from '@/lib/shareCard';

export default function ShareButton({ kicker, title, name, stat, statLabel, label }){
  const [busy, setBusy] = useState(false);

  async function go(){
    setBusy(true);
    try {
      const blob = await generateShareCard({ kicker, title, name, stat, statLabel });
      const file = new File([blob], 'fsp-trainer.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'FSP Trainer', text: title });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'fsp-trainer.png';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } catch (e) { /* foydalanuvchi ulashishni bekor qildi */ }
    setBusy(false);
  }

  return (
    <button className="quiz-btn ghost" onClick={go} disabled={busy}>
      {busy ? '…' : (label || '📤 Teilen')}
    </button>
  );
}
