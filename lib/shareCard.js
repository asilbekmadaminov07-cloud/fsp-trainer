'use client';

// Baby-blue uslubdagi ulashish kartasi — Canvas orqali, hech qanday server yoki
// tashqi xizmat kerak emas.
export function generateShareCard({ kicker, title, name, stat, statLabel }){
  const w = 1080, h = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#1E6FA8');
  grad.addColorStop(1, '#5CB8EE');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = 'rgba(255,255,255,.10)';
  ctx.beginPath(); ctx.arc(120, 940, 260, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(980, 140, 200, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = '700 34px sans-serif';
  ctx.fillText('FSP . Trainer', 70, 100);

  ctx.font = '600 26px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.82)';
  ctx.fillText(kicker || '', 70, 220);

  ctx.font = '700 64px Georgia, serif';
  ctx.fillStyle = '#fff';
  wrapText(ctx, title || '', 70, 300, 940, 74);

  ctx.font = '500 30px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.fillText(name || '', 70, 560);

  if (stat != null) {
    ctx.font = '800 140px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(String(stat), 70, 760);
    ctx.font = '500 28px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillText(statLabel || '', 70, 800);
  }

  ctx.font = '500 22px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,.7)';
  ctx.fillText('fsp-trainer-six.vercel.app', 70, 1000);

  return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight){
  const words = text.split(' ');
  let line = '', cy = y;
  for (const word of words) {
    const test = line + word + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word + ' ';
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, cy);
}
