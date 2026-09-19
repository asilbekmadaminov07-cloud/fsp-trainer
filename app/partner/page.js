'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { roomIdFor } from '@/lib/partner';
import ToolShell from '@/app/tools/ToolShell';

// Hamkor qidirish: Supabase Realtime Presence orqali. Har bir mijoz bir xil
// qoida bilan navbatni saralaydi va juftlikni mustaqil hisoblaydi — alohida
// server kerak emas.
export default function PartnerLobby(){
  const router = useRouter();
  const [waiting, setWaiting] = useState([]);
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState('');
  const channelRef = useRef(null);
  const meRef = useRef(null);

  useEffect(() => {
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  async function startSearch(){
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) { router.replace('/login'); return; }
    const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    meRef.current = { id: user.id, name: prof?.full_name || 'Kandidat/in' };

    setSearching(true);
    setStatus('Suche nach einem freien Partner…');

    const ch = supabase.channel('partner-queue', { config: { presence: { key: user.id } } });
    channelRef.current = ch;

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState();
      const entries = Object.entries(state).map(([id, metas]) => ({ id, ...metas[0] }));
      setWaiting(entries.filter(e => e.id !== user.id));

      const sorted = [...entries].sort((a, b) => (a.joinedAt - b.joinedAt) || a.id.localeCompare(b.id));
      const myIndex = sorted.findIndex(e => e.id === user.id);
      if (myIndex === -1) return;
      const pairIndex = myIndex % 2 === 0 ? myIndex + 1 : myIndex - 1;
      const partner = sorted[pairIndex];
      if (partner) {
        const roomId = roomIdFor(user.id, partner.id);
        ch.untrack().then(() => ch.unsubscribe());
        router.push(`/partner/room/${roomId}?peer=${encodeURIComponent(partner.name || 'Partner')}`);
      }
    });

    ch.subscribe(async (subStatus) => {
      if (subStatus === 'SUBSCRIBED') {
        await ch.track({ name: meRef.current.name, joinedAt: Date.now() });
      }
    });
  }

  function cancelSearch(){
    channelRef.current?.untrack();
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setSearching(false);
    setStatus('');
  }

  return (
    <ToolShell title="Partner-Übung" lead="Üben Sie live mit einem anderen FSP-Kandidaten — abwechselnd Arzt und Patient. Kostenlos, in Echtzeit, ohne Termin.">
      {!searching && (
        <div className="panel" style={{ textAlign: 'center', padding: '38px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Klicken Sie auf Start — sobald ein weiterer Kandidat online ist, werden Sie automatisch zusammengeführt.</p>
          <button className="quiz-btn" onClick={startSearch}>Partner suchen</button>
        </div>
      )}

      {searching && (
        <div className="panel partner-lobby" style={{ textAlign: 'center', padding: '30px 24px' }}>
          <span className="spinner" style={{ width: 26, height: 26, marginBottom: 12 }} />
          <p style={{ color: 'var(--muted)', margin: '10px 0 18px' }}>{status}</p>
          {waiting.length > 0 && <p style={{ fontSize: 13, color: 'var(--faint)' }}>{waiting.length} weitere Person(en) online — Zuordnung läuft…</p>}
          <button className="quiz-btn ghost" onClick={cancelSearch}>Abbrechen</button>
        </div>
      )}
    </ToolShell>
  );
}
