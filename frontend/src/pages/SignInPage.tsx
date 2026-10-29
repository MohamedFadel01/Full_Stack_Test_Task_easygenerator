import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout';
import { SignInForm } from '@/features/auth/components/SignInForm';

export function SignInPage() {
  return (
    <AuthPageLayout>
      <SignInForm />
    </AuthPageLayout>
  );
}
