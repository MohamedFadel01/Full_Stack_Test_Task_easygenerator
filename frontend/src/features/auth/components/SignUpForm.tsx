import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api-client';
import { signUp } from '@/lib/auth-api';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  signUpSchema,
  type SignUpFormValues,
} from '@/features/auth/validation/auth-schemas';

type SignUpFormProps = {
  className?: string;
};

export function SignUpForm({ className }: SignUpFormProps) {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  async function onSubmit(values: SignUpFormValues) {
    setApiError(null);
    try {
      const { user, accessToken } = await signUp(values);
      setSession(user, accessToken);
      navigate('/app', { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setApiError(error.message);
      } else {
        setApiError('Unable to create account. Please try again.');
      }
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <Card>
        <CardHeader>
          <h1 className="font-heading text-base leading-snug font-medium">
            Create your account
          </h1>
          <CardDescription>
            Enter your details to register for the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field data-invalid={Boolean(errors.name)}>
                <FieldLabel htmlFor="sign-up-name">Name</FieldLabel>
                <Input
                  id="sign-up-name"
                  type="text"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  {...register('name')}
                />
                <FieldError errors={[errors.name]} />
              </Field>
              <Field data-invalid={Boolean(errors.email)}>
                <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
                <Input
                  id="sign-up-email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
                <FieldError errors={[errors.email]} />
              </Field>
              <Field data-invalid={Boolean(errors.password)}>
                <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
                <Input
                  id="sign-up-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  {...register('password')}
                />
                <FieldDescription>
                  At least 8 characters with a letter, number, and special
                  character.
                </FieldDescription>
                <FieldError errors={[errors.password]} />
              </Field>
              {apiError ? (
                <p className="text-sm text-destructive" role="alert">
                  {apiError}
                </p>
              ) : null}
              <Field>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating account…' : 'Sign up'}
                </Button>
                <FieldDescription className="text-center">
                  Already have an account?{' '}
                  <Link
                    to="/sign-in"
                    className="underline-offset-4 hover:underline"
                  >
                    Sign in
                  </Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
