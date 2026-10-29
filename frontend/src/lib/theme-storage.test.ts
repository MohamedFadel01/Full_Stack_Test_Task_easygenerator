import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyThemeToDocument,
  persistTheme,
  readStoredTheme,
  resolveInitialTheme,
} from '@/lib/theme-storage';

describe('theme-storage', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('returns null when nothing is stored', () => {
    expect(readStoredTheme()).toBeNull();
  });

  it('persists and reads light and dark themes', () => {
    persistTheme('dark');
    expect(readStoredTheme()).toBe('dark');
    persistTheme('light');
    expect(readStoredTheme()).toBe('light');
  });

  it('falls back to system preference when storage is empty', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('dark'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    expect(resolveInitialTheme()).toBe('dark');
  });

  it('applies dark class on the document element', () => {
    applyThemeToDocument('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    applyThemeToDocument('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
