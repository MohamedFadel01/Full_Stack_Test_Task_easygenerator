import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({ description: 'Current password to confirm deletion' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
