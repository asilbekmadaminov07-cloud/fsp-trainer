'use client';
import { useEffect, useRef } from 'react';

// Sichqoncha harakati (desktop) yoki qurilma sensori (mobil — gyroscope/akselerometr)
// asosida nozik 3D "tilt" effekti. Kamera harakati kabi silliq (lerp bilan).
export function useTilt({ maxDeg = 7, scale = 1.012 } = {}){
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = null;
    let targetX = 0, targetY = 0, curX = 0, curY = 0, hovering = false;

    function frame(){
      curX += (targetX - curX) * 0.11;
      curY += (targetY - curY) * 0.11;
      const s = hovering ? scale : 1;
      el.style.transform = `perspective(1100px) rotateX(${curY}deg) rotateY(${curX}deg) scale(${s})`;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function onMove(e){
      hovering = true;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      targetX = px * maxDeg * 2;
      targetY = -py * maxDeg * 2;
    }
    function onLeave(){ hovering = false; targetX = 0; targetY = 0; }

    function onOrient(e){
      if (e.gamma == null || e.beta == null) return;
      const gamma = Math.max(-30, Math.min(30, e.gamma));
      const beta = Math.max(15, Math.min(75, e.beta)) - 45;
      targetX = (gamma / 30) * maxDeg;
      targetY = -(beta / 30) * maxDeg;
    }

    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    window.addEventListener('deviceorientation', onOrient);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('deviceorientation', onOrient);
    };
  }, [maxDeg, scale]);

  return ref;
}

// iOS 13+ da DeviceOrientation faqat foydalanuvchi bosgan tugma orqali so'raladi.
// Android/desktop'da bu shart emas — sensor/sichqoncha avtomatik ishlaydi.
export function needsMotionPermission(){
  return typeof window !== 'undefined'
    && typeof window.DeviceOrientationEvent !== 'undefined'
    && typeof window.DeviceOrientationEvent.requestPermission === 'function';
}

export async function requestMotionPermission(){
  try {
    const res = await window.DeviceOrientationEvent.requestPermission();
    return res === 'granted';
  } catch (e) {
    return false;
  }
}
