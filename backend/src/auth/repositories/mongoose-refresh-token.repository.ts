import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  RefreshToken,
  RefreshTokenDocument,
} from '../schemas/refresh-token.schema.js';
import {
  CreateRefreshTokenRecord,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from './refresh-token.repository.js';

function toRecord(document: RefreshTokenDocument): RefreshTokenRecord {
  return {
    id: document._id.toString(),
    userId: document.userId.toString(),
    familyId: document.familyId,
    tokenHash: document.tokenHash,
    expiresAt: document.expiresAt,
    revokedAt: document.revokedAt,
    replacedByTokenId: document.replacedByTokenId?.toString() ?? null,
  };
}

@Injectable()
export class MongooseRefreshTokenRepository implements RefreshTokenRepository {
  constructor(
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  async create(record: CreateRefreshTokenRecord): Promise<RefreshTokenRecord> {
    const document = await this.refreshTokenModel.create({
      userId: new Types.ObjectId(record.userId),
      familyId: record.familyId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      revokedAt: null,
      replacedByTokenId: null,
    });
    return toRecord(document);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const document = await this.refreshTokenModel
      .findOne({ tokenHash })
      .select('+tokenHash')
      .exec();
    if (!document) {
      return null;
    }
    return toRecord(document);
  }

  async revokeById(id: string, replacedByTokenId?: string): Promise<void> {
    await this.refreshTokenModel.updateOne(
      { _id: new Types.ObjectId(id) },
      {
        revokedAt: new Date(),
        ...(replacedByTokenId
          ? { replacedByTokenId: new Types.ObjectId(replacedByTokenId) }
          : {}),
      },
    );
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.refreshTokenModel.updateMany(
      { familyId, revokedAt: null },
      { revokedAt: new Date() },
    );
  }
}
