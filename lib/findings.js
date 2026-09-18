// RENTGEN TOPILMALARI KUTUBXONASI
//
// Har bir yozuv — bitta ajralib turuvchi radiologik topilma, unga mos ochiq
// litsenziyali rasm bilan. Holatlar shu topilmalarga havola qiladi, shuning uchun
// rentgen har doim bemor muammosiga mos keladi.
//
// MUHIM: `verified: true` faqat rasm KO'Z BILAN ko'rilgan va quyidagilar
// tasdiqlangan bo'lsa qo'yiladi:
//   1. rasm aynan shu topilmani ko'rsatadi
//   2. ustida strelka, doira yoki yozuv YO'Q (javobni oshkor qilmasligi kerak)
//   3. litsenziya ochiq (CC0 / CC BY / CC BY-SA / Public Domain)
//   4. bemor shaxsi tanib bo'lmaydi
//
// Tekshirilmagan yozuvlar saytda ISHLATILMAYDI — faqat nomzod sifatida turadi.
// Tekshirish: node scripts/fetch-open-images.js verify

export const FINDINGS = {

  // ---------- NORMAL ----------
  normal_opg_adult: {
    label: 'Unauffälliges OPG, Erwachsener',
    file: 'File:OPT - Paciente de sexo masculino de 23 años.webp',
    verified: true,
    befund: 'vollständige Bezahnung, keine kariösen Läsionen, keine periapikalen Aufhellungen, regelrechter Knochenverlauf — röntgenologisch unauffällig',
    fits: ['kein odontogener Befund', 'CMD', 'Trigeminusneuralgie', 'kardialer Schmerz', 'Sialolithiasis', 'Candidose', 'Aphthe', 'Dentinhypersensibilität', 'Gingivitis', 'Halitosis', 'MRONJ Frühstadium', 'Leukoplakie']
  },
  normal_opg_teen: {
    label: 'Unauffälliges OPG, Jugendliche mit Weisheitszahnanlagen',
    file: 'File:OPT - Paciente de sexo femenino de 15 años.webp',
    verified: true,
    befund: 'regelrechte Bezahnung, angelegte aber noch nicht durchgebrochene Weisheitszähne, kein pathologischer Befund',
    fits: ['junge Patienten', 'Weisheitszahnanlage', 'kieferorthopädische Fragestellung']
  },

  // ---------- APIKAL ----------
  apikale_ostitis_molar: {
    label: 'Apikale Parodontitis am unteren Molaren',
    file: 'File:ApikaleOstitis3.JPG',
    verified: true,
    befund: 'periapikale Aufhellung an der Wurzelspitze des zweiten unteren Molaren, Amalgamfüllungen an den Nachbarzähnen, teilretinierter Weisheitszahn',
    fits: ['irreversible Pulpitis', 'apikale Parodontitis', 'Wurzelkanalbehandlung', 'nicht erhaltungswürdiger Zahn', 'teilretinierter 38']
  },
  apikale_ostitis_2: {
    label: 'Apikale Ostitis unter prothetischer Versorgung',
    file: 'File:ApikaleOstitis1.JPG',
    verified: true,
    befund: 'unterer Seitenzahnbereich mit ausgedehnter metallischer Versorgung (Krone/Brücke), an der Wurzelspitze eines Molaren eine umschriebene Aufhellung',
    fits: ['apikale Parodontitis unter Krone', 'Pulpanekrose', 'Revisionsentscheidung', 'Schmerzen unter Zahnersatz']
  },
  apikale_ostitis_25: {
    label: 'Wurzelgefüllter Prämolar mit apikaler Aufhellung',
    file: 'File:Apikale Ostitis Zahn 25 2018-05-09.JPG',
    verified: true,
    befund: 'oberer Seitenzahnbereich: wurzelkanalgefüllter Prämolar mit Aufhellung an der Wurzelspitze, Nachbarzähne mit ausgedehnten Füllungen',
    fits: ['persistierende apikale Parodontitis', 'Revision der Wurzelfüllung', 'Wurzelspitzenresektion', 'Aufbissschmerz']
  },
  // RAD ETILDI: ustida uchta qizil strelka bor — javobni oshkor qiladi
  abszess_molar: {
    label: 'Periapikaler Abszess Zahn 36',
    file: 'File:Abscessed tooth periapical radiograph.jpg',
    verified: false,
    rejected: 'rote Pfeile im Bild',
    befund: '',
    fits: []
  },
  radiolucency_front: {
    label: 'Große periapikale Aufhellung an den oberen Frontzähnen',
    file: 'File:Periapical radiolucency.jpg',
    verified: true,
    befund: 'obere Frontzähne mit einer großen, scharf begrenzten rundlichen Aufhellung, die die Wurzelspitzen der mittleren Schneidezähne umfasst',
    fits: ['radikuläre Zyste', 'Pulpanekrose nach Frontzahntrauma', 'chronische apikale Parodontitis', 'Wurzelspitzenresektion', 'Zahnverfärbung nach Trauma']
  },
  // RAD ETILDI: rentgen emas, ekran fotosi — dastur interfeysi, sana va bemor ismi ko'rinadi
  granulom_wurzelgefuellt: {
    label: 'Granulom an wurzelgefülltem Zahn',
    file: 'File:Granuloma sotto dente già devitalizzato - visione di lastra su schermo.jpg',
    verified: false,
    rejected: 'Bildschirmfoto mit Patientenname',
    befund: '',
    fits: []
  },

  // ---------- PARODONT ----------
  knochenabbau_stark: {
    label: 'Ausgeprägter Knochenabbau',
    file: 'File:Bone loss in periapical xray.jpg',
    verified: true,
    befund: 'deutlich reduziertes Knochenniveau, die Wurzeln liegen über mehrere Millimeter frei, erweiterter Parodontalspalt',
    fits: ['Parodontitis', 'Periimplantitis', 'Raucher', 'Diabetes', 'Zahnlockerung']
  },
  // RAD ETILDI: hajmi juda kichik (400x273)
  knochenabbau_paro1: {
    label: 'Parodontaler Knochenabbau, Frontzähne',
    file: 'File:Paro1.JPG',
    verified: false,
    rejected: 'zu geringe Auflösung',
    befund: '',
    fits: []
  },
  vertikaler_dimensionsverlust: {
    label: 'Verlust der Vertikaldimension bei Zahnverlust',
    file: 'File:Loss of vertical dimension.jpg',
    verified: false,
    befund: 'ausgedehnter Zahnverlust und Verlust der vertikalen Dimension',
    fits: ['Prothetik', 'Bisshebung', 'Lückengebiss']
  },

  // ---------- RETENTION ----------
  retinierter_eckzahn: {
    label: 'Retinierter und verlagerter oberer Eckzahn',
    file: 'File:Eckzahn retiniert und verlagert Zahn 13 OPG 20100106 001.JPG',
    verified: true,
    befund: 'im Oberkiefer liegt ein Eckzahn quer oberhalb der Wurzeln der Nachbarzähne, er ist nicht durchgebrochen; die übrige Bezahnung ist regelrecht',
    fits: ['Retention des Eckzahns', 'persistierender Milcheckzahn', 'kieferorthopädische Einordnung', 'Wurzelresorption der Nachbarzähne', 'Zufallsbefund']
  },
  // RAD ETILDI: hajmi juda kichik (600x331), da'vo qilingan topilma ajratib bo'lmaydi
  transmigranter_eckzahn: {
    label: 'Transmigrierter Eckzahn',
    file: 'File:Panoramic-radiograph-depicting-transmigrant-maxillary-right-canine-case-20-with-overretained-deciduous-right-maxillary-c.jpg',
    verified: false,
    rejected: 'zu geringe Auflösung, Befund nicht erkennbar',
    befund: '',
    fits: []
  },
  // RAD ETILDI: oddiy rentgen emas, rangli 3D rekonstruksiya — mashq uchun chalg'ituvchi
  impaktierter_8er_ct: {
    label: 'Impaktierter Weisheitszahn (3D-CT)',
    file: 'File:Severely impacted wisdom tooth CT scan - upper right.jpg',
    verified: false,
    rejected: '3D-Rekonstruktion, kein konventionelles Röntgenbild',
    befund: '',
    fits: []
  },
  retinierte_8er_oben: {
    label: 'Retinierte obere Weisheitszähne',
    file: 'File:Orthopantomogram of a patient with Eagles syndrome due to impacted upper third molar.jpg',
    verified: true,
    befund: 'Panoramaschichtbild: beidseits hoch im Oberkiefer retinierte Weisheitszähne, im Unterkiefer keine durchgebrochenen Weisheitszähne, die übrige Bezahnung ohne kariöse Läsionen und mit regelrechtem Knochenverlauf',
    fits: ['retinierte Weisheitszähne', 'Druckgefühl im Oberkiefer', 'atypische Gesichtsschmerzen', 'Entfernungsindikation', 'Zufallsbefund']
  },

  // ---------- ENDODONTIE / IATROGEN ----------
  wurzelfuellung_47: {
    label: 'Wurzelkanalbehandelter Molar',
    file: 'File:Iopa.jpg',
    verified: false,
    befund: 'wurzelkanalbehandelter unterer Molar mit Wurzelfüllung',
    fits: ['Zustand nach Wurzelkanalbehandlung', 'Kontrollaufnahme']
  },
  frakturiertes_instrument: {
    label: 'Frakturiertes Instrument im Wurzelkanal',
    file: 'File:Broken endodontic file in mesial root canal.jpg',
    verified: false,
    befund: 'frakturiertes endodontisches Instrument im mesialen Wurzelkanal',
    fits: ['Komplikation Wurzelkanalbehandlung', 'Aufklärung', 'Überweisung Endodontologie']
  },
  wurzelfraktur: {
    label: 'Wurzelfraktur vor Extraktion',
    file: 'File:Solo - breuk.jpg',
    verified: false,
    befund: 'Wurzelfraktur',
    fits: ['Trauma', 'Extraktionsindikation', 'Zahnerhalt nicht möglich']
  },
  hemisektion: {
    label: 'Hemisektion eines Molaren',
    file: 'File:Hemisection of Molar tooth.jpg',
    verified: false,
    befund: 'Zustand nach Hemisektion, mesiale Wurzel entfernt',
    fits: ['Zahnerhaltende Chirurgie', 'Furkationsbefall']
  },

  // ---------- IMPLANTATE ----------
  implantat_regelrecht: {
    label: 'Implantat in regelrechter Position',
    file: 'File:Xray two cylinders.jpg',
    verified: false,
    befund: 'zwei zylindrische Implantate im Kiefer, regelrechte Osseointegration',
    fits: ['Implantatkontrolle', 'Zustand nach Implantation']
  },

  // ---------- ENTWICKLUNG / KINDER ----------
  milchzahn_mit_keim: {
    label: 'Milchmolar mit darunterliegendem Zahnkeim',
    file: 'File:Intraoral Periapical Radiograph (IOPA) showing Deciduous(Milky or Primary) Tooth 75 and developing crown of Permanent or Secondary Teeth 35, 36 and 37.jpg',
    verified: true,
    befund: 'Milchmolar mit divergierenden Wurzeln und darunterliegendem, intaktem Keim des bleibenden Zahnes; kein periapikaler Befund, kein Knochenabbau im Furkationsbereich',
    fits: ['Kinderbehandlung', 'Milchzahnkaries mit erhaltbarem Zahn', 'Pulpotomie statt Extraktion', 'Zahnwechsel', 'ängstliches Kind']
  },
  wechselgebiss: {
    label: 'OPG im Wechselgebiss',
    file: 'File:Orthopantomogram of a mixed dentition patient with curved root.jpg',
    verified: false,
    befund: 'Wechselgebiss mit gekrümmter Wurzel',
    fits: ['Kinderbehandlung', 'Zahnwechsel', 'Kieferorthopädie']
  },
  amelogenesis: {
    label: 'Schmelzbildungsstörung',
    file: 'File:Amelogenesis.jpg',
    verified: false,
    befund: 'fehlende Schmelzopazität und pathologischer Schmelzverlust',
    fits: ['Amelogenesis imperfecta', 'Schmelzdefekt', 'genetische Erkrankung']
  },

  // ---------- SONSTIGE ----------
  cod: {
    label: 'Zemento-ossäre Dysplasie',
    file: 'File:Periapical COD.png',
    verified: false,
    befund: 'periapikale Verschattung/Mischstruktur ohne Bezug zu einer Pulpanekrose',
    fits: ['Zufallsbefund', 'Differentialdiagnose periapikale Läsion', 'kein Behandlungsbedarf']
  },
  odontogene_sinusitis: {
    label: 'Odontogene Sinusitis (CT)',
    file: 'File:Odontogenic sinusitis.jpg',
    verified: false,
    befund: 'vollständige Verschattung der rechten Kieferhöhle und der vorderen Siebbeinzellen',
    fits: ['odontogene Sinusitis', 'Oberkiefermolar', 'HNO-Überweisung']
  },
  aufhellung_generisch: {
    label: 'Aufhellung auf dem Röntgenfilm',
    file: 'File:Aufhellung.jpg',
    verified: false,
    befund: 'umschriebene Aufhellung',
    fits: ['Differentialdiagnose Aufhellung', 'Zyste', 'Granulom']
  },
  amalgamfuellung: {
    label: 'Amalgamfüllung',
    file: 'File:Amalgam filling.JPG',
    verified: false,
    befund: 'ausgedehnte Amalgamfüllung',
    fits: ['Füllungserneuerung', 'Sekundärkaries', 'Amalgamdiskussion']
  }
};

// Faqat tekshirilgan topilmalar saytda ishlatiladi
export function verifiedFindings(){
  return Object.entries(FINDINGS)
    .filter(([, f]) => f.verified)
    .map(([key, f]) => ({ key, ...f }));
}

export function findingByKey(key){
  const f = FINDINGS[key];
  return f && f.verified ? { key, ...f } : null;
}

// Tekshirish navbati
export function unverifiedFindings(){
  return Object.entries(FINDINGS)
    .filter(([, f]) => !f.verified)
    .map(([key, f]) => ({ key, ...f }));
}
