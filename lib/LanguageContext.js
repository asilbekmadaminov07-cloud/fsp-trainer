'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { APP_UI } from '@/lib/appUi';
import { detectLang } from '@/lib/i18n';

const LanguageContext = createContext({ lang: 'de', setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }){
  const [lang, setLangState] = useState('de');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fsp-lang');
      setLangState(saved && APP_UI[saved] ? saved : detectLang());
    } catch (e) { /* localStorage yopiq bo'lishi mumkin */ }
  }, []);

  function setLang(code){
    setLangState(code);
    try { localStorage.setItem('fsp-lang', code); } catch (e) {}
  }

  function t(key){
    const dict = APP_UI[lang] || APP_UI.de;
    return dict[key] ?? APP_UI.de[key] ?? key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang(){
  return useContext(LanguageContext);
}
