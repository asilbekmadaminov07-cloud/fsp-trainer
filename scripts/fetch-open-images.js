// Wikimedia Commons'dan OCHIQ LITSENZIYALI tibbiy rasmlarni olish.
//
// Ishlatish:
//   node scripts/fetch-open-images.js list            → nomzodlarning litsenziya/muallif/tavsifini ko'rsatadi
//   node scripts/fetch-open-images.js search "termin" → Commons'dan qidiradi
//   node scripts/fetch-open-images.js download        → CHOSEN ro'yxatidagilarni yuklab oladi
//
// Yuklab olingan rasmlar: public/images/<key>.<kengaytma>
// Atribut ma'lumotlari:   public/images/credits.json  (saytda ko'rsatiladi — CC BY talabi)

const fs = require('fs');
const path = require('path');

const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'FSP-Trainer/1.0 (educational dental exam trainer; contact via GitHub)';

// Har bir holat uchun nomzodlar. Birinchisi afzal, keyingilari zaxira.
const CANDIDATES = {
  pulpitis: [
    'File:Chronic apical periodontitis.jpg',
    'File:Periapical radiolucency.jpg',
    'File:Tooth decay and abscess xray.png'
  ],
  gingivitis: [
    'File:Gingivitis-before.JPG',
    'File:Gingivitis.png',
    'File:Gingivitis-before-and-after-3.jpg'
  ],
  caries_primary: [
    'File:Intraoral Periapical Radiograph (IOPA) showing Deciduous(Milky or Primary) Tooth 75 and developing crown of Permanent or Secondary Teeth 35, 36 and 37.jpg',
    'File:Dental Caries Cavity 2.JPG'
  ],
  periodontitis_bone: [
    'File:Periodontitis 01.jpg'
  ],
  mronj: [
    'File:Stage 3 MRONJ.jpg'
  ],
  normal_xray: [
    'File:Dental X-ray.jpg',
    'File:Periapical radiograph.jpg'
  ]
};

// `list` natijasini ko'rib chiqqach, tasdiqlangan fayllarni shu yerga yozamiz.
// Bo'sh bo'lsa, `download` CANDIDATES'ning birinchisini oladi.
const CHOSEN = {};

// Ruxsat etilgan litsenziyalar (qisqa nomi shu so'zlardan birini o'z ichiga olishi kerak)
const OK_LICENSE = /^(cc0|cc by|cc-by|public domain|pd-|gfdl)/i;

function apiUrl(params){
  const u = new URL(API);
  u.searchParams.set('format', 'json');
  u.searchParams.set('origin', '*');
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return u.toString();
}

