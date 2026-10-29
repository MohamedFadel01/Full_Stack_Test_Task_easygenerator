import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GuestRoute } from '@/features/auth/components/AuthRoutes';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { ThemeProvider } from '@/features/theme/ThemeProvider';
import * as authApi from '@/lib/auth-api';
import { clearAccessToken, getAccessToken } from '@/lib/auth-storage';
import { ApiError } from '@/lib/api-client';
import { SignUpPage } from '@/pages/SignUpPage';

vi.mock('@/lib/auth-api', () => ({
  getMe: vi.fn(),
  refreshSession: vi.fn(),
  logoutSession: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

function renderSignUpPage() {
  return render(
    <MemoryRouter initialEntries={['/sign-up']}>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/sign-up" element={<SignUpPage />} />
            </Route>
            <Route path="/check-email" element={<div>check email page</div>} />
            <Route path="/app" element={<div>app page</div>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  );
}

describe('SignUpPage', () => {
  beforeEach(() => {
    clearAccessToken();
    vi.mocked(authApi.signUp).mockReset();
    vi.mocked(authApi.refreshSession).mockRejectedValue(new ApiError(401, 'x'));
  });

  it('shows password validation errors', async () => {
    const user = userEvent.setup();
    renderSignUpPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Create your account' }),
      ).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Name'), 'Jane');
    await user.type(screen.getByLabelText('Email'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(
      await screen.findByText('Password must be at least 8 characters'),
    ).toBeInTheDocument();
    expect(authApi.signUp).not.toHaveBeenCalled();
  });

  it('shows duplicate email API errors', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.signUp).mockRejectedValueOnce(
      new ApiError(409, 'Email already registered'),
    );

    renderSignUpPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Create your account' }),
      ).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'dup@example.com');
    await user.type(screen.getByLabelText('Password'), 'Secret1!');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Email already registered',
    );
  });

  it('navigates to check email after successful sign-up', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.signUp).mockResolvedValueOnce({
      user: {
        id: 'user-1',
        email: 'new@example.com',
        name: 'Jane Doe',
        emailVerifiedAt: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      message: 'Check your email',
    });

    renderSignUpPage();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Create your account' }),
      ).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('Name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'Secret1!');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));

    await waitFor(() => {
      expect(screen.getByText('check email page')).toBeInTheDocument();
    });
    expect(getAccessToken()).toBeNull();
  });
});
