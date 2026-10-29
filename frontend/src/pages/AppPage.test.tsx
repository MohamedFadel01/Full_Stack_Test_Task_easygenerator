import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '@/features/auth/components/AuthRoutes';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import * as authApi from '@/lib/auth-api';
import { AppPage } from '@/pages/AppPage';

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

describe('AppPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(authApi.getMe).mockResolvedValue({ user: mockUser });
    sessionStorage.setItem('auth.accessToken', 'token');
  });

  it('shows the required welcome message and logs out', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/app']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<AppPage />} />
            </Route>
            <Route path="/sign-in" element={<div>sign-in page</div>} />
          </Routes>
        </AuthProvider>
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
    expect(sessionStorage.getItem('auth.accessToken')).toBeNull();
  });
});
