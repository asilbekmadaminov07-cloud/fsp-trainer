import { describe, expect, it } from 'vitest';
import { buildFallbackPlan, currentWeekStart, primaryFocus, topicStats } from './learning';

describe('personal learning helpers', () => {
  const mistakes = [
    { topic: 'Anamnese' }, { topic: 'Fachbegriffe' }, { topic: 'Anamnese' }
  ];

  it('ranks the most frequent weak topic first', () => {
    expect(topicStats(mistakes)[0]).toEqual({ topic: 'Anamnese', count: 2 });
    expect(primaryFocus(mistakes)).toBe('Anamnese');
  });

  it('always creates a seven day plan', () => {
    expect(buildFallbackPlan(mistakes).days).toHaveLength(7);
  });

  it('uses Monday as the weekly league boundary', () => {
    expect(currentWeekStart(new Date('2026-09-18T12:00:00Z'))).toBe('2026-09-14');
  });
});
