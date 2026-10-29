import { describe, expect, it } from 'vitest';
import { ApiError, parseNestErrorMessage } from '@/lib/api-client';

describe('parseNestErrorMessage', () => {
  it('joins validation message arrays', () => {
    expect(
      parseNestErrorMessage(
        { message: ['email must be an email', 'name is too short'] },
        'fallback',
      ),
    ).toBe('email must be an email, name is too short');
  });

  it('returns string messages', () => {
    expect(
      parseNestErrorMessage({ message: 'Invalid credentials' }, 'fallback'),
    ).toBe('Invalid credentials');
  });

  it('uses fallback for unknown shapes', () => {
    expect(parseNestErrorMessage(null, 'fallback')).toBe('fallback');
  });
});

describe('ApiError', () => {
  it('exposes status and message', () => {
    const error = new ApiError(401, 'Invalid credentials');
    expect(error.status).toBe(401);
    expect(error.message).toBe('Invalid credentials');
  });
});
