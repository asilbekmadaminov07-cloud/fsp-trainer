// AI so'rovlariga "qaysi tilda javob berish" ko'rsatmasini qo'shish uchun umumiy yordamchi.
// Foydalanuvchi interfeys tilidan qat'i nazar, imtihon MAZMUNI (savollar, bemor
// suhbati) ham shu tilga o'giriladi — foydalanuvchi shunday tanladi.

export const LANGUAGE_NAMES = {
  de: 'Deutsch',
  uz: 'Usbekisch (O\'zbek tili)',
  ru: 'Russisch',
  en: 'Englisch',
  tr: 'Türkisch',
  ar: 'Arabisch'
};

export function safeLang(lang){
  return LANGUAGE_NAMES[lang] ? lang : 'de';
}

// System-promptga qo'shiladigan bitta qatorlik ko'rsatma.
export function langInstruction(lang){
  const l = safeLang(lang);
  if (l === 'de') return 'Alles auf Deutsch.';
  return `Antworte AUSSCHLIESSLICH auf ${LANGUAGE_NAMES[l]} (nicht auf Deutsch), außer wenn explizit ein deutscher Fachbegriff als solcher benannt werden soll.`;
}
