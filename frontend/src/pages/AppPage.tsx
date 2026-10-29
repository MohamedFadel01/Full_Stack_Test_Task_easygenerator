import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/page-shell';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';

export function AppPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/sign-in', { replace: true });
  }

  return (
    <PageShell
      showThemeToggle={false}
      header={
        <header className="relative z-10 flex items-center justify-between border-b border-border/50 bg-card/60 px-6 py-4 backdrop-blur-md">
          <p className="text-sm text-muted-foreground">
            Signed in as {user?.email}
          </p>
          <div className="flex items-center gap-2">
            <ThemeToggle className="bg-card/70 backdrop-blur-md" />
            <Button type="button" variant="outline" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </header>
      }
    >
      <main className="relative z-10 flex flex-1 min-h-[calc(100svh-4.5rem)] items-center justify-center p-6">
        <div className="rounded-2xl border border-border/50 bg-card/75 px-10 py-12 text-center shadow-2xl backdrop-blur-xl">
          <h1 className="text-2xl font-medium">Welcome to the application.</h1>
        </div>
      </main>
    </PageShell>
  );
}
