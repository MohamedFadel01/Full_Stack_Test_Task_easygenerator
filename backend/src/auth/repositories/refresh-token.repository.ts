export const REFRESH_TOKEN_REPOSITORY = Symbol('REFRESH_TOKEN_REPOSITORY');

export type CreateRefreshTokenRecord = {
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
};

export type RefreshTokenRecord = {
  id: string;
  userId: string;
  familyId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
};

export interface RefreshTokenRepository {
  create(record: CreateRefreshTokenRecord): Promise<RefreshTokenRecord>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revokeById(id: string, replacedByTokenId?: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}
