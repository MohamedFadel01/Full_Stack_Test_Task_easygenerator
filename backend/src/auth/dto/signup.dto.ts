import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

// Whitespace: trim email and name before validation; password is not trimmed.
export class SignUpDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(3)
  name!: string;

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
