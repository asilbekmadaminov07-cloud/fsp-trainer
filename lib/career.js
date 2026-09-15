export function levelFromXp(xp){
  return Math.floor((xp || 0) / 150) + 1;
}

// Reale Karrierestufen im deutschen Gesundheitswesen — statt generischer "Level"-Bezeichnungen.
const STAGES = [
  { minLevel: 1,  title: 'Assistenzarzt (1. Jahr)' },
  { minLevel: 4,  title: 'Assistenzarzt (2. Jahr)' },
  { minLevel: 7,  title: 'Facharzt in Ausbildung' },
  { minLevel: 10, title: 'Facharzt für Zahnmedizin' },
  { minLevel: 14, title: 'Oberarzt' },
  { minLevel: 18, title: 'Leitender Oberarzt' },
  { minLevel: 23, title: 'Praxisinhaber' }
];

export function careerStage(level){
  let current = STAGES[0];
  let next = STAGES[1] || null;
  for (let i = 0; i < STAGES.length; i++) {
    if (level >= STAGES[i].minLevel) {
      current = STAGES[i];
      next = STAGES[i + 1] || null;
    }
  }
  return { title: current.title, minLevel: current.minLevel, next };
}

export const WELCOME_LINES = [
  "Guten Tag, Herr Doktor. Ich bin so froh, dass Sie da sind. Ich habe nämlich ein Problem — können Sie mir helfen?",
  "Hallo Doktor, schön dass Sie sich Zeit nehmen. Ich habe seit einer Weile ein Problem, und ich hoffe wirklich, Sie können mir helfen.",
  "Guten Tag. Endlich sind Sie da! Ich mache mir etwas Sorgen wegen eines Problems — würden Sie sich das bitte ansehen?",
  "Hallo, schön Sie kennenzulernen, Herr Doktor. Ich habe da ein kleines Problem, bei dem ich Ihre Hilfe brauche."
];

export function speakText(text, onEnd){
  if (typeof window === 'undefined' || !window.speechSynthesis) { if (onEnd) onEnd(); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'de-DE';
  const voices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('de'));
  if (voices.length) utter.voice = voices[Math.floor(Math.random() * voices.length)];
  utter.pitch = 0.9 + Math.random() * 0.3;
  utter.rate = 0.95 + Math.random() * 0.12;
  if (onEnd) utter.onend = onEnd;
  window.speechSynthesis.speak(utter);
}
