import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { EmailModule } from '../email/email.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthTokensModule } from './auth-tokens.module.js';
import { BcryptPasswordHasherService } from './bcrypt-password-hasher.service.js';
import { DeleteAccountUseCase } from './delete-account.use-case.js';
import { GetCurrentUserUseCase } from './get-current-user.use-case.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PASSWORD_HASHER } from './password-hasher.js';
import { RegisterUserUseCase } from './register-user.use-case.js';
import { ResendVerificationUseCase } from './resend-verification.use-case.js';
import {
  LogoutUseCase,
  RefreshSessionUseCase,
} from './session.use-cases.js';
import { SignInUseCase } from './sign-in.use-case.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { TokenService } from './token.service.js';
import { VerifyEmailUseCase } from './verify-email.use-case.js';

@Module({
  imports: [
    UsersModule,
    AuthTokensModule,
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresIn = (configService.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
        ) ??
          configService.get<string>('JWT_EXPIRES_IN') ??
          '15m') as StringValue;
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
    VerifyEmailUseCase,
    ResendVerificationUseCase,
    RefreshSessionUseCase,
    LogoutUseCase,
    TokenService,
    GetCurrentUserUseCase,
    DeleteAccountUseCase,
    JwtStrategy,
    JwtAuthGuard,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasherService },
  ],
})
export class AuthModule {}
