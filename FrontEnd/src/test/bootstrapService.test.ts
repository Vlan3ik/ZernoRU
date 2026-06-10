import { describe, expect, it } from 'vitest';
import { bootstrapData } from '../services/bootstrapService';

describe('bootstrapData', () => {
  it('is a no-op in the API-backed app', () => {
    expect(() => bootstrapData()).not.toThrow();
  });
});
