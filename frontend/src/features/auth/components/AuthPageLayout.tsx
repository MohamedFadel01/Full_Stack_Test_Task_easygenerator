import type { ReactNode } from 'react';
import { PageShell } from '@/components/page-shell';

type AuthPageLayoutProps = {
  children: ReactNode;
};

export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <PageShell>
      <div className="relative z-10 flex min-h-svh w-full items-center justify-center p-6 pt-16 md:p-10">
        <div className="w-full max-w-sm [&_[data-slot=card]]:border-border/50 [&_[data-slot=card]]:bg-card/80 [&_[data-slot=card]]:shadow-2xl [&_[data-slot=card]]:backdrop-blur-xl">
          {children}
        </div>
      </div>
    </PageShell>
  );
}
