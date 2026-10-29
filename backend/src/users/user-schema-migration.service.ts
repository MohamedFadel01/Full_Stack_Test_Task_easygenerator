import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';

@Injectable()
export class UserSchemaMigrationService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.userModel.updateMany({ emailVerifiedAt: { $exists: false } }, [
      {
        $set: {
          emailVerifiedAt: '$createdAt',
          tokenVersion: { $ifNull: ['$tokenVersion', 0] },
        },
      },
    ]);
  }
}
