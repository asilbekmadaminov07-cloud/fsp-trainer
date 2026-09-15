function toothX(x, color){
  return `<g fill="${color}"><path d="M${x} 25 h28 a5 5 0 0 1 5 5 v20 h-38 v-20 a5 5 0 0 1 5 -5 z"/><path d="M${x} 50 h38 l-9 55 q-6 18 -10 32 q-4 -14 -10 -32 z"/></g>`;
}
function xrayBase(extra){
  return `<svg viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="170" fill="#0b0b0b"/>${toothX(45,'#d9d9d2')}${toothX(130,'#d9d9d2')}${toothX(215,'#d9d9d2')}${extra||''}</svg>`;
}

export const IMAGES = {
  pulpitis: xrayBase(`<ellipse cx="149" cy="150" rx="15" ry="11" fill="#050505" stroke="#5a5a55" stroke-width="1.5"/>`),
  periodontitis_bone: xrayBase(`<path d="M15 92 Q150 108 285 92" stroke="#cfcfc8" stroke-width="2" fill="none" stroke-dasharray="4 3"/>`),
  abscess_rct: xrayBase(`<rect x="144" y="52" width="6" height="55" fill="#f2f2ec"/><ellipse cx="149" cy="152" rx="22" ry="17" fill="#020202" stroke="#5a5a55" stroke-width="1.5"/>`),
  normal_xray: xrayBase(''),
  gingivitis: `<svg viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="170" fill="#f7e4e1"/><rect x="0" y="70" width="300" height="100" fill="#e59a94"/><rect x="30" y="20" width="45" height="60" rx="8" fill="#fdfaf5"/><rect x="127" y="20" width="45" height="60" rx="8" fill="#fdfaf5"/><rect x="224" y="20" width="45" height="60" rx="8" fill="#fdfaf5"/><path d="M20 78 Q150 66 280 78" stroke="#c1352b" stroke-width="6" fill="none" opacity="0.85"/><circle cx="52" cy="76" r="4" fill="#e8d24a"/><circle cx="150" cy="72" r="4" fill="#e8d24a"/><circle cx="248" cy="76" r="4" fill="#e8d24a"/></svg>`,
  pregnancy_gingivitis: `<svg viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="170" fill="#f7e4e1"/><rect x="0" y="70" width="300" height="100" fill="#e59a94"/><rect x="30" y="20" width="45" height="60" rx="8" fill="#fdfaf5"/><rect x="127" y="20" width="45" height="60" rx="8" fill="#fdfaf5"/><rect x="224" y="20" width="45" height="60" rx="8" fill="#fdfaf5"/><path d="M20 78 Q150 52 280 78" stroke="#8f1a13" stroke-width="11" fill="none" opacity="0.9"/></svg>`,
  mronj: `<svg viewBox="0 0 300 170" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="170" fill="#f7e4e1"/><rect x="0" y="70" width="300" height="100" fill="#e59a94"/><rect x="30" y="20" width="45" height="60" rx="8" fill="#fdfaf5"/><rect x="224" y="20" width="45" height="60" rx="8" fill="#fdfaf5"/><ellipse cx="149" cy="60" rx="24" ry="16" fill="#cfc79a" stroke="#8a8460" stroke-width="1.5"/><path d="M105 80 Q150 62 193 80" stroke="#a8332a" stroke-width="5" fill="none" opacity="0.75"/></svg>`
};

