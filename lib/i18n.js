// Faqat kirish (landing) sahifasi uchun — ilovaning o'zi har doim nemis tilida
// qoladi (imtihon nemis tilida bo'lgani uchun bu to'g'ri), lekin marketing
// matni foydalanuvchi tilida bo'lsa konversiya oshadi.

export const LANGS = [
  { code: 'de', label: 'Deutsch' },
  { code: 'uz', label: 'O\'zbekcha' },
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ar', label: 'العربية' }
];

export const T = {
  de: {
    h1: 'Üben Sie das Patientengespräch, bevor es zählt.',
    sub: 'Ein KI-Patient antwortet Ihnen wie im echten Sprechzimmer. Sie stellen die Diagnose — die Auswertung sagt Ihnen, was Sie übersehen haben.',
    ctaPrimary: 'Kostenlos registrieren',
    ctaSecondary: 'Ich habe schon ein Konto',
    note: 'Keine Kartendaten nötig · in wenigen Sekunden startklar',
    previewLabel: 'So beginnt ein Fall',
    msgs: ['Guten Tag, Herr Doktor. Ich habe seit ein paar Tagen richtig üble Schmerzen im Unterkiefer links.', 'Seit wann genau, und wie würden Sie den Schmerz beschreiben?', "Das pocht die ganze Zeit. Besonders nachts wird's schlimmer."]
  },
  uz: {
    h1: 'Bemor bilan suhbatni haqiqiy imtihondan oldin mashq qiling.',
    sub: 'Sun\'iy intellekt-bemor sizga xuddi haqiqiy kabinetdagidek javob beradi. Siz tashxis qo\'yasiz — baholash esa nimani o\'tkazib yuborganingizni ko\'rsatadi.',
    ctaPrimary: 'Bepul ro\'yxatdan o\'tish',
    ctaSecondary: 'Mening hisobim bor',
    note: 'Karta ma\'lumotlari kerak emas · bir necha soniyada boshlaysiz',
    previewLabel: 'Holat qanday boshlanadi',
    msgs: ['Assalomu alaykum, doktor. Bir necha kundan beri pastki jag\'imning chap tomonida qattiq og\'riq bor.', 'Qachondan beri aniq, va og\'riqni qanday tasvirlab berasiz?', 'Doim zirqiraydi. Ayniqsa kechasi kuchayadi.']
  },
  ru: {
    h1: 'Потренируйте разговор с пациентом до того, как это будет иметь значение.',
    sub: 'ИИ-пациент отвечает вам как в настоящем кабинете. Вы ставите диагноз — оценка покажет, что вы упустили.',
    ctaPrimary: 'Зарегистрироваться бесплатно',
    ctaSecondary: 'У меня уже есть аккаунт',
    note: 'Данные карты не нужны · готово за несколько секунд',
    previewLabel: 'Так начинается случай',
    msgs: ['Здравствуйте, доктор. Уже несколько дней сильная боль в левой нижней челюсти.', 'С каких пор именно, и как бы вы описали боль?', 'Пульсирует постоянно. Особенно ночью усиливается.']
  },
  en: {
    h1: 'Practice the patient conversation before it counts.',
    sub: 'An AI patient responds to you like in a real consultation room. You make the diagnosis — the feedback shows what you missed.',
    ctaPrimary: 'Register for free',
    ctaSecondary: 'I already have an account',
    note: 'No card required · ready in seconds',
    previewLabel: 'How a case begins',
    msgs: ["Good day, doctor. I've had really bad pain in my lower left jaw for a few days.", 'Since when exactly, and how would you describe the pain?', 'It throbs all the time. It gets worse at night especially.']
  },
  tr: {
    h1: 'Gerçek sınavdan önce hasta görüşmesini alıştırın.',
    sub: 'Yapay zekâ hasta size gerçek muayenehanedeki gibi yanıt verir. Teşhisi siz koyarsınız — değerlendirme neyi gözden kaçırdığınızı gösterir.',
    ctaPrimary: 'Ücretsiz kaydol',
    ctaSecondary: 'Zaten hesabım var',
    note: 'Kart bilgisi gerekmez · saniyeler içinde başlayın',
    previewLabel: 'Bir vaka böyle başlar',
    msgs: ['Merhaba doktor. Birkaç gündür sol alt çenemde çok kötü bir ağrı var.', 'Tam olarak ne zamandan beri, ve ağrıyı nasıl tarif edersiniz?', 'Sürekli zonkluyor. Özellikle geceleri kötüleşiyor.']
  },
  ar: {
    h1: 'تدرّب على محادثة المريض قبل أن يحين وقتها الحقيقي.',
    sub: 'مريض بالذكاء الاصطناعي يردّ عليك كما في العيادة الحقيقية. أنت تضع التشخيص — والتقييم يوضح لك ما فاتك.',
    ctaPrimary: 'سجّل مجانًا',
    ctaSecondary: 'لدي حساب بالفعل',
    note: 'لا حاجة لبيانات بطاقة · جاهز خلال ثوانٍ',
    previewLabel: 'هكذا تبدأ الحالة',
    msgs: ['مساء الخير يا دكتور. لدي ألم شديد جدًا في الفك السفلي الأيسر منذ أيام قليلة.', 'منذ متى بالضبط، وكيف تصف الألم؟', 'إنه ينبض طوال الوقت. يزداد سوءًا في الليل خاصة.']
  }
};

export function detectLang(){
  if (typeof navigator === 'undefined') return 'de';
  const nav = (navigator.language || 'de').slice(0, 2).toLowerCase();
  return T[nav] ? nav : 'de';
}
