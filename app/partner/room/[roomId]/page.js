'use client';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { randomPrompt } from '@/lib/partner';
import ToolShell from '@/app/tools/ToolShell';

function Room(){
  const { roomId } = useParams();
  const params = useSearchParams();
  const router = useRouter();
  const peerName = params.get('peer') || 'Partner';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [ready, setReady] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);
  const [myId, setMyId] = useState(null);
  const [prompt] = useState(() => randomPrompt());
  const meRef = useRef(null);
  const chRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) { router.replace('/login'); return; }
      const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (!alive) return;
      meRef.current = { id: user.id, name: prof?.full_name || 'Ich' };
      setMyId(user.id);

      const ch = supabase.channel(`partner-room-${roomId}`, { config: { presence: { key: user.id } } });
      chRef.current = ch;

      ch.on('broadcast', { event: 'msg' }, ({ payload }) => {
        setMessages(m => [...m, payload]);
      });
      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState();
        setPeerOnline(Object.keys(state).some(id => id !== user.id));
      });
      ch.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({ name: meRef.current.name });
          setReady(true);
        }
      });
    })();
    return () => { alive = false; chRef.current?.unsubscribe(); };
  }, [roomId, router]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  function send(){
    const text = input.trim();
    if (!text || !chRef.current) return;
    const payload = { from: meRef.current.id, name: meRef.current.name, text, at: Date.now() };
    chRef.current.send({ type: 'broadcast', event: 'msg', payload });
    setMessages(m => [...m, payload]);
    setInput('');
  }

  function leave(){
    chRef.current?.unsubscribe();
    router.push('/partner');
  }

  return (
    <ToolShell title={'Partner-Übung mit ' + peerName} lead={prompt}>
      <div className="partner-chat">
        <div className="partner-chat-body" ref={bodyRef}>
          {!ready && <div className="partner-msg sys">Verbindung wird hergestellt…</div>}
          {ready && !peerOnline && <div className="partner-msg sys">Warte auf {peerName}…</div>}
          {messages.map((m, i) => (
            <div className={'partner-msg ' + (m.from === myId ? 'me' : 'them')} key={i}>{m.text}</div>
          ))}
        </div>
        <div className="partner-chat-input">
          <input
            placeholder="Nachricht schreiben…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
          />
          <button className="quiz-btn" onClick={send}>Senden</button>
        </div>
      </div>
      <div className="quiz-actions" style={{ marginTop: 16 }}>
        <button className="quiz-btn ghost" onClick={leave}>Übung beenden</button>
      </div>
    </ToolShell>
  );
}

export default function PartnerRoomPage(){
  return <Suspense fallback={null}><Room /></Suspense>;
}