// difficulty: "leicht" | "mittel" | "schwer" | "pro"
export const CASES = [
  {
    difficulty: "leicht",
    name: "Herr Keller, 47", meta: "Schmerzen unten links", avatar: "K",
    diagnosis: "Akute irreversible Pulpitis (Zahn 36) — Indikation zur Wurzelkanalbehandlung",
    opener: "Guten Tag, Herr Doktor. Ich habe seit ein paar Tagen richtig üble Schmerzen im Unterkiefer links.",
    imageLabel: "Röntgenbild", imageKey: "pulpitis",
    imageCaption: "Hier, das hab ich noch von meinem letzten Röntgen.",
    imageContent: "Ich schicke Ihnen das Röntgenbild. Befund: deutliche periapikale Aufhellung an der Wurzelspitze von Zahn 36, Hinweis auf einen entzündlichen Prozess.",
    system: `Du spielst "Herr Keller", 47, Bauarbeiter. Seit 4 Tagen starke, pochende Schmerzen im linken Unterkiefer, nachts schlimmer, beim Kauen stärker, kalte Getränke lösen kurzen Schmerz aus. Ibuprofen hilft kaum noch. Leichter Bluthochdruck, nimmt Amlodipin. Keine Allergien. Umgänglich, aber ungeduldig wegen der Schmerzen. Antworte NUR auf Deutsch, einfache Umgangssprache, keine Fachbegriffe, kurze Antworten (1-3 Sätze), Details nur auf konkrete Frage.`
  },
  {
    difficulty: "leicht",
    name: "Frau Neumann, 29", meta: "Zahnfleischbluten", avatar: "N",
    diagnosis: "Akute Gingivitis (plaquebedingt)",
    opener: "Hallo. Mein Zahnfleisch blutet seit zwei Wochen immer beim Zähneputzen.",
    imageLabel: "Foto", imageKey: "gingivitis",
    imageCaption: "Ich hab eben ein Foto gemacht, hier.",
    imageContent: "Ich schicke Ihnen ein Foto. Befund: gerötetes, leicht geschwollenes Zahnfleisch mit sichtbaren Plaque-Ablagerungen am Zahnfleischsaum, keine Rezession, keine Zahnlockerung.",
    system: `Du spielst "Frau Neumann", 29, Marketing-Assistentin. Zahnfleisch blutet seit 2 Wochen beim Putzen, keine Schmerzen, putzt eher unregelmäßig und hastig, keine Vorerkrankungen, raucht nicht, keine Medikamente. Entspannt, freundlich, etwas gestresst wegen der Arbeit. Antworte NUR auf Deutsch, einfache Umgangssprache, kurze Antworten (1-3 Sätze), Details nur auf Nachfrage.`
  },
  {
    difficulty: "mittel",
    name: "Kevin, 8", meta: "Zahnschmerzen, sehr ängstlich", avatar: "K",
    diagnosis: "Tiefe kariöse Läsion, Milchzahn 84 — Indikation zur Kinderbehandlung/ggf. Pulpotomie",
    opener: "...(schaut die Mama an, will nicht antworten)",
    imageLabel: "Röntgenbild", imageKey: "abscess_rct",
    imageCaption: "(Die Mutter reicht das Röntgenbild.) Hier, das haben wir vom letzten Termin.",
    imageContent: "Die Mutter zeigt das Röntgenbild. Befund: tiefe kariöse Läsion am Milchzahn 84, nahe der Pulpa, beginnende periapikale Aufhellung.",
    system: `Du spielst "Kevin", 8 Jahre alt, sehr ängstlich vor dem Zahnarzt. Du antwortest zuerst nur einsilbig oder gar nicht und schaust deine Mutter an. Erst wenn der Arzt/die Ärztin ruhig, freundlich und kindgerecht fragt (einfache Worte, keine medizinischen Begriffe, evtl. beruhigend), wirst du nach und nach offener und beantwortest kurz (1 Satz). Du hast seit 2 Tagen Schmerzen im rechten Unterkiefer, besonders beim Essen von Süßem. Wenn der Arzt/die Ärztin unfreundlich, zu direkt oder hastig fragt, wirst du noch schüchterner oder fängst an zu weinen und antwortest gar nicht. Deine Mutter (erwähne sie gelegentlich als "meine Mama") ist dabei und hilft manchmal, wenn du gar nichts sagst. Antworte NUR auf Deutsch, sehr einfache Kindersprache, sehr kurz.`
  },
  {
    difficulty: "mittel",
    name: "Herr Yildiz, 55", meta: "Lockere Zähne", avatar: "Y",
    diagnosis: "Chronische generalisierte Parodontitis, diabetesassoziiert",
    opener: "Guten Tag. Meine Zähne wackeln seit einer Weile, und das Zahnfleisch zieht sich zurück.",
    imageLabel: "Röntgenbild", imageKey: "periodontitis_bone",
    imageCaption: "Ich hab noch ein Röntgenbild vom letzten Zahnarztbesuch.",
    imageContent: "Ich schicke Ihnen das Röntgenbild. Befund: horizontaler Knochenabbau von etwa 40 Prozent an mehreren Zähnen, generalisiert, keine akuten periapikalen Aufhellungen.",
    system: `Du spielst "Herr Yildiz", 55, Bäcker. Seit Jahren lockere Zähne, Zahnfleischrückgang, kein akuter Schmerz. Hat Diabetes Typ 2, schlecht eingestellt (nur erwähnen, wenn nach Vorerkrankungen gefragt wird). Raucht ca. 10 Zigaretten/Tag. Nimmt Metformin. Etwas misstrauisch gegenüber Ärzten, antwortet knapp, wird aber gesprächiger, wenn der Arzt/die Ärztin Zeit sich nimmt. Antworte NUR auf Deutsch, einfache Umgangssprache, kurze Antworten, Details nur auf Nachfrage.`
  },
  {
    difficulty: "schwer",
    name: "Frau Wolter, 62", meta: "Wunde heilt nicht, gereizt", avatar: "W",
    diagnosis: "Verdacht auf medikamentenassoziierte Kiefernekrose (MRONJ)",
    opener: "Guten Tag. Ich hatte vor drei Wochen eine Zahnentfernung, und die Stelle will einfach nicht heilen. Ich bin schon bei zwei anderen Ärzten gewesen, keiner konnte mir helfen.",
    imageLabel: "Foto", imageKey: "mronj",
    imageCaption: "Ich zeig Ihnen mal ein Foto von der Stelle. Sieht das nicht schlimm aus?",
    imageContent: "Ich schicke Ihnen ein Foto von der Extraktionsstelle. Befund: freiliegender, grau-gelblicher Knochen im Bereich von Zahn 46, umgebendes Weichgewebe gerötet, keine Heilungstendenz nach 3 Wochen.",
    system: `Du spielst "Frau Wolter", 62, Rentnerin. Vor 3 Wochen Zahnextraktion (Zahn 46), Wunde heilt nicht, Knochen liegt teilweise sichtbar frei, leichter fauliger Geruch. Nimmt seit 2 Jahren Alendronat (Bisphosphonat) wegen Osteoporose — nur erwähnen, wenn konkret nach Medikamenten oder Vorerkrankungen gefragt wird. Du bist frustriert und leicht gereizt, weil bisher niemand dir geholfen hat — das darf in deinem Ton durchklingen (etwas ungeduldig, seufzend), aber werde nicht beleidigend. Antworte NUR auf Deutsch, einfache Umgangssprache, kurze Antworten, Details nur auf Nachfrage.`
  },
  {
    difficulty: "pro",
    name: "Herr Baptiste, 38", meta: "Schmerz unten links", avatar: "B",
    diagnosis: "Kein odontogener Befund — Verdacht auf kardial ausstrahlenden Schmerz (Angina pectoris), sofortige Überweisung/Notaufnahme nötig",
    opener: "Guten Tag. Ich hab seit zwei Tagen so einen dumpfen Schmerz im Unterkiefer links, dachte, das kommt von den Zähnen.",
    imageLabel: "Röntgenbild", imageKey: "normal_xray",
    imageCaption: "Hier, falls das hilft — ist noch aktuell.",
    imageContent: "Ich schicke Ihnen das Röntgenbild, falls es hilft. Befund: unauffälliger Zahnstatus, keine kariösen Läsionen, keine periapikalen Aufhellungen, keine Auffälligkeiten am Kieferknochen.",
    system: `Du spielst "Herr Baptiste", 38, Bauleiter. Dumpfer Schmerz im linken Unterkiefer seit 2 Tagen, KEINE Reaktion auf kalt/heiß/süß (nur auf Nachfrage sagen). Der Schmerz wird schlimmer bei körperlicher Anstrengung, z.B. Treppensteigen (nur auf gezielte Frage nach Auslösern/Anstrengung erwähnen). Leichte Übelkeit und Engegefühl in der Brust bei Anstrengung (nur auf gezielte Frage nach Brustschmerz/Atemnot/Übelkeit erwähnen). Raucher (1 Packung/Tag). Vater hatte Herzinfarkt mit 50 (nur auf Frage nach Familienanamnese). Deine Zähne sehen bei Betrachtung unauffällig aus. Antworte NUR auf Deutsch, einfache Umgangssprache, kurze Antworten, gib Details wirklich nur bei konkreter, gezielter Nachfrage preis — sei nicht von dir aus hilfreich.`
  },
  {
    difficulty: "pro",
    name: "Frau Kessler, 45", meta: "Blitzartige Schmerzattacken", avatar: "K",
    diagnosis: "Kein odontogener Befund — Verdacht auf Trigeminusneuralgie, Überweisung zum Neurologen empfohlen",
    opener: "Guten Tag. Ich habe seit Monaten diese wahnsinnigen, stechenden Schmerzattacken im Gesicht, ich dachte erst, es liegt an den Zähnen.",
    imageLabel: "Röntgenbild", imageKey: "normal_xray",
    imageCaption: "Hier ist ein Röntgenbild, das hab ich noch.",
    imageContent: "Ich schicke Ihnen das Röntgenbild. Befund: unauffälliger Zahn- und Knochenbefund, keine Hinweise auf eine odontogene Ursache.",
    system: `Du spielst "Frau Kessler", 45, Lehrerin. Seit 3 Monaten blitzartige, extrem starke Schmerzattacken in der rechten Wange, dauern nur Sekunden, dazwischen komplett schmerzfrei (nur auf Nachfrage nach Dauer/Verlauf sagen). Ausgelöst durch leichte Berührung — Zähneputzen, Rasieren, kalter Wind (nur auf gezielte Frage nach Auslösern erwähnen). Keine Reaktion auf heiß/kalt an den Zähnen selbst. Keine Schwellung, kein Fieber. Antworte NUR auf Deutsch, einfache Umgangssprache, kurze Antworten, Details nur auf sehr konkrete Nachfrage.`
  }
];

export const DIFFS = ["leicht", "mittel", "schwer", "pro"];

export const DIFF_REWARDS = {
  leicht: { coins: 30, xp: 15 },
  mittel: { coins: 60, xp: 30 },
  schwer: { coins: 100, xp: 50 },
  pro: { coins: 180, xp: 90 }
};

export const COMMON_PATIENT_INSTRUCTIONS = `

Wichtig für den Gesprächsverlauf: Bleibe nicht passiv, sobald der Arzt/die Ärztin dir eine Vermutung, Diagnose oder einen Behandlungsvorschlag nennt. Reagiere wie ein echter Patient — mit einer natürlichen Rückfrage oder einer kurzen Sorge (z. B. wie lange der Schmerz noch anhält, ob es Alternativen gibt, ob die Behandlung wehtut, was bei Nichtbehandlung passiert). Wähle jeweils nur EINE Rückfrage pro Antwort. Stelle sie erst, NACHDEM der Arzt/die Ärztin eine Einschätzung oder einen nächsten Schritt genannt hat — vorher beantworte nur die gestellten Anamnesefragen. Halte das Gespräch am Laufen wie ein echtes, mehrere Runden dauerndes Arztgespräch, bis der Arzt/die Ärztin es klar beendet.`;
