import { describe, expect, it } from 'vitest';
import {
  signInSchema,
  signUpSchema,
} from '@/features/auth/validation/auth-schemas';

describe('signUpSchema', () => {
  const valid = {
    email: '  user@example.com  ',
    name: '  Jane Doe  ',
    password: 'Secret1!',
  };

  it('accepts valid input and trims email and name', () => {
    const result = signUpSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
      expect(result.data.name).toBe('Jane Doe');
      expect(result.data.password).toBe('Secret1!');
    }
  });

  it('rejects invalid email', () => {
    const result = signUpSchema.safeParse({ ...valid, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects short names after trim', () => {
    const result = signUpSchema.safeParse({ ...valid, name: '  ab  ' });
    expect(result.success).toBe(false);
  });

  it('rejects passwords missing required character classes', () => {
    expect(
      signUpSchema.safeParse({ ...valid, password: 'Secret!!' }).success,
    ).toBe(false);
    expect(
      signUpSchema.safeParse({ ...valid, password: '12345678!' }).success,
    ).toBe(false);
    expect(
      signUpSchema.safeParse({ ...valid, password: 'Secret12' }).success,
    ).toBe(false);
    expect(
      signUpSchema.safeParse({ ...valid, password: 'Sec1!' }).success,
    ).toBe(false);
  });
});

describe('signInSchema', () => {
  it('trims email and requires password', () => {
    const result = signInSchema.safeParse({
      email: '  user@example.com  ',
      password: 'Secret1!',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects empty password', () => {
    const result = signInSchema.safeParse({
      email: 'user@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});
