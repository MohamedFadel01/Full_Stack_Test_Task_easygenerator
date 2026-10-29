import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DuplicateEmailError } from '../errors/duplicate-email.error.js';
import { User, UserDocument } from '../schemas/user.schema.js';
import {
  CreateUserRecord,
  SafeUser,
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
}
