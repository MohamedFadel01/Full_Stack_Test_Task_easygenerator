import {
  Inject,
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DuplicateEmailError } from '../users/errors/duplicate-email.error.js';
import { USERS_REPOSITORY } from '../users/repositories/users.repository.js';
import type {
  SafeUser,
  UsersRepository,
} from '../users/repositories/users.repository.js';
import { PASSWORD_HASHER } from './password-hasher.js';
import type { PasswordHasher } from './password-hasher.js';

export type RegisterUserInput = {
  email: string;
  name: string;
  password: string;
};

export type RegisterUserResult = {
  user: SafeUser;
  accessToken: string;
};

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
    @Inject(PASSWORD_HASHER)
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    const passwordHash = await this.passwordHasher.hash(input.password);

    try {
      const user = await this.usersRepository.create({
        email: input.email,
        name: input.name,
        passwordHash,
      });

      const accessToken = this.jwtService.sign({ sub: user.id });

      return { user, accessToken };
    } catch (error: unknown) {
      if (error instanceof DuplicateEmailError) {
        throw new ConflictException('Email already registered');
      }
      throw new InternalServerErrorException('Unable to complete registration');
    }
  }
}
