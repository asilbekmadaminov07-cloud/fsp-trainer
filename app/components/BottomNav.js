'use client';
import { usePathname, useRouter } from 'next/navigation';
import { IconHome, IconTooth, IconBolt, IconPin, IconBrain } from '@/app/components/Icons';
import { useLang } from '@/lib/LanguageContext';

const ITEMS = [
  { href: '/home', Icon: IconHome, key: 'navHome' },
  { href: '/game', Icon: IconTooth, key: 'navPractice' },
  { href: '/daily', Icon: IconBolt, key: 'navToday' },
  { href: '/mistakes', Icon: IconPin, key: 'navMistakes' },
  { href: '/coach', Icon: IconBrain, key: 'navCoach' }
];

// Instagram/Duolingo uslubidagi pastki navigatsiya paneli — faqat mobil
// ekranlarda ko'rinadi (CSS orqali), native ilova hissi beradi.
export default function BottomNav(){
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLang();

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
            <span className="bottom-nav-label">{t(item.key)}</span>
          </button>
        );
      })}
    </nav>
  );
}
