import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { SmtpMailProvider } from './providers/smtp.provider';

@Module({
  providers: [
    {
      provide: 'MailProvider',
      useClass: SmtpMailProvider,
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
