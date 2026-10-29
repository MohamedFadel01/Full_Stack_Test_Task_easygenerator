import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import { ApiError } from '@/lib/api-client';
import { verifyEmail } from '@/lib/auth-api';
import { useAuth } from '@/features/auth/context/AuthContext';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Verification link is invalid.');
      setIsVerifying(false);
      return;
    }

    let cancelled = false;

    async function runVerification() {
      try {
        const session = await verifyEmail(token!);
        if (cancelled) {
          return;
        }
        setSession(session.user, session.accessToken);
        navigate('/app', { replace: true });
      } catch (err) {
        if (cancelled) {
          return;
        }
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('Unable to verify email. Please request a new link.');
        }
        setIsVerifying(false);
      }
    }

    void runVerification();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams, setSession]);

  return (
    <AuthPageLayout>
      <Card>
        <CardHeader>
          <h1 className="font-heading text-base leading-snug font-medium">
            Verify email
          </h1>
          <CardDescription>
            {isVerifying
              ? 'Confirming your email address…'
              : 'We could not verify your email.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          {!isVerifying ? (
            <Link
              to="/sign-in"
              className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
            >
              Go to sign in
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </AuthPageLayout>
  );
}
