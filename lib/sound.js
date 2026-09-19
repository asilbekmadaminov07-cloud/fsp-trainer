'use client';

// Web Audio API orqali generatsiya qilingan qisqa tovushlar — audio fayl
// yuklash shart emas.
let ctx = null;
function getCtx(){
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, start, duration, type, gainPeak){
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type || 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, c.currentTime + start);
  gain.gain.linearRampToValueAtTime(gainPeak ?? 0.12, c.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + duration + 0.02);
}

export function playCorrect(){
  tone(660, 0, 0.11, 'sine');
  tone(880, 0.09, 0.16, 'sine');
}

export function playWrong(){
  tone(220, 0, 0.18, 'sawtooth', 0.08);
}

export function playLevelUp(){
  [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.22, 'sine', 0.1));
}
