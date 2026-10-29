import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/signup.dto.js';
import { AuthResponseDto, SafeUserDto } from './dto/auth-response.dto.js';
import {
  MessageResponseDto,
  SignUpResponseDto,
} from './dto/sign-up-response.dto.js';
import {
  ResendVerificationDto,
  VerifyEmailDto,
} from './dto/verification.dto.js';
import { DeleteAccountDto } from './dto/delete-account.dto.js';
import { DeleteAccountUseCase } from './delete-account.use-case.js';
import { GetCurrentUserUseCase } from './get-current-user.use-case.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RegisterUserUseCase } from './register-user.use-case.js';
import { ResendVerificationUseCase } from './resend-verification.use-case.js';
import { LogoutUseCase, RefreshSessionUseCase } from './session.use-cases.js';
import { SignInUseCase } from './sign-in.use-case.js';
import { VerifyEmailUseCase } from './verify-email.use-case.js';
import type { JwtValidatedUser } from './types/jwt-validated-user.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly signInUseCase: SignInUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
  ) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created; verification email sent',
    type: SignUpResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  signUp(@Body() signUpDto: SignUpDto) {
    return this.registerUserUseCase.execute(signUpDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email and start a session' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  verifyEmail(
    @Body() body: VerifyEmailDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.verifyEmailUseCase.execute(body.token, response);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  resendVerification(@Body() body: ResendVerificationDto) {
    return this.resendVerificationUseCase.execute(body);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Authenticated',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 403, description: 'Email not verified' })
  signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.signInUseCase.execute(signInDto, response);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate refresh cookie and issue new access token' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.refreshSessionUseCase.execute(request, response);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke refresh session and clear cookie' })
  @ApiResponse({ status: 204, description: 'Logged out' })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.logoutUseCase.execute(request, response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Get the current user',
    description: 'Requires a valid Bearer access JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    type: SafeUserDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid token' })
  me(@Req() request: { user: JwtValidatedUser }) {
    return this.getCurrentUserUseCase.execute(request.user.userId);
  }

  @Delete('account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Permanently delete the authenticated account',
    description: 'Requires current password. Clears refresh cookie.',
  })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({ status: 401, description: 'Invalid password or token' })
  async deleteAccount(
    @Req() request: Request & { user: JwtValidatedUser },
    @Body() body: DeleteAccountDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.deleteAccountUseCase.execute({
      userId: request.user.userId,
      password: body.password,
      request,
      response,
    });
  }
}
