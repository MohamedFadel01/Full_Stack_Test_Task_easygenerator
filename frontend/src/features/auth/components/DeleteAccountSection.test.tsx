import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteAccountSection } from '@/features/auth/components/DeleteAccountSection';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { ThemeProvider } from '@/features/theme/ThemeProvider';
import * as authApi from '@/lib/auth-api';
import { ApiError } from '@/lib/api-client';
import { setAccessToken } from '@/lib/auth-storage';

vi.mock('@/lib/auth-api', () => ({
  deleteAccount: vi.fn(),
  getMe: vi.fn(),
  refreshSession: vi.fn(),
  logoutSession: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('DeleteAccountSection', () => {
  beforeEach(() => {
    setAccessToken('token');
    mockNavigate.mockReset();
    vi.mocked(authApi.deleteAccount).mockReset();
    vi.mocked(authApi.logoutSession).mockResolvedValue(undefined);
    vi.mocked(authApi.getMe).mockResolvedValue({
      user: {
        id: '1',
        email: 'user@example.com',
        name: 'Jane',
        emailVerifiedAt: '2026-01-02T00:00:00.000Z',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    vi.mocked(authApi.refreshSession).mockRejectedValue(
      new ApiError(401, 'no session'),
    );
  });

  function renderSection() {
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <AuthProvider>
            <DeleteAccountSection />
          </AuthProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
  }

  it('shows delete form only after opening from the trigger button', async () => {
    const user = userEvent.setup();
    renderSection();

    expect(
      screen.queryByLabelText('Confirm with your password'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete account…' }));

    expect(
      screen.getByLabelText('Confirm with your password'),
    ).toBeInTheDocument();
  });

  it('closes the form when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Delete account…' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.queryByLabelText('Confirm with your password'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Delete account…' }),
    ).toBeInTheDocument();
  });

  it('calls deleteAccount and navigates to sign-in on success', async () => {
    vi.mocked(authApi.deleteAccount).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Delete account…' }));
    await user.type(
      screen.getByLabelText('Confirm with your password'),
      'Secret1!',
    );
    await user.click(screen.getByRole('button', { name: 'Delete my account' }));

    await waitFor(() => {
      expect(authApi.deleteAccount).toHaveBeenCalledWith('Secret1!');
    });
    expect(mockNavigate).toHaveBeenCalledWith('/sign-in', { replace: true });
  });

  it('keeps delete disabled until password is at least 8 characters', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Delete account…' }));

    const deleteButton = screen.getByRole('button', {
      name: 'Delete my account',
    });
    expect(deleteButton).toBeDisabled();

    await user.type(
      screen.getByLabelText('Confirm with your password'),
      '1234567',
    );
    expect(deleteButton).toBeDisabled();

    await user.type(screen.getByLabelText('Confirm with your password'), '8');
    expect(deleteButton).toBeEnabled();
  });

  it('shows error when password is rejected', async () => {
    vi.mocked(authApi.deleteAccount).mockRejectedValue(
      new ApiError(401, 'Invalid credentials'),
    );
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Delete account…' }));
    await user.type(
      screen.getByLabelText('Confirm with your password'),
      'WrongPass1!',
    );
    await user.click(screen.getByRole('button', { name: 'Delete my account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /incorrect password/i,
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
