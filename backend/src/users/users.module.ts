import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseUsersRepository } from './repositories/mongoose-users.repository.js';
import { USERS_REPOSITORY } from './repositories/users.repository.js';
import { User, UserSchema } from './schemas/user.schema.js';
import { UserSchemaMigrationService } from './user-schema-migration.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  providers: [
    { provide: USERS_REPOSITORY, useClass: MongooseUsersRepository },
    UserSchemaMigrationService,
  ],
  exports: [USERS_REPOSITORY],
})
export class UsersModule {}
