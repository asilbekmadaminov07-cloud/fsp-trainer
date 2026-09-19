'use client';
import { IconMedal, IconLock } from '@/app/components/Icons';

// Har bir yutuq uchun rang darajasi (bronza → kumush → tilla → olmos),
// necha ta holat borligidan qat'i nazar tartib bo'yicha aylanadi.
const TIERS = ['bronze', 'silver', 'gold', 'diamond'];

export default function AchievementBadges({ achievements, current }) {
  return (
    <div className="badge-grid">
      {achievements.map((a, i) => {
        const done = current >= a.need;
        const tier = TIERS[i % TIERS.length];
        return (
          <div className={'badge-item' + (done ? ' unlocked ' + tier : ' locked')} key={a.id} title={a.title}>
            <div className="badge-medal">
              {done ? <IconMedal width={26} height={26} /> : <IconLock width={20} height={20} />}
            </div>
            <div className="badge-label">{a.title}</div>
            {!done && <div className="badge-progress">{current}/{a.need}</div>}
          </div>
        );
      })}
    </div>
  );
}
