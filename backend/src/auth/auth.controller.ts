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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/signup.dto.js';
import { AuthResponseDto, SafeUserDto } from './dto/auth-response.dto.js';
import { GetCurrentUserUseCase } from './get-current-user.use-case.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RegisterUserUseCase } from './register-user.use-case.js';
import { SignInUseCase } from './sign-in.use-case.js';
import type { JwtValidatedUser } from './types/jwt-validated-user.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly signInUseCase: SignInUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  signUp(@Body() signUpDto: SignUpDto) {
    return this.registerUserUseCase.execute(signUpDto);
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
  signIn(@Body() signInDto: SignInDto) {
    return this.signInUseCase.execute(signInDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'Get the current user',
    description: 'Requires a valid Bearer JWT from sign-up or sign-in.',
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
}
