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

    fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voiceId })
    }).then(async (res) => {
      if (!res.ok) { browserFallback(); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); browserFallback(); };
      audio.play().catch(() => { URL.revokeObjectURL(url); browserFallback(); });
    }).catch(() => browserFallback());
  });
}

export function stopSpeaking(){
  if (typeof window === 'undefined') return;
  window.speechSynthesis?.cancel();
}
