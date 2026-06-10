import { describe, expect, it, beforeEach } from 'vitest';
import { bootstrapData } from '../services/bootstrapService';

describe('bootstrapData', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps localStorage untouched because the backend owns seeding now', () => {
    bootstrapData();
    expect(localStorage.length).toBe(0);
  });
});
