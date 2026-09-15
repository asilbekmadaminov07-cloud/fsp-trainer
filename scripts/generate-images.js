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
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }
}
loadEnvLocal();

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('XATOLIK: GEMINI_API_KEY topilmadi (.env.local faylini tekshiring).');
  process.exit(1);
}

const PROMPTS = {
  pulpitis: 'A professional dental periapical X-ray radiograph, black and white, showing a lower molar tooth with a clearly visible dark radiolucent shadow at the root apex, indicating apical periodontitis. Realistic radiographic grain and contrast, clinical style, no text, no labels, no watermark.',
  gingivitis: 'A close-up clinical intraoral photograph of front teeth showing mild gingivitis: a red, mildly swollen gum margin along healthy white teeth, light plaque buildup at the gumline. Professional dental photography, natural clinical lighting, no text, no watermark, no identifiable face.',
  abscess_rct: 'A professional dental periapical X-ray radiograph in grayscale showing an upper molar tooth with a visible root canal filling that stops short of the root apex, and a large dark radiolucent area around the root tip indicating an abscess. Realistic radiographic texture, clinical style, no text, no watermark.',
  periodontitis_bone: 'A professional dental periapical X-ray radiograph in grayscale, showing several teeth with visible horizontal alveolar bone loss below the normal bone crest level, generalized pattern. Realistic radiographic texture, clinical style, no text, no watermark.',
  mronj: 'A close-up clinical intraoral photograph showing an area of exposed, necrotic, grayish-yellow jawbone at a healed tooth extraction site, surrounded by inflamed red gum tissue. Professional dental clinical photography, natural lighting, no text, no watermark, no identifiable face.',
  normal_xray: 'A professional dental periapical X-ray radiograph in grayscale showing healthy, normal teeth and jawbone with no visible pathology, intact bone level, clean root canals. Realistic radiographic texture, clinical style, no text, no watermark.'
};

function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function generateOne(key, prompt, attempt = 1){
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }] })
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const msg = (data.error && data.error.message) || `HTTP ${res.status}`;
    if (msg.includes('quota') && attempt < 3) {
      console.log(`  ... limitga uchradi, 35 soniya kutib qayta urinamiz (${attempt}/3)`);
      await sleep(35000);
      return generateOne(key, prompt, attempt + 1);
    }
    throw new Error(msg);
  }
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find(p => p.inlineData || p.inline_data);
  if (!imgPart) throw new Error('Javobda rasm topilmadi');
  const inline = imgPart.inlineData || imgPart.inline_data;
  const buffer = Buffer.from(inline.data, 'base64');
  const outDir = path.join(__dirname, '..', 'public', 'images');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${key}.png`), buffer);
  console.log(`✓ public/images/${key}.png yaratildi`);
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
