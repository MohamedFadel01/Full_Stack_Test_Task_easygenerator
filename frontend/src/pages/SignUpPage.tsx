import { AuthPageLayout } from '@/features/auth/components/AuthPageLayout';
import { SignUpForm } from '@/features/auth/components/SignUpForm';

export function SignUpPage() {
  return (
    <AuthPageLayout>
      <SignUpForm />
    </AuthPageLayout>
  );
}
