import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders scaffold placeholder', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'Easygenerator Auth' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Scaffold ready')).toBeInTheDocument();
  });
});
