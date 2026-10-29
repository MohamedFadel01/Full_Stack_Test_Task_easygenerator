import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function opaqueTokensMatch(storedHash: string, token: string): boolean {
  const candidate = hashOpaqueToken(token);
  const storedBuffer = Buffer.from(storedHash, 'hex');
  const candidateBuffer = Buffer.from(candidate, 'hex');
  if (storedBuffer.length !== candidateBuffer.length) {
    return false;
  }
  return timingSafeEqual(storedBuffer, candidateBuffer);
}

export const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
