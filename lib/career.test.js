import { describe, expect, it } from 'vitest';
import { careerStage, levelFromXp } from './career';

describe('career progression', () => {
  it('calculates stable 150 XP levels', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(149)).toBe(1);
    expect(levelFromXp(150)).toBe(2);
  });

  it('returns the correct career stage', () => {
    expect(careerStage(1).title).toContain('Assistenzarzt');
    expect(careerStage(23).title).toBe('Praxisinhaber');
  });
});
