'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import ShareButton from '@/app/components/ShareButton';

export default function CertificatePage() {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) { router.replace('/login'); return; }
      const userId = auth.session.user.id;
      const [{ data: profile }, { count }] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', userId).single(),
        supabase.from('daily_training_sessions').select('id', { count: 'exact', head: true }).eq('user_id', userId)
      ]);
      setData({ name: profile?.full_name || auth.session.user.email, sessions: count || 0 });
    })();
  }, [router]);

  if (!data) return null;
  if (data.sessions < 7) return <main className="certificate-page locked-cert"><div className="panel"><h1>Zertifikat noch gesperrt</h1><p>Schließen Sie an 7 verschiedenen Tagen das 10-Minuten-Training ab. Aktuell: {data.sessions}/7.</p><a className="quiz-btn" href="/daily">Heute trainieren</a></div></main>;

  return <main className="certificate-page">
    <div className="certificate-actions">
      <a href="/home" className="quiz-btn ghost">← Übersicht</a>
      <button className="quiz-btn" onClick={() => window.print()}>Als PDF speichern / drucken</button>
      <ShareButton kicker="TEILNAHMENACHWEIS" title="FSP-Tagestraining absolviert" name={data.name} stat={data.sessions} statLabel="Tage trainiert" label="📤 Zertifikat teilen" />
    </div>
    <section className="certificate">
      <div className="cert-mark">FSP<span>.</span>Trainer</div>
      <div className="cert-kicker">TEILNAHMENACHWEIS</div>
      <h1>Zertifikat</h1>
      <p className="cert-intro">Hiermit wird bestätigt, dass</p>
      <h2>{data.name}</h2>
      <p>das persönliche FSP-Tagestraining an mindestens sieben verschiedenen Tagen erfolgreich absolviert hat.</p>
      <div className="cert-stat"><b>{data.sessions}</b><span>abgeschlossene Tagestrainings</span></div>
      <div className="cert-bottom"><span>Ausgestellt am {new Date().toLocaleDateString('de-DE')}</span><strong>FSP.Trainer · Zahnmedizin</strong></div>
    </section>
    <p className="cert-disclaimer">Dieser Nachweis dokumentiert die Teilnahme am Training und ist kein staatlich anerkanntes Prüfungszertifikat.</p>
  </main>;
}
