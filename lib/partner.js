export function roomIdFor(a, b){
  return [a, b].sort().join('_');
}

const PROMPTS = [
  'Patient A hat seit 2 Tagen pochenden Schmerz im Unterkiefer, verstärkt nachts. Rollenspiel: einer fragt (Arzt), einer antwortet (Patient) — danach wechseln.',
  'Patient B kommt zur Nachkontrolle nach einer Extraktion vor 5 Tagen, klagt über Schwellung. Übt die Anamnese abwechselnd.',
  'Patientin C, schwanger (24. SSW), hat Zahnfleischbluten. Übt, wie man einfühlsam und fachlich korrekt fragt.',
  'Patient D, Diabetiker, hat einen Abszess am Zahn 46. Übt die Frage nach Allgemeinerkrankungen und Medikamenten.',
  'Übt einen Arztbrief mündlich zusammenzufassen: einer diktiert die Befunde, der andere wiederholt sie in Fachsprache.'
];

export function randomPrompt(){
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}
