import { describe, expect, it } from 'vitest';
import { CASES, DIFFS } from './cases';
import { verifiedFindings } from './findings';

describe('clinical case library', () => {
  it('contains a broad and balanced case pool', () => {
    expect(CASES.length).toBeGreaterThanOrEqual(27);
    for (const difficulty of DIFFS) {
      expect(CASES.filter(item => item.difficulty === difficulty).length).toBeGreaterThanOrEqual(5);
    }
  });

  it('has complete, unique manual cases', () => {
    expect(new Set(CASES.map(item => item.name)).size).toBe(CASES.length);
    for (const item of CASES) {
      expect(item.diagnosis.length).toBeGreaterThan(10);
      expect(item.opener.length).toBeGreaterThan(10);
      expect(item.system.length).toBeGreaterThan(80);
      expect(item.commonsFile).toMatch(/^File:/);
    }
  });

  it('offers at least fifteen verified radiographic findings', () => {
    expect(verifiedFindings().length).toBeGreaterThanOrEqual(15);
  });
});
