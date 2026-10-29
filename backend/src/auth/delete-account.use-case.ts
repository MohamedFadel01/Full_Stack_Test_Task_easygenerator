import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { USERS_REPOSITORY } from '../users/repositories/users.repository.js';
import type { UsersRepository } from '../users/repositories/users.repository.js';
import { PASSWORD_HASHER } from './password-hasher.js';
import type { PasswordHasher } from './password-hasher.js';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from './repositories/refresh-token.repository.js';
import { TokenService } from './token.service.js';

export type DeleteAccountInput = {
  userId: string;
  password: string;
  request: Request;
  response: Response;
};

@Injectable()
export class DeleteAccountUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: DeleteAccountInput): Promise<void> {
    try {
      const auth = await this.usersRepository.findByIdWithAuthFields(
        input.userId,
      );

      const passwordMatches =
        auth !== null &&
        (await this.passwordHasher.compare(input.password, auth.passwordHash));

      if (!auth || !passwordMatches) {
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.refreshTokenRepository.deleteByUserId(input.userId);
      const deleted = await this.usersRepository.deleteById(input.userId);
      if (!deleted) {
        throw new InternalServerErrorException('Unable to delete account');
      }

      await this.tokenService.logout(input.request, input.response);
    } catch (error: unknown) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Unable to delete account');
    }
  }
}
