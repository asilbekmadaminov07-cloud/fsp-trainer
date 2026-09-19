'use client';
import { useTilt } from '@/lib/useTilt';

// Har qanday elementni sensor/sichqoncha bilan boshqariladigan 3D kartaga aylantiradi.
// `as` — nechta HTML teg sifatida render qilinishini belgilaydi ('div', 'a', ...).
export default function TiltCard({ as: Tag = 'div', className = '', children, style, maxDeg = 6, ...rest }){
  const ref = useTilt({ maxDeg });
  return (
    <Tag ref={ref} className={'tilt3d-el ' + className} style={{ transformStyle: 'preserve-3d', willChange: 'transform', ...style }} {...rest}>
      {children}
    </Tag>
  );
}
