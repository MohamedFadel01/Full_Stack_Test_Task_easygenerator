import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Whitespace: trim email and name before validation; password is not trimmed.
export class SignUpDto {
  @ApiProperty({ example: 'user@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'Jane Doe', minLength: 3 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({
    example: 'Secret1!',
    minLength: 8,
    description:
      'At least 8 characters with a letter, a number, and a special character',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/[a-zA-Z]/, { message: 'password must contain at least one letter' })
  @Matches(/\d/, { message: 'password must contain at least one number' })
  @Matches(/[^a-zA-Z0-9]/, {
    message: 'password must contain at least one special character',
  })
  password!: string;
}
