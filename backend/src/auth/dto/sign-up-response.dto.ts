import { ApiProperty } from '@nestjs/swagger';
import { SafeUserDto } from './auth-response.dto.js';

export class SignUpResponseDto {
  @ApiProperty({ type: SafeUserDto })
  user!: SafeUserDto;

  @ApiProperty({
    example:
      'Registration successful. Check your email to verify your account.',
  })
  message!: string;
}

export class MessageResponseDto {
  @ApiProperty()
  message!: string;
}
