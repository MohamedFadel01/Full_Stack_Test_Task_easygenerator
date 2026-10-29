export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasher {
  hash(plainTextPassword: string): Promise<string>;
  compare(plainTextPassword: string, passwordHash: string): Promise<boolean>;
}
