import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/signup.dto.js';
import { GetCurrentUserUseCase } from './get-current-user.use-case.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RegisterUserUseCase } from './register-user.use-case.js';
import { SignInUseCase } from './sign-in.use-case.js';
import type { JwtValidatedUser } from './types/jwt-validated-user.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly signInUseCase: SignInUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() signUpDto: SignUpDto) {
    return this.registerUserUseCase.execute(signUpDto);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  signIn(@Body() signInDto: SignInDto) {
    return this.signInUseCase.execute(signInDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: { user: JwtValidatedUser }) {
    return this.getCurrentUserUseCase.execute(request.user.userId);
  }
}
