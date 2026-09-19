// Texnik xato matnlarini iliq, tushunarli nemis tiliga aylantiradi.
// Foydalanuvchi hech qachon "Error 500" yoki xom stack-trace ko'rmasligi kerak.
const PATTERNS = [
  [/fetch|network|failed to fetch/i, 'Es gibt gerade ein Verbindungsproblem. Prüfen Sie Ihr Internet und versuchen Sie es noch einmal.'],
  [/rate.?limit|too many requests|429/i, 'Sie waren richtig fleißig! Bitte warten Sie einen Moment, bevor Sie weitermachen.'],
  [/invalid login|credentials/i, 'E-Mail oder Passwort stimmen nicht. Bitte noch einmal prüfen.'],
  [/already registered|already exists/i, 'Für diese E-Mail gibt es bereits ein Konto. Versuchen Sie es mit „Anmelden".'],
  [/captcha/i, 'Die Sicherheitsprüfung ist fehlgeschlagen. Bitte versuchen Sie es erneut.'],
  [/quota|kontingent/i, 'Der KI-Dienst ist gerade ausgelastet. Bitte versuchen Sie es in Kürze noch einmal.'],
  [/50\d|internal|server/i, 'Bei uns ist gerade etwas schiefgelaufen — nicht bei Ihnen. Bitte versuchen Sie es noch einmal.']
];

export function friendlyError(raw){
  const msg = String(raw || '');
  for (const [pattern, friendly] of PATTERNS) {
    if (pattern.test(msg)) return friendly;
  }
  // Agar allaqachon inson uchun yozilgan (nemischa, texnik bo'lmagan) bo'lsa — o'zini qaytaramiz.
  if (msg && msg.length < 160 && !/^[A-Za-z]+Error|status \d{3}/.test(msg)) return msg;
  return 'Etwas ist schiefgelaufen. Bitte versuchen Sie es noch einmal — falls es weiter nicht klappt, kommen Sie später zurück.';
}
