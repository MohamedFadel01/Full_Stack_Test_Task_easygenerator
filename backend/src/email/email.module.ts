import { Module } from '@nestjs/common';
import { emailServiceProvider } from './smtp-email.service.js';
import { EMAIL_SERVICE } from './email.service.interface.js';

@Module({
  providers: [emailServiceProvider],
  exports: [EMAIL_SERVICE],
})
export class EmailModule {}
