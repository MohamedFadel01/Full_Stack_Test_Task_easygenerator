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
  createdAt: Date;
  updatedAt: Date;
};

export type UserWithPasswordHash = SafeUser & { passwordHash: string };

export interface UsersRepository {
  create(record: CreateUserRecord): Promise<SafeUser>;
  findByEmail(email: string): Promise<SafeUser | null>;
  findByEmailWithPasswordHash(
    email: string,
  ): Promise<UserWithPasswordHash | null>;
  findById(id: string): Promise<SafeUser | null>;
}
