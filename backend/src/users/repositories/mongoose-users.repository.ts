import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DuplicateEmailError } from '../errors/duplicate-email.error.js';
import { User, UserDocument } from '../schemas/user.schema.js';
import {
  CreateUserRecord,
  SafeUser,
  UserAuthFields,
  UserWithPasswordHash,
  UsersRepository,
} from './users.repository.js';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toSafeUser(document: UserDocument): SafeUser {
  return {
    id: document._id.toString(),
    email: document.email,
    name: document.name,
    emailVerifiedAt: document.emailVerifiedAt ?? null,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11_000
  );
}

@Injectable()
export class MongooseUsersRepository implements UsersRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(record: CreateUserRecord): Promise<SafeUser> {
    try {
      const document = await this.userModel.create({
        email: normalizeEmail(record.email),
        name: record.name,
        passwordHash: record.passwordHash,
        emailVerifiedAt: null,
        tokenVersion: 0,
      });
      return toSafeUser(document);
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new DuplicateEmailError();
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<SafeUser | null> {
    const document = await this.userModel.findOne({
      email: normalizeEmail(email),
    });
    if (!document) {
      return null;
    }
    return toSafeUser(document);
  }

  async findByEmailWithPasswordHash(
    email: string,
  ): Promise<UserWithPasswordHash | null> {
    const document = await this.userModel
      .findOne({ email: normalizeEmail(email) })
      .select('+passwordHash');
    if (!document) {
      return null;
    }
    return {
      ...toSafeUser(document),
      passwordHash: document.passwordHash,
    };
  }

  async findById(id: string): Promise<SafeUser | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const document = await this.userModel.findById(id);
    if (!document) {
      return null;
    }
    return toSafeUser(document);
  }

  async findByIdWithAuthFields(id: string): Promise<UserAuthFields | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const document = await this.userModel
      .findById(id)
      .select('+passwordHash');
    if (!document) {
      return null;
    }
    return {
      ...toSafeUser(document),
      passwordHash: document.passwordHash,
      tokenVersion: document.tokenVersion ?? 0,
    };
  }

  async setEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: expiresAt,
      },
    );
  }

  async clearEmailVerificationToken(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: new Types.ObjectId(userId) },
      {
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    );
  }

  async markEmailVerified(userId: string): Promise<SafeUser | null> {
    const document = await this.userModel.findByIdAndUpdate(
      new Types.ObjectId(userId),
      {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
      { new: true },
    );
    if (!document) {
      return null;
    }
    return toSafeUser(document);
  }

  async incrementTokenVersion(userId: string): Promise<number> {
    const document = await this.userModel.findByIdAndUpdate(
      new Types.ObjectId(userId),
      { $inc: { tokenVersion: 1 } },
      { new: true },
    );
    return document?.tokenVersion ?? 0;
  }

  async findByEmailVerificationTokenHash(
    tokenHash: string,
  ): Promise<SafeUser | null> {
    const document = await this.userModel
      .findOne({
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpiresAt: { $gt: new Date() },
      })
      .select('+emailVerificationTokenHash +emailVerificationExpiresAt');
    if (!document) {
      return null;
    }
    return toSafeUser(document);
  }
}
