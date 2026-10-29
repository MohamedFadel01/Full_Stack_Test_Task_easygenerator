import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from '@/App';
import { AuthProvider } from '@/features/auth/context/AuthContext';

vi.mock('@/lib/auth-api', () => ({
  getMe: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

describe('App routing', () => {
  it('redirects unauthenticated users from / to sign-in', async () => {
    render(
      <AuthProvider>
        <App />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
    });
  });
});
