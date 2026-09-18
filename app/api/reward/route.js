import { createClient } from '@supabase/supabase-js';
import { guard } from '@/lib/apiGuard';

const ALLOWED_REWARDS = new Set([
  'diagnosis:leicht', 'diagnosis:mittel', 'diagnosis:schwer', 'diagnosis:pro',
  'quiz:leicht:pass', 'quiz:mittel:pass', 'quiz:schwer:pass', 'quiz:pro:pass',
  'quiz:leicht:perfect', 'quiz:mittel:perfect', 'quiz:schwer:perfect', 'quiz:pro:perfect',
  'test:correct'
]);

export async function POST(req){
  const gate = await guard(req, 'reward');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    return Response.json({ error: 'Der Belohnungsdienst ist nicht konfiguriert.' }, { status: 500 });
  }

  let body;
  try { body = await req.json(); }
  catch { return Response.json({ error: 'Ungültige Anfrage.' }, { status: 400 }); }

  const rewardKey = String(body?.rewardKey || '');
  const attemptId = String(body?.attemptId || '');
  const units = Math.max(1, Math.min(Number(body?.units) || 1, 20));
  if (!ALLOWED_REWARDS.has(rewardKey) || attemptId.length < 8 || attemptId.length > 100) {
    return Response.json({ error: 'Ungültige Belohnung.' }, { status: 400 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await admin.rpc('award_progress', {
    p_user_id: gate.user.id,
    p_reward_key: rewardKey,
    p_attempt_id: attemptId,
    p_units: units
  });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ profile: Array.isArray(data) ? data[0] || null : data || null });
}
