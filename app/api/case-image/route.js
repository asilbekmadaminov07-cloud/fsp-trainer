// Commons fayl nomini haqiqiy rasm manziliga va atribut ma'lumotlariga aylantiradi.
// Rasm repoda saqlanmaydi — sayt ishlagan paytda Wikimedia CDN'idan olinadi.
//
// GET /api/case-image?file=File:Gingivitis-before.JPG
// → { url, thumb, width, height, license, artist, title, source }

import { guard } from '@/lib/apiGuard';

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'FSP-Trainer/1.0 (educational dental exam trainer)';

// Faqat ochiq litsenziyalar. Boshqasi kelsa rad etamiz.
const OK_LICENSE = /^(cc0|cc by|cc-by|public domain|pd-|gfdl)/i;

// Vercel'da javob 24 soat keshlanadi — har ochilishda Wikimedia'ga bormaydi.
export const revalidate = 86400;

function stripHtml(s){
  return String(s || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(req) {
  const gate = await guard(req, 'case-image');
  if (gate.error) return Response.json({ error: gate.error }, { status: gate.status });

  const { searchParams } = new URL(req.url);
  let file = searchParams.get('file');
  if (!file) return Response.json({ error: 'Es wurde keine Bilddatei angegeben.' }, { status: 400 });
  if (file.length > 240 || /[\r\n\0]/.test(file)) {
    return Response.json({ error: 'Ungültiger Dateiname.' }, { status: 400 });
  }
  if (!/^File:/i.test(file)) file = 'File:' + file;

  // Kichikroq nusxa — mobil uchun yetarli, tez yuklanadi
  const width = Math.min(parseInt(searchParams.get('width') || '900', 10) || 900, 1600);

  const u = new URL(API);
  u.searchParams.set('format', 'json');
  u.searchParams.set('action', 'query');
  u.searchParams.set('titles', file);
  u.searchParams.set('prop', 'imageinfo');
  u.searchParams.set('iiprop', 'url|size|mime|extmetadata');
  u.searchParams.set('iiurlwidth', String(width));

  try {
    const res = await fetch(u.toString(), {
      headers: { 'User-Agent': UA },
      next: { revalidate: 86400 }
    });
    if (!res.ok) {
      return Response.json({ error: 'Die Bilddatenbank antwortet nicht (' + res.status + ')' }, { status: 502 });
    }
    const data = await res.json();
    const pages = (data.query && data.query.pages) || {};
    const page = Object.values(pages)[0];
    if (!page || page.missing !== undefined) {
      return Response.json({ error: 'Bild nicht gefunden: ' + file }, { status: 404 });
    }
    const ii = (page.imageinfo || [])[0];
    if (!ii) return Response.json({ error: 'Zu diesem Bild liegen keine Daten vor.' }, { status: 404 });

    const m = ii.extmetadata || {};
    const license = stripHtml(m.LicenseShortName && m.LicenseShortName.value);
    if (!OK_LICENSE.test(license)) {
      return Response.json({ error: 'Die Lizenz dieses Bildes ist nicht zulässig: ' + license }, { status: 403 });
    }

    return Response.json({
      url: ii.thumburl || ii.url,
      full: ii.url,
      width: ii.thumbwidth || ii.width,
      height: ii.thumbheight || ii.height,
      license,
      artist: stripHtml(m.Artist && m.Artist.value),
      title: page.title,
      source: ii.descriptionurl
    });
  } catch (e) {
    return Response.json({ error: 'Die Anfrage ist fehlgeschlagen: ' + e.message }, { status: 500 });
  }
}
