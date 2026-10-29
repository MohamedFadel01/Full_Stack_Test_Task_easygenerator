import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { USERS_REPOSITORY } from '../users/repositories/users.repository.js';
import type { UsersRepository } from '../users/repositories/users.repository.js';
import { PASSWORD_HASHER } from './password-hasher.js';
import type { PasswordHasher } from './password-hasher.js';
import { TokenService, type SessionTokens } from './token.service.js';

export type SignInInput = {
  email: string;
  password: string;
};

export type SignInResult = SessionTokens;

@Injectable()
export class SignInUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: SignInInput, response: Response): Promise<SignInResult> {
    try {
      const record = await this.usersRepository.findByEmailWithPasswordHash(
        input.email,
      );

      const passwordMatches =
        record !== null &&
        (await this.passwordHasher.compare(
          input.password,
          record.passwordHash,
        ));

      if (!record || !passwordMatches) {
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!record.emailVerifiedAt) {
        throw new ForbiddenException('EMAIL_NOT_VERIFIED');
      }

      return await this.tokenService.issueSession(record.id, response);
    } catch (error: unknown) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Unable to complete sign-in');
    }
  }
}
