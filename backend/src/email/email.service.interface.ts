export const EMAIL_SERVICE = Symbol('EMAIL_SERVICE');

export type VerificationEmailPayload = {
  to: string;
  verifyUrl: string;
};

export interface EmailService {
  sendVerificationEmail(to: string, verifyUrl: string): Promise<void>;
  /** Test-only capture; cleared explicitly in e2e helpers. */
  getCapturedVerificationEmails(): VerificationEmailPayload[];
  clearCapturedVerificationEmails(): void;
}