async function getJson(url){
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function stripHtml(s){
  return String(s || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

async function infoFor(titles){
  const url = apiUrl({
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata'
  });
  const data = await getJson(url);
  const pages = (data.query && data.query.pages) || {};
  const out = [];
  for (const id of Object.keys(pages)) {
    const p = pages[id];
    if (p.missing !== undefined) { out.push({ title: p.title, missing: true }); continue; }
    const ii = (p.imageinfo || [])[0];
    if (!ii) { out.push({ title: p.title, missing: true }); continue; }
    const m = ii.extmetadata || {};
    out.push({
      title: p.title,
      url: ii.url,
      mime: ii.mime,
      width: ii.width,
      height: ii.height,
      license: stripHtml(m.LicenseShortName && m.LicenseShortName.value),
      artist: stripHtml(m.Artist && m.Artist.value),
      description: stripHtml(m.ImageDescription && m.ImageDescription.value).slice(0, 320),
      descUrl: ii.descriptionurl
    });
  }
  return out;
}

async function cmdList(){
  for (const [key, titles] of Object.entries(CANDIDATES)) {
    console.log('\n' + '='.repeat(70));
    console.log('HOLAT: ' + key);
    console.log('='.repeat(70));
    let infos;
    try { infos = await infoFor(titles); }
    catch (e) { console.log('  XATO: ' + e.message); continue; }
    // API tartibni saqlamaydi — nomzod tartibiga qaytaramiz
    infos.sort((a, b) => titles.indexOf(a.title) - titles.indexOf(b.title));
    for (const i of infos) {
      if (i.missing) { console.log(`\n  ✗ ${i.title} — TOPILMADI`); continue; }
      const ok = OK_LICENSE.test(i.license) ? '✓' : '?';
      console.log(`\n  ${ok} ${i.title}`);
      console.log(`     litsenziya : ${i.license}`);
      console.log(`     muallif    : ${i.artist}`);
      console.log(`     o'lcham    : ${i.width}x${i.height}  ${i.mime}`);
      console.log(`     tavsif     : ${i.description}`);
      console.log(`     sahifa     : ${i.descUrl}`);
    }
  }
  console.log('\nTayyor. Natijani Claude\'ga yuboring — u qaysi rasm qaysi holatga mos kelishini baholaydi.');
}

async function cmdSearch(term){
  if (!term) { console.log('Qidiruv so\'zini kiriting.'); return; }
  const url = apiUrl({
    action: 'query', list: 'search', srsearch: term,
    srnamespace: '6', srlimit: '20'
  });
  const data = await getJson(url);
  const hits = (data.query && data.query.search) || [];
  if (!hits.length) { console.log('Hech narsa topilmadi: ' + term); return; }
  await printBatch(hits.map(h => h.title));
}

async function cmdCat(cat){
  if (!cat) { console.log('Kategoriya nomini kiriting.'); return; }
  if (!/^Category:/i.test(cat)) cat = 'Category:' + cat;
  const url = apiUrl({
    action: 'query', list: 'categorymembers', cmtitle: cat,
    cmtype: 'file', cmlimit: '40'
  });
  const data = await getJson(url);
  const hits = (data.query && data.query.categorymembers) || [];
  if (!hits.length) { console.log('Kategoriya bo\'sh yoki topilmadi: ' + cat); return; }
  console.log(`\n### ${cat} — ${hits.length} ta fayl\n`);
  await printBatch(hits.map(h => h.title));
}

// Ko'p faylni 25 tadan bo'lib so'raymiz (API cheklovi)
async function printBatch(titles){
  for (let i = 0; i < titles.length; i += 25) {
    const chunk = titles.slice(i, i + 25);
    let infos;
    try { infos = await infoFor(chunk); }
    catch (e) { console.log('  XATO: ' + e.message); continue; }
    for (const info of infos) {
      if (info.missing) continue;
      // PDF, DJVU, TIFF va boshqa hujjatlarni tashlab yuboramiz — faqat rasm kerak
      if (!/^image\/(jpeg|png|gif|webp)$/.test(info.mime || '')) continue;
      const ok = OK_LICENSE.test(info.license) ? '\u2713' : '?';
      console.log(`${ok} ${info.title}`);
      console.log(`    ${info.license} | ${info.width}x${info.height} | ${info.artist}`);
      console.log(`    ${info.description.slice(0, 220)}`);
      console.log('');
    }
  }
}

// Nomzodlarni _preview/ papkasiga yuklaydi — Claude ularni ko'rib, mosligini tekshiradi.
async function cmdPreview(titles){
  if (!titles.length) { console.log('Fayl nomlarini kiriting.'); return; }
  const outDir = path.join(__dirname, '..', '_preview');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  for (const t of titles) {
    const title = /^File:/i.test(t) ? t : 'File:' + t;
    let info;
    try { info = (await infoFor([title]))[0]; }
    catch (e) { console.log(`\u2717 ${title}: ${e.message}`); continue; }
    if (!info || info.missing) { console.log(`\u2717 ${title}: topilmadi`); continue; }
    // 1000px kenglikdagi nusxa — ko'rish uchun yetarli, tez yuklanadi
    const u = new URL(API);
    u.searchParams.set('format','json'); u.searchParams.set('action','query');
    u.searchParams.set('titles', title); u.searchParams.set('prop','imageinfo');
    u.searchParams.set('iiprop','url'); u.searchParams.set('iiurlwidth','1000');
    let src = info.url;
    try {
      const d = await getJson(u.toString());
      const pg = Object.values((d.query && d.query.pages) || {})[0];
      const ii = pg && (pg.imageinfo || [])[0];
      if (ii && ii.thumburl) src = ii.thumburl;
    } catch (e) {}
    try {
      const res = await fetch(src, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      const safe = title.replace(/^File:/i,'').replace(/[^A-Za-z0-9._-]+/g,'_').slice(0,70);
      const name = /\.(jpe?g|png|gif|webp)$/i.test(safe) ? safe : safe + '.jpg';
      fs.writeFileSync(path.join(outDir, name), buf);
      console.log(`\u2713 _preview/${name}  (${Math.round(buf.length/1024)} KB)`);
    } catch (e) {
      console.log(`\u2717 ${title}: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 400));
  }
  console.log('\nTayyor. Claude\'ga xabar bering — u rasmlarni ko\'rib baholaydi.');
}

function extFromMime(mime, url){
  if (mime === 'image/png') return 'png';
  if (mime === 'image/jpeg') return 'jpg';
  const m = String(url).match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : 'jpg';
}

async function cmdDownload(){
  const outDir = path.join(__dirname, '..', 'public', 'images');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const credits = {};

  for (const [key, titles] of Object.entries(CANDIDATES)) {
    const title = CHOSEN[key] || titles[0];
    let info;
    try { info = (await infoFor([title]))[0]; }
    catch (e) { console.log(`✗ ${key}: ${e.message}`); continue; }
    if (!info || info.missing) { console.log(`✗ ${key}: "${title}" topilmadi`); continue; }
    if (!OK_LICENSE.test(info.license)) {
      console.log(`✗ ${key}: litsenziya mos emas (${info.license}) — o'tkazib yuborildi`);
      continue;
    }
    try {
      const res = await fetch(info.url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = Buffer.from(await res.arrayBuffer());
      const ext = extFromMime(info.mime, info.url);
      fs.writeFileSync(path.join(outDir, `${key}.${ext}`), buf);
      credits[key] = {
        file: `${key}.${ext}`,
        title: info.title,
        license: info.license,
        artist: info.artist,
        source: info.descUrl
      };
      console.log(`✓ ${key}.${ext}  (${Math.round(buf.length/1024)} KB, ${info.license})`);
    } catch (e) {
      console.log(`✗ ${key}: yuklab bo'lmadi — ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 600));
  }

  fs.writeFileSync(path.join(outDir, 'credits.json'), JSON.stringify(credits, null, 2));
  console.log(`\ncredits.json yozildi (${Object.keys(credits).length} ta rasm). Atribut saytda ko'rsatiladi.`);
}

const cmd = process.argv[2] || 'list';
(async () => {
  if (cmd === 'list') await cmdList();
  else if (cmd === 'search') await cmdSearch(process.argv.slice(3).join(' '));
  else if (cmd === 'cat') await cmdCat(process.argv.slice(3).join(' '));
  else if (cmd === 'preview') await cmdPreview(process.argv.slice(3));
  else if (cmd === 'download') await cmdDownload();
  else console.log('Buyruqlar: list | search "termin" | cat "Category:Nomi" | download');
})();
