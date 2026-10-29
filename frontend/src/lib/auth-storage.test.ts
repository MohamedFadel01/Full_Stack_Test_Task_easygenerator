import { describe, expect, it } from 'vitest';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth-storage';

describe('auth-storage', () => {
  it('stores and retrieves the access token', () => {
    clearAccessToken();
    expect(getAccessToken()).toBeNull();

    setAccessToken('test-token');
    expect(getAccessToken()).toBe('test-token');
  });

  it('clears the access token', () => {
    setAccessToken('test-token');
    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});
