import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  GuestRoute,
  ProtectedRoute,
} from '@/features/auth/components/AuthRoutes';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import * as authApi from '@/lib/auth-api';
import { clearAccessToken } from '@/lib/auth-storage';

vi.mock('@/lib/auth-api', () => ({
  getMe: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

describe('Auth route guards', () => {
  beforeEach(() => {
    clearAccessToken();
    vi.mocked(authApi.getMe).mockReset();
  });

  it('redirects unauthenticated users away from protected routes', async () => {
    render(
      <MemoryRouter initialEntries={['/app']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<div>protected content</div>} />
            </Route>
            <Route path="/sign-in" element={<div>sign-in page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('sign-in page')).toBeInTheDocument();
    });
  });

  it('shows loading state while bootstrapping', () => {
    sessionStorage.setItem('auth.accessToken', 'token');
    vi.mocked(authApi.getMe).mockImplementation(
      () => new Promise(() => undefined),
    );

    render(
      <MemoryRouter initialEntries={['/app']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<div>protected content</div>} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Loading session…');
  });

  it('renders protected content for authenticated users', async () => {
    vi.mocked(authApi.getMe).mockResolvedValueOnce({
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'Jane',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    sessionStorage.setItem('auth.accessToken', 'token');

    render(
      <MemoryRouter initialEntries={['/app']}>
        <AuthProvider>
          <Routes>
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<div>protected content</div>} />
            </Route>
            <Route path="/sign-in" element={<div>sign-in page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('protected content')).toBeInTheDocument();
    });
  });

  it('redirects authenticated users away from guest routes', async () => {
    vi.mocked(authApi.getMe).mockResolvedValueOnce({
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'Jane',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    sessionStorage.setItem('auth.accessToken', 'token');

    render(
      <MemoryRouter initialEntries={['/sign-in']}>
        <AuthProvider>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/sign-in" element={<div>sign-in form</div>} />
            </Route>
            <Route path="/app" element={<div>app page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('app page')).toBeInTheDocument();
    });
  });
});
