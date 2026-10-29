import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    type: String,
  })
  email!: string;

  @Prop({ required: true, minlength: 3, type: String })
  name!: string;

  @Prop({ required: true, select: false, type: String })
  passwordHash!: string;
}

export type UserDocument = HydratedDocument<User> & {
  createdAt: Date;
  updatedAt: Date;
};

export const UserSchema = SchemaFactory.createForClass(User);
