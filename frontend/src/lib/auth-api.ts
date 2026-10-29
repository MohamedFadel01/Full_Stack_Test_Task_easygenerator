import { apiRequest } from '@/lib/api-client';
import { getAccessToken } from '@/lib/auth-storage';
import type {
  AuthSuccessResponse,
  MeResponse,
  MessageResponse,
  SafeUser,
  SignUpResponse,
} from '@/types/auth';

export type SignUpPayload = {
  email: string;
  name: string;
  password: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};

export async function signUp(payload: SignUpPayload): Promise<SignUpResponse> {
  return apiRequest<SignUpResponse>('/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function signIn(
  payload: SignInPayload,
): Promise<AuthSuccessResponse> {
  return apiRequest<AuthSuccessResponse>('/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: true,
  });
}

export async function verifyEmail(token: string): Promise<AuthSuccessResponse> {
  return apiRequest<AuthSuccessResponse>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token }),
    auth: true,
  });
}

export async function resendVerification(
  email: string,
): Promise<MessageResponse> {
  return apiRequest<MessageResponse>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
    auth: true,
  });
}

export async function refreshSession(): Promise<AuthSuccessResponse> {
  return apiRequest<AuthSuccessResponse>('/auth/refresh', {
    method: 'POST',
    auth: true,
  });
}

export async function logoutSession(): Promise<void> {
  await apiRequest<void>('/auth/logout', {
    method: 'POST',
    auth: true,
  });
}

export async function deleteAccount(password: string): Promise<void> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  await apiRequest<void>('/auth/account', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
    accessToken,
    auth: true,
  });
}

export async function getMe(accessToken: string): Promise<MeResponse> {
  return apiRequest<MeResponse>('/auth/me', {
    method: 'GET',
    accessToken,
  });
}

export type { SafeUser };
