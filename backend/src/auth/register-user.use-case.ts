import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DuplicateEmailError } from '../users/errors/duplicate-email.error.js';
import { USERS_REPOSITORY } from '../users/repositories/users.repository.js';
import type {
  SafeUser,
  UsersRepository,
} from '../users/repositories/users.repository.js';
import { EMAIL_SERVICE } from '../email/email.service.interface.js';
import type { EmailService } from '../email/email.service.interface.js';
import {
  EMAIL_VERIFICATION_TTL_MS,
  generateOpaqueToken,
  hashOpaqueToken,
} from './opaque-token.js';
import { PASSWORD_HASHER } from './password-hasher.js';
import type { PasswordHasher } from './password-hasher.js';

export type RegisterUserInput = {
  email: string;
  name: string;
  password: string;
};

export type RegisterUserResult = {
  user: SafeUser;
  message: string;
  /** Present only when EXPOSE_VERIFICATION_TOKEN=true (Playwright live server). */
  verificationToken?: string;
};

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    @Inject(EMAIL_SERVICE)
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      const user = await this.usersRepository.create({
        email: input.email,
        name: input.name,
        passwordHash,
      });

      const verificationToken = generateOpaqueToken();
      const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
      await this.usersRepository.setEmailVerificationToken(
        user.id,
        hashOpaqueToken(verificationToken),
        expiresAt,
      );

      const frontendUrl = this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:5173',
      );
      const verifyUrl = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${verificationToken}`;
      await this.emailService.sendVerificationEmail(user.email, verifyUrl);

      const exposeToken =
        this.configService.get<string>('EXPOSE_VERIFICATION_TOKEN') === 'true';

      return {
        user,
        message:
          'Registration successful. Check your email to verify your account.',
        ...(exposeToken ? { verificationToken } : {}),
      };
    } catch (error: unknown) {
      if (error instanceof DuplicateEmailError) {
        throw new ConflictException('Email already registered');
      }
      throw new InternalServerErrorException('Unable to complete registration');
    }
  }
}
