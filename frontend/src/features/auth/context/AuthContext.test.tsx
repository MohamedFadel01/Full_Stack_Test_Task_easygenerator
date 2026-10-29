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
  refreshSession: vi.fn(),
  logoutSession: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

const mockUser = {
  id: 'user-1',
  email: 'user@example.com',
  name: 'Jane Doe',
  emailVerifiedAt: '2026-01-02T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function AuthProbe() {
  const { user, status, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <button type="button" onClick={() => void logout()}>
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
    vi.mocked(authApi.refreshSession).mockReset();
    vi.mocked(authApi.logoutSession).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('bootstraps via getMe when an in-memory token exists', async () => {
    setAccessToken('stored-token');
    vi.mocked(authApi.getMe).mockResolvedValueOnce({ user: mockUser });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });
    expect(authApi.getMe).toHaveBeenCalledWith('stored-token');
    expect(authApi.refreshSession).not.toHaveBeenCalled();
  });

  it('bootstraps via refresh when no access token is stored', async () => {
    vi.mocked(authApi.refreshSession).mockResolvedValueOnce({
      user: mockUser,
      accessToken: 'refreshed-token',
    });

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });
    expect(getAccessToken()).toBe('refreshed-token');
  });

  it('clears storage when getMe returns 401 and refresh fails', async () => {
    setAccessToken('expired-token');
    vi.mocked(authApi.getMe).mockRejectedValueOnce(
      new ApiError(401, 'Unauthorized'),
    );
    vi.mocked(authApi.refreshSession).mockRejectedValueOnce(
      new ApiError(401, 'Invalid refresh token'),
    );

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
    });
    expect(getAccessToken()).toBeNull();
  });

  it('logout clears the stored token and calls the API', async () => {
    setAccessToken('stored-token');
    vi.mocked(authApi.getMe).mockResolvedValueOnce({ user: mockUser });
    const user = userEvent.setup();

    renderAuthProvider();

    await waitFor(() => {
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated');
    });

    await user.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() => {
      expect(getAccessToken()).toBeNull();
    });
    expect(authApi.logoutSession).toHaveBeenCalled();
    expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated');
  });
});
