import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '@/features/auth/components/AuthRoutes';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { ThemeProvider } from '@/features/theme/ThemeProvider';
import * as authApi from '@/lib/auth-api';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/lib/auth-storage';
import { ApiError } from '@/lib/api-client';
import { AppPage } from '@/pages/AppPage';

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

describe('AppPage', () => {
  beforeEach(() => {
    clearAccessToken();
    setAccessToken('token');
    vi.mocked(authApi.getMe).mockResolvedValue({ user: mockUser });
    vi.mocked(authApi.logoutSession).mockResolvedValue(undefined);
    vi.mocked(authApi.refreshSession).mockRejectedValue(new ApiError(401, 'x'));
  });

  it('shows the required welcome message and logs out', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/app']}>
        <ThemeProvider>
          <AuthProvider>
            <Routes>
              <Route element={<ProtectedRoute />}>
                <Route path="/app" element={<AppPage />} />
              </Route>
              <Route path="/sign-in" element={<div>sign-in page</div>} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Welcome to the application.',
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    await waitFor(() => {
      expect(screen.getByText('sign-in page')).toBeInTheDocument();
    });
    expect(getAccessToken()).toBeNull();
  });
});
