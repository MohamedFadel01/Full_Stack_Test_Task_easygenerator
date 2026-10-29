import { Link, useLocation } from 'react-router-dom';
import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';

type CheckEmailLocationState = {
  email?: string;
};

export function CheckEmailPage() {
  const location = useLocation();
  const state = location.state as CheckEmailLocationState | null;
  const email = state?.email;

  return (
    <AuthPageLayout>
      <Card>
        <CardHeader>
          <h1 className="font-heading text-base leading-snug font-medium">
            Check your email
          </h1>
          <CardDescription>
            {email
              ? `We sent a verification link to ${email}. Open it to activate your account.`
              : 'We sent a verification link to your email. Open it to activate your account.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link
            to="/sign-in"
            className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    </AuthPageLayout>
  );
}
