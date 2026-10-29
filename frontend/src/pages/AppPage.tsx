import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';

export function AppPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/sign-in', { replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <p className="text-sm text-muted-foreground">
          Signed in as {user?.email}
        </p>
        <Button type="button" variant="outline" onClick={handleLogout}>
          Log out
        </Button>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <h1 className="text-2xl font-medium">Welcome to the application.</h1>
      </main>
    </div>
  );
}
