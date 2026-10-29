import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { PasswordHasher } from './password-hasher.js';

const BCRYPT_COST_FACTOR = 10;

@Injectable()
export class BcryptPasswordHasherService implements PasswordHasher {
  async hash(plainTextPassword: string): Promise<string> {
    return bcrypt.hash(plainTextPassword, BCRYPT_COST_FACTOR);
  }

  async compare(
    plainTextPassword: string,
    passwordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainTextPassword, passwordHash);
  }
}
