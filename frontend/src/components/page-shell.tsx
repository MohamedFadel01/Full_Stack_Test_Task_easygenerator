import type { ReactNode } from 'react';
import { AnimatedGradientBackground } from '@/components/animated-gradient-background';
import { ThemeToggle } from '@/components/theme-toggle';

type PageShellProps = {
  children: ReactNode;
  header?: ReactNode;
  showThemeToggle?: boolean;
};

export function PageShell({
  children,
  header,
  showThemeToggle = true,
}: PageShellProps) {
  return (
    <div className="relative flex min-h-svh flex-col">
      <AnimatedGradientBackground />
      {showThemeToggle ? (
        <div className="pointer-events-none fixed top-4 right-4 z-20">
          <ThemeToggle className="pointer-events-auto bg-card/70 backdrop-blur-md" />
        </div>
      ) : null}
      {header}
      {children}
    </div>
  );
}
