import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  EMAIL_SERVICE,
  EmailService,
  VerificationEmailPayload,
} from './email.service.interface.js';

@Injectable()
export class SmtpEmailService implements EmailService {
  private transporter: Transporter | null = null;
  private readonly captured: VerificationEmailPayload[] = [];

  constructor(private readonly configService: ConfigService) {}

  getCapturedVerificationEmails(): VerificationEmailPayload[] {
    return [...this.captured];
  }

  clearCapturedVerificationEmails(): void {
    this.captured.length = 0;
  }

  async sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
    const host = this.configService.get<string>('SMTP_HOST');
    if (!host) {
      this.captured.push({ to, verifyUrl });
      return;
    }

    const transporter = this.getTransporter();
    const from = this.configService.get<string>(
      'SMTP_FROM',
      'noreply@localhost',
    );

    await transporter.sendMail({
      from,
      to,
      subject: 'Verify your email',
      text: `Verify your email by opening: ${verifyUrl}`,
      html: `<p>Verify your email by opening this link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = this.configService.getOrThrow<string>('SMTP_HOST');
    const port = Number.parseInt(
      this.configService.get<string>('SMTP_PORT', '1025'),
      10,
    );
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass: pass ?? '' } : undefined,
    });

    return this.transporter;
  }
}

export const emailServiceProvider = {
  provide: EMAIL_SERVICE,
  useClass: SmtpEmailService,
};
