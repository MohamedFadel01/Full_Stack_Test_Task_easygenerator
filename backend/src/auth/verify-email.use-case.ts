import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Response } from 'express';
import { USERS_REPOSITORY } from '../users/repositories/users.repository.js';
import type { UsersRepository } from '../users/repositories/users.repository.js';
import { hashOpaqueToken } from './opaque-token.js';
import { TokenService, type SessionTokens } from './token.service.js';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(token: string, response: Response): Promise<SessionTokens> {
    const trimmed = token?.trim();
    if (!trimmed) {
      throw new BadRequestException('Verification token is required');
    }

    try {
      const user = await this.usersRepository.findByEmailVerificationTokenHash(
        hashOpaqueToken(trimmed),
      );
      if (!user) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      const verified = await this.usersRepository.markEmailVerified(user.id);
      if (!verified) {
        throw new BadRequestException('Invalid or expired verification token');
      }

      return await this.tokenService.issueSession(verified.id, response);
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Unable to verify email');
    }
  }
}
