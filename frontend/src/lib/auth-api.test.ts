import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signIn, signUp, getMe } from '@/lib/auth-api';

describe('auth-api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('signUp posts to /auth/sign-up and returns the response', async () => {
    const mockResponse = {
      user: {
        id: '1',
        email: 'a@example.com',
        name: 'Jane',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      accessToken: 'token-123',
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    } as Response);

    const result = await signUp({
      email: 'a@example.com',
      name: 'Jane',
      password: 'Secret1!',
    });

    expect(result).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/sign-up',
      expect.objectContaining({
        method: 'POST',
        credentials: 'omit',
        body: JSON.stringify({
          email: 'a@example.com',
          name: 'Jane',
          password: 'Secret1!',
        }),
      }),
    );
  });

  it('signIn surfaces 401 messages', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Invalid credentials' }),
    } as Response);

    await expect(
      signIn({ email: 'a@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({
      status: 401,
      message: 'Invalid credentials',
    });
  });

  it('getMe sends Bearer authorization', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          id: '1',
          email: 'a@example.com',
          name: 'Jane',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      }),
    } as Response);

    await getMe('jwt-token');

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/me',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-token',
        }),
      }),
    );
  });

  it('signUp surfaces 400 validation message arrays', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        message: ['email must be an email', 'name must be longer'],
      }),
    } as Response);

    await expect(
      signUp({
        email: 'bad',
        name: 'ab',
        password: 'Secret1!',
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: 'email must be an email, name must be longer',
    });
  });

  it('signUp surfaces 409 duplicate email message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Email already registered' }),
    } as Response);

    await expect(
      signUp({
        email: 'dup@example.com',
        name: 'Jane',
        password: 'Secret1!',
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Email already registered',
    });
  });
});
