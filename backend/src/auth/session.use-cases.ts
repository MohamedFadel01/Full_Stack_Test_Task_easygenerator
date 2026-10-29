import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TokenService, type SessionTokens } from './token.service.js';

@Injectable()
export class RefreshSessionUseCase {
  constructor(private readonly tokenService: TokenService) {}

  execute(request: Request, response: Response): Promise<SessionTokens> {
    return this.tokenService.refreshSession(request, response);
  }
}

@Injectable()
export class LogoutUseCase {
  constructor(private readonly tokenService: TokenService) {}

  execute(request: Request, response: Response): Promise<void> {
    return this.tokenService.logout(request, response);
  }
}
