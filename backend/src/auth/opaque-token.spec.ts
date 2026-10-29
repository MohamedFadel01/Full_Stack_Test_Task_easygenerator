import { describe, expect, it } from 'vitest';
import {
  generateOpaqueToken,
  hashOpaqueToken,
  opaqueTokensMatch,
} from './opaque-token.js';

describe('opaque-token', () => {
  it('generateOpaqueToken produces URL-safe tokens', () => {
    const token = generateOpaqueToken();
    expect(token.length).toBeGreaterThan(20);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('hashOpaqueToken is deterministic', () => {
    const token = 'sample-token-value';
    expect(hashOpaqueToken(token)).toBe(hashOpaqueToken(token));
    expect(hashOpaqueToken(token)).not.toBe(token);
  });

  it('opaqueTokensMatch uses constant-time comparison semantics', () => {
    const token = generateOpaqueToken();
    const hash = hashOpaqueToken(token);
    expect(opaqueTokensMatch(hash, token)).toBe(true);
    expect(opaqueTokensMatch(hash, `${token}x`)).toBe(false);
  });
});
