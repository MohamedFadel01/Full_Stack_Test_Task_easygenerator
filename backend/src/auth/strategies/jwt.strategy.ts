import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { USERS_REPOSITORY } from '../../users/repositories/users.repository.js';
import type { UsersRepository } from '../../users/repositories/users.repository.js';
import type { JwtValidatedUser } from '../types/jwt-validated-user.js';

type JwtPayload = {
  sub: string;
  ver?: number;
  typ?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) configService: ConfigService,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtValidatedUser> {
    if (payload.typ !== 'access' || payload.ver === undefined) {
      throw new UnauthorizedException();
    }

    const user = await this.usersRepository.findByIdWithAuthFields(payload.sub);
    if (!user?.emailVerifiedAt) {
      throw new UnauthorizedException();
    }

    if (user.tokenVersion !== payload.ver) {
      throw new UnauthorizedException();
    }

    return { userId: user.id };
  }
}
