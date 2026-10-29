import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { deleteAccount } from '@/lib/auth-api';
import { useAuth } from '@/features/auth/context/AuthContext';

const MIN_PASSWORD_LENGTH = 8;

export function DeleteAccountSection() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  function handleClose() {
    setIsOpen(false);
    setPassword('');
    setError(null);
  }

  async function handleDelete(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      return;
    }
    setError(null);
    setIsDeleting(true);

    try {
      await deleteAccount(password);
      await logout();
      navigate('/sign-in', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 401
            ? 'Incorrect password. Account was not deleted.'
            : err.message,
        );
      } else {
        setError('Unable to delete account. Please try again.');
      }
    } finally {
      setIsDeleting(false);
    }
  }

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setIsOpen(true)}
      >
        Delete account…
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-md text-left">
      <CardHeader>
        <h2 className="font-heading text-base leading-snug font-medium">
          Delete account
        </h2>
        <CardDescription>
          Permanently remove your account and sign out on all devices. This
          cannot be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleDelete} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="delete-account-password">
                Confirm with your password
              </FieldLabel>
              <Input
                id="delete-account-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isDeleting}
              />
              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </Field>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isDeleting || password.length < MIN_PASSWORD_LENGTH}
              >
                {isDeleting ? 'Deleting…' : 'Delete my account'}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
