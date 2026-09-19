import { apiRawPost } from '@/lib/api';
// Har bir "bemor" uchun bir xil ovoz butun suhbat davomida saqlanishi uchun
// bir nechta tabiiy ovoz ID'lari (ElevenLabs standart ovozlari, ko'p tilli model orqali nemis tilida ham ishlaydi).
export const PATIENT_VOICES = [
  '21m00Tcm4TlvDq8ikWAM', // Rachel — ayol
  'EXAVITQu4vr4xnSDxMaL', // Bella — ayol
  'TxGEqnHWrfWFTfGW9XjX', // Josh — erkak
  'VR6AewLTigWG4xSOukaG'  // Arnold — erkak
];

export function pickVoice(){
  return PATIENT_VOICES[Math.floor(Math.random() * PATIENT_VOICES.length)];
}

// iOS'da speechSynthesis faqat foydalanuvchi tegib turgan payt (tap) ichida birinchi
// marta chaqirilsa ishlaydi. Bu funksiya tugma bosilgan zahoti chaqiriladi — shu
// "ruxsat" ni ushlab qolish uchun jimjit bo'sh matn bilan sinth ishga tushiriladi.
export function unlockAudio(){
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(u);
  } catch (e) { /* e'tiborsiz */ }
}

// PATIENT_VOICES'dagi qaysi ID erkak ovozga mos kelishini bildiradi — brauzer
// ovozida biroz balandlik (pitch) farqi bilan bemorlar orasida ozgina xilma-xillik
// yaratish uchun ishlatiladi.
const MALE_VOICE_IDS = new Set(['TxGEqnHWrfWFTfGW9XjX', 'VR6AewLTigWG4xSOukaG']);

// Matnni bepul brauzer ovoz sintezi orqali o'qiydi (Web Speech API — hech qanday
// kalit yoki to'lov talab qilmaydi, har bir zamonaviy brauzerda mavjud).
// Promise onend chaqirilganda yoki xato bo'lganda ham hal bo'ladi (hech qachon abadiy osilib qolmaydi).
export function speakNatural(text, voiceId){
  return new Promise((resolve) => {
    if (!text || !text.trim()) { resolve(); return; }
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return; }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'de-DE';
    const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('de'));
    if (voices.length) {
      // voiceId'dan barqaror indeks chiqaramiz — bir xil bemor butun suhbat
      // davomida bir xil ovozda gapiradi, lekin bemorlar orasida farqlanadi.
      const seed = String(voiceId || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      utter.voice = voices[seed % voices.length];
    }
    utter.pitch = MALE_VOICE_IDS.has(voiceId) ? 0.85 : 1.1;
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}

export function stopSpeaking(){
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
}

// ---------------------------------------------------------------------------
// Ovoz yozib olish (iOS va nutq-tanish ishlamaydigan boshqa brauzerlar uchun)
// ---------------------------------------------------------------------------

// Brauzer uzluksiz nutq-tanishni qo'llab-quvvatlaydimi?
export function hasSpeechRecognition(){
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function hasRecorder(){
  if (typeof window === 'undefined') return false;
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

function pickRecorderMime(){
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',            // Safari / iOS
    'audio/mpeg',
    'audio/ogg;codecs=opus'
  ];
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return '';
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

// Yozishni boshlaydi. Qaytadi: { stop() -> Promise<{ audioBase64, mimeType }> }
export async function startRecording(){
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true }
  });
  const mime = pickRecorderMime();
  const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
  rec.start();

  return {
    stop(){
      return new Promise((resolve, reject) => {
        rec.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          try {
            const type = rec.mimeType || mime || 'audio/webm';
            const blob = new Blob(chunks, { type });
            if (blob.size < 1200) { resolve(null); return; } // deyarli jimlik
            const audioBase64 = await blobToBase64(blob);
            resolve({ audioBase64, mimeType: type });
          } catch (e) { reject(e); }
        };
        try { rec.stop(); } catch (e) { reject(e); }
      });
    },
    cancel(){
      try { rec.stop(); } catch (e) {}
      stream.getTracks().forEach(t => t.stop());
    }
  };
}

function blobToBase64(blob){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Yozib olingan ovozni matnga aylantiradi (server orqali Gemini'da).
export async function transcribeAudio(payload){
  if (!payload) return '';
  const res = await apiRawPost('/api/transcribe', payload);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Die Aufnahme konnte nicht ausgewertet werden.');
  return (data.text || '').trim();
}
