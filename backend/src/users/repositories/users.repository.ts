export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export type CreateUserRecord = {
  email: string;
  name: string;
  passwordHash: string;
};

export type SafeUser = {
  id: string;
  email: string;
  name: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithPasswordHash = SafeUser & { passwordHash: string };

export type UserAuthFields = SafeUser & {
  tokenVersion: number;
  passwordHash: string;
};

export interface UsersRepository {
  create(record: CreateUserRecord): Promise<SafeUser>;
  findByEmail(email: string): Promise<SafeUser | null>;
  findByEmailWithPasswordHash(
    email: string,
  ): Promise<UserWithPasswordHash | null>;
  findById(id: string): Promise<SafeUser | null>;
  findByIdWithAuthFields(id: string): Promise<UserAuthFields | null>;
  setEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;
  clearEmailVerificationToken(userId: string): Promise<void>;
  markEmailVerified(userId: string): Promise<SafeUser | null>;
  incrementTokenVersion(userId: string): Promise<number>;
  findByEmailVerificationTokenHash(
    tokenHash: string,
  ): Promise<SafeUser | null>;
}
