import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeProvider } from '@/features/theme/ThemeProvider';

describe('ThemeToggle', () => {
  it('toggles dark class on the document', async () => {
    localStorage.setItem('ui.theme', 'light');
    document.documentElement.classList.remove('dark');

    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: 'Switch to dark mode' }),
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    await user.click(
      screen.getByRole('button', { name: 'Switch to light mode' }),
    );
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
