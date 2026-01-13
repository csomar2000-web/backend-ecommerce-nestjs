import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { SmtpMailProvider } from './providers/smtp.provider';
import { ConsoleMailProvider } from './providers/console.provider';

const hasSmtpConfig = () =>
  Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.MAIL_FROM,
  );

@Module({
  providers: [
    {
      provide: 'MailProvider',
      useFactory: () => {
        if (hasSmtpConfig()) {
          return new SmtpMailProvider();
        }
        return new ConsoleMailProvider();
      },
    },
    {
      provide: MailService,
      inject: ['MailProvider'],
      useFactory: (provider) => new MailService(provider),
    },
  ],
  exports: [MailService],
})
export class MailModule { }
