import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { ThemeProvider } from '@/features/theme/ThemeProvider';
import * as authApi from '@/lib/auth-api';
import { ApiError } from '@/lib/api-client';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';

vi.mock('@/lib/auth-api', () => ({
  verifyEmail: vi.fn(),
  getMe: vi.fn(),
  refreshSession: vi.fn(),
  logoutSession: vi.fn(),
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.mocked(authApi.verifyEmail).mockReset();
    vi.mocked(authApi.refreshSession).mockRejectedValue(
      new ApiError(401, 'no session'),
    );
  });

  it('shows error when token query param is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/verify-email']}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/verify-email" element={<VerifyEmailPage />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Verification link is invalid.'),
    ).toBeInTheDocument();
  });

  it('verifies token and navigates to app', async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValueOnce({
      accessToken: 'access',
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'Jane',
        emailVerifiedAt: '2026-01-02T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    render(
      <MemoryRouter initialEntries={['/verify-email?token=abc']}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/app" element={<div>app home</div>} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('app home')).toBeInTheDocument();
    });
    expect(authApi.verifyEmail).toHaveBeenCalledWith('abc');
  });
});
