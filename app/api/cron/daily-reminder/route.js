// Har kuni Vercel Cron orqali chaqiriladi (vercel.json'ga qarang).
// Bugun hali mashq qilmagan, lekin push-bildirishnomani yoqqan foydalanuvchilarga eslatma yuboradi.

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

export async function GET(req) {
  const auth = req.headers.get('authorization') || '';
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!url || !serviceKey || !vapidPublic || !vapidPrivate) {
    return Response.json({ error: 'Push ist nicht konfiguriert.' }, { status: 500 });
  }

  webpush.setVapidDetails('mailto:support@fsp-trainer.app', vapidPublic, vapidPrivate);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const today = new Date().toISOString().slice(0, 10);
  const { data: subs, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, user_id, profiles!inner(last_practice_date, full_name)')
    .or(`last_practice_date.is.null,last_practice_date.neq.${today}`, { foreignTable: 'profiles' });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  let sent = 0, removed = 0;
  await Promise.all((subs || []).map(async (s) => {
    const payload = JSON.stringify({
      title: 'FSP Trainer',
      body: 'Heute noch kein Training — 5 Minuten reichen, um Ihre Serie zu halten!',
      url: '/daily'
    });
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('id', s.id);
        removed++;
      }
    }
  }));

  return Response.json({ sent, removed, total: (subs || []).length });
}
