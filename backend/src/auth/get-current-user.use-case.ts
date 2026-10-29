import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { USERS_REPOSITORY } from '../users/repositories/users.repository.js';
import type { UsersRepository } from '../users/repositories/users.repository.js';

@Injectable()
export class GetCurrentUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return { user };
  }
}
