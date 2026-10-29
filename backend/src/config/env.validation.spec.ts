import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './env.validation.js';

describe('validateEnvironment', () => {
  it('throws when MONGODB_URI is missing', () => {
    expect(() => validateEnvironment({})).toThrow(
      /Environment validation failed.*MONGODB_URI/i,
    );
  });

  it('throws when MONGODB_URI is empty', () => {
    expect(() => validateEnvironment({ MONGODB_URI: '' })).toThrow(
      /Environment validation failed/i,
    );
  });

  it('returns validated config when MONGODB_URI is set', () => {
    const result = validateEnvironment({
      MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
      JWT_SECRET: 'test-secret',
      PORT: '3000',
    });

    expect(result.MONGODB_URI).toBe('mongodb://127.0.0.1:27017/test');
    expect(result.JWT_SECRET).toBe('test-secret');
    expect(result.PORT).toBe('3000');
  });

  it('throws when JWT_SECRET is missing', () => {
    expect(() =>
      validateEnvironment({
        MONGODB_URI: 'mongodb://127.0.0.1:27017/test',
      }),
    ).toThrow(/Environment validation failed/i);
  });
});
