import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { USERS_REPOSITORY } from '../users/repositories/users.repository.js';
import type { UsersRepository } from '../users/repositories/users.repository.js';
import { EMAIL_SERVICE } from '../email/email.service.interface.js';
import type { EmailService } from '../email/email.service.interface.js';
import {
  EMAIL_VERIFICATION_TTL_MS,
  generateOpaqueToken,
  hashOpaqueToken,
} from './opaque-token.js';

export type ResendVerificationInput = {
  email: string;
};

export type ResendVerificationResult = {
  message: string;
};

@Injectable()
export class ResendVerificationUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(EMAIL_SERVICE)
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async execute(
    input: ResendVerificationInput,
  ): Promise<ResendVerificationResult> {
    const genericMessage =
      'If an unverified account exists for this email, a verification message has been sent.';

    const user = await this.usersRepository.findByEmail(input.email);
    if (!user || user.emailVerifiedAt) {
      return { message: genericMessage };
    }

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

    return { message: genericMessage };
  }
}
