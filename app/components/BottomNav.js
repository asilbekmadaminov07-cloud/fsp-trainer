'use client';
import { usePathname, useRouter } from 'next/navigation';

const ITEMS = [
  { href: '/home', icon: '🏠', label: 'Start' },
  { href: '/game', icon: '🦷', label: 'Üben' },
  { href: '/daily', icon: '⚡', label: 'Heute' },
  { href: '/mistakes', icon: '📌', label: 'Fehler' },
  { href: '/coach', icon: '🧠', label: 'Coach' }
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
        return (
          <button
            key={item.href}
            className={'bottom-nav-item' + (active ? ' active' : '')}
            onClick={() => router.push(item.href)}
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
