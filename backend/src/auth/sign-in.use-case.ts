import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { USERS_REPOSITORY } from '../users/repositories/users.repository.js';
import type {
  SafeUser,
  UsersRepository,
} from '../users/repositories/users.repository.js';
import { PASSWORD_HASHER } from './password-hasher.js';
import type { PasswordHasher } from './password-hasher.js';

export type SignInInput = {
  email: string;
  password: string;
};

export type SignInResult = {
  user: SafeUser;
  accessToken: string;
};

@Injectable()
export class SignInUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: SignInInput): Promise<SignInResult> {
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

      const user: SafeUser = {
        id: record.id,
        email: record.email,
        name: record.name,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      };

      const accessToken = this.jwtService.sign({ sub: user.id });

      return { user, accessToken };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Unable to complete sign-in');
    }
  }
}
