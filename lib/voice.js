// Har bir "bemor" uchun bir xil ovoz butun suhbat davomida saqlanishi uchun
// bir nechta tabiiy ovoz ID'lari (ElevenLabs standart ovozlari, ko'p tilli model orqali nemis tilida ham ishlaydi).
import { apiRaw, apiPost } from './api';

export const PATIENT_VOICES = [
  '21m00Tcm4TlvDq8ikWAM', // Rachel — ayol
  'EXAVITQu4vr4xnSDxMaL', // Bella — ayol
  'TxGEqnHWrfWFTfGW9XjX', // Josh — erkak
  'VR6AewLTigWG4xSOukaG'  // Arnold — erkak
];

export function pickVoice(){
  return PATIENT_VOICES[Math.floor(Math.random() * PATIENT_VOICES.length)];
}

// ---------------------------------------------------------------------------
// iOS uchun audio "qulfini ochish".
// iPhone'da <audio>.play() faqat foydalanuvchi tegib turgan payt (tap) ishga tushadi.
// Shuning uchun bitta umumiy Audio elementi yaratamiz, uni tugma bosilganda jimjit
// tovush bilan bir marta "uyg'otamiz" va keyin barcha javoblarni xuddi shu element
// orqali o'ynatamiz — brauzer uni allaqachon ruxsat berilgan deb hisoblaydi.
// ---------------------------------------------------------------------------
const SILENT_WAV = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAACABAAZGF0YQAAAAA=';

let sharedAudio = null;

export function unlockAudio(){
  if (typeof window === 'undefined') return;
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
    sharedAudio.setAttribute('playsinline', 'true');
  }
  try {
    sharedAudio.src = SILENT_WAV;
    const p = sharedAudio.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* e'tiborsiz */ }
}

function getAudioEl(){
  if (typeof window === 'undefined') return null;
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
    sharedAudio.setAttribute('playsinline', 'true');
  }
  return sharedAudio;
}

// Matnni tabiiy ovozda o'qiydi (ElevenLabs orqali). Agar xato bo'lsa yoki kalit sozlanmagan bo'lsa,
// brauzerning o'z ovoz sintezi bilan (robotsimon, lekin ishlaydi) fallback qiladi.
// Promise onend chaqirilganda yoki xato bo'lganda ham hal bo'ladi (hech qachon abadiy osilib qolmaydi).
export function speakNatural(text, voiceId){
  return new Promise((resolve) => {
    if (!text || !text.trim()) { resolve(); return; }

    function browserFallback(){
      if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'de-DE';
      const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('de'));
      if (voices.length) utter.voice = voices[0];
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      window.speechSynthesis.speak(utter);
    }

    apiRaw('/api/tts', { text, voiceId }).then(async (res) => {
      if (!res.ok) { browserFallback(); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = getAudioEl();
      if (!audio) { URL.revokeObjectURL(url); browserFallback(); return; }

      let done = false;
      const finish = (fallback) => {
        if (done) return;
        done = true;
        URL.revokeObjectURL(url);
        audio.onended = null;
        audio.onerror = null;
        if (fallback) browserFallback(); else resolve();
      };

      audio.onended = () => finish(false);
      audio.onerror = () => finish(true);
      audio.src = url;
      try { audio.currentTime = 0; } catch (e) {}
      const p = audio.play();
      if (p && p.catch) p.catch(() => finish(true));
    }).catch(() => browserFallback());
  });
}

export function stopSpeaking(){
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
  if (sharedAudio) {
    try { sharedAudio.pause(); } catch (e) {}
  }
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
  const data = await apiPost('/api/transcribe', payload);
  return (data.text || '').trim();
}
