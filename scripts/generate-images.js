// Bir martalik skript: Gemini rasm modeli orqali har bir holat uchun
// professional tibbiy tasvir yaratadi va public/images/ papkasiga saqlaydi.
//
// Ishlatish:
//   1. Terminalda loyiha papkasiga o'ting (fsp-nextjs-project)
//   2. .env.local faylida GEMINI_API_KEY borligiga ishonch hosil qiling
//      (yoki alohida: set GEMINI_API_KEY=sizning_kalitingiz)
//   3. node scripts/generate-images.js
//
// Natija: public/images/pulpitis.png va h.k. yaratiladi.
// Bu bir martalik ishlaydi — natijalar statik fayl sifatida saqlanadi,
// sayt ishlaganda har safar API chaqirilmaydi.

const fs = require('fs');
const path = require('path');

// .env.local'ni qo'lda o'qiymiz (loyihada dotenv paketi bo'lmasligi mumkin)
function loadEnvLocal(){
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  // BOM (\uFEFF), CR, tirnoqlar va bo'sh qatorlarga chidamli o'qish
  let raw = fs.readFileSync(envPath, 'utf8').replace(/^\uFEFF/, '');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) {
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[m[1]]) process.env[m[1]] = val;
    } else if (/^AQ\.|^AIza/.test(t) && !process.env.GEMINI_API_KEY) {
      // faylga faqat kalitning o'zi yozilgan bo'lsa ham qabul qilamiz
      process.env.GEMINI_API_KEY = t;
    }
  }
}
loadEnvLocal();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('XATOLIK: GEMINI_API_KEY topilmadi (.env.local faylini tekshiring).');
  process.exit(1);
}

const PROMPTS = {
  pulpitis: 'Authentic dental periapical radiograph (X-ray), grayscale, high diagnostic quality. A mandibular first molar (tooth 36) with a deep carious lesion reaching the pulp chamber and a well-defined dark radiolucent lesion at the apex of the mesial root, consistent with apical periodontitis. Show realistic trabecular bone pattern, lamina dura, periodontal ligament space, natural radiographic noise and grayscale gradient. Looks like a scan from a real dental practice. No text, no letters, no numbers, no labels, no arrows, no watermark, no border.',

  gingivitis: 'Authentic clinical intraoral photograph taken with a dental camera and retractors, showing the lower anterior teeth. Marginal gingiva is red, glossy and mildly swollen with rounded papillae; light plaque and calculus along the gumline; teeth otherwise healthy and white. Sharp macro focus, natural clinical lighting with slight specular highlights on wet tissue. Only teeth and gums visible, no face, no lips beyond retractors. No text, no labels, no watermark.',

  caries_primary: 'Authentic dental bitewing radiograph (X-ray) of a child, grayscale, high diagnostic quality. Primary molars of the lower right quadrant, with a deep dark carious lesion on the lower right second primary molar (tooth 84) extending close to the pulp chamber; a faint early radiolucency near the root furcation. Visible permanent tooth germs developing below the primary teeth, thin roots typical of deciduous dentition. Realistic trabecular bone and radiographic grain. No text, no letters, no numbers, no labels, no arrows, no watermark.',

  abscess_rct: 'Authentic dental periapical radiograph (X-ray), grayscale, high diagnostic quality. A maxillary molar with a radiopaque root canal filling that visibly stops several millimetres short of the root apex, and a large well-circumscribed dark radiolucent lesion surrounding the root tip, consistent with a periapical abscess. Realistic trabecular bone pattern and radiographic noise. No text, no letters, no numbers, no labels, no arrows, no watermark.',

  periodontitis_bone: 'Authentic dental periapical radiograph (X-ray), grayscale, high diagnostic quality. Several mandibular teeth showing generalized horizontal alveolar bone loss, with the crestal bone level clearly reduced well below the cemento-enamel junction, widened periodontal ligament spaces and visible subgingival calculus deposits on the root surfaces. Realistic trabecular bone pattern and radiographic grain. No text, no letters, no numbers, no labels, no arrows, no watermark.',

  mronj: 'Authentic clinical intraoral photograph taken with a dental camera, showing a posterior mandibular alveolar ridge at a previous extraction site. A well-demarcated area of exposed, dull grayish-yellow necrotic bone protrudes through the mucosa, surrounded by erythematous, slightly swollen gingiva. Sharp macro focus, natural clinical lighting, wet tissue highlights. Only intraoral tissue visible, no face. No text, no labels, no watermark.',

  normal_xray: 'Authentic dental periapical radiograph (X-ray), grayscale, high diagnostic quality. Healthy mandibular molars with intact enamel and dentin, no caries, normal pulp chambers and root canals, intact lamina dura, uniform periodontal ligament space and a crestal bone level right at the cemento-enamel junction. Realistic trabecular bone pattern and radiographic noise. No text, no letters, no numbers, no labels, no arrows, no watermark.'
};

// Gemini rasm modellari — birinchisi ishlamasa, keyingisiga o'tadi.
const MODELS = (process.env.GEMINI_IMAGE_MODEL ? [process.env.GEMINI_IMAGE_MODEL] : []).concat([
  'gemini-3.1-flash-image',
  'gemini-2.5-flash-image',
  'gemini-2.5-flash-image-preview',
  'gemini-2.0-flash-preview-image-generation'
]);
let WORKING_MODEL = null;

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function callModel(model, prompt){
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['IMAGE'] }
      })
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const err = new Error((data.error && data.error.message) || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  const imgPart = parts.find(p => p.inlineData || p.inline_data);
  if (!imgPart) throw new Error('Javobda rasm topilmadi');
  const inline = imgPart.inlineData || imgPart.inline_data;
  return Buffer.from(inline.data, 'base64');
}

async function generateOne(key, prompt, attempt = 1){
  const models = WORKING_MODEL ? [WORKING_MODEL] : MODELS;
  let lastErr = null;
  for (const model of models) {
    try {
      const buffer = await callModel(model, prompt);
      WORKING_MODEL = model;
      const outDir = path.join(__dirname, '..', 'public', 'images');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, `${key}.png`), buffer);
      console.log(`\u2713 public/images/${key}.png yaratildi (${model}, ${Math.round(buffer.length/1024)} KB)`);
      return;
    } catch (e) {
      lastErr = e;
      const msg = String(e.message || '');
      if ((msg.includes('quota') || e.status === 429) && attempt < 3) {
        console.log(`  ... limitga uchradi, 35 soniya kutib qayta urinamiz (${attempt}/3)`);
        await sleep(35000);
        return generateOne(key, prompt, attempt + 1);
      }
      if (!WORKING_MODEL) { console.log(`  ... ${model} ishlamadi (${msg.slice(0,80)}), keyingisiga o'tamiz`); continue; }
      throw e;
    }
  }
  throw lastErr || new Error('Hech qaysi model ishlamadi');
}

(async () => {
  const outDir = path.join(__dirname, '..', 'public', 'images');
  for (const [key, prompt] of Object.entries(PROMPTS)) {
    const outPath = path.join(outDir, `${key}.png`);
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
      console.log(`… ${key}.png allaqachon bor, o'tkazib yuborildi`);
      continue;
    }
    try {
      await generateOne(key, prompt);
    } catch (e) {
      console.error(`✗ ${key} uchun xatolik: ${e.message}`);
    }
    await sleep(8000);
  }
  console.log('\nTayyor! Sayt endi shu haqiqiy rasmlarni avtomatik ishlatadi.');
})();
