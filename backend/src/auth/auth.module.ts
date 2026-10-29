import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { BcryptPasswordHasherService } from './bcrypt-password-hasher.service.js';
import { GetCurrentUserUseCase } from './get-current-user.use-case.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PASSWORD_HASHER } from './password-hasher.js';
import { RegisterUserUseCase } from './register-user.use-case.js';
import { SignInUseCase } from './sign-in.use-case.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn = (configService.get<string>('JWT_EXPIRES_IN') ??
          '1h') as StringValue;
        return {
          secret: configService.getOrThrow<string>('JWT_SECRET'),
          signOptions: { expiresIn },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    RegisterUserUseCase,
    SignInUseCase,
    GetCurrentUserUseCase,
    JwtStrategy,
    JwtAuthGuard,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasherService },
  ],
})
export class AuthModule {}
