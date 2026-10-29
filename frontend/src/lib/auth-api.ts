import { apiRequest } from '@/lib/api-client';
import type { AuthSuccessResponse, MeResponse, SafeUser } from '@/types/auth';

export type SignUpPayload = {
  email: string;
  name: string;
  password: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};

export async function signUp(
  payload: SignUpPayload,
): Promise<AuthSuccessResponse> {
  return apiRequest<AuthSuccessResponse>('/auth/sign-up', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function signIn(
  payload: SignInPayload,
): Promise<AuthSuccessResponse> {
  return apiRequest<AuthSuccessResponse>('/auth/sign-in', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMe(accessToken: string): Promise<MeResponse> {
  return apiRequest<MeResponse>('/auth/me', {
    method: 'GET',
    accessToken,
  });
}

export type { SafeUser };
