export const FALLBACK_TOPICS = [
  'Anamnese',
  'Differentialdiagnose',
  'Fachbegriffe',
  'Röntgenbefund',
  'Therapieplanung'
];

export function normalizeTopic(value) {
  const topic = String(value || '').trim();
  return topic || 'Allgemeines FSP-Wissen';
}

export function topicStats(mistakes = []) {
  const counts = new Map();
  for (const mistake of mistakes) {
    const topic = normalizeTopic(mistake.topic || mistake.case_name || mistake.difficulty);
    counts.set(topic, (counts.get(topic) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}

export function primaryFocus(mistakes = []) {
  return topicStats(mistakes)[0]?.topic || FALLBACK_TOPICS[0];
}

export function buildFallbackPlan(mistakes = []) {
  const ranked = topicStats(mistakes);
  const topics = [...ranked.map(item => item.topic), ...FALLBACK_TOPICS]
    .filter((topic, index, all) => all.indexOf(topic) === index);

  return {
    summary: mistakes.length
      ? `Aus ${mistakes.length} gespeicherten Fehlern wurde ein persönlicher Lernweg erstellt.`
      : 'Beginnen Sie mit einer kurzen Standortbestimmung. Der Plan passt sich danach automatisch an.',
    focusTopic: topics[0],
    weakTopics: topics.slice(0, 3).map((topic, index) => ({
      topic,
      reason: index < ranked.length
        ? `${ranked[index].count} gespeicherte Fehler in diesem Bereich.`
        : 'Wichtiger Bestandteil der Fachsprachprüfung.'
    })),
    days: Array.from({ length: 7 }, (_, index) => ({
      day: index + 1,
      topic: topics[index % topics.length],
      goal: index === 6 ? 'Wiederholen und Fortschritt prüfen' : 'Begriffe verstehen und sicher anwenden',
      minutes: 10
    })),
    coachTip: 'Erklären Sie jede richtige Antwort laut in zwei Sätzen. So trainieren Sie Wissen und Prüfungssprache gleichzeitig.'
  };
}

export function currentWeekStart(date = new Date()) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  return utc.toISOString().slice(0, 10);
}
