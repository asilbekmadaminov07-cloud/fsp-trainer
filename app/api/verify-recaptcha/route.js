// Google reCAPTCHA v2 tokenini serverda tekshiradi — botlar/AI ro'yxatdan
// o'tishining oldini olish uchun. POST { token } → { success: boolean }

export async function POST(req) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    // Kalit hali sozlanmagan bo'lsa, ro'yxatdan o'tishni bloklamaymiz.
    return Response.json({ success: true, skipped: true });
  }

  let payload;
  try { payload = await req.json(); }
  catch (e) { return Response.json({ error: 'Noto\'g\'ri so\'rov' }, { status: 400 }); }

  const token = payload?.token;
  if (!token) return Response.json({ success: false, error: 'Token yo\'q' }, { status: 400 });

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token })
    });
    const data = await res.json();
    return Response.json({ success: !!data.success });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}
