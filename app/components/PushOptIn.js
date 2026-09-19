'use client';
import { useEffect, useState } from 'react';
import { pushSupported, isPushEnabled, enablePush } from '@/lib/push';

const DISMISS_KEY = 'fsp-push-banner-dismissed';

export default function PushOptIn({ userId }){
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId || !pushSupported()) return;
    if (typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY)) return;
    isPushEnabled().then(on => { if (!on) setShow(true); });
  }, [userId]);

  async function accept(){
    setBusy(true);
    const ok = await enablePush(userId);
    setBusy(false);
    setShow(false);
    if (!ok) try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
  }

  function dismiss(){
    setShow(false);
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch (e) {}
  }

  if (!show) return null;
  return (
    <div className="push-banner">
      <span style={{ fontSize: 22 }}>🔔</span>
      <p>Tägliche Erinnerung aktivieren, damit Ihre Serie nicht abbricht?</p>
      <div className="actions">
        <button className="quiz-btn ghost" onClick={dismiss}>Nicht jetzt</button>
        <button className="quiz-btn" onClick={accept} disabled={busy}>{busy ? '…' : 'Aktivieren'}</button>
      </div>
    </div>
  );
}
