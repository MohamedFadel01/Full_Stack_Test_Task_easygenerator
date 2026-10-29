import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class RefreshToken {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, type: String, index: true })
  familyId!: string;

  @Prop({ required: true, type: String, unique: true, select: false })
  tokenHash!: string;

  @Prop({ required: true, type: Date })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  revokedAt!: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'RefreshToken', default: null })
  replacedByTokenId!: Types.ObjectId | null;
}

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
