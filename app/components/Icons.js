// Sodda, chiziqli (stroke) SVG belgilar — emoji/stiker o'rniga. Barchasi
// currentColor bilan, shuning uchun CSS orqali rang beriladi.
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

export function IconHome(p){
  return <svg {...base} {...p}><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4h4v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" /></svg>;
}
export function IconTooth(p){
  return <svg {...base} {...p}><path d="M12 3c-2 0-3.2 1-4.5 1-1.6 0-2.5-.8-2.5-.8S4 5 4 8c0 3 1 4.5 1.2 7 .2 2 .3 5 1.8 5 1.3 0 1-3 1.5-5 .3-1.3 1-2 1.5-2s1.2.7 1.5 2c.5 2 .2 5 1.5 5 1.5 0 1.6-3 1.8-5 .2-2.5 1.2-4 1.2-7 0-3-1-4.8-1-4.8S17.6 3.2 16 3.2c-1.3 0-2.5-.2-4-.2Z"/></svg>;
}
export function IconBolt(p){
  return <svg {...base} {...p}><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>;
}
export function IconPin(p){
  return <svg {...base} {...p}><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.3"/></svg>;
}
export function IconBrain(p){
  return <svg {...base} {...p}><path d="M9 4.5a2.5 2.5 0 0 0-2.5 2.5v.3A2.5 2.5 0 0 0 5 9.5a2.7 2.7 0 0 0 .4 5A2.6 2.6 0 0 0 8 17a2.5 2.5 0 0 0 4 .2"/><path d="M15 4.5a2.5 2.5 0 0 1 2.5 2.5v.3A2.5 2.5 0 0 1 19 9.5a2.7 2.7 0 0 1-.4 5A2.6 2.6 0 0 1 16 17a2.5 2.5 0 0 1-4 .2"/><path d="M12 5v13"/></svg>;
}
export function IconCoin(p){
  return <svg {...base} {...p}><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M9.3 9.6c0-1.2 1.2-2.1 2.7-2.1s2.7.8 2.7 1.9c0 1.6-2 1.8-2.7 2.3-.9.5-2.7.8-2.7 2.4 0 1.1 1.2 1.9 2.7 1.9s2.7-.9 2.7-2.1" strokeWidth="1.6"/></svg>;
}
export function IconStar(p){
  return <svg {...base} {...p}><path d="m12 3 2.7 5.9 6.3.7-4.7 4.4 1.2 6.3L12 17.2 6.5 20.3l1.2-6.3-4.7-4.4 6.3-.7Z"/></svg>;
}
export function IconFire(p){
  return <svg {...base} {...p}><path d="M12 22c-4 0-6.5-2.7-6.5-6.3 0-2.6 1.5-4.2 2.4-6 .5 1 1.5 1.6 1.9 1 .6-1 .1-2.7-.4-4.2C11 7.5 13.5 9 14.3 11.6c.3-.8.4-1.9.2-2.9C17 10.2 18.5 12.8 18.5 15.7 18.5 19.3 16 22 12 22Z"/></svg>;
}
export function IconChevronRight(p){
  return <svg {...base} {...p}><path d="m9 6 6 6-6 6"/></svg>;
}
export function IconCamera(p){
  return <svg {...base} {...p}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13" r="3.3"/></svg>;
}
export function IconLock(p){
  return <svg {...base} {...p}><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>;
}
export function IconMedal(p){
  return <svg {...base} {...p}><circle cx="12" cy="14" r="6.5"/><path d="m9 8-3-5M15 8l3-5M12 11.2v5.6M9.5 13.2 12 11.2l2.5 2"/></svg>;
}
