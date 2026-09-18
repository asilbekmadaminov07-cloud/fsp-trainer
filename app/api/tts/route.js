import { guard } from '@/lib/apiGuard';

export async function POST(req) {
  const gate = await guard(req, 'tts');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Der Sprachdienst ist nicht konfiguriert.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  let payload;
  try { payload = await req.json(); }
  catch { return Response.json({ error: 'Ungültige Anfrage.' }, { status: 400 }); }
  const text = String(payload?.text || '').trim();
  const voiceId = String(payload?.voiceId || '');
  if (!text) {
    return new Response(JSON.stringify({ error: 'Es wurde kein Text übergeben.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  if (text.length > 1200) return Response.json({ error: 'Der Text ist zu lang.' }, { status: 400 });
  if (voiceId && !/^[A-Za-z0-9_-]{10,64}$/.test(voiceId)) {
    return Response.json({ error: 'Ungültige Stimme.' }, { status: 400 });
  }

  const vid = voiceId || '21m00Tcm4TlvDq8ikWAM'; // Rachel — ko'p tilli, nemis tilida yaxshi ishlaydi

  try {
    const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text.slice(0, 1200),
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.42, similarity_boost: 0.75 }
      })
    });

    if (!elRes.ok) {
      const errText = await elRes.text();
      return new Response(JSON.stringify({ error: errText || 'ElevenLabs xatosi' }), {
        status: elRes.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const audioBuffer = await elRes.arrayBuffer();
    return new Response(audioBuffer, { headers: { 'Content-Type': 'audio/mpeg' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Die Anfrage ist fehlgeschlagen: ' + e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
