import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuestRoute } from '@/features/auth/components/AuthRoutes';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import * as authApi from '@/lib/auth-api';
import { clearAccessToken } from '@/lib/auth-storage';
import { ApiError } from '@/lib/api-client';
import { SignInPage } from '@/pages/SignInPage';

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

function renderSignInPage() {
  return render(
    <MemoryRouter initialEntries={['/sign-in']}>
      <AuthProvider>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/sign-in" element={<SignInPage />} />
          </Route>
          <Route path="/app" element={<div>app page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('SignInPage', () => {
  beforeEach(() => {
    clearAccessToken();
    vi.mocked(authApi.getMe).mockReset();
    vi.mocked(authApi.signIn).mockReset();
  });

  it('shows client validation errors before submitting', async () => {
    const user = userEvent.setup();
    renderSignInPage();

    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(authApi.signIn).not.toHaveBeenCalled();
  });

  it('shows API errors and navigates on success', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.signIn)
      .mockRejectedValueOnce(new ApiError(401, 'Invalid credentials'))
      .mockResolvedValueOnce({
        user: mockUser,
        accessToken: 'jwt-token',
      });

    renderSignInPage();

    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'Secret1!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Invalid credentials',
    );

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByText('app page')).toBeInTheDocument();
    });
    expect(sessionStorage.getItem('auth.accessToken')).toBe('jwt-token');
  });

  it('prevents duplicate submissions while loading', async () => {
    const user = userEvent.setup();
    let resolveSignIn: (value: {
      user: typeof mockUser;
      accessToken: string;
    }) => void = () => undefined;
    const pending = new Promise<{
      user: typeof mockUser;
      accessToken: string;
    }>((resolve) => {
      resolveSignIn = resolve;
    });
    vi.mocked(authApi.signIn).mockReturnValueOnce(pending);

    renderSignInPage();

    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'Secret1!');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const submittingButton = screen.getByRole('button', {
      name: 'Signing in…',
    });
    expect(submittingButton).toBeDisabled();

    resolveSignIn({ user: mockUser, accessToken: 'jwt-token' });

    await waitFor(() => {
      expect(screen.getByText('app page')).toBeInTheDocument();
    });
    expect(authApi.signIn).toHaveBeenCalledTimes(1);
  });
});
