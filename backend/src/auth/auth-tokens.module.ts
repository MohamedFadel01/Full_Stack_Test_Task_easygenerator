import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongooseRefreshTokenRepository } from './repositories/mongoose-refresh-token.repository.js';
import { REFRESH_TOKEN_REPOSITORY } from './repositories/refresh-token.repository.js';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refresh-token.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
  ],
  providers: [
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: MongooseRefreshTokenRepository,
    },
  ],
  exports: [REFRESH_TOKEN_REPOSITORY],
})
export class AuthTokensModule {}
