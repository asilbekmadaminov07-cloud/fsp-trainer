'use client';
import { useEffect, useState } from 'react';
import { needsMotionPermission, requestMotionPermission } from '@/lib/useTilt';

// iPhone'da 3D-sensor effektlari uchun ruxsat so'raydi. Android/desktop'da
// hech narsa ko'rsatmaydi — u yerda sensor/sichqoncha ruxsatsiz ishlaydi.
export default function SensorToggle(){
  const [needed, setNeeded] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => { setNeeded(needsMotionPermission()); }, []);

  if (!needed || granted) return null;

  return (
    <button
      className="sensor-toggle"
      onClick={async () => { if (await requestMotionPermission()) setGranted(true); }}
      title="3D-Effekte per Bewegungssensor aktivieren"
    >
      ✨ 3D-Sensoren aktivieren
    </button>
  );
}
