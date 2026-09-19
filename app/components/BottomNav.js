'use client';
import { usePathname, useRouter } from 'next/navigation';
import { IconHome, IconTooth, IconBolt, IconPin, IconBrain } from '@/app/components/Icons';

const ITEMS = [
  { href: '/home', Icon: IconHome, label: 'Start' },
  { href: '/game', Icon: IconTooth, label: 'Üben' },
  { href: '/daily', Icon: IconBolt, label: 'Heute' },
  { href: '/mistakes', Icon: IconPin, label: 'Fehler' },
  { href: '/coach', Icon: IconBrain, label: 'Coach' }
];

// Instagram/Duolingo uslubidagi pastki navigatsiya paneli — faqat mobil
// ekranlarda ko'rinadi (CSS orqali), native ilova hissi beradi.
export default function BottomNav(){
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="bottom-nav" aria-label="Hauptnavigation">
      {ITEMS.map(item => {
        const active = pathname === item.href;
        const Icon = item.Icon;
        return (
          <button
            key={item.href}
            className={'bottom-nav-item' + (active ? ' active' : '')}
            onClick={() => router.push(item.href)}
          >
            <span className="bottom-nav-icon"><Icon /></span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
