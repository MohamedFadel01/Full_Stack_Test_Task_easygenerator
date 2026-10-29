import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext';
import * as authApi from '@/lib/auth-api';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth-storage';
import { ApiError } from '@/lib/api-client';

vi.mock('@/lib/auth-api', () => ({
  getMe: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

const mockUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Jane Doe',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function AuthProbe() {
  const { user, status, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  );
}

function renderAuthProvider() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    clearAccessToken();
    vi.mocked(authApi.getMe).mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('bootstraps an authenticated session when getMe succeeds', async () => {
    setAccessToken('stored-token');
    vi.mocked(authApi.getMe).mockResolvedValueOnce({ user: mockUser });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });
    expect(screen.getByTestId('email')).toHaveTextContent('user@example.com');
    expect(authApi.getMe).toHaveBeenCalledWith('stored-token');
  });

  it('clears storage when getMe returns 401', async () => {
    setAccessToken('expired-token');
    vi.mocked(authApi.getMe).mockRejectedValueOnce(
      new ApiError(401, 'Unauthorized'),
    );

    renderAuthProvider();

    await waitFor(() => {
      expect(getAccessToken()).toBeNull();
    });
    expect(screen.getByTestId('email')).toHaveTextContent('none');
  });

  it('logout clears the stored token', async () => {
    setAccessToken('stored-token');
    vi.mocked(authApi.getMe).mockResolvedValueOnce({ user: mockUser });
    const user = userEvent.setup();

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });

    await user.click(screen.getByRole('button', { name: 'logout' }));

    expect(getAccessToken()).toBeNull();
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
  });
});
